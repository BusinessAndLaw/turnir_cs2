import {Button} from '../../shared/Button.jsx';
import React, {useRef, useState} from 'react';
import {useDialogClose} from '../../shared/useDialogClose.js';
import {draw, maps} from '../../entities/tournament/model.js';

export function TeamEntry({session, save, busy, onError}) {
  const [text, setText] = useState(session?.teams.map(team => team.name).join('\n') ?? '');
  const [pool, setPool] = useState(session?.mapPool ?? Object.keys(maps).slice(0, 7));
  const teamDialog = useRef(null);
  const mapDialog = useRef(null);
  const closeTeams = useDialogClose(teamDialog);
  const closeMaps = useDialogClose(mapDialog);
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
      <Button variant="secondary" type="button" onClick={() => {
        setTeamDraft(text);
        teamDialog.current.showModal();
      }}>Команды <span className="action-count">{names.length}</span></Button>
      <Button variant="secondary" type="button" onClick={() => {
        setMapDraft(pool);
        mapDialog.current.showModal();
      }}>Карты <span className="action-count">{pool.length}</span></Button>
      <Button disabled={busy}>Распределить команды</Button>
    </form>

    <dialog onCancel={event => { event.preventDefault(); closeTeams(); }} ref={teamDialog} aria-labelledby="teams-title">
      <form onSubmit={event => {
        event.preventDefault();
        setText(teamDraft);
        closeTeams();
      }}>
        <h2 id="teams-title">Команды турнира</h2>
        <label htmlFor="names">По одной команде на строку</label>
        <textarea id="names" rows={9} value={teamDraft} onChange={event => setTeamDraft(event.target.value)}
          placeholder={'Команда Alpha\nКоманда Bravo'} autoFocus />
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={() => closeTeams()}>Отмена</Button>
          <Button>Готово</Button>
        </div>
      </form>
    </dialog>

    <dialog onCancel={event => { event.preventDefault(); closeMaps(); }} ref={mapDialog} className="map-dialog" aria-labelledby="maps-title">
      <form onSubmit={event => {
        event.preventDefault();
        if (!mapDraft.length) return;
        setPool(mapDraft);
        closeMaps();
      }}>
        <h2 id="maps-title">Карты турнира</h2>
        <div id="maps">{Object.entries(maps).map(([id, name]) =>
          <label className="map" key={id}>
            <input type="checkbox" checked={mapDraft.includes(id)} onChange={event => {
              const checked = event.target.checked;
              setMapDraft(current => checked ? [...current, id] : current.filter(item => item !== id));
            }} />
            <img draggable={false} src={'/maps/' + id + '.jpg'} alt="" width={480} height={270} />
            <span>{name}</span>
          </label>
        )}</div>
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={() => closeMaps()}>Отмена</Button>
          <Button disabled={!mapDraft.length}>Готово</Button>
        </div>
      </form>
    </dialog>
  </>;
}
