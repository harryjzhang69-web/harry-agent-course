/* ============================================================
 * build_ppt_part1.js —— Part 1「认知重建」讲课版 PPT 生成器
 * 深蓝紫科技风 · LAYOUT_WIDE 16:9 宽屏 · 一页一要点
 * 覆盖 01~04 四章 + 导览 + 收尾，供 Harry 上台投屏讲课
 * ============================================================ */
const pptxgen = require('pptxgenjs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'assets', 'images');
const cover1 = path.join(IMG_DIR, 'part1-cover.png');

// ---------- 设计系统 ----------
const C = {
  bg:   '0F1225', bg2: '141834',
  card: '1A1F3A', card2: '20264A',
  line: '2A3050', line2: '3A4270',
  txt:  'EEF0FB', txt2: 'A9B0D4', txt3: '767EA8',
  brand:'5B6CF5', purple:'A855F7', cyan:'22D3EE',
  ok:   '34D399', gold:'FBBF24', bad:'F87171',
  white:'FFFFFF',
};
const FH = '微软雅黑';   // header (Microsoft YaHei)
const FB = '微软雅黑';   // body
const FM = 'Consolas';   // mono
const W = 13.333, H = 7.5, MX = 0.7;

const pres = new pptxgen();
pres.defineLayout({ name: 'WIDE', width: W, height: H });
pres.layout = 'WIDE';
pres.author = 'Harry Zhang';
pres.company = 'AI 产品手艺人';
pres.title = 'Harry 的 Agent 实战课 · Part 1 认知重建';

const shadow = () => ({ type: 'outer', color: '000000', blur: 9, offset: 3, angle: 135, opacity: 0.35 });
let PAGE = 0;

// ---------- 复用组件 ----------
function base(slide, dark) {
  slide.background = { color: dark ? C.bg : C.bg };
}
function glow(slide) {
  slide.addShape(pres.shapes.OVAL, { x: -2.2, y: -2.6, w: 7, h: 6, fill: { color: C.brand, transparency: 82 }, line: { type: 'none' } });
  slide.addShape(pres.shapes.OVAL, { x: W - 5.2, y: -3, w: 7.5, h: 6.2, fill: { color: C.purple, transparency: 84 }, line: { type: 'none' } });
}
function footer(slide) {
  PAGE++;
  slide.addShape(pres.shapes.LINE, { x: MX, y: H - 0.52, w: W - MX * 2, h: 0, line: { color: C.line, width: 1 } });
  slide.addText('Harry 的 Agent 实战课 · Part 1 认知重建', { x: MX, y: H - 0.48, w: 8, h: 0.32, fontFace: FB, fontSize: 9, color: C.txt3, align: 'left', valign: 'middle', margin: 0 });
  slide.addText(String(PAGE).padStart(2, '0'), { x: W - MX - 1, y: H - 0.48, w: 1, h: 0.32, fontFace: FM, fontSize: 9, color: C.txt3, align: 'right', valign: 'middle', margin: 0 });
}
// 内容页大标题（kicker + title）
function head(slide, kicker, title, titleSize) {
  slide.addText(kicker, { x: MX, y: 0.5, w: W - MX * 2, h: 0.32, fontFace: FB, fontSize: 12, color: C.purple, bold: true, charSpacing: 2, margin: 0 });
  slide.addText(title, { x: MX, y: 0.82, w: W - MX * 2, h: 0.9, fontFace: FH, fontSize: titleSize || 30, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.05 });
}
// 卡片底板
function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.09, fill: { color: fill || C.card }, line: { color: C.line, width: 1 }, shadow: shadow() });
}
// 左侧竖条强调卡
function accentCard(slide, x, y, w, h, accent) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.card }, line: { color: C.line, width: 1 }, shadow: shadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h, fill: { color: accent || C.brand }, line: { type: 'none' } });
}

// ============================================================
// 1. 封面
// ============================================================
(function () {
  const s = pres.addSlide(); base(s, true); glow(s);
  // 右侧封面图（圆角遮罩靠视觉，直接放）
  s.addImage({ path: cover1, x: 8.15, y: 1.7, w: 4.7, h: 4.7 * (1 / 1), sizing: { type: 'contain', w: 4.7, h: 4.1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.55, w: 0.09, h: 1.5, fill: { color: C.brand }, line: { type: 'none' } });
  s.addText('PART 1 · 讲课版', { x: MX + 0.28, y: 1.5, w: 7, h: 0.4, fontFace: FB, fontSize: 15, color: C.purple, bold: true, charSpacing: 3, margin: 0 });
  s.addText('认知重建', { x: MX + 0.24, y: 1.95, w: 7.6, h: 1.2, fontFace: FH, fontSize: 60, color: C.white, bold: true, margin: 0 });
  s.addText('Agent 到底是什么，别被概念忽悠', { x: MX + 0.28, y: 3.25, w: 7.2, h: 0.6, fontFace: FH, fontSize: 22, color: C.txt2, margin: 0 });
  s.addText([
    { text: 'Harry 的 Agent 实战课', options: { bold: true, color: C.txt } },
    { text: '   ·   清华学长 harry｜AI 产品手艺人', options: { color: C.txt3 } },
  ], { x: MX + 0.28, y: 4.35, w: 7.4, h: 0.4, fontFace: FB, fontSize: 14, margin: 0 });
  // 四章胶囊
  const chs = ['01 不是新物种', '02 进化史', '03 发动机不是车', '04 成熟度分级'];
  let cx = MX + 0.28;
  chs.forEach((t) => {
    const w = 0.34 + t.length * 0.155;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 5.15, w, h: 0.48, rectRadius: 0.24, fill: { color: C.card2 }, line: { color: C.line2, width: 1 } });
    s.addText(t, { x: cx, y: 5.15, w, h: 0.48, fontFace: FB, fontSize: 11.5, color: C.txt2, align: 'center', valign: 'middle', margin: 0 });
    cx += w + 0.2;
  });
})();

