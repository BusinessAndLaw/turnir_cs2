import {XMarkIcon} from '../../shared/Icons.jsx';
import {rouletteCards} from './roulette.js';
import {Button} from '../../shared/Button.jsx';
import React, {useEffect, useRef, useState} from 'react';
import {useDialogClose} from '../../shared/useDialogClose.js';
import {maps} from '../../entities/tournament/model.js';

export function MapRoulette({map, pool, onClose}) {
  const dialog = useRef(null);
  const close = useDialogClose(dialog, onClose);
  const [done, setDone] = useState(false);
  const [moving, setMoving] = useState(false);
  const [{cards, target}] = useState(() => rouletteCards(pool, map));
  useEffect(() => {
    dialog.current.showModal();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = setTimeout(() => setMoving(true), 80);
    const end = setTimeout(() => setDone(true), reduced || target === 0 ? 100 : 6100);
    return () => { clearTimeout(start); clearTimeout(end); };
  }, []);
  return <dialog ref={dialog} className="roulette-dialog" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="roulette-heading"><Button variant="secondary" shape="circle" onClick={close} aria-label="Закрыть рулетку"><XMarkIcon /></Button></div>
    <h2>{done ? maps[map] : 'Где сыграем?'}</h2>
    <p>{done ? 'Карта определена. Пора идти в кабинеты!' : 'Крутим карты из пула турнира…'}</p>
    <div className={'roulette-window' + (done ? ' landed' : '')}>
      <div className="roulette-pointer" />
      <div className="roulette-track" style={{transform: `translateX(calc(50% - 90px - ${moving ? target * 192 : 0}px))`}}>
        {cards.map((id, i) => <div className={'roulette-card' + (done && i === target ? ' selected' : '')} key={i}><img draggable={false} src={'/maps/' + id + '.jpg'} alt=""/><strong>{maps[id]}</strong></div>)}
      </div>
    </div>
    {done && <div className="dialog-actions"><Button onClick={close}>Погнали играть</Button></div>}
  </dialog>;
}

