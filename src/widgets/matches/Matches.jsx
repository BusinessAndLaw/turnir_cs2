import React, {useState} from 'react';
import {MatchCard} from '../../entities/tournament/MatchCard.jsx';
import {generateGame, roundName, validScore} from '../../entities/tournament/model.js';

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
    <button className="secondary" disabled={busy || !ready}>Сохранить счёт</button>
  </form>;
}

export function Matches({session, names, numbers, edit, busy}) {
  return session.rounds.map((round, index) => <section className="game-round" key={index}>
    <h2>{roundName(session.rounds.length, index)}</h2>
    <div className="game-grid">{round.map((match, i) =>
      <MatchCard key={match.id} match={match} names={names} numbers={numbers}
        sources={session.rounds[index - 1]?.slice(i * 2, i * 2 + 2).map(source => source.id)}>
        {match.teams.every(Boolean) && (match.map ?
          <ScoreForm key={JSON.stringify([match.teams, match.score])} match={match} names={names} edit={edit} busy={busy} /> :
          <button type="button" disabled={busy} onClick={() => edit(match.id, current => generateGame(current, session.mapPool))}>
            Сгенерировать игру
          </button>)}
      </MatchCard>
    )}</div>
  </section>);
}
