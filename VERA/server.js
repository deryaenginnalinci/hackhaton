// -------------------------------
// IMPORTS BÁSICOS DE NODE
// -------------------------------
const http = require('http'); // Crea el servidor HTTP
const fs = require('fs'); // Permite leer archivos del sistema
const path = require('path'); // Manejo seguro de rutas
const { Transform } = require('stream'); // Clase base para crear transform streams
const { pipeline } = require('stream/promises'); // Para conectar streams usando async/await

// Usamos import dinámico (ESM) para "Marked"
let marked;
(async () => {
  marked = (await import('marked')).marked; // Carga la librería que convierte Markdown → HTML
})();

const PORT = 8080; // Puerto donde escucha el servidor (localhost:8080)

// --------------------------------------------------------------------
//                        TRANSFORM STREAM MD → HTML
// --------------------------------------------------------------------
class MarkdownToHTML extends Transform {
  constructor() {
    super();
    this.buffer = ''; // Aquí se va guardando el Markdown antes de convertirlo
  }

  // _transform se ejecuta por cada "trozo" del .md que se va leyendo
  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString(); // Acumula todo el contenido
    callback(); // Continúa con el siguiente chunk
  }

  // Cuando se termina de leer el archivo, ejecuta _flush
  _flush(callback) {
    const html = marked.parse(this.buffer); // Convierte Markdown → HTML
    this.push(html); // Devuelve el HTML procesado al stream
    callback();
  }
}

// --------------------------------------------------------------------
//                  FUNCION PARA OBTENER RUTAS DE LECCIONES
// --------------------------------------------------------------------
function getLessonPaths(id) {
  // Carpeta donde están las lecciones
  const folderNames = {
    1: '01.Event-emitters',
    2: '02.Streams',
    3: '03.Error-control',
  };

  // Selecciona la carpeta correcta según el id
  const folder = folderNames[id];
  if (!folder) return null; // Si no existe, devuelve null

  // Devuelve las rutas completas de los 3 capítulos markdown
  return [
    path.join('lessons', folder, 'lesson1.md'),
    path.join('lessons', folder, 'lesson2.md'),
    path.join('lessons', folder, 'lesson3.md'),
  ];
}

// --------------------------------------------------------------------
//                          ENVOLTURA HTML FINAL
// --------------------------------------------------------------------
function wrapHTML(content, title) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css"> <!-- Cargamos CSS -->
  </head>
  <body>
    <nav>
      <a href="/">Volver</a>
    </nav>

    <main class="lesson-wrapper">
      ${content} <!-- Aquí se inyecta el HTML generado -->
    </main>
  </body>
  </html>`;
}

// --------------------------------------------------------------------
//                            SERVIDOR HTTP
// --------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  console.log('URL recibida:', req.url);

  // -------------------------------
  // SERVIR ARCHIVO PRINCIPAL (index)
  // -------------------------------
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream('./index.html').pipe(res);
    return;
  }

  // -------------------------------
  // SERVIR CSS
  // -------------------------------
  if (req.url === '/styles.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    fs.createReadStream('./styles.css').pipe(res);
    return;
  }

  // -------------------------------
  // SERVIR IMÁGENES (carpeta /img/)
  // -------------------------------
  if (req.url.startsWith('/img/')) {
    const filePath = path.join('.', req.url);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // --------------------------------------------------------------------
  //                           RUTA DE LECCIONES
  // --------------------------------------------------------------------
  if (req.url.startsWith('/lesson/')) {
    const id = parseInt(req.url.split('/')[2]); // Extrae "1", "2", etc.

    const paths = getLessonPaths(id); // Busca los markdown
    if (!paths) {
      res.writeHead(404);
      res.end('Lección no encontrada');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    let finalHTML = ''; // Aquí se junta toda la lección

    try {
      // Aquí se procesa cada archivo Markdown
      for (const mdPath of paths) {
        const mdStream = fs.createReadStream(mdPath); // Lee el MD
        const transformer = new MarkdownToHTML(); // Lo converte a HTML

        let htmlChunk = '';

        // pipeline conecta el stream del MD → transformador → salida programada
        await pipeline(mdStream, transformer, async function* (source) {
          for await (const chunk of source) {
            htmlChunk += chunk.toString(); // Acumula HTML generado
          }
        });

        // Envolvemos cada markdown convertido en una sección
        finalHTML += `
          <section class="chapter">
            <h2>${path.basename(mdPath)}</h2>
            ${htmlChunk}
          </section>`;
      }

      // Lanzamos la página
      res.end(wrapHTML(finalHTML, `Lección ${id}`));
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Error interno del servidor');
    }

    return;
  }

  // --------------------------------------------------------------------
  //                                404
  // --------------------------------------------------------------------
  res.writeHead(404);
  res.end('404 Not Found');
});

// --------------------------------------------------------------------
//                        INICIAR SERVIDOR SEGURO
// --------------------------------------------------------------------
// Escucha SOLO en 127.0.0.1 (localhost)
// Nadie desde otra red puede verlo.
// Cualquier otra persona lo verá usando SU propia IP localhost, no la mía.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor protegido en http://localhost:${PORT}`);
});