// ============================================================
// 2. 本 Part 导览
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'OVERVIEW · 本篇导览', '为什么第一件事，是"重建认知"而不是写代码');
  s.addText('别急着学怎么搭。如果你连"自己做的到底是不是 Agent、该做到多 Agent"都说不清，后面所有的技术选型都会跑偏。这一篇先把判断力立起来。', 
    { x: MX, y: 1.8, w: W - MX * 2, h: 0.7, fontFace: FB, fontSize: 15, color: C.txt2, margin: 0, lineSpacingMultiple: 1.25 });

  const items = [
    ['01', '不是新物种', 'Agent 是自动化能力谱上"模型开始自主决策"的那一段，是连续谱不是开关', C.brand],
    ['02', '一张图看懂进化史', '70 年里"让机器自主决策"几起几落，LLM 第一次补上了常识与语言这块拼图', C.purple],
    ['03', '大模型是发动机不是车', '模型只是发动机，产品体验取决于它和 Prompt/工具/护栏配得好不好', C.cyan],
    ['04', '产品成熟度分级 L0~L3', '把模糊的"要不要做 Agent"变成清晰的"该做到 L 几"的原创判断框架', C.gold],
  ];
  const cw = (W - MX * 2 - 0.6) / 4, cy = 2.7, ch = 3.4;
  items.forEach((it, i) => {
    const x = MX + i * (cw + 0.2);
    accentCard(s, x, cy, cw, ch, it[3]);
    s.addText(it[0], { x: x + 0.22, y: cy + 0.28, w: cw - 0.4, h: 0.9, fontFace: FM, fontSize: 40, color: it[3], bold: true, margin: 0 });
    s.addText(it[1], { x: x + 0.22, y: cy + 1.2, w: cw - 0.44, h: 0.7, fontFace: FH, fontSize: 16.5, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.05 });
    s.addText(it[2], { x: x + 0.22, y: cy + 1.95, w: cw - 0.44, h: 1.3, fontFace: FB, fontSize: 11.5, color: C.txt2, margin: 0, lineSpacingMultiple: 1.22 });
  });
  footer(s);
})();

// ============================================================
// 3. 开场钩子
// ============================================================
(function () {
  const s = pres.addSlide(); base(s, true); glow(s);
  s.addText('开场', { x: MX, y: 1.15, w: 6, h: 0.4, fontFace: FB, fontSize: 13, color: C.purple, bold: true, charSpacing: 3, margin: 0 });
  s.addText('"我们这个，也是 Agent 产品。"', { x: MX, y: 1.55, w: W - MX * 2, h: 1.1, fontFace: FH, fontSize: 40, color: C.white, bold: true, margin: 0 });
  s.addText([
    { text: '这句话我在大大小小的评审会上听过太多次。但仔细一问——', options: { color: C.txt2 } },
    { text: '十次里有六次，其实只是"调了个大模型 API 拼了个话术"。', options: { color: C.gold, bold: true } },
  ], { x: MX, y: 2.85, w: W - MX * 2, h: 0.8, fontFace: FB, fontSize: 17, margin: 0, lineSpacingMultiple: 1.3 });

  card(s, MX, 4.0, W - MX * 2, 2.1);
  s.addText('这不是挑刺，是产品经理最不该犯的错', { x: MX + 0.4, y: 4.25, w: W - MX * 2 - 0.8, h: 0.5, fontFace: FH, fontSize: 17, color: C.brand, bold: true, margin: 0 });
  s.addText('如果你不能准确判断自己做的东西处在哪个技术层级，你就无法预估它的成本、风险和天花板。所以这一篇的第一件事——不是学怎么"做"Agent，是先学会怎么"识别"Agent。',
    { x: MX + 0.4, y: 4.8, w: W - MX * 2 - 0.8, h: 1.1, fontFace: FB, fontSize: 15, color: C.txt, margin: 0, lineSpacingMultiple: 1.35 });
  footer(s);
})();

// ============================================================
// 4. Ch01 章节标题
// ============================================================
function chapterCover(numStr, title, sub, accent) {
  const s = pres.addSlide(); base(s, true); glow(s);
  s.addText('CHAPTER ' + numStr, { x: MX, y: 2.5, w: 6, h: 0.5, fontFace: FM, fontSize: 16, color: accent, bold: true, charSpacing: 3, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 3.05, w: 1.1, h: 0.09, fill: { color: accent }, line: { type: 'none' } });
  s.addText(title, { x: MX, y: 3.25, w: W - MX * 2, h: 1.3, fontFace: FH, fontSize: 46, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.05 });
  s.addText(sub, { x: MX, y: 4.7, w: W - MX * 2 - 3, h: 0.8, fontFace: FB, fontSize: 16, color: C.txt2, margin: 0, lineSpacingMultiple: 1.3 });
  // 大号章节数字水印
  s.addText(numStr, { x: W - 4.3, y: 1.1, w: 4, h: 4, fontFace: FM, fontSize: 200, color: accent, bold: true, align: 'right', valign: 'middle', margin: 0, transparency: 88 });
  return s;
}
chapterCover('01', 'Agent 不是新物种', '从自动化脚本到自主智能体的连续谱——判断一个系统是不是 Agent，不看框架，看决策权在谁手里。', C.brand);

