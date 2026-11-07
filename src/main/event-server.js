const http = require('node:http');

const MAX_BODY_BYTES = 1024;

function createEventServer(stateMachine, { port = 4747 } = {}) {
  return http.createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/event') {
      response.writeHead(404).end('Not found');
      return;
    }

    let body = '';
    let bodyBytes = 0;
    let bodyTooLarge = false;
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      bodyBytes += Buffer.byteLength(chunk, 'utf8');
      if (bodyBytes > MAX_BODY_BYTES && !bodyTooLarge) {
        bodyTooLarge = true;
        response.writeHead(413).end('Body too large');
        return;
      }
      if (bodyTooLarge) return;
      body += chunk;
    });
    request.on('end', () => {
      if (bodyTooLarge || response.writableEnded || response.destroyed) return;
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        response.writeHead(400).end('Invalid JSON');
        return;
      }

      if (!payload || typeof payload.type !== 'string' || !stateMachine.dispatch(payload.type)) {
        response.writeHead(400).end('Unknown event type');
        return;
      }

      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ state: stateMachine.getState() }));
    });
  }).listen(port, '127.0.0.1');
}

module.exports = { createEventServer, MAX_BODY_BYTES };
