const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Servir archivos estáticos
app.use(express.static(__dirname));

// Endpoint para listar archivos .md
app.get('/api/md-files', (req, res) => {
  const folder = req.query.folder; // "02.Streams", etc.

  if (!folder) {
    return res.status(400).json({ error: 'Folder not provided' });
  }

  const folderPath = path.join(__dirname, 'lessons', folder);

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const mdFiles = files.filter((f) => f.endsWith('.md'));
    res.json(mdFiles);
  });
});

app.listen(8080, () => {
  console.log('Server running at http://localhost:8080');
});
