import {ArrowRightIcon} from '../../shared/Icons.jsx';
import {Button} from '../../shared/Button.jsx';
import React, {useState} from 'react';
import {MatchCard} from '../../entities/tournament/MatchCard.jsx';
import {generateGame, roundName, validScore} from '../../entities/tournament/model.js';
import {MapRoulette} from './MapRoulette.jsx';

function ScoreForm({match, names, edit, busy}) {
  const [values, setValues] = useState(() => match.score?.map(String) ?? ['', '']);
  const score = values.map(value => value === '' ? NaN : Number(value));
  const ready = validScore(score);

  function record(event) {
    event.preventDefault();
    if (!ready) return;
    const winner = match.teams[Number(score[1] > score[0])];
    if (match.winner && winner !== match.winner
        && !confirm('Смена победителя сбросит зависимые жеребьёвки и результаты. Продолжить?')) return;
    edit(match.id, current => Object.assign(current, {score, winner}));
  }

  return <form className="score-form" onSubmit={record}>
    {values.map((value, slot) => <input key={slot} type="number" min={0} max={999}
      value={value} aria-label={'Счёт ' + names.get(match.teams[slot])}
      onChange={event => setValues(values.map((current, index) => index === slot ? event.target.value : current))} />)}
    <Button variant="secondary" disabled={busy || !ready}>Сохранить счёт</Button>
  </form>;
}

export function Matches({session, names, numbers, edit, busy}) {
  const [roulette, setRoulette] = useState(null);
  async function roll(match) {
    const game = {};
    generateGame(game, session.mapPool);
    if (await edit(match.id, current => Object.assign(current, game))) {
      setRoulette({map: game.map, pool: [...session.mapPool], number: numbers.get(match.id), teams: match.teams.map(id => names.get(id)), startingSides: [...game.startingSides]});
    }
  }
  return <>{roulette && <MapRoulette {...roulette} onClose={() => setRoulette(null)} />}{[...session.rounds, ...(session.bronze ? [[session.bronze]] : [])].map((round, index) => <section className="game-round" key={index}>
    <h2>{index === session.rounds.length ? 'Матч за 3-е место' : (session.format === 'manual BO1' ? 'Подтверждённые пары' : roundName(session.rounds.length, index))}</h2>
    <div className="game-grid">{round.map((match, i) =>
      <MatchCard placementRound={match.id === 'bronze' ? 'bronze' : session.format !== 'manual BO1' && index === session.rounds.length - 1 ? 'final' : null} expandedBye key={match.id} match={match} names={names} numbers={numbers}
        sources={session.rounds[index - 1]?.slice(i * 2, i * 2 + 2).map(source => source.id)}>
        {match.teams.every(Boolean) && (match.map ?
          <ScoreForm key={JSON.stringify([match.teams, match.score])} match={match} names={names} edit={edit} busy={busy} /> :
          <Button type="button" disabled={busy} onClick={() => roll(match)}>
            Крутить карту <ArrowRightIcon />
          </Button>)}
      </MatchCard>
    )}</div>
  </section>)}</>;
}
