const { chromium } = require('C:\\Users\\Harryjzhang\\AppData\\Roaming\\npm\\node_modules\\playwright');

const BASE = 'https://harryjzhang69-web.github.io/harry-agent-course';

const pages = [
  ['落地页', '/index.html'],
  ['首页README', '/book.html#/'],
  ['00前言', '/book.html#/docs/00-前言'],
  ['Part1 README', '/book.html#/docs/part1/README'],
  ['01', '/book.html#/docs/part1/01-Agent不是新物种'],
  ['02', '/book.html#/docs/part1/02-一张图看懂Agent进化史'],
  ['03', '/book.html#/docs/part1/03-大模型是发动机不是车'],
  ['04', '/book.html#/docs/part1/04-Agent产品成熟度分级'],
  ['Part2 README', '/book.html#/docs/part2/README'],
  ['05', '/book.html#/docs/part2/05-三大经典范式手把手实现'],
  ['06', '/book.html#/docs/part2/06-低代码平台怎么选'],
  ['07', '/book.html#/docs/part2/07-主流框架产品化评测'],
  ['08', '/book.html#/docs/part2/08-从零写一个Agent框架'],
  ['Part3 README', '/book.html#/docs/part3/README'],
  ['09', '/book.html#/docs/part3/09-记忆与检索'],
  ['10', '/book.html#/docs/part3/10-上下文工程'],
  ['11', '/book.html#/docs/part3/11-通信协议速查'],
  ['12', '/book.html#/docs/part3/12-Agentic-RL产品经理版'],
  ['13', '/book.html#/docs/part3/13-Agent评估体系与常见陷阱'],
  ['14', '/book.html#/docs/part3/14-Agent安全与风险治理'],
  ['Part4 README', '/book.html#/docs/part4/README'],
  ['15', '/book.html#/docs/part4/15-企业IM智能问答机器人'],
  ['16', '/book.html#/docs/part4/16-数据分析Agent架构演进'],
  ['17', '/book.html#/docs/part4/17-独立开发者一周产品'],
  ['Part5 README', '/book.html#/docs/part5/README'],
  ['18', '/book.html#/docs/part5/18-毕业设计Pitch'],
  ['19', '/book.html#/docs/part5/19-转型面试题库'],
  ['Demos README', '/book.html#/demos/README'],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  for (const [name, path] of pages) {
    const consoleErrors = [];
    const handler = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200)); };
    page.on('console', handler);

    let status = 'OK';
    let detail = '';
    try {
      const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      const httpStatus = resp ? resp.status() : 'N/A';

      const bodyText = await page.evaluate(() => document.body.innerText || '');
      const renderErr = /Unable to render rich display|Parse error|Syntax error/i.test(bodyText);

      const brokenImgs = await page.evaluate(() => {
        return Array.from(document.images)
          .filter(img => img.naturalWidth === 0)
          .map(img => img.src);
      });

      const textLen = bodyText.length;

      if (httpStatus >= 400) { status = 'HTTP_ERROR'; detail = `status=${httpStatus}`; }
      else if (renderErr) { status = 'RENDER_ERROR'; detail = 'mermaid/parse error found in page text'; }
      else if (brokenImgs.length > 0) { status = 'BROKEN_IMG'; detail = brokenImgs.join(', '); }
      else if (textLen < 50) { status = 'EMPTY_CONTENT'; detail = `textLen=${textLen}`; }
      else { detail = `textLen=${textLen}, imgs=${(await page.evaluate(() => document.images.length))}`; }
    } catch (e) {
      status = 'EXCEPTION';
      detail = String(e.message || e).slice(0, 200);
    }

    page.off('console', handler);
    results.push({ name, path, status, detail, consoleErrors: consoleErrors.slice(0, 3) });
  }

  await browser.close();

  console.log('\n=== 巡检结果 ===\n');
  let hasIssue = false;
  for (const r of results) {
    const mark = r.status === 'OK' ? '✅' : '❌';
    if (r.status !== 'OK') hasIssue = true;
    console.log(`${mark} [${r.status}] ${r.name} (${r.path})`);
    if (r.status !== 'OK') console.log(`   detail: ${r.detail}`);
    if (r.consoleErrors.length) console.log(`   console errors: ${JSON.stringify(r.consoleErrors)}`);
  }
  console.log(`\n总计 ${results.length} 页，${hasIssue ? '发现问题见上' : '全部正常'}`);
})();
