const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const pairs = manifest.map(m => `["${encodeURIComponent(m.route).replace(/%2F/g, '/')}","${m.pdfName}"]`);
const arrLiteral = '[' + pairs.join(',') + ']';
fs.writeFileSync(path.join(__dirname, 'encoded_routes.txt'), arrLiteral, 'utf8');
console.log('written, length=', arrLiteral.length);
console.log(arrLiteral.slice(0, 200));
