import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([['/', ['index.html','text/html; charset=utf-8']], ['/bundle.js',['bundle.js','text/javascript']]]);
const server = createServer(async (request,response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  const route = routes.get(path);
  if (!route) { response.writeHead(404); response.end(); return; }
  try { response.writeHead(200, {'content-type':route[1], 'cache-control':'no-store'});
    response.end(await readFile(new URL('../demo/' + route[0], import.meta.url))); }
  catch { response.destroy(); }
});
server.listen(Number(process.env.PORT ?? 4175), '127.0.0.1', () => console.log(`Demo: http://127.0.0.1:${server.address().port}`));
