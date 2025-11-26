const http = require("http");
const fs = require("fs");
const path = require("path");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");
let marked;
(async () => {
  marked = (await import("marked")).marked;
})();

const PORT = 8080;

// Transform Markdown → HTML
class MarkdownToHTML extends Transform {
  constructor() {
    super();
    this.buffer = "";
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
    1: "01.Event-emitters",
    2: "02.Streams",
    3: "03.Error-control",
  };

  const folder = folderNames[id];
  if (!folder) return null;

  return [
    path.join("lessons", folder, "lesson1.md"),
    path.join("lessons", folder, "lesson2.md"),
    path.join("lessons", folder, "lesson3.md"),
  ];
}

function extractHeadings(html) {
  const headingRegex = /<h([1-6])>(.*?)<\/h\1>/g;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = Number(match[1]);
    const text = match[2];
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    headings.push({ level, text, id });
  }

  return headings;
}

function navButtons(id) {
  const prev =
    id > 1
      ? `<a class="nav-btn prev" href="/lesson/${id - 1}">← Previous</a>`
      : "";
  const next =
    id < 3 ? `<a class="nav-btn next" href="/lesson/${id + 1}">Next →</a>` : "";

  return `
    <div class="lesson-nav">
      ${prev}
      ${next}
    </div>
  `;
}

function tableOfContents(html) {
  const headings = extractHeadings(html);

  if (headings.length === 0) return "";

  let tocHTML = '<div class="toc"><h3>Índice</h3><ul>';

  for (const h of headings) {
    tocHTML += `
      <li class="lvl-${h.level}">
        <a href="#${h.id}">${h.text}</a>
      </li>`;
  }

  tocHTML += "</ul></div>";

  return tocHTML;
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

  <div class="layout">
  ${tableOfContents(content)}

  <main class="lesson-wrapper">
    ${content}
    ${navButtons(parseInt(title.replace("Lección ", "")))}
  </main>
</div>


  </body>
  </html>`;
}

const server = http.createServer(async (req, res) => {
  console.log("URL recibida:", req.url);

  // SERVIR INDEX
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./index.html").pipe(res);
    return;
  }

  // SERVIR CSS
  if (req.url === "/styles.css") {
    res.writeHead(200, { "Content-Type": "text/css" });
    fs.createReadStream("./styles.css").pipe(res);
    return;
  }

  // SERVIR IMÁGENES
  if (req.url.startsWith("/img/")) {
    const filePath = path.join(".", req.url);
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SERVIR ABOUT
  if (req.url === "/about" || req.url === "/about.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream("./about.html").pipe(res);
    return;
  }

  // SERVIR CONTACT
  if (req.url === "/contact" || req.url === "/contact.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream("./contact.html").pipe(res);
    return;
  }

  // SERVIR LECCIONES
  if (req.url.startsWith("/lesson/")) {
    const id = parseInt(req.url.split("/")[2]);

    const paths = getLessonPaths(id);
    if (!paths) {
      res.writeHead(404);
      res.end("Lección no encontrada");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

    let finalHTML = "";

    try {
      for (const mdPath of paths) {
        const mdStream = fs.createReadStream(mdPath);
        const transformer = new MarkdownToHTML();

        let htmlChunk = "";

        await pipeline(mdStream, transformer, async function* (source) {
          for await (const chunk of source) {
            htmlChunk += chunk.toString();
          }
        });

        // Añader IDs a los headings
        htmlChunk = htmlChunk.replace(
          /<h([1-6])>(.*?)<\/h\1>/g,
          (m, level, text) => {
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `<h${level} id="${id}">${text}</h${level}>`;
          }
        );

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
      res.end("Error interno del servidor");
    }

    return;
  }

  // 404 si no coincide con nada
  res.writeHead(404);
  res.end("404 Not Found");
});

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
