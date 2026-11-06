import React, {useRef, useState} from 'react';
import {draw, maps} from '../../entities/tournament/model.js';

export function TeamEntry({session, save, busy, onError}) {
  const [text, setText] = useState(session?.teams.map(team => team.name).join('\n') ?? '');
  const [pool, setPool] = useState(session?.mapPool ?? Object.keys(maps).slice(0, 7));
  const teamDialog = useRef(null);
  const mapDialog = useRef(null);
  const [teamDraft, setTeamDraft] = useState(text);
  const [mapDraft, setMapDraft] = useState(pool);
  const names = text.split(/\r?\n/).map(name => name.trim()).filter(Boolean);

  function submit(event) {
    event.preventDefault();
    if (names.length < 2 || names.length > 64 || names.some(name => name.length > 80)) {
      return onError('Добавь от 2 до 64 команд с названиями до 80 символов');
    }
    if (new Set(names.map(name => name.toLowerCase())).size !== names.length) {
      return onError('Названия команд должны быть уникальными');
    }
    if (!pool.length) return onError('Выбери хотя бы одну карту');
    if (session && !confirm('Новая жеребьёвка заменит текущие пары и результаты. Продолжить?')) return;
    save(draw(names, pool));
  }

  return <>
    <form id="draw" className="tournament-actions" onSubmit={submit}>
      <button className="secondary" type="button" onClick={() => {
        setTeamDraft(text);
        teamDialog.current.showModal();
      }}>Команды <span className="action-count">{names.length}</span></button>
      <button className="secondary" type="button" onClick={() => {
        setMapDraft(pool);
        mapDialog.current.showModal();
      }}>Карты <span className="action-count">{pool.length}</span></button>
      <button disabled={busy}>Распределить команды</button>
    </form>

    <dialog ref={teamDialog} aria-labelledby="teams-title">
      <form onSubmit={event => {
        event.preventDefault();
        setText(teamDraft);
        teamDialog.current.close();
      }}>
        <h2 id="teams-title">Команды турнира</h2>
        <label htmlFor="names">По одной команде на строку</label>
        <textarea id="names" rows={9} value={teamDraft} onChange={event => setTeamDraft(event.target.value)}
          placeholder={'Команда Alpha\nКоманда Bravo'} autoFocus />
        <div className="dialog-actions">
          <button className="secondary" type="button" onClick={() => teamDialog.current.close()}>Отмена</button>
          <button>Готово</button>
        </div>
      </form>
    </dialog>

    <dialog ref={mapDialog} className="map-dialog" aria-labelledby="maps-title">
      <form onSubmit={event => {
        event.preventDefault();
        if (!mapDraft.length) return;
        setPool(mapDraft);
        mapDialog.current.close();
      }}>
        <h2 id="maps-title">Карты турнира</h2>
        <div id="maps">{Object.entries(maps).map(([id, name]) =>
          <label className="map" key={id}>
            <input type="checkbox" checked={mapDraft.includes(id)} onChange={event => {
              const checked = event.target.checked;
              setMapDraft(current => checked ? [...current, id] : current.filter(item => item !== id));
            }} />
            <img src={'/maps/' + id + '.jpg'} alt="" width={480} height={270} />
            <span>{name}</span>
          </label>
        )}</div>
        <div className="dialog-actions">
          <button className="secondary" type="button" onClick={() => mapDialog.current.close()}>Отмена</button>
          <button disabled={!mapDraft.length}>Готово</button>
        </div>
      </form>
    </dialog>
  </>;
}
