// 下载生成的图片到本地 assets/images/ 目录
const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = {
  'part1-cover.png': process.argv[2],
};

const dir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function download(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${filename}`));
        return;
      }
      const filePath = path.join(dir, filename);
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        const stat = fs.statSync(filePath);
        console.log(`OK ${filename} ${stat.size} bytes`);
        resolve();
      });
    }).on('error', reject);
  });
}

(async () => {
  const url = process.argv[2];
  const filename = process.argv[3];
  if (!url || !filename) {
    console.error('Usage: node _dl_img.js <url> <filename>');
    process.exit(1);
  }
  await download(url, filename);
})();
