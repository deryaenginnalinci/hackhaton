// server.js con sidebar y comentarios explicativos en español

// -------------------------------
// IMPORTS BÁSICOS DE NODE
// -------------------------------
const http = require("http"); // Crea el servidor HTTP
const fs = require("fs"); // Permite leer archivos del sistema
const path = require("path"); // Manejo seguro de rutas
const { Transform } = require("stream"); // Clase base para crear transform streams
const { pipeline } = require("stream/promises"); // Para conectar streams usando async/await

// Usamos import dinámico (ESM) para "Marked"
let marked;
(async () => {
  marked = (await import("marked")).marked; // Convierte Markdown → HTML
})();

const PORT = 8080; // Puerto del servidor local

// --------------------------------------------------------------------
//                     TRANSFORM STREAM MD → HTML
// --------------------------------------------------------------------
// Esta clase transforma archivos Markdown leídos por streaming en HTML.
// Se usa para evitar cargar archivos enteros en memoria.
class MarkdownToHTML extends Transform {
  constructor() {
    super();
    this.buffer = ""; // Acumulamos aquí el contenido MD
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    callback();
  }

  _flush(callback) {
    const html = marked.parse(this.buffer); // Convertimos a HTML
    this.push(html);
    callback();
  }
}

// --------------------------------------------------------------------
//              OBTENER RUTAS DE ARCHIVOS DE CADA LECCIÓN
// --------------------------------------------------------------------
// Esta función devuelve las rutas a los 3 capítulos MD de cada lección.
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

// --------------------------------------------------------------------
//         FUNCIÓN PARA GENERAR EL SIDEBAR (Tabla de contenidos)
// --------------------------------------------------------------------
// EXTRA: analizamos los encabezados del HTML generado para construir un TOC.
function generateSidebar(htmlContent) {
  // Buscamos títulos h1-h4 del markdown procesado
  const headingRegex = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/g; // cambiado para que pueda leer los emojis
  let match;
  let toc = "<div class='toc'><h3>Contenido</h3><ul>";

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const title = match[2];
    const id = title.toLowerCase().replace(/ /g, "-");

    // Insertamos ancla en el contenido final
    htmlContent = htmlContent.replace(
      match[0],
      `<h${level} id='${id}'>${title}</h${level}>`
    );

    toc += `<li class='lvl-${level}'><a href='#${id}'>${title}</a></li>`;
  }

  toc += "</ul></div>";

  return { toc, updatedHTML: htmlContent };
}

// --------------------------------------------------------------------
//    ENVOLTURA HTML FINAL (sidebar separado + contenido centrado)
// --------------------------------------------------------------------
function wrapHTML(content, title) {
  const { toc, updatedHTML } = generateSidebar(content);

  console.log(">>> NUEVO WRAP HTML ACTIVO <<<");

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css">
  </head>

  <body>

    <!-- Sidebar independiente -->
    <aside class="sidebar-wrapper">
      ${toc}
    </aside>

    <!-- Contenido centrado -->
    <main class="lesson-wrapper">

      <!-- Volver dentro del contenido -->
      <div class="volver">
        <a href="/">Volver</a>
      </div>

      ${updatedHTML}

    </main>

  </body>
  </html>`;
}


// --------------------------------------------------------------------
//                           SERVIDOR HTTP
// --------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  console.log("URL recibida:", req.url);

  // INDEX
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./index.html").pipe(res);
    return;
  }

  // ABOUT
  if (req.url === "/about") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./about.html").pipe(res);
    return;
  }

  // CONTACT
  if (req.url === "/contact") {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream("./contact.html").pipe(res);
    return;
  }

  // CSS
  if (req.url === "/styles.css") {
    res.writeHead(200, { "Content-Type": "text/css" });
    fs.createReadStream("./styles.css").pipe(res);
    return;
  }

  // IMÁGENES
  if (req.url.startsWith("/img/")) {
    const filePath = path.join(__dirname, req.url);
    const ext = path.extname(filePath);

    const mime =
      {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // LECCIONES MD → HTML
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

        finalHTML += `
          <section class="chapter">
            <h2>${path.basename(mdPath)}</h2>
            ${htmlChunk}
          </section>`;
      }

      res.end(wrapHTML(finalHTML, `Lección ${id}`));
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end("Error interno del servidor");
    }

    return;
  }

  res.writeHead(404);
  res.end("404 Not Found");
});

// --------------------------------------------------------------------
//                        INICIAR SERVIDOR LOCAL
// --------------------------------------------------------------------
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Servidor protegido en http://localhost:${PORT}`);
});