// ============================================================
// 5. Agent 的本质：感知-决策-行动闭环
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH01 · 本质', 'Agent 的本质：一个"感知—决策—行动"的闭环');
  s.addText('抛开所有花哨的定义，Agent 的核心就是三件事反复循环：', { x: MX, y: 1.75, w: W - MX * 2, h: 0.5, fontFace: FB, fontSize: 15, color: C.txt2, margin: 0 });

  // 三节点闭环
  const cy = 2.9, bw = 3.0, bh = 1.5, gap = 1.15;
  const xs = [MX + 0.3, MX + 0.3 + bw + gap, MX + 0.3 + (bw + gap) * 2];
  const nodes = [
    ['感知 Perceive', '拿到环境 / 用户的信息', C.brand],
    ['决策 Decide', '想清楚下一步该做什么', C.purple],
    ['行动 Act', '调用工具 / 输出结果，改变环境', C.cyan],
  ];
  nodes.forEach((n, i) => {
    card(s, xs[i], cy, bw, bh, C.card);
    s.addShape(pres.shapes.RECTANGLE, { x: xs[i], y: cy, w: bw, h: 0.09, fill: { color: n[2] }, line: { type: 'none' } });
    s.addText(n[0], { x: xs[i] + 0.2, y: cy + 0.3, w: bw - 0.4, h: 0.5, fontFace: FH, fontSize: 18, color: C.white, bold: true, align: 'center', margin: 0 });
    s.addText(n[1], { x: xs[i] + 0.2, y: cy + 0.85, w: bw - 0.4, h: 0.55, fontFace: FB, fontSize: 12.5, color: C.txt2, align: 'center', margin: 0 });
  });
  // 箭头
  [0, 1].forEach((i) => {
    s.addShape(pres.shapes.LINE, { x: xs[i] + bw + 0.12, y: cy + bh / 2, w: gap - 0.24, h: 0, line: { color: C.txt3, width: 2.5, endArrowType: 'triangle' } });
  });
  // 回环箭头（下方）
  s.addShape(pres.shapes.LINE, { x: xs[2] + bw / 2, y: cy + bh + 0.15, w: 0, h: 0.5, line: { color: C.txt3, width: 2.5 } });
  s.addShape(pres.shapes.LINE, { x: xs[0] + bw / 2, y: cy + bh + 0.65, w: xs[2] + bw / 2 - (xs[0] + bw / 2), h: 0, line: { color: C.txt3, width: 2.5 } });
  s.addShape(pres.shapes.LINE, { x: xs[0] + bw / 2, y: cy + bh + 0.15, w: 0, h: 0.5, line: { color: C.txt3, width: 2.5, beginArrowType: 'none', endArrowType: 'triangle' }, flipV: true });
  s.addText('循环反复', { x: xs[1], y: cy + bh + 0.42, w: bw, h: 0.35, fontFace: FB, fontSize: 11, color: C.txt3, align: 'center', margin: 0 });

  card(s, MX, 5.6, W - MX * 2, 1.05, C.card2);
  s.addText([
    { text: '关键三变量：', options: { bold: true, color: C.brand } },
    { text: '这个循环 由谁驱动、能不能自主终止、遇到意外能不能自己调整 —— 决定了一个系统离"真正的 Agent"有多远。', options: { color: C.txt } },
  ], { x: MX + 0.35, y: 5.72, w: W - MX * 2 - 0.7, h: 0.8, fontFace: FB, fontSize: 14.5, valign: 'middle', margin: 0, lineSpacingMultiple: 1.2 });
  footer(s);
})();

// ============================================================
// 6. 连续谱 1~5
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH01 · 连续谱', '一条连续谱，而不是一个开关');
  s.addText('把"自主性程度"当作横轴，从固定脚本到多智能体协作，是一条平滑上升的谱系：', { x: MX, y: 1.72, w: W - MX * 2, h: 0.4, fontFace: FB, fontSize: 14, color: C.txt2, margin: 0 });

  const rows = [
    ['1', '固定脚本 / RPA', '人（写死在代码里）', '定时爬虫、Excel 宏'],
    ['2', '条件流程编排', '人预设的 if-else 树', '传统客服机器人、Dify 工作流'],
    ['3', '单轮工具调用 LLM', 'LLM 决定调哪个工具，但只有一步', '"帮我查下天气"类插件'],
    ['4', '自主规划循环（ReAct）', 'LLM 自己规划多步、判断是否结束', 'AutoGPT 类、深度研究 Agent'],
    ['5', '多智能体协作', '多个 LLM 角色协商、分工、互检', '多角色写作 / 开发团队模拟'],
  ];
  const tblData = [[
    { text: '位置', options: { fill: { color: C.card2 }, color: C.brand, bold: true, align: 'center' } },
    { text: '名称', options: { fill: { color: C.card2 }, color: C.brand, bold: true } },
    { text: '决策由谁做', options: { fill: { color: C.card2 }, color: C.brand, bold: true } },
    { text: '典型例子', options: { fill: { color: C.card2 }, color: C.brand, bold: true } },
  ]];
  rows.forEach((r, i) => {
    const hot = i >= 2;
    tblData.push([
      { text: r[0], options: { align: 'center', color: hot ? C.gold : C.txt3, bold: true, fill: { color: C.card } } },
      { text: r[1], options: { color: hot ? C.white : C.txt2, bold: hot, fill: { color: C.card } } },
      { text: r[2], options: { color: C.txt2, fill: { color: C.card } } },
      { text: r[3], options: { color: C.txt2, fill: { color: C.card } } },
    ]);
  });
  s.addTable(tblData, { x: MX, y: 2.25, w: W - MX * 2, colW: [1.0, 3.1, 4.2, 3.63], rowH: 0.5, fontFace: FB, fontSize: 12.5, valign: 'middle', border: { pt: 1, color: C.line }, margin: [2, 6, 2, 6] });

  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 5.9, w: W - MX * 2, h: 0.75, fill: { color: C.brand, transparency: 82 }, line: { color: C.brand, width: 1 } });
  s.addText([
    { text: '关键认知：', options: { bold: true, color: C.gold } },
    { text: 'Agent 不是"5"独有的称号，而是谱上"自主性明显跃升"的 3~5 段的统称。越往右能力越高，但不可控性、成本、调试难度也越高——不是越 Agent 越好，是够用就好。', options: { color: C.txt } },
  ], { x: MX + 0.3, y: 5.95, w: W - MX * 2 - 0.6, h: 0.65, fontFace: FB, fontSize: 13.5, valign: 'middle', margin: 0, lineSpacingMultiple: 1.15 });
  footer(s);
})();

// ============================================================
// 7. 三大误区
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH01 · 避坑', '三个最常见的误区');
  const items = [
    ['误区一', '"调了 LLM API 就是 Agent"', '只是把问题拼进 prompt 让模型直接答，中间没有"要不要调工具、调哪个、要不要继续"的决策分支——那是 LLM 应用，不是 Agent。', C.brand],
    ['误区二', '"工作流编排 = Agent"', 'Dify/Coze/n8n 本质是条件流程编排（位置 2），路径是人预先画好的。它能解决 80% 场景，但和"模型自主规划路径"是两回事。', C.purple],
    ['误区三', '"必须多智能体才叫高级"', '多智能体的复杂度、调试成本、Token 消耗是单 Agent 的数倍。绝大多数业务，一个设计良好的单 Agent（位置 4）就足够。', C.cyan],
  ];
  const cw = (W - MX * 2 - 0.6) / 3, cy = 2.0, ch = 4.3;
  items.forEach((it, i) => {
    const x = MX + i * (cw + 0.3);
    accentCard(s, x, cy, cw, ch, it[3]);
    s.addText(it[0], { x: x + 0.25, y: cy + 0.28, w: cw - 0.5, h: 0.4, fontFace: FB, fontSize: 12, color: it[3], bold: true, charSpacing: 1, margin: 0 });
    s.addText(it[1], { x: x + 0.25, y: cy + 0.72, w: cw - 0.5, h: 1.1, fontFace: FH, fontSize: 17, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.1 });
    s.addShape(pres.shapes.LINE, { x: x + 0.25, y: cy + 1.95, w: cw - 0.5, h: 0, line: { color: C.line, width: 1 } });
    s.addText(it[2], { x: x + 0.25, y: cy + 2.15, w: cw - 0.5, h: 1.9, fontFace: FB, fontSize: 13, color: C.txt2, margin: 0, lineSpacingMultiple: 1.35 });
  });
  footer(s);
})();

