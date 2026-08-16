const fs = require('fs');
const path = require('path');

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
}

const docsDir = path.join(__dirname, 'docs');
const files = [];
walk(docsDir, files);

const blocks = [];
const re = /```mermaid\r?\n([\s\S]*?)```/g;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  let idx = 0;
  while ((m = re.exec(content)) !== null) {
    idx++;
    blocks.push({
      file: path.relative(__dirname, f).replace(/\\/g, '/'),
      idx,
      code: m[1],
    });
  }
  re.lastIndex = 0;
}

fs.writeFileSync(path.join(__dirname, '_mermaid_blocks.json'), JSON.stringify(blocks, null, 2), 'utf8');
console.log('extracted', blocks.length, 'mermaid blocks from', files.length, 'files');
