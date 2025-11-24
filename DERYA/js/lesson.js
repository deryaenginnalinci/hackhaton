const files = [
  `../lessons/${folder}/lesson1.md`,
  `../lessons/${folder}/lesson2.md`,
  `../lessons/${folder}/lesson3.md`,
];

async function loadMarkdownStream(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    content += decoder.decode(value, { stream: true });
  }

  return content;
}

async function loadAll() {
  const container = document.getElementById('content');

  for (let file of files) {
    const md = await loadMarkdownStream(file);
    const section = document.createElement('section');
    section.innerHTML = marked.parse(md);
    container.appendChild(section);
  }
}

loadAll();