// ============================================================
// 8. 产品经理三问框架
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH01 · 判断框架', '产品经理的三个问题，定位你的产品');
  s.addText('拿到一个"Agent 产品"需求时，先别急着讨论技术方案，先问自己三个问题：', { x: MX, y: 1.75, w: W - MX * 2, h: 0.4, fontFace: FB, fontSize: 14.5, color: C.txt2, margin: 0 });

  const qs = [
    ['Q1', '需要自己决定"要不要调工具、调几次"吗？', '不需要 → 是流程自动化，别叫 Agent，用更便宜的方案', '需要 → 至少 位置 3 起步', C.brand],
    ['Q2', '需要在多步之间自主判断"任务是否完成"吗？', '不需要 → 停在位置 3，别过度设计', '需要（模糊终点）→ 需要 位置 4 自主规划循环', C.purple],
    ['Q3', '任务天然需要多个专业角色分工、且单角色扛不住？', '不是 → 先把单 Agent 做扎实', '是 → 才考虑 位置 5 多智能体', C.cyan],
  ];
  const cy = 2.35, rh = 1.32, gap = 0.16;
  qs.forEach((q, i) => {
    const y = cy + i * (rh + gap);
    accentCard(s, MX, y, W - MX * 2, rh, q[4]);
    s.addText(q[0], { x: MX + 0.28, y: y + 0.2, w: 1.1, h: rh - 0.4, fontFace: FM, fontSize: 30, color: q[4], bold: true, valign: 'middle', margin: 0 });
    s.addText(q[1], { x: MX + 1.5, y: y + 0.16, w: 6.2, h: rh - 0.32, fontFace: FH, fontSize: 15.5, color: C.white, bold: true, valign: 'middle', margin: 0, lineSpacingMultiple: 1.1 });
    s.addText([
      { text: '✕ ', options: { color: C.bad, bold: true } }, { text: q[2], options: { color: C.txt2 } }, { text: '\n', options: {} },
      { text: '✓ ', options: { color: C.ok, bold: true } }, { text: q[3], options: { color: C.txt } },
    ], { x: MX + 7.9, y: y + 0.14, w: W - MX * 2 - 8.1, h: rh - 0.28, fontFace: FB, fontSize: 11.5, valign: 'middle', margin: 0, lineSpacingMultiple: 1.25 });
  });
  footer(s);
})();

// ============================================================
// 9. Ch02 章节标题
// ============================================================
chapterCover('02', '一张图看懂 Agent 进化史', '70 年里"让机器自主决策"几起几落，每一次都被同一个问题卡住——直到 LLM 出现。', C.purple);

// ============================================================
// 10. 为什么学历史
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH02 · 为什么', '"Agent 是不是又一阵风？"——用历史回答');
  card(s, MX, 1.95, W - MX * 2, 1.9, C.card);
  s.addText('过去 70 年，"让机器自主做决策"已经经历过几轮兴衰。每一轮都被同一个问题卡住：', { x: MX + 0.4, y: 2.2, w: W - MX * 2 - 0.8, h: 0.55, fontFace: FB, fontSize: 16, color: C.txt2, margin: 0 });
  s.addText('机器没有足够的"常识"和"语言理解能力"，去处理开放世界的模糊性。', { x: MX + 0.4, y: 2.8, w: W - MX * 2 - 0.8, h: 0.85, fontFace: FH, fontSize: 24, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.1 });

  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 4.35, w: W - MX * 2, h: 1.9, fill: { color: C.purple, transparency: 84 }, line: { color: C.purple, width: 1 } });
  s.addText('这一轮为什么不一样', { x: MX + 0.4, y: 4.55, w: W - MX * 2 - 0.8, h: 0.5, fontFace: FH, fontSize: 18, color: C.purple, bold: true, margin: 0 });
  s.addText('LLM 第一次 同时 解决了"常识"和"语言理解"这两个问题——这才是这轮浪潮和前几次本质上的区别。所以它不是风口，是补上了拼图的最后一块。',
    { x: MX + 0.4, y: 5.1, w: W - MX * 2 - 0.8, h: 1.0, fontFace: FB, fontSize: 15.5, color: C.txt, margin: 0, lineSpacingMultiple: 1.35 });
  footer(s);
})();

// ============================================================
// 11. 70 年 6 阶段演进时间线
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH02 · 全景', '70 年，六个阶段');
  const stages = [
    ['1950s–80s', '符号主义 AI', '逻辑规则+知识表示', '缺常识', C.txt3],
    ['1980s–90s', '专家系统', '领域规则库+推理机', '规则爆炸', C.txt3],
    ['1990s–2010s', '强化学习', '试错学习 + AlphaGo', '依赖干净环境', C.cyan],
    ['2012–2020', '深度学习感知', '图像/语音识别突破', '感知强认知弱', C.cyan],
    ['2022–2023', 'LLM 驱动 Agent', 'ReAct + ChatGPT 插件', '★ 转折点', C.brand],
    ['2024–至今', '框架爆发+多智能体', 'LangGraph / Agentic RL', '我们所处阶段', C.purple],
  ];
  // 横向时间轴
  const y0 = 2.45, cw = (W - MX * 2 - 0.5 * 5) / 6;
  s.addShape(pres.shapes.LINE, { x: MX, y: y0 + 3.55, w: W - MX * 2, h: 0, line: { color: C.line2, width: 2 } });
  stages.forEach((st, i) => {
    const x = MX + i * (cw + 0.5);
    const accent = st[4];
    card(s, x, y0, cw, 3.1, C.card);
    s.addShape(pres.shapes.RECTANGLE, { x, y: y0, w: cw, h: 0.08, fill: { color: accent }, line: { type: 'none' } });
    s.addText(st[0], { x: x + 0.05, y: y0 + 0.22, w: cw - 0.1, h: 0.5, fontFace: FM, fontSize: 11.5, color: accent, bold: true, align: 'center', margin: 0 });
    s.addText(st[1], { x: x + 0.08, y: y0 + 0.75, w: cw - 0.16, h: 0.95, fontFace: FH, fontSize: 14, color: C.white, bold: true, align: 'center', margin: 0, lineSpacingMultiple: 1.05 });
    s.addText(st[2], { x: x + 0.08, y: y0 + 1.72, w: cw - 0.16, h: 0.85, fontFace: FB, fontSize: 10.5, color: C.txt2, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
    s.addText(st[3], { x: x + 0.08, y: y0 + 2.55, w: cw - 0.16, h: 0.45, fontFace: FB, fontSize: 10.5, color: accent, bold: true, align: 'center', margin: 0 });
    // 轴上圆点
    s.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.09, y: y0 + 3.46, w: 0.18, h: 0.18, fill: { color: accent }, line: { color: C.bg, width: 2 } });
  });
  footer(s);
})();

