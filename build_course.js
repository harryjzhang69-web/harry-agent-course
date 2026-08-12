/*
 * build_course.js
 * 把 docs/ 下的 19 章 markdown 解析成结构化课件数据层 app/course.json
 * - 拆分知识卡片（按 H2 小节，排除章节自测）
 * - 提取自测题（题干 + 选项 + 答案）
 * 供「学习机 Web App」和「讲课 PPT」共同复用。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DOCS = path.join(ROOT, 'docs');
const OUT_DIR = path.join(ROOT, 'app');

const PARTS = [
  {
    id: 'part1', title: 'Part 1 · 认知重建',
    tagline: 'Agent 到底是什么，别被概念忽悠',
    cover: '../assets/images/part1-cover.png',
    chapters: ['01-Agent不是新物种', '02-一张图看懂Agent进化史', '03-大模型是发动机不是车', '04-Agent产品成熟度分级'],
  },
  {
    id: 'part2', title: 'Part 2 · 亲手造轮子',
    tagline: '从 Prompt 到框架，判断要不要自己写',
    cover: '../assets/images/part2-cover.png',
    chapters: ['05-三大经典范式手把手实现', '06-低代码平台怎么选', '07-主流框架产品化评测', '08-从零写一个Agent框架'],
  },
  {
    id: 'part3', title: 'Part 3 · 高级能力',
    tagline: '让 Agent 从能跑 Demo 到生产可靠',
    cover: '../assets/images/part3-cover.png',
    chapters: ['09-记忆与检索', '10-上下文工程', '11-通信协议速查', '12-Agentic-RL产品经理版', '13-Agent评估体系与常见陷阱', '14-Agent安全与风险治理'],
  },
  {
    id: 'part4', title: 'Part 4 · 真实项目复盘',
    tagline: '三个我亲手上线过的真实 Agent 项目',
    cover: '../assets/images/part4-cover.png',
    chapters: ['15-企业IM智能问答机器人', '16-数据分析Agent架构演进', '17-独立开发者一周产品'],
  },
  {
    id: 'part5', title: 'Part 5 · 毕业设计与展望',
    tagline: '把方法论串成产品 Pitch，检验知识体系',
    cover: '../assets/images/part5-cover.png',
    chapters: ['18-毕业设计Pitch', '19-转型面试题库'],
  },
];

// 解析单行选项：A. xxx　B. xxx　C. xxx　D. xxx（全角空格分隔）
function parseOptions(line) {
  const norm = line.replace(/\u3000/g, ' ').trim();
  const opts = [];
  const re = /([ABCD])[.\．]\s*(.*?)(?=\s+[ABCD][.\．]\s|$)/g;
  let m;
  while ((m = re.exec(norm))) {
    opts.push({ key: m[1], text: m[2].trim() });
  }
  return opts;
}

// 从章节自测区块解析题目
function parseQuiz(quizText) {
  if (!quizText) return [];
  // 分离答案区（<details> 里）
  let answers = {};
  const detIdx = quizText.indexOf('<details>');
  let bodyText = quizText, ansText = '';
  if (detIdx >= 0) {
    bodyText = quizText.slice(0, detIdx);
    ansText = quizText.slice(detIdx);
  }
  const ansRe = /(\d+)\s*[-–]\s*([ABCD])/g;
  let am;
  while ((am = ansRe.exec(ansText))) {
    answers[am[1]] = am[2];
  }

  const lines = bodyText.split(/\r?\n/);
  const questions = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const qm = line.match(/\*\*Q(\d+)[.\．]\*\*\s*(.*)/);
    if (qm) {
      if (cur) questions.push(cur);
      cur = { n: qm[1], q: qm[2].trim(), options: [] };
      continue;
    }
    if (cur && cur.options.length === 0) {
      // 选项行：包含 A. 和 B.
      if (/[ABCD][.\．]/.test(line) && /A[.\．]/.test(line)) {
        cur.options = parseOptions(line);
      }
    }
  }
  if (cur) questions.push(cur);

  return questions
    .filter((q) => q.options.length >= 2)
    .map((q) => ({
      q: q.q,
      options: q.options,
      answer: answers[q.n] || null,
    }));
}

// 解析单章 markdown
function parseChapter(md) {
  const lines = md.split(/\r?\n/);
  // 标题（H1）
  let title = '';
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const h1 = lines[i].match(/^#\s+(.+)/);
    if (h1) { title = h1[1].trim(); bodyStart = i + 1; break; }
  }
  const body = lines.slice(bodyStart).join('\n');

  // 找章节自测位置
  const quizMatch = body.match(/^##\s*章节自测.*$/m);
  let contentPart = body, quizPart = '';
  if (quizMatch) {
    const idx = body.indexOf(quizMatch[0]);
    contentPart = body.slice(0, idx);
    quizPart = body.slice(idx);
  }

  // 拆卡片：按 H2
  const cards = [];
  const parts = contentPart.split(/\n(?=##\s+)/);
  for (const chunk of parts) {
    const t = chunk.trim();
    if (!t) continue;
    const hm = t.match(/^##\s+(.+)/);
    let heading = '', mdBody = t;
    if (hm) {
      heading = hm[1].trim();
      mdBody = t.replace(/^##\s+.+\n?/, '').trim();
    }
    if (!heading && !mdBody) continue;
    cards.push({ heading, md: mdBody });
  }

  const quiz = parseQuiz(quizPart);
  return { title, cards, quiz };
}

function stripNum(title) {
  return title.replace(/^\d+\s+/, '').trim();
}

function main() {
  const course = {
    title: 'Harry 的 Agent 实战课',
    subtitle: '从认知到产品，亲手打造你的 AI Agent',
    author: '清华学长 harry · AI 产品手艺人',
    generatedAt: new Date().toISOString(),
    parts: [],
  };

  let totalChapters = 0, totalCards = 0, totalQuiz = 0;

  for (const p of PARTS) {
    const partObj = {
      id: p.id, title: p.title, tagline: p.tagline, cover: p.cover, chapters: [],
    };
    for (const chFile of p.chapters) {
      const fp = path.join(DOCS, p.id, chFile + '.md');
      if (!fs.existsSync(fp)) { console.warn('MISSING', fp); continue; }
      const md = fs.readFileSync(fp, 'utf8');
      const parsed = parseChapter(md);
      const num = (chFile.match(/^(\d+)/) || [])[1] || '';
      partObj.chapters.push({
        id: p.id + '-' + num,
        num,
        title: stripNum(parsed.title || chFile),
        file: 'docs/' + p.id + '/' + chFile + '.md',
        cards: parsed.cards,
        quiz: parsed.quiz,
      });
      totalChapters++;
      totalCards += parsed.cards.length;
      totalQuiz += parsed.quiz.length;
    }
    course.parts.push(partObj);
  }

  course.stats = { parts: course.parts.length, chapters: totalChapters, cards: totalCards, quiz: totalQuiz };

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'course.json');
  fs.writeFileSync(outFile, JSON.stringify(course, null, 2), 'utf8');

  console.log('=== build_course done ===');
  console.log('parts   :', course.stats.parts);
  console.log('chapters:', course.stats.chapters);
  console.log('cards   :', course.stats.cards);
  console.log('quiz    :', course.stats.quiz);
  console.log('output  :', outFile);
  // 逐章打印校验
  for (const p of course.parts) {
    for (const c of p.chapters) {
      console.log(`  ${c.id} 「${c.title}」 cards=${c.cards.length} quiz=${c.quiz.length}` + (c.quiz.some(q => !q.answer) ? ' [WARN: missing answer]' : ''));
    }
  }
}

main();
