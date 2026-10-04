import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const dist = 'dist/resume/browser';
const base = process.env.BASE_HREF ?? '/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(base)) return res.writeHead(404).end();
  let file = normalize(join(dist, path.slice(base.length)));
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}${base}`;

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(origin, { waitUntil: 'networkidle0' });
  await page.waitForSelector('mat-card');
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({
    path: join(dist, 'resume.pdf'),
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  });
  console.log('wrote resume.pdf');
} finally {
  await browser.close();
  server.close();
}
