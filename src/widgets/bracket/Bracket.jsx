import React, {useLayoutEffect, useRef} from 'react';
import {MatchCard} from '../../entities/tournament/MatchCard.jsx';
import {roundName} from '../../entities/tournament/model.js';

export function Bracket({session, names, numbers}) {
  const root = useRef(null);
  const canvas = useRef(null);

  useLayoutEffect(() => {
    const bracket = root.current;
    const surface = canvas.current;
    const context = surface.getContext('2d');
    if (!context) return;

    function paint() {
      const scale = window.devicePixelRatio || 1;
      surface.width = Math.ceil(bracket.clientWidth * scale);
      surface.height = Math.ceil(bracket.clientHeight * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.lineWidth = 1.5;
      context.lineJoin = 'round';
      const origin = bracket.getBoundingClientRect();
      const cards = new Map(Array.from(bracket.querySelectorAll('[data-match]'), card =>
        [card.dataset.match, card.getBoundingClientRect()]));

      session.rounds.slice(1).forEach((round, r) => round.forEach((match, i) => {
        const end = cards.get(match.id);
        const y2 = end.top + end.height / 2 - origin.top;
        session.rounds[r].slice(i * 2, i * 2 + 2).forEach(source => {
          const start = cards.get(source.id);
          const x1 = start.right - origin.left;
          const x2 = end.left - origin.left;
          const middle = (x1 + x2) / 2;
          const y1 = start.top + start.height / 2 - origin.top;
          context.strokeStyle = source.winner ? '#094067' : '#90b4ce';
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(middle, y1);
          context.lineTo(middle, y2);
          context.lineTo(x2, y2);
          context.stroke();
        });
      }));
    }

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(bracket);
    window.addEventListener('resize', paint);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', paint);
    };
  }, [session]);

  return <div id="bracket-scroll" tabIndex={0} aria-label="Сетка турнира с прокруткой">
    <div id="bracket" ref={root} style={{'--rounds': session.rounds.length}}>
      <canvas ref={canvas} aria-hidden="true" />
      {session.rounds.map((round, r) => <React.Fragment key={r}>
        <h2 style={{gridColumn: r + 1, gridRow: 1}}>{roundName(session.rounds.length, r)}</h2>
        {round.map((match, i) => {
          const span = 2 ** r;
          const sources = session.rounds[r - 1]?.slice(i * 2, i * 2 + 2).map(source => source.id);
          return <div className="bracket-slot" key={match.id}
            style={{gridColumn: r + 1, gridRow: (2 + i * span) + ' / span ' + span}}>
            <MatchCard match={match} names={names} numbers={numbers} sources={sources} />
          </div>;
        })}
      </React.Fragment>)}
    </div>
  </div>;
}


