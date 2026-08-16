/* 扫描全部课程 markdown 文件，生成 PDF 导出清单 manifest.json
 * 顺序：00前言 -> Part1(README+4章) -> Part2(README+4章) -> Part3(README+6章)
 *       -> Part4(README+3章) -> Part5(README+2章) -> Part6(README+4章)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

const PARTS = [
  { id: 'part1', chapters: ['01-Agent不是新物种', '02-一张图看懂Agent进化史', '03-大模型是发动机不是车', '04-Agent产品成熟度分级'] },
  { id: 'part2', chapters: ['05-三大经典范式手把手实现', '06-低代码平台怎么选', '07-主流框架产品化评测', '08-从零写一个Agent框架'] },
  { id: 'part3', chapters: ['09-记忆与检索', '10-上下文工程', '11-通信协议速查', '12-Agentic-RL产品经理版', '13-Agent评估体系与常见陷阱', '14-Agent安全与风险治理'] },
  { id: 'part4', chapters: ['15-企业IM智能问答机器人', '16-数据分析Agent架构演进', '17-独立开发者一周产品'] },
  { id: 'part5', chapters: ['18-毕业设计Pitch', '19-转型面试题库'] },
  { id: 'part6', chapters: ['20-多模态Agent专题', '21-Agent产品AB测试方法论', '22-Agent产品商业化与定价模式', '23-团队协作与项目管理'] },
];

function getH1(filePath) {
  const md = fs.readFileSync(filePath, 'utf8');
  const m = md.match(/^#\s+(.+)/m);
  return m ? m[1].trim() : path.basename(filePath, '.md');
}

const manifest = [];
let seq = 1;

// 00 前言
{
  const rel = 'docs/00-前言.md';
  const fp = path.join(ROOT, rel);
  manifest.push({
    seq: seq++, kind: 'preface', partId: null,
    title: getH1(fp), route: 'docs/00-前言',
    file: rel, pdfName: String(manifest.length + 1).padStart(2, '0') + '.pdf',
  });
}

for (const p of PARTS) {
  // Part README（导读）
  {
    const rel = `docs/${p.id}/README.md`;
    const fp = path.join(DOCS, p.id, 'README.md');
    manifest.push({
      seq: seq++, kind: 'part-readme', partId: p.id,
      title: getH1(fp), route: `docs/${p.id}/README`,
      file: rel, pdfName: '',
    });
  }
  for (const chFile of p.chapters) {
    const rel = `docs/${p.id}/${chFile}.md`;
    const fp = path.join(DOCS, p.id, chFile + '.md');
    manifest.push({
      seq: seq++, kind: 'chapter', partId: p.id,
      title: getH1(fp), route: `docs/${p.id}/${chFile}`,
      file: rel, pdfName: '',
    });
  }
}

// 统一编号 pdfName（按 manifest 索引，保证顺序不乱）
manifest.forEach((m, i) => {
  m.pdfName = String(i + 1).padStart(2, '0') + '.pdf';
});

const outPath = path.join(__dirname, 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('共', manifest.length, '个文档，manifest已生成:', outPath);
manifest.forEach(m => console.log(' ', m.pdfName, m.kind, m.title));