// ============================================================
// 12. 为什么 LLM 这次不一样（三合一）
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH02 · 关键转折', 'LLM 的三合一：为什么是它终结了几十年的僵局');
  s.addText('前四个阶段各自解决了"逻辑/知识/试错/感知"中的一项，但都缺"自然语言理解 + 常识推理"这块粘合剂。LLM 第一次把三者叠在一起：', 
    { x: MX, y: 1.78, w: W - MX * 2, h: 0.75, fontFace: FB, fontSize: 15, color: C.txt2, margin: 0, lineSpacingMultiple: 1.25 });

  const abil = [
    ['世界常识', '海量文本预训练带来的常识，不用再手写规则', C.brand],
    ['语言理解与生成', '能和人无缝自然交互，而不是填表式命令', C.purple],
    ['推理与规划', '一定程度拆解多步任务，具备"想下一步"的能力', C.cyan],
  ];
  const cw = (W - MX * 2 - 0.6) / 3, cy = 2.75, ch = 2.15;
  abil.forEach((a, i) => {
    const x = MX + i * (cw + 0.3);
    card(s, x, cy, cw, ch, C.card);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: cy + 0.35, w: 0.55, h: 0.55, fill: { color: a[2], transparency: 20 }, line: { type: 'none' } });
    s.addText(String(i + 1), { x: x + 0.3, y: cy + 0.35, w: 0.55, h: 0.55, fontFace: FM, fontSize: 20, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0 });
    s.addText(a[0], { x: x + 1.0, y: cy + 0.36, w: cw - 1.2, h: 0.55, fontFace: FH, fontSize: 16, color: C.white, bold: true, valign: 'middle', margin: 0 });
    s.addText(a[1], { x: x + 0.3, y: cy + 1.1, w: cw - 0.6, h: 0.9, fontFace: FB, fontSize: 12.5, color: C.txt2, margin: 0, lineSpacingMultiple: 1.3 });
  });
  // 合流箭头 + 结论
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 5.2, w: W - MX * 2, h: 1.05, fill: { color: C.card2 }, line: { color: C.line2, width: 1 } });
  s.addText([
    { text: '三者叠加 = ', options: { color: C.txt2, bold: true } },
    { text: '"自主决策的智能体"第一次具备了通用性', options: { color: C.gold, bold: true } },
    { text: '，不再局限于围棋那种封闭环境。', options: { color: C.txt } },
  ], { x: MX + 0.35, y: 5.25, w: W - MX * 2 - 0.7, h: 1.0, fontFace: FB, fontSize: 16, valign: 'middle', margin: 0, lineSpacingMultiple: 1.2 });
  footer(s);
})();

// ============================================================
// 13. 范式转移规律（给 PM 的启示）
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH02 · 启示', '范式转移的规律：历史没有被推翻，是被拼接');
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.9, w: W - MX * 2, h: 1.0, fill: { color: C.brand, transparency: 82 }, line: { color: C.brand, width: 1 } });
  s.addText('每一代范式的死因，都是"底层能力"跟不上"应用场景的开放程度"，而不是"这个方向本身错了"。',
    { x: MX + 0.4, y: 1.95, w: W - MX * 2 - 0.8, h: 0.9, fontFace: FH, fontSize: 19, color: C.white, bold: true, valign: 'middle', margin: 0, lineSpacingMultiple: 1.15 });

  const legacy = [
    ['符号主义的遗产', '"领域规则库"思想，今天活在"给 Agent 设计护栏和工具白名单"里', C.purple],
    ['行为主义的遗产', '"奖励设计"思想，直接决定你的 Agent 训练 / 评估该怎么打分', C.cyan],
  ];
  const cw = (W - MX * 2 - 0.3) / 2, cy = 3.2, ch = 1.6;
  legacy.forEach((l, i) => {
    const x = MX + i * (cw + 0.3);
    accentCard(s, x, cy, cw, ch, l[2]);
    s.addText(l[0], { x: x + 0.3, y: cy + 0.25, w: cw - 0.6, h: 0.5, fontFace: FH, fontSize: 16, color: C.white, bold: true, margin: 0 });
    s.addText(l[1], { x: x + 0.3, y: cy + 0.78, w: cw - 0.6, h: 0.7, fontFace: FB, fontSize: 13, color: C.txt2, margin: 0, lineSpacingMultiple: 1.3 });
  });

  card(s, MX, 5.1, W - MX * 2, 1.15, C.card2);
  s.addText([
    { text: '给 PM 的实操启示：', options: { bold: true, color: C.gold } },
    { text: '不要因为某个技术路线"过时"就抛弃它的方法论。判断一个新技术能不能用，看它解决了历史上哪个具体瓶颈，而不是只看它"新不新"。', options: { color: C.txt } },
  ], { x: MX + 0.35, y: 5.22, w: W - MX * 2 - 0.7, h: 0.95, fontFace: FB, fontSize: 14.5, valign: 'middle', margin: 0, lineSpacingMultiple: 1.25 });
  footer(s);
})();

// ============================================================
// 14. Ch03 章节标题
// ============================================================
chapterCover('03', '大模型是发动机，不是车', '选模型不是看跑分榜马力，是看发动机和整车——Prompt、工具链、护栏——配得好不好。', C.cyan);

