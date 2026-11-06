import {readFileSync, writeFileSync, renameSync} from 'node:fs';
import {defineConfig} from 'vite';
import {parseSession, maps} from './src/entities/tournament/model.js';

const file = new URL('./session.json', import.meta.url);
const temp = new URL('./session.tmp', import.meta.url);
const knownMaps = Object.keys(maps);

function readSession() {
  try {
    return parseSession(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''), knownMaps);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function install(server) {
  server.middlewares.use('/api/session', async (req, res) => {
    function reply(status, data) {
      res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(JSON.stringify(data));
    }
    try {
      if (req.method === 'GET') return reply(200, readSession());
      if (req.method !== 'POST' || req.headers.origin !== 'http://' + req.headers.host
          || req.headers['content-type'] !== 'application/json') {
        return reply(403, {error: 'Запрос отклонён'});
      }
      req.setEncoding('utf8');
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024 * 1024) return reply(413, {error: 'Сессия слишком большая'});
      }
      let base, next;
      try {
        const data = JSON.parse(body);
        base = data.base;
        next = parseSession(JSON.stringify(data.next), knownMaps);
      } catch {
        return reply(400, {error: 'Некорректная сессия'});
      }
      const current = readSession();
      if (JSON.stringify(base) !== JSON.stringify(current ? [current.id, current.revision] : null)) {
        return reply(409, {error: 'Сессия уже изменилась', current});
      }
      const revision = current?.id === next.id ? current.revision + 1 : 0;
      if (next.revision !== revision) return reply(400, {error: 'Некорректная версия сессии'});
      writeFileSync(temp, JSON.stringify(next, null, 2), 'utf8');
      renameSync(temp, file);
      reply(200, next);
    } catch (error) {
      console.error(error);
      reply(500, {error: 'Не удалось прочитать или сохранить сессию'});
    }
  });
}

export default defineConfig({
  plugins: [{name: 'tournament-session', configureServer: install, configurePreviewServer: install}],
  server: {
    host: '0.0.0.0', port: 8765, strictPort: true,
    fs: {deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/session.json', '**/session.tmp']},
    watch: {ignored: ['**/session.json', '**/session.tmp']}
  },
  preview: {host: '0.0.0.0', port: 8765, strictPort: true}
});

