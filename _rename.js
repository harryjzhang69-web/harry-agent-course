const { execSync } = require('child_process');
const path = require('path');

const renames = [
  ['docs/part4/16-独立开发者一周产品.md', 'docs/part4/17-独立开发者一周产品.md'],
  ['docs/part4/15-数据分析Agent架构演进.md', 'docs/part4/16-数据分析Agent架构演进.md'],
  ['docs/part4/14-企业IM智能问答机器人.md', 'docs/part4/15-企业IM智能问答机器人.md'],
  ['docs/part5/18-转型面试题库.md', 'docs/part5/19-转型面试题库.md'],
  ['docs/part5/17-毕业设计Pitch.md', 'docs/part5/18-毕业设计Pitch.md'],
];

for (const [src, dst] of renames) {
  const cmd = `git mv "${src}" "${dst}"`;
  try {
    execSync(cmd, { cwd: __dirname, stdio: 'pipe' });
    console.log('OK:', src, '->', dst);
  } catch (e) {
    console.log('FAIL:', src, '->', dst, e.message);
  }
}