// ============================================================
// 15. 发动机比喻（整车装配图）
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH03 · 心智模型', '模型只是发动机，产品体验来自"整车装配"');
  // 左：四个输入
  const inputs = [
    ['大模型能力', '推理 / 知识 / 生成', C.brand],
    ['Prompt 设计', 'L1 指令→L2 示例→L3 结构化约束', C.purple],
    ['工具链', '检索 / 调用 / 校验', C.cyan],
    ['护栏机制', '幻觉校验 / 上下文管理 / 成本调度', C.gold],
  ];
  const iy = 2.1, ih = 0.98, iw = 5.0;
  inputs.forEach((it, i) => {
    const y = iy + i * (ih + 0.16);
    accentCard(s, MX, y, iw, ih, it[2]);
    s.addText(it[0], { x: MX + 0.28, y: y + 0.14, w: iw - 0.5, h: 0.4, fontFace: FH, fontSize: 15, color: C.white, bold: true, margin: 0 });
    s.addText(it[1], { x: MX + 0.28, y: y + 0.52, w: iw - 0.5, h: 0.4, fontFace: FB, fontSize: 11.5, color: C.txt2, margin: 0 });
  });
  // 中：装配节点
  const midX = MX + iw + 1.15;
  s.addShape(pres.shapes.OVAL, { x: midX, y: 3.55, w: 1.5, h: 1.5, fill: { color: C.card2 }, line: { color: C.brand, width: 2 } });
  s.addText('整车\n装配', { x: midX, y: 3.55, w: 1.5, h: 1.5, fontFace: FH, fontSize: 16, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0 });
  // 输入→装配箭头
  inputs.forEach((it, i) => {
    const y = iy + i * (ih + 0.16) + ih / 2;
    s.addShape(pres.shapes.LINE, { x: MX + iw + 0.1, y, w: midX - (MX + iw) - 0.2, h: 4.3 - y, line: { color: C.line2, width: 1.5, endArrowType: 'triangle' } });
  });
  // 装配→体验
  const outX = midX + 1.5 + 0.9;
  s.addShape(pres.shapes.LINE, { x: midX + 1.5, y: 4.3, w: 0.9, h: 0, line: { color: C.brand, width: 3, endArrowType: 'triangle' } });
  card(s, outX, 3.5, W - MX - outX, 1.6, C.card);
  s.addShape(pres.shapes.RECTANGLE, { x: outX, y: 3.5, w: 0.08, h: 1.6, fill: { color: C.brand }, line: { type: 'none' } });
  s.addText('Agent 产品体验', { x: outX + 0.3, y: 3.75, w: W - MX - outX - 0.5, h: 0.5, fontFace: FH, fontSize: 18, color: C.brand, bold: true, margin: 0 });
  s.addText('发动机参数很重要，但决定体验的是"整车匹配得好不好"。', { x: outX + 0.3, y: 4.3, w: W - MX - outX - 0.5, h: 0.7, fontFace: FB, fontSize: 12.5, color: C.txt2, margin: 0, lineSpacingMultiple: 1.25 });
  footer(s);
})();

// ============================================================
// 16. 三层认知
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH03 · 三层认知', '产品经理必须建立的三层"发动机认知"');
  const layers = [
    ['第一层', '本质是"续写"不是"理解"', '模型核心任务是"给定前文预测下一个词"。它没有事实核查机制——这正是幻觉的根源，也是它对"离题"极其敏感的原因。', C.brand],
    ['第二层', 'Prompt 工程的三个层次', 'L1 指令 / L2 示例(Few-shot) / L3 结构化约束。只要 Agent 要用代码解析模型输出去决定动作，就必须上 L3，否则"自主决策"会变成"随机崩溃"。', C.purple],
    ['第三层', '按场景选模型 + 分层调度', '别看跑分榜排名，按场景（长文本/强推理/低成本）选。更别用一个模型扛全部——小模型做路由分类，大模型做真正的推理。', C.cyan],
  ];
  const cw = (W - MX * 2 - 0.6) / 3, cy = 2.0, ch = 4.3;
  layers.forEach((l, i) => {
    const x = MX + i * (cw + 0.3);
    card(s, x, cy, cw, ch, C.card);
    s.addShape(pres.shapes.OVAL, { x: x + 0.28, y: cy + 0.3, w: 0.7, h: 0.7, fill: { color: l[3], transparency: 15 }, line: { type: 'none' } });
    s.addText(String(i + 1), { x: x + 0.28, y: cy + 0.3, w: 0.7, h: 0.7, fontFace: FM, fontSize: 26, color: C.white, bold: true, align: 'center', valign: 'middle', margin: 0 });
    s.addText(l[0], { x: x + 1.12, y: cy + 0.34, w: cw - 1.3, h: 0.35, fontFace: FB, fontSize: 12, color: l[3], bold: true, margin: 0 });
    s.addText(l[1], { x: x + 1.12, y: cy + 0.64, w: cw - 1.3, h: 0.7, fontFace: FH, fontSize: 14.5, color: C.white, bold: true, valign: 'top', margin: 0, lineSpacingMultiple: 1.05 });
    s.addShape(pres.shapes.LINE, { x: x + 0.28, y: cy + 1.7, w: cw - 0.56, h: 0, line: { color: C.line, width: 1 } });
    s.addText(l[2], { x: x + 0.28, y: cy + 1.9, w: cw - 0.56, h: 2.2, fontFace: FB, fontSize: 12.5, color: C.txt2, margin: 0, lineSpacingMultiple: 1.4 });
  });
  footer(s);
})();

