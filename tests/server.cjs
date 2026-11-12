const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'] };
http.createServer((req, res) => {
  const file = files[req.url];
  if (!file) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8` });
  fs.createReadStream(path.join(__dirname, '../public', file[0])).pipe(res);
}).listen(4173, '127.0.0.1');
