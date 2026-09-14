const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) {
      fs.writeFileSync(path.join(__dirname, 'crash.log'), err.toString());
      throw err;
    }
  });
}).catch((err) => {
  fs.writeFileSync(path.join(__dirname, 'crash.log'), err.stack || err.toString());
  process.exit(1);
});