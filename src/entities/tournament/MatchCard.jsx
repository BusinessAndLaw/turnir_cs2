import React from 'react';
import {maps} from './model.js';
import {ViewIcon} from '../../shared/Icons.jsx';

export function MatchCard({match, names, numbers, children, sources, expandedBye = false, placementRound}) {
  if (match.bye && expandedBye) return <article className="match match--bye" data-match={match.id}>
    <div className="match-title"><span>Матч №{numbers.get(match.id)}</span></div>
    <div className="bye-content"><ViewIcon /><h3>Проход без матча</h3><span className="winner">{names.get(match.winner)}</span></div>
  </article>;
  return <article className="match" data-match={match.id}>
    <div className="match-title">
      <span>Матч №{numbers.get(match.id)}</span>
      <strong>{match.bye ? 'Проход без матча' : maps[match.map] ?? 'Карта не выбрана'}</strong>
    </div>
    {match.map && <img draggable={false} className="match-image" src={'/maps/' + match.map + '.jpg'} alt={'Скрин карты ' + maps[match.map]} width={480} height={270} />}
    {match.teams.map((team, slot) => {
      if (match.bye && slot === 1) return null;
      const side = match.startingSides?.[slot];
      const place = match.winner && team && (placementRound === 'final' ? (team === match.winner ? 1 : 2) : placementRound === 'bronze' && team === match.winner ? 3 : null);
      return <div className={'team' + (place ? ' podium podium--' + place : '')} key={slot}>
        <span className={'side ' + (side ?? '')} title={side === 'CT' ? 'Спецназ · стартовая сторона' : side === 'T' ? 'Террористы · стартовая сторона' : undefined}>
          {side && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{side === 'CT' ? <><path d="M12 2 21 6v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m7 11 3 3 7-7"/></> : <><path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z"/><path d="m10 12 2-3 2 3-2 3Z"/></>}</svg>}
        </span>
        <span title={names.get(team)} className={team && team === match.winner ? 'winner' : ''}>{names.get(team) ?? ''}{place && <small className="place-label">{place + '-е место'}</small>}</span>
        {match.score && <strong className="score-value" key={match.score.join(':')}>{match.score[slot]}</strong>}
      </div>;
    })}
    {children}
  </article>;
}

