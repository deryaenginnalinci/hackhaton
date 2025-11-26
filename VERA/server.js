const http = require('http');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
let marked;
(async () => {
  marked = (await import('marked')).marked;
})();

const PORT = 8080;

// Transform Markdown → HTML
class MarkdownToHTML extends Transform {
  constructor() {
    super();
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    callback();
  }

  _flush(callback) {
    const html = marked.parse(this.buffer);
    this.push(html);
    callback();
  }
}

// Rutas reales de tus carpetas
function getLessonPaths(id) {
  const folderNames = {
    1: '01.Event-emitters',
    2: '02.Streams',
    3: '03.Error-control',
  };

  const folder = folderNames[id];
  if (!folder) return null;

  return [
    path.join('lessons', folder, 'lesson1.md'),
    path.join('lessons', folder, 'lesson2.md'),
    path.join('lessons', folder, 'lesson3.md'),
  ];
}

// HTML final
function wrapHTML(content, title) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <nav>
      <a href="/">Volver</a>
    </nav>

    <main class="lesson-wrapper">
      ${content}
    </main>
  </body>
  </html>`;
}

const server = http.createServer(async (req, res) => {
  console.log('URL recibida:', req.url);

  // SERVIR INDEX (ruta correcta)
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream('./index.html').pipe(res);
    return;
  }

  // SERVIR CSS (ruta correcta)
  if (req.url === '/styles.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    fs.createReadStream('./styles.css').pipe(res);
    return;
  }

  // SERVIR IMÁGENES (ruta correcta)
  if (req.url.startsWith('/img/')) {
    const filePath = path.join('.', req.url); // img/fondo.jpg
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // ----------------------------
  //         LECCIÓN /lesson/X
  // ----------------------------
  if (req.url.startsWith('/lesson/')) {
    const id = parseInt(req.url.split('/')[2]);

    const paths = getLessonPaths(id);
    if (!paths) {
      res.writeHead(404);
      res.end('Lección no encontrada');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    let finalHTML = '';

    try {
      for (const mdPath of paths) {
        const mdStream = fs.createReadStream(mdPath);
        const transformer = new MarkdownToHTML();

        let htmlChunk = '';

        await pipeline(mdStream, transformer, async function* (source) {
          for await (const chunk of source) {
            htmlChunk += chunk.toString();
          }
        });

        finalHTML += `
          <section class="chapter">
            <h2>${path.basename(mdPath)}</h2>
            ${htmlChunk}
          </section>`;
      }

      res.end(wrapHTML(finalHTML, `Lección ${id}`));
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Error interno del servidor');
    }

    return;
  }

  // 404 si no coincide con nada
  res.writeHead(404);
  res.end('404 Not Found');
});

// INICIAR SERVIDOR
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
