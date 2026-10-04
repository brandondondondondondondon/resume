import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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

const { roles = [] } = JSON.parse(await readFile(join(dist, 'data/resume.json'), 'utf8'));
const targets = [
  { file: 'resume.pdf', query: '' },
  ...roles.map((r) => ({ file: `resume-${r.id}.pdf`, query: `?role=${r.id}` })),
];

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  for (const { file, query } of targets) {
    await page.goto(origin + query, { waitUntil: 'networkidle0' });
    await page.waitForSelector('mat-card');
    await page.evaluateHandle('document.fonts.ready');
    await page.pdf({
      path: join(dist, file),
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    });
    console.log('wrote', file);
  }
} finally {
  await browser.close();
  server.close();
}
