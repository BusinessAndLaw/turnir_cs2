import {Button} from '../shared/Button.jsx';
import React, {useEffect, useRef, useState} from 'react';
import {advance, allMatches} from '../entities/tournament/model.js';
import {TeamEntry} from '../features/team-entry/TeamEntry.jsx';
import {requestSession} from '../shared/api/session.js';
import {Bracket} from '../widgets/bracket/Bracket.jsx';
import {Matches} from '../widgets/matches/Matches.jsx';

export function TournamentPage() {
  const [tab, setTab] = useState('teams');
  const [session, setSession] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending || saving.current) return;
      pending = true;
      const version = generation.current;
      try {
        const next = await requestSession();
        if (active && version === generation.current) setSession(current =>
          current !== undefined && current?.id === next?.id && current?.revision === next?.revision ? current : next);
      } catch (failure) {
        if (active && version === generation.current) setError(failure.message);
      } finally {
        pending = false;
      }
    }
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  async function save(next) {
    if (saving.current) return;
    saving.current = true;
    generation.current++;
    setBusy(true);
    setError('');
    try {
      setSession(await requestSession({base: session ? [session.id, session.revision] : null, next}));
      return true;
    } catch (failure) {
      if ('current' in failure) setSession(failure.current);
      setError(failure.message);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function edit(id, change) {
    const next = JSON.parse(JSON.stringify(session));
    change(allMatches(next).find(match => match.id === id));
    next.revision++;
    advance(next);
    return save(next);
  }

  const numbers = new Map((session ? allMatches(session) : []).map((match, index) => [match.id, index + 1]));
  const names = new Map(session?.teams.map(team => [team.id, team.name]));
  return <>

    <main>
      <nav aria-label="Разделы турнира">
        <Button variant="secondary" aria-current={tab === 'teams' ? 'page' : undefined} onClick={() => setTab('teams')}>Команды и матчи</Button>
        <Button variant="secondary" aria-current={tab === 'bracket' ? 'page' : undefined} onClick={() => setTab('bracket')}>Турнирная сетка</Button>
      </nav>
      {error && <p role="alert" id="status">{error}</p>}
      {session === undefined ? <p>Загрузка сессии</p> : <>
        <section className="view" hidden={tab !== 'teams'}>
          <h1>Команды и матчи</h1>
          <TeamEntry key={session?.id ?? 'new'} session={session} save={save} busy={busy} onError={setError} />
          {session && <Matches session={session} names={names} numbers={numbers} edit={edit} busy={busy} />}
        </section>
        {tab === 'bracket' && <section className="view">
          <h1 className="bracket-title">Турнирная сетка</h1>
          {session ? <Bracket session={session} names={names} numbers={numbers} /> : <p>Сначала распредели команды</p>}
        </section>}
      </>}
    </main>
  </>;
}
