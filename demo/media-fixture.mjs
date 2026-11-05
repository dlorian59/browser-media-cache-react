// EN: Local HTTP fixture only; account labels are not authenticated identities.
// RU: Только локальный HTTP-fixture; метки аккаунтов не являются проверенной идентичностью.
const requests = new Map();
function wave() {
  const rate = 16000, frames = rate * 2;
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index++) bytes.writeInt16LE(Math.round(Math.sin(index / rate * Math.PI * 440) * 1200 * Math.min(index / 800, (frames - index) / 800, 1)), 44 + index * 2);
  return bytes;
}
const audio = wave();

export function serveMediaFixture(request, response, path) {
  if (path === '/api/fixture/reset' && request.method === 'POST') {
    requests.clear(); response.writeHead(204); response.end(); return true;
  }
  if (path === '/api/fixture/stats') {
    response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(Object.fromEntries(requests))); return true;
  }
  const match = /^\/api\/accounts\/(alice|bob)\/media\/(landscape%3Av1|voice%3Av1)$/i.exec(path);
  if (!match || request.method !== 'GET') return false;
  const account = match[1]; const key = decodeURIComponent(match[2]); const id = `${account}/${key}`;
  const attempt = (requests.get(id) ?? 0) + 1; requests.set(id, attempt);
  const timer = setTimeout(() => {
    if (account === 'alice' && key === 'landscape:v1' && attempt === 1) {
      response.writeHead(503, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); response.end('Intentional first-load failure'); return;
    }
    const bytes = key === 'voice:v1' ? audio : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" fill="#e3edf0"/><circle cx="370" cy="65" r="30" fill="#efc880"/><path d="M0 240V165L140 55 270 195 365 115 480 200V240Z" fill="${account === 'alice' ? '#3b746d' : '#5766a8'}"/><text x="24" y="35" fill="#172b35" font-family="sans-serif" font-size="20">${account} / landscape:v1</text></svg>`);
    response.writeHead(200, { 'Content-Type': key === 'voice:v1' ? 'audio/wav' : 'image/svg+xml', 'Content-Length': bytes.length, 'Cache-Control': 'no-store' }); response.end(bytes);
  }, 1200);
  response.once('close', () => clearTimeout(timer));
  return true;
}
