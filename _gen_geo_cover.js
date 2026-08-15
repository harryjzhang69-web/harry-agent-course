/* 生成 Part4/Part5 几何风格占位封面（SVG -> PNG），不依赖AI生成接口
 * 视觉延续 Part1-3 已确认的深蓝紫科技风：#0f1225 -> #1a1f3a 渐变背景 + 发光线条
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, 'assets', 'images');

// Part4: 数据流城市天际线（服务器机架剪影 + 发光数据流线）
const svgPart4 = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1225"/>
      <stop offset="100%" stop-color="#1a1f3a"/>
    </linearGradient>
    <linearGradient id="glow4" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5b6cf5"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="tower4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a3363"/>
      <stop offset="100%" stop-color="#141834"/>
    </linearGradient>
    <filter id="blur4"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg4)"/>
  <!-- 建筑群剪影 -->
  <g>
    <rect x="120" y="560" width="90" height="340" fill="url(#tower4)"/>
    <rect x="230" y="460" width="70" height="440" fill="url(#tower4)"/>
    <rect x="320" y="620" width="100" height="280" fill="url(#tower4)"/>
    <rect x="440" y="380" width="80" height="520" fill="url(#tower4)"/>
    <rect x="540" y="500" width="110" height="400" fill="url(#tower4)"/>
    <rect x="670" y="440" width="75" height="460" fill="url(#tower4)"/>
    <rect x="760" y="580" width="95" height="320" fill="url(#tower4)"/>
    <rect x="870" y="500" width="70" height="400" fill="url(#tower4)"/>
    <!-- 建筑窗户光点（严格落在各建筑矩形范围内）-->
    ${(() => {
      const towers = [
        [120,560,90,340],[230,460,70,440],[320,620,100,280],[440,380,80,520],
        [540,500,110,400],[670,440,75,460],[760,580,95,320],[870,500,70,400],
      ];
      const out = [];
      towers.forEach(([bx,by,bw,bh]) => {
        const n = 8 + Math.floor(Math.random()*5);
        for (let i=0;i<n;i++){
          const x = bx + 12 + Math.random()*(bw-24);
          const y = by + 20 + Math.random()*(bh-40);
          const c = Math.random()>0.5 ? '#5b6cf5' : '#a855f7';
          out.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="6" height="8" fill="${c}" opacity="${(0.3+Math.random()*0.6).toFixed(2)}"/>`);
        }
      });
      return out.join('');
    })()}
  </g>
  <!-- 发光数据流线（河流状穿梭于建筑间）-->
  <path d="M 60 720 C 250 680, 350 780, 500 700 S 750 620, 960 680" stroke="url(#glow4)" stroke-width="5" fill="none" opacity="0.85" filter="url(#blur4)"/>
  <path d="M 60 720 C 250 680, 350 780, 500 700 S 750 620, 960 680" stroke="url(#glow4)" stroke-width="2.5" fill="none" opacity="0.95"/>
  <path d="M 40 830 C 220 800, 400 900, 620 820 S 850 760, 1000 810" stroke="#22D3EE" stroke-width="3.5" fill="none" opacity="0.5" filter="url(#blur4)"/>
  <path d="M 40 830 C 220 800, 400 900, 620 820 S 850 760, 1000 810" stroke="#22D3EE" stroke-width="1.6" fill="none" opacity="0.7"/>
  <!-- 数据流上的光点 -->
  <circle cx="500" cy="700" r="8" fill="#a855f7" opacity="0.9" filter="url(#blur4)"/>
  <circle cx="500" cy="700" r="4" fill="#ffffff"/>
  <circle cx="750" cy="632" r="6" fill="#5b6cf5" opacity="0.9" filter="url(#blur4)"/>
  <circle cx="750" cy="632" r="3" fill="#ffffff"/>
  <circle cx="620" cy="820" r="6" fill="#22D3EE" opacity="0.85" filter="url(#blur4)"/>
  <!-- 顶部星空点 -->
  ${Array.from({length: 40}, () => {
    const x = Math.random()*1024, y = Math.random()*380;
    const r = 1 + Math.random()*2;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(0.2+Math.random()*0.5).toFixed(2)}"/>`;
  }).join('')}
</svg>`;

// Part5: 眺望远方光路的剪影（人形轮廓站在平台边缘望向发光路径）
const svgPart5 = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg5" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1225"/>
      <stop offset="60%" stop-color="#181d3a"/>
      <stop offset="100%" stop-color="#1a1f3a"/>
    </linearGradient>
    <radialGradient id="sun5" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#5b6cf5" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#5b6cf5" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="path5" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#5b6cf5" stop-opacity="0.1"/>
    </linearGradient>
    <filter id="blur5"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg5)"/>
  <!-- 远方发光地平线光源（低于地平线，只露出上半，营造"旭日/远方光"感）-->
  <circle cx="660" cy="640" r="230" fill="url(#sun5)"/>
  <!-- 平台（地平线）-->
  <rect x="0" y="700" width="1024" height="6" fill="#3a4270" opacity="0.7"/>
  <rect x="0" y="706" width="1024" height="318" fill="#12162e"/>
  <!-- 发散光束线（从光源向上扇形展开，细线不封闭，避免三角形/金字塔的错觉）-->
  <g stroke="#ffffff" stroke-linecap="round">
    <path d="M 660 640 L 660 90" stroke-width="2" opacity="0.30"/>
    <path d="M 660 640 L 540 110" stroke-width="1.6" opacity="0.26"/>
    <path d="M 660 640 L 430 160" stroke-width="1.4" opacity="0.20"/>
    <path d="M 660 640 L 790 105" stroke-width="1.6" opacity="0.26"/>
    <path d="M 660 640 L 900 150" stroke-width="1.4" opacity="0.20"/>
  </g>
  <g stroke="url(#path5)" stroke-linecap="round">
    <path d="M 660 640 L 660 90" stroke-width="4" opacity="0.55"/>
    <path d="M 660 640 L 540 110" stroke-width="3" opacity="0.45"/>
    <path d="M 660 640 L 790 105" stroke-width="3" opacity="0.45"/>
  </g>
  <!-- 光源核心 -->
  <circle cx="660" cy="640" r="16" fill="#ffffff" opacity="0.9" filter="url(#blur5)"/>
  <circle cx="660" cy="640" r="7" fill="#ffffff"/>
  <!-- 地平线反光倒影 -->
  <ellipse cx="660" cy="706" rx="230" ry="16" fill="#a855f7" opacity="0.18" filter="url(#blur5)"/>
  <!-- 抽象人形剪影站在平台边缘，侧身望向光源 -->
  <g transform="translate(310,560)">
    <ellipse cx="0" cy="-88" rx="24" ry="28" fill="#0a0d1c"/>
    <path d="M -30 -48 Q -36 40 -26 168 L -8 168 L -5 18 L 5 18 L 8 168 L 26 168 Q 36 40 30 -48 Q 18 -72 0 -72 Q -18 -72 -30 -48 Z" fill="#0a0d1c"/>
  </g>
  <!-- 人形轮廓的发光描边 -->
  <g transform="translate(310,560)" fill="none" stroke="#5b6cf5" stroke-width="1.8" opacity="0.55" filter="url(#blur5)">
    <ellipse cx="0" cy="-88" rx="24" ry="28"/>
    <path d="M -30 -48 Q -36 40 -26 168 L 26 168 Q 36 40 30 -48 Q 18 -72 0 -72 Q -18 -72 -30 -48 Z"/>
  </g>
  <!-- 星空点 -->
  ${Array.from({length: 50}, () => {
    const x = Math.random()*1024, y = Math.random()*700;
    const r = 1 + Math.random()*2;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(0.2+Math.random()*0.6).toFixed(2)}"/>`;
  }).join('')}
  <!-- 云层剪影（呼应设计系统里glow圆形元素）-->
  <circle cx="900" cy="120" r="180" fill="#5b6cf5" opacity="0.08"/>
  <circle cx="80" cy="80" r="150" fill="#a855f7" opacity="0.07"/>
</svg>`;

// Part6: 产品化跃升——多个齿轮节点汇聚成一枚向上生长的六边形结晶（象征多模态/AB测试/商业化/团队协作四股力量汇聚成规模化产品）
const svgPart6 = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg6" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1225"/>
      <stop offset="100%" stop-color="#1a1f3a"/>
    </linearGradient>
    <linearGradient id="glow6" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5b6cf5"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <radialGradient id="core6" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="#a855f7" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#5b6cf5" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur6"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg6)"/>
  <!-- 中心发光核心：象征"规模化产品"这枚结晶 -->
  <circle cx="512" cy="500" r="260" fill="url(#core6)"/>
  <!-- 六边形结晶外框（象征产品化的稳定结构）-->
  <polygon points="512,300 690,405 690,595 512,700 334,595 334,405" fill="none" stroke="url(#glow6)" stroke-width="3" opacity="0.85"/>
  <polygon points="512,340 655,420 655,580 512,660 369,580 369,420" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.4"/>
  <!-- 四个外围节点(多模态/AB测试/商业化/团队协作)汇入中心 -->
  ${(() => {
    const nodes = [
      [180, 220], [844, 220], [180, 780], [844, 780],
    ];
    return nodes.map(([nx, ny]) => `
      <line x1="${nx}" y1="${ny}" x2="512" y2="500" stroke="url(#glow6)" stroke-width="2.2" opacity="0.5" filter="url(#blur6)"/>
      <line x1="${nx}" y1="${ny}" x2="512" y2="500" stroke="#22D3EE" stroke-width="1" opacity="0.6"/>
      <circle cx="${nx}" cy="${ny}" r="14" fill="#5b6cf5" opacity="0.85" filter="url(#blur6)"/>
      <circle cx="${nx}" cy="${ny}" r="6" fill="#ffffff"/>
    `).join('');
  })()}
  <!-- 中心核心点 -->
  <circle cx="512" cy="500" r="22" fill="#ffffff" opacity="0.95" filter="url(#blur6)"/>
  <circle cx="512" cy="500" r="10" fill="#ffffff"/>
  <!-- 齿轮小图标点缀在节点旁，呼应Part1-2的齿轮语言 -->
  <g transform="translate(180,220)" opacity="0.8">
    <circle cx="40" cy="-40" r="16" fill="none" stroke="#a855f7" stroke-width="2.5"/>
    <circle cx="40" cy="-40" r="6" fill="#a855f7"/>
  </g>
  <!-- 星空点 -->
  ${Array.from({length: 45}, () => {
    const x = Math.random()*1024, y = Math.random()*1024;
    const r = 1 + Math.random()*2;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(0.15+Math.random()*0.45).toFixed(2)}"/>`;
  }).join('')}
</svg>`;

async function render(svg, outName) {
  const outPath = path.join(DIR, outName);
  await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(outPath);
  console.log('OK', outName, fs.statSync(outPath).size, 'bytes');
}

(async () => {
  await render(svgPart4, 'part4-cover.png');
  await render(svgPart5, 'part5-cover.png');
  await render(svgPart6, 'part6-cover.png');
})();
