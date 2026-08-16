/* 用 Playwright 批量把课程 docsify 页面导出为独立 PDF（隐藏侧边栏/导航/CTA，只留正文+封面图）
 * 依赖本地 http.server 已在 8330 端口跑起来（book.html 可访问）
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = 'http://localhost:8330/book.html';
const OUT_DIR = path.join(__dirname, 'chapters_raw');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

const HIDE_CSS = `
  .sidebar, .sidebar-toggle, nav.app-nav, .search, .cover, .cover-main { display: none !important; }
  .content { max-width: 100% !important; margin: 0 !important; padding: 24px 36px !important; }
  main { margin-left: 0 !important; }
  body { background: #ffffff !important; }
  /* 隐藏我们注入的关注引导CTA（PDF里不需要，避免每页重复出现） */
  .content div[style*="border-radius:12px"] { display: none !important; }
  .markdown-section > div[style*="border-radius"] { display: none !important; }
`;

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });

  for (const m of manifest) {
    const url = `${BASE}#/${m.route}`;
    process.stdout.write(`[${m.pdfName}] ${m.title} ... `);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.addStyleTag({ content: HIDE_CSS });
    // 等待 mermaid 渲染成 svg（如果这一页有 mermaid 图）
    await page.waitForTimeout(1200);
    try {
      await page.waitForFunction(() => {
        const mmds = document.querySelectorAll('.mermaid');
        if (mmds.length === 0) return true;
        return [...mmds].every(el => el.querySelector('svg'));
      }, { timeout: 6000 });
    } catch (e) { /* 没有mermaid或渲染超时，继续 */ }
    await page.waitForTimeout(300);
    const outPath = path.join(OUT_DIR, m.pdfName);
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    console.log('OK', fs.statSync(outPath).size, 'bytes');
  }

  await browser.close();
  console.log('全部导出完成，共', manifest.length, '个文件 ->', OUT_DIR);
}

main().catch(err => { console.error(err); process.exit(1); });
