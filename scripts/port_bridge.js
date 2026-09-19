const http = require('http');

const server = http.createServer((req, res) => {
  const headers = { ...req.headers };
  delete headers.host;
  const proxy = http.request(
    {
      host: '127.0.0.1',
      port: 3001,
      path: req.url,
      method: req.method,
      headers: { ...headers, host: 'localhost:3001' },
    },
    (pres) => {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    }
  );
  req.pipe(proxy);
  proxy.on('error', (err) => {
    res.writeHead(502);
    res.end('Port 3001 server not responding...');
  });
});

server.on('upgrade', (req, socket, head) => {
  const net = require('net');
  const proxySocket = net.connect(3001, '127.0.0.1', () => {
    proxySocket.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n') +
        '\r\n\r\n'
    );
    if (head && head.length) proxySocket.write(head);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxySocket.on('error', () => socket.destroy());
});

server.listen(3000, () => {
  console.log('Port bridge active: http://localhost:3000 -> http://localhost:3001');
});