// ============================================================
// 17. 三大局限倒逼设计
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH03 · 能力边界', '三大局限，直接倒逼你的 Agent 设计');
  const rows = [
    ['幻觉', '会自信地编造不存在的事实 / API / 数据', '设计"结果校验环节"——让工具返回真实数据，关键结论要有可追溯来源', C.bad],
    ['上下文窗口有限', '任务变长后，前面的信息会被挤出去或稀释', '设计记忆架构（短期上下文 + 长期检索），别假设模型"记得住"', C.gold],
    ['成本与延迟', '强模型又贵又慢，不可能每步都用最强', '分层调度：路由用小模型，推理用大模型，可复用结果做缓存', C.cyan],
  ];
  const cy = 2.15, rh = 1.35, gap = 0.18;
  // 表头
  s.addText('局限', { x: MX + 0.28, y: cy - 0.45, w: 2.6, h: 0.35, fontFace: FB, fontSize: 12, color: C.txt3, bold: true, margin: 0 });
  s.addText('具体表现', { x: MX + 3.2, y: cy - 0.45, w: 4.3, h: 0.35, fontFace: FB, fontSize: 12, color: C.txt3, bold: true, margin: 0 });
  s.addText('对 Agent 设计的直接倒逼', { x: MX + 7.7, y: cy - 0.45, w: 4.3, h: 0.35, fontFace: FB, fontSize: 12, color: C.txt3, bold: true, margin: 0 });
  rows.forEach((r, i) => {
    const y = cy + i * (rh + gap);
    accentCard(s, MX, y, W - MX * 2, rh, r[3]);
    s.addText(r[0], { x: MX + 0.28, y: y + 0.15, w: 2.6, h: rh - 0.3, fontFace: FH, fontSize: 16, color: C.white, bold: true, valign: 'middle', margin: 0 });
    s.addText(r[1], { x: MX + 3.2, y: y + 0.15, w: 4.3, h: rh - 0.3, fontFace: FB, fontSize: 13, color: C.txt2, valign: 'middle', margin: 0, lineSpacingMultiple: 1.2 });
    s.addShape(pres.shapes.LINE, { x: MX + 7.5, y: y + 0.2, w: 0, h: rh - 0.4, line: { color: C.line, width: 1 } });
    s.addText([{ text: '→ ', options: { color: r[3], bold: true } }, { text: r[2], options: { color: C.txt } }],
      { x: MX + 7.7, y: y + 0.15, w: W - MX * 2 - 7.9, h: rh - 0.3, fontFace: FB, fontSize: 13, valign: 'middle', margin: 0, lineSpacingMultiple: 1.25 });
  });
  footer(s);
})();

// ============================================================
// 18. Ch04 章节标题
// ============================================================
chapterCover('04', 'Agent 产品成熟度分级 L0~L3', '"要不要做 Agent"是假问题。真正该问的是——我们的产品需要做到哪一级的自主性？', C.gold);

// ============================================================
// 19. L0~L3 决策树
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH04 · 决策树', '四个问题，定位你该做到 L 几');
  // 决策节点纵列 + 结果
  const qx = MX, qw = 6.6, qh = 0.74, gap = 0.22, y0 = 1.9;
  const qs = [
    ['任务路径能否提前枚举清楚？', '能 → L0 规则脚本自动化'],
    ['只需调用 1 次工具就能回答？', '是 → L1 单轮工具调用'],
    ['任务终点模糊、需多步试错？', '否但多步固定 → L1+ 工作流编排'],
    ['需要多个专业角色分工协作？', '否 → L2 自主规划循环'],
  ];
  qs.forEach((q, i) => {
    const y = y0 + i * (qh + gap);
    // 菱形判断（用旋转矩形近似，这里用圆角矩形+标签）
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: qx, y, w: qw, h: qh, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.brand, width: 1.5 }, shadow: shadow() });
    s.addText('Q' + (i + 1), { x: qx + 0.2, y: y + 0.14, w: 0.9, h: qh - 0.28, fontFace: FM, fontSize: 18, color: C.brand, bold: true, valign: 'middle', margin: 0 });
    s.addText(q[0], { x: qx + 1.1, y: y + 0.1, w: qw - 1.3, h: qh - 0.2, fontFace: FH, fontSize: 14.5, color: C.white, bold: true, valign: 'middle', margin: 0 });
    // 竖向箭头（除最后）
    if (i < qs.length - 1) s.addShape(pres.shapes.LINE, { x: qx + qw / 2, y: y + qh, w: 0, h: gap, line: { color: C.line2, width: 2, endArrowType: 'triangle' } });
    // 右侧分流结果
    const rx = qx + qw + 0.7;
    s.addShape(pres.shapes.LINE, { x: qx + qw, y: y + qh / 2, w: 0.7, h: 0, line: { color: C.ok, width: 2, endArrowType: 'triangle' } });
    const isL = q[1].match(/L\d\+?/);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx, y: y + 0.06, w: W - MX - rx, h: qh - 0.12, rectRadius: 0.09, fill: { color: C.card2 }, line: { color: C.ok, width: 1 } });
    s.addText(q[1], { x: rx + 0.25, y: y + 0.06, w: W - MX - rx - 0.4, h: qh - 0.12, fontFace: FB, fontSize: 13.5, color: C.txt, valign: 'middle', margin: 0 });
  });
  // 底部 L3
  const yL3 = y0 + qs.length * (qh + gap) + 0.02;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: qx, y: yL3, w: W - MX * 2, h: 0.72, rectRadius: 0.1, fill: { color: C.gold, transparency: 80 }, line: { color: C.gold, width: 1.5 } });
  s.addText([
    { text: '是，且单角色确实扛不住 → ', options: { color: C.txt2 } },
    { text: 'L3 多智能体协作', options: { color: C.gold, bold: true } },
    { text: '（最贵、最难、最容易过度设计——先把 L2 做扎实）', options: { color: C.txt2 } },
  ], { x: qx + 0.3, y: yL3, w: W - MX * 2 - 0.6, h: 0.72, fontFace: FB, fontSize: 14, valign: 'middle', margin: 0 });
  footer(s);
})();

// ============================================================
// 20. L0-L3 速查对照表
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH04 · 速查', 'L0–L3 分级对照速查表');
  const header = ['', 'L0 规则脚本', 'L1 单轮工具', 'L2 自主循环', 'L3 多智能体'];
  const rows = [
    ['决策者', '人 / 规则', '模型（单步）', '模型（多步自主）', '多个模型角色'],
    ['路径确定性', '完全确定', '基本确定', '边做边定', '不确定 + 分角色'],
    ['典型开发', '纯代码', 'Function Calling', 'ReAct / Plan-Solve', 'Multi-Agent 框架'],
    ['调试难度', '低', '低', '中高', '高'],
    ['Token / 成本', '几乎无', '低', '中高（多轮）', '高（多 Agent）'],
    ['何时引入', '需求确定不变', 'MVP 默认起步', 'L1 不够用再升', 'L2 扛不住再升'],
  ];
  const accents = [C.txt3, C.brand, C.cyan, C.purple, C.gold];
  const tbl = [header.map((h, i) => ({ text: h, options: { fill: { color: C.card2 }, color: i === 0 ? C.txt3 : accents[i], bold: true, align: i === 0 ? 'left' : 'center', valign: 'middle' } }))];
  rows.forEach((r) => {
    tbl.push(r.map((c, i) => ({ text: c, options: { fill: { color: C.card }, color: i === 0 ? C.txt3 : C.txt, bold: i === 0, align: i === 0 ? 'left' : 'center', valign: 'middle' } })));
  });
  s.addTable(tbl, { x: MX, y: 2.1, w: W - MX * 2, colW: [2.13, 2.45, 2.45, 2.45, 2.45], rowH: 0.62, fontFace: FB, fontSize: 12.5, border: { pt: 1, color: C.line }, margin: [3, 6, 3, 6] });
  footer(s);
})();

