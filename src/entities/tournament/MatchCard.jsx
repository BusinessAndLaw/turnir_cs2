import React from 'react';
import {maps} from './model.js';

export function MatchCard({match, names, numbers, children, sources}) {
  return <article className="match" data-match={match.id}>
    <div className="match-title">
      <span>Матч №{numbers.get(match.id)}</span>
      <strong>{match.bye ? 'Проход без матча' : maps[match.map] ?? 'Карта не выбрана'}</strong>
    </div>
    {match.map && <img className="match-image" src={'/maps/' + match.map + '.jpg'} alt={'Скрин карты ' + maps[match.map]} width={480} height={270} />}
    {match.teams.map((team, slot) => {
      if (match.bye && slot === 1) return null;
      const side = match.startingSides?.[slot];
      return <div className="team" key={slot}>
        <span className={'side ' + (side ?? '')}>{side}</span>
        <span title={names.get(team)} className={team && team === match.winner ? 'winner' : ''}>{names.get(team) ?? (sources ? 'Победитель матча №' + numbers.get(sources[slot]) : 'Ожидает победителя')}</span>
        {match.score && <strong>{match.score[slot]}</strong>}
      </div>;
    })}
    {children}
  </article>;
}


