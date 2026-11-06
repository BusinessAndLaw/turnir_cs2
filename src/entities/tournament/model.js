export const maps = {mirage: "Mirage", ancient: "Ancient", nuke: "Nuke", dust2: "Dust II", inferno: "Inferno", overpass: "Overpass", train: "Train", anubis: "Anubis", cache: "Cache", vertigo: "Vertigo"};

function randomInt(limit) {
  const sample = new Uint32Array(1);
  const ceiling = 2 ** 32 - (2 ** 32 % limit);
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= ceiling);
  return sample[0] % limit;
}

function shuffle(values) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

export function draw(names, pool) {
  const teams = names.map((name, index) => ({id: index + 1, name}));
  const entrants = shuffle(teams.map(team => team.id));
  const roundCount = Math.ceil(Math.log2(teams.length));
  const size = 2 ** roundCount;
  const byeSlots = new Set(shuffle(Array.from({length: size / 2}, (_, i) => i))
    .slice(0, size - teams.length));
  const rounds = Array.from({length: roundCount}, (_, round) =>
    Array.from({length: size / 2 ** (round + 1)}, (_, index) => {
      const bye = round === 0 && byeSlots.has(index);
      const slots = round === 0 ? [entrants.pop(), bye ? null : entrants.pop()] : [null, null];
      return {
        id: (round + 1) + "." + (index + 1), teams: slots, bye, score: null,
        map: null,
        startingSides: null,
        winner: bye ? slots[0] : null
      };
    }));
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
    byte.toString(16).padStart(2, "0")).join("");
  const state = {
    version: 1, id, revision: 0, game: "CS2", format: "single-elimination BO1",
    createdAt: new Date().toISOString(), mapPool: pool, teams, rounds, champion: null
  };
  advance(state);
  return state;
}

export function generateGame(match, pool) {
  match.map = pool[randomInt(pool.length)];
  match.startingSides = randomInt(2) ? ["CT", "T"] : ["T", "CT"];
}

export function advance(state) {
  for (let round = 1; round < state.rounds.length; round++) {
    const previous = state.rounds[round - 1];
    state.rounds[round].forEach((match, index) => {
      const slots = [previous[index * 2].winner, previous[index * 2 + 1].winner];
      if (slots.some((team, slot) => team !== match.teams[slot])) {
        Object.assign(match, {teams: slots, map: null, startingSides: null, score: null, winner: null});
      }
    });
  }
  state.champion = state.rounds.at(-1)[0].winner;
}

export function validScore(score) {
  return Array.isArray(score) && score.length === 2 && score[0] !== score[1]
    && score.every(n => Number.isInteger(n) && n >= 0 && n <= 999);
}

export function parseSession(raw, knownMaps) {
  const state = JSON.parse(raw);
  const fail = () => { throw new Error("Файл не содержит корректную сессию CS2 Setka."); };
  if (!state || state.version !== 1 || state.game !== "CS2"
      || typeof state.id !== "string" || !/^[a-f0-9-]{32,36}$/i.test(state.id)
      || !Number.isSafeInteger(state.revision) || state.revision < 0
      || !Array.isArray(state.mapPool) || !state.mapPool.length
      || !state.mapPool.every(id => knownMaps.includes(id))
      || !Array.isArray(state.teams) || state.teams.length < 2 || state.teams.length > 64) fail();
  const ids = new Set();
  for (const team of state.teams) {
    if (!team || !Number.isInteger(team.id) || team.id < 1 || ids.has(team.id)
        || typeof team.name !== "string" || !team.name.trim() || team.name.length > 80) fail();
    ids.add(team.id);
  }
  const count = Math.ceil(Math.log2(ids.size));
  if (!Array.isArray(state.rounds) || state.rounds.length !== count) fail();
  const seeded = new Set();
  state.rounds.forEach((round, r) => {
    if (!Array.isArray(round) || round.length !== 2 ** (count - r - 1)) fail();
    round.forEach((match, i) => {
      if (!match || match.id !== (r + 1) + "." + (i + 1) || typeof match.bye !== "boolean"
          || !Array.isArray(match.teams) || match.teams.length !== 2) fail();
      const [a, b] = match.teams;
      if (r === 0) {
        for (const team of match.bye ? [a] : [a, b]) {
          if (!ids.has(team) || seeded.has(team)) fail();
          seeded.add(team);
        }
      } else if (match.bye || a !== state.rounds[r - 1][2 * i].winner
                 || b !== state.rounds[r - 1][2 * i + 1].winner) fail();
      if (match.bye) {
        if (b !== null || match.winner !== a || match.map !== null
            || match.startingSides !== null || match.score !== null) fail();
        return;
      }
      if (match.map === null && match.startingSides === null && match.score === null && match.winner === null) return;
      if (!state.mapPool.includes(match.map) || !Array.isArray(match.startingSides)
          || !["CT,T", "T,CT"].includes(match.startingSides.join(","))) fail();
      if (match.score === null ? match.winner !== null
          : !a || !b || !validScore(match.score)
            || match.winner !== match.teams[Number(match.score[1] > match.score[0])]) fail();
    });
  });
  if (seeded.size !== ids.size || state.champion !== state.rounds.at(-1)[0].winner) fail();
  return state;
}


export function roundName(total, index) {
  const remaining = total - index;
  return remaining === 1 ? "Финал" : remaining === 2 ? "Полуфиналы" : "Раунд " + (index + 1);
}
