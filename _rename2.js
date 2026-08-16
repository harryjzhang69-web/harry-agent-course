const fs = require('fs');
const path = require('path');

// 按降序执行，避免正序改名时新文件名与尚未改名的旧文件冲突
const renames = [
  ['docs/part6/23-团队协作与项目管理.md', 'docs/part6/24-团队协作与项目管理.md'],
  ['docs/part6/22-Agent产品商业化与定价模式.md', 'docs/part6/23-Agent产品商业化与定价模式.md'],
  ['docs/part6/21-Agent产品AB测试方法论.md', 'docs/part6/22-Agent产品AB测试方法论.md'],
  ['docs/part6/20-多模态Agent专题.md', 'docs/part6/21-多模态Agent专题.md'],
  ['docs/part5/19-转型面试题库.md', 'docs/part5/20-转型面试题库.md'],
  ['docs/part5/18-毕业设计Pitch.md', 'docs/part5/19-毕业设计Pitch.md'],
  ['docs/part4/17-独立开发者一周产品.md', 'docs/part4/18-独立开发者一周产品.md'],
  ['docs/part4/16-数据分析Agent架构演进.md', 'docs/part4/17-数据分析Agent架构演进.md'],
  ['docs/part4/15-企业IM智能问答机器人.md', 'docs/part4/16-企业IM智能问答机器人.md'],
  ['docs/part3/14-Agent安全与风险治理.md', 'docs/part3/15-Agent安全与风险治理.md'],
  ['docs/part3/13-Agent评估体系与常见陷阱.md', 'docs/part3/14-Agent评估体系与常见陷阱.md'],
  ['docs/part3/12-Agentic-RL产品经理版.md', 'docs/part3/13-Agentic-RL产品经理版.md'],
  ['docs/part3/11-通信协议速查.md', 'docs/part3/12-通信协议速查.md'],
  ['docs/part3/10-上下文工程.md', 'docs/part3/11-上下文工程.md'],
  ['docs/part3/09-记忆与检索.md', 'docs/part3/10-记忆与检索.md'],
  ['docs/part2/08-从零写一个Agent框架.md', 'docs/part2/09-从零写一个Agent框架.md'],
  ['docs/part2/07-主流框架产品化评测.md', 'docs/part2/08-主流框架产品化评测.md'],
  ['docs/part2/06-低代码平台怎么选.md', 'docs/part2/07-低代码平台怎么选.md'],
];

let ok = 0, fail = 0;
for (const [from, to] of renames) {
  const fromPath = path.join(__dirname, from);
  const toPath = path.join(__dirname, to);
  if (!fs.existsSync(fromPath)) {
    console.log('MISSING SOURCE:', from);
    fail++;
    continue;
  }
  if (fs.existsSync(toPath)) {
    console.log('DEST ALREADY EXISTS (danger, skip):', to);
    fail++;
    continue;
  }
  fs.renameSync(fromPath, toPath);
  console.log('OK:', from, '->', to);
  ok++;
}
console.log(`\n完成：成功${ok}个，失败${fail}个`);