// ============================================================
// 21. 升级前的自问清单
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'CH04 · 决策清单', '升到下一级之前，先过这份自问清单');
  const list = [
    '我是否已经"验证"了当前级别真的不够用——还是只是主观觉得"应该更高级"？',
    '升一级的边际收益（体验提升）和边际成本（Token / 延迟 / 可控性下降），我算过账吗？',
    '如果要升到 L2，我给自主循环设计的护栏（最大步数、结果校验）是什么？',
    '如果要升到 L3，我能不能明确说出"哪个具体角色分工是单 Agent 顾不过来的"？说不出就别升。',
  ];
  const cy = 2.05, rh = 0.98, gap = 0.18;
  list.forEach((t, i) => {
    const y = cy + i * (rh + gap);
    accentCard(s, MX, y, W - MX * 2, rh, C.gold);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + 0.28, y: y + rh / 2 - 0.22, w: 0.44, h: 0.44, rectRadius: 0.08, fill: { color: C.card2 }, line: { color: C.gold, width: 1.5 } });
    s.addText('✓', { x: MX + 0.28, y: y + rh / 2 - 0.22, w: 0.44, h: 0.44, fontFace: FH, fontSize: 16, color: C.gold, bold: true, align: 'center', valign: 'middle', margin: 0 });
    s.addText(t, { x: MX + 1.0, y: y + 0.1, w: W - MX * 2 - 1.3, h: rh - 0.2, fontFace: FB, fontSize: 14.5, color: C.txt, valign: 'middle', margin: 0, lineSpacingMultiple: 1.2 });
  });
  footer(s);
})();

// ============================================================
// 22. Part1 四认知回顾
// ============================================================
(function () {
  const s = pres.addSlide(); base(s); head(s, 'RECAP · 本篇小结', 'Part 1 建立的四个核心认知');
  const recap = [
    ['01', 'Agent 是连续谱，不是开关', '看决策权在谁手里，够用就好', C.brand],
    ['02', '每代范式兴衰都有清晰逻辑', 'LLM 补上了常识与语言这块拼图', C.purple],
    ['03', '大模型的能力边界决定设计', '发动机不是车，局限倒逼护栏与调度', C.cyan],
    ['04', '一套可直接用的分级框架', 'L0~L3，把"要不要"变成"该做到几"', C.gold],
  ];
  const cw = (W - MX * 2 - 0.6) / 2, ch = 1.75, gapx = 0.6, gapy = 0.35, cy = 2.0;
  recap.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = MX + col * (cw + gapx), y = cy + row * (ch + gapy);
    accentCard(s, x, y, cw, ch, r[3]);
    s.addText(r[0], { x: x + 0.28, y: y + 0.35, w: 1.3, h: 1.1, fontFace: FM, fontSize: 46, color: r[3], bold: true, valign: 'middle', margin: 0 });
    s.addText(r[1], { x: x + 1.6, y: y + 0.32, w: cw - 1.85, h: 0.8, fontFace: FH, fontSize: 17, color: C.white, bold: true, margin: 0, lineSpacingMultiple: 1.1 });
    s.addText(r[2], { x: x + 1.6, y: y + 1.05, w: cw - 1.85, h: 0.6, fontFace: FB, fontSize: 12.5, color: C.txt2, margin: 0, lineSpacingMultiple: 1.2 });
  });
  footer(s);
})();

// ============================================================
// 23. 下一 Part 预告 + 收尾
// ============================================================
(function () {
  const s = pres.addSlide(); base(s, true); glow(s);
  s.addText('NEXT · 下一篇', { x: MX, y: 1.4, w: 6, h: 0.4, fontFace: FB, fontSize: 13, color: C.purple, bold: true, charSpacing: 3, margin: 0 });
  s.addText('Part 2 · 亲手造轮子', { x: MX, y: 1.8, w: W - MX * 2, h: 0.9, fontFace: FH, fontSize: 40, color: C.white, bold: true, margin: 0 });
  s.addText('从 Prompt 到框架——手写三大经典范式、判断该不该用低代码平台、主流框架产品化评测、从零写一个 <300 行的 Agent 框架。认知立住了，接下来就该动手了。',
    { x: MX, y: 2.85, w: W - MX * 2 - 3, h: 1.0, fontFace: FB, fontSize: 15, color: C.txt2, margin: 0, lineSpacingMultiple: 1.35 });

  card(s, MX, 4.15, W - MX * 2, 2.0, C.card);
  s.addText('配套学起来', { x: MX + 0.4, y: 4.4, w: 4, h: 0.4, fontFace: FH, fontSize: 15, color: C.brand, bold: true, margin: 0 });
  s.addText([
    { text: '🎮 交互式学习机（闯关学）', options: { bold: true, color: C.txt, breakLine: true } },
    { text: 'harryjzhang69-web.github.io/harry-agent-course/app/', options: { color: C.txt3, fontFace: FM, fontSize: 12, breakLine: true } },
    { text: '📖 全部内容永久免费开源  ·  公众号：AI 产品手艺人  ·  小红书：@清华学长harry', options: { color: C.txt2 } },
  ], { x: MX + 0.4, y: 4.85, w: W - MX * 2 - 0.8, h: 1.1, fontFace: FB, fontSize: 14, margin: 0, lineSpacingMultiple: 1.4 });
  footer(s);
})();

// ---------- 输出 ----------
const out = path.join(__dirname, 'Part1-认知重建-讲课版.pptx');
pres.writeFile({ fileName: out }).then(() => {
  console.log('PPT 生成成功:', out);
  console.log('总页数:', PAGE + '(含封面/章节页等未编号)');
}).catch((e) => console.error('生成失败:', e));
