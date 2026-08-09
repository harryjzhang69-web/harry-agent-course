# Harry 的 Agent 实战课｜从认知到产品，亲手打造你的 AI Agent

> 清华学长 harry 出品 · AI 产品手艺人系列课程 —— 核心内容永久免费，进阶真实项目复盘案例解锁付费版。

[![License: Docs CC BY-NC-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--NC--SA%204.0-blue)](./LICENSE-DOCS.md)
[![License: Code MIT](https://img.shields.io/badge/code-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-持续更新中-orange)](./ROADMAP.md)
[![付费进阶案例](https://img.shields.io/badge/进阶案例-¥99解锁-red)](#-进阶版真实项目复盘怎么解锁)

---

## 这是什么

2025年被称为"Agent 元年"，市面上已经有很多讲"怎么写Agent 代码"的教程，其中最出圈的一份公开课程是 Datawhale 社区的 [**hello-agents**](https://github.com/datawhalechina/hello-agents) —— 一份非常扎实的工程向教材，从ReAct 范式到 Agentic RL 训练全流程都讲到了。

**这套课是我在读完并实践完那一整套体系之后，重新设计的一份"产品经理也能看懂、工程师也不会觉得水"的 Agent 实战课。** 它不是 hello-agents 的翻译或搬运，而是我基于自己真实做过的几个 Agent 项目（企业 IM 智能问答机器人、游戏安全数据知识库、独立开发者的 AI 小产品）重新想清楚之后，从零写的一套内容。

我是谁：清华硕士毕业，前腾讯游戏产品经理，现在是一名独立的「AI 产品手艺人」——不做大而全的平台，只做小而美、能直接用起来的 AI 产品。这套课延续同样的手艺人风格：**每一章都配一个能跑起来的东西，不是纯理论。**

## 免费内容 vs 进阶付费内容

我一直的产品哲学是"前期免费、后续收费"——先把最核心、最能建立信任的部分完全开源免费，等你确认这套东西真的对你有用之后，再决定要不要解锁最值钱的那部分（我真实踩过坑的项目复盘）。

| | 内容 | 状态 | 定价 |
|---|---|---|---|
| **免费** | 前言 + Part 1 认知重建（4章）+ Part 2 亲手造轮子 + Part 3 高级能力 + Part 5 毕业设计与面试题库 | 本仓库完全公开 | 免费 |
| **进阶付费** | **Part 4 · 真实项目复盘**（3 个我亲手做上线过的真实 Agent 项目：企业 IM 机器人 / 数据分析 Agent 架构演进 / 独立开发者一周产品） | 私信解锁 | ¥99 一次性（详见下方） |

> 为什么单独把Part 4 拿出来卖：概念和范式网上讲的人很多，但"一个真实项目怎么从错误方案一步步演进到正确架构"这种一手经验很少有人愿意公开写。这部分是我真金白银踩坑换来的，所以单独定价。

## 这套东西和别的 Agent 教程有什么不一样

| | 常见的 Agent 教程 | 本课程 |
|---|---|---|
| 视角 | 纯工程视角，讲怎么实现 | 工程 + 产品双视角，讲怎么实现 **也讲为什么这样设计、值不值得做** |
| 案例 | 教学向虚拟案例（旅行助手Demo 等） | 附带我自己真实上线过的项目复盘（企业 IM 机器人、数据分析 Agent） |
| 结构 | 章节讲完概念/代码就结束 | 每章末尾固定一份「产品经理决策清单」，教你怎么把知识变成判断力 |
| 交付物 | 学完记笔记 | 学完至少落地一个能跑的 mini demo，符合"下载即用"的手艺人风格 |
| 时效性 | 视发布时间而定 | 持续跟进 2026 年最新模型/协议生态（国内外并重） |

> 说明：本项目在**内容结构、案例、代码全部原创**，仅在"为什么要做一套体系化 Agent 教程"这件事上受到 hello-agents 的启发，在此郑重感谢 Datawhale 社区开源分享的精神。如果你想看更偏算法训练/学术向的内容（比如 Agentic RL 全流程复现），非常推荐去读原版。

## 目录（持续更新，详见 [ROADMAP.md](./ROADMAP.md)）

### 前言（免费）
- [00 前言：我为什么要写这套东西](./docs/00-前言.md)

### Part 1 · 认知重建——Agent 到底是什么，别被概念忽悠 ✅ 免费
- [01 Agent 不是新物种：从自动化脚本到自主智能体的连续谱](./docs/part1/01-Agent不是新物种.md)
- [02 一张图看懂 Agent 进化史](./docs/part1/02-一张图看懂Agent进化史.md)
- [03 大模型是发动机，不是车](./docs/part1/03-大模型是发动机不是车.md)
- [04 Agent 产品成熟度分级：L0~L3](./docs/part1/04-Agent产品成熟度分级.md)

### Part 2 ·亲手造轮子——从 Prompt 到框架 ✅ 免费
- [05 三大经典范式手把手实现（ReAct/Plan-and-Solve/Reflection）](./docs/part2/05-三大经典范式手把手实现.md)
- [06 低代码平台怎么选（Dify/Coze/n8n）](./docs/part2/06-低代码平台怎么选.md)
- [07 主流框架产品化评测（LangGraph/AutoGen/AgentScope）](./docs/part2/07-主流框架产品化评测.md)
- [08 从零写一个 <300 行的 Agent 框架](./docs/part2/08-从零写一个Agent框架.md)

### Part 3 · 让 Agent 活起来——高级能力 🚧 免费
- [概览与进度](./docs/part3/README.md)：记忆与检索、上下文工程、MCP/A2A 通信协议速查、Agentic RL 产品经理版、Agent 评估体系

### Part 4 · 从Demo 到产品——真实项目复盘 🔒 进阶付费 ¥99
- [内容预览与解锁方式](./docs/part4/README.md)：企业 IM 机器人复盘、数据分析 Agent 架构演进、独立开发者一周做出 AI 小产品

### Part 5 · 毕业设计与展望 🚧 免费
- [概览与进度](./docs/part5/README.md)：设计你自己的 Agent 产品 Pitch、AI 产品经理 / Agent 工程师转型面试题库

### 可运行 Demo（免费）
- [demos/01-hello-react-agent](./demos/01-hello-react-agent)：5分钟跑起来的最小 ReAct Agent
- [demos/02-plan-and-solve-agent](./demos/02-plan-and-solve-agent)：Plan-and-Solve Agent
- [demos/03-reflection-agent](./demos/03-reflection-agent)：Reflection Agent
- [demos/04-mini-agent-framework](./demos/04-mini-agent-framework)：迷你 Agent 框架（<300行）

## 怎么读

- **转型 AI 产品经理的人**：按 Part 1 → Part 5 顺序读免费内容，代码部分可以跳过实现细节，重点看每章的"决策清单"；如果想看真实项目怎么落地踩坑，再考虑解锁 Part 4。
- **工程师 / 想动手实现的人**：Part 1 快速过一遍建立框架感，然后重点啃 Part 2、Part 3，把 demo 都跑一遍。
- **独立开发者**：先读免费的 Part 5 毕业设计方法论，如果想抄作业式地套用真实项目的架构演进过程，解锁 Part 4。

## 进阶版真实项目复盘怎么解锁

因为是我个人独立维护的小课程，暂时没有接第三方支付平台，走最直接的"私信购买"：

1. 加我微信 `jialin_69`，备注"Agent 实战课"
2. 转账 ¥99（一次性，永久获取更新）
3. 我把你加入私有仓库协作者名单，或直接发你 PDF/Markdown 打包文件
4. 后续 Part 4 新增案例，已购买的同学免费更新

> 定价和交付方式后续可能调整（比如接入知识星球/爱发电），最新方式以本README 为准。也欢迎通过公众号「AI 产品手艺人」或邮箱联系我。

## 快速开始（免费内容 + Demo）

```bash
git clone https://github.com/harryjzhang69-web/harry-agent-course.git
cd harry-agent-course/demos/01-hello-react-agent
pip install -r requirements.txt
# 配置任意 OpenAI 协议兼容的 API Key（深度求索/混元/OpenAI 均可）
export OPENAI_API_KEY=sk-xxxx
export OPENAI_BASE_URL=https://api.deepseek.com   # 换成你用的服务商
python react_agent.py
```

## 关于作者

Harry，清华大学硕士，前腾讯游戏产品经理，现在专职做「AI 产品手艺人」——不追求大平台，只做小而美、下载即用的 AI 产品和工具。

- 公众号：AI 产品手艺人
- 小红书：@清华学长harry
- GitHub：[@harryjzhang69-web](https://github.com/harryjzhang69-web)
- 微信：jialin_69
- 邮箱：2385069706@qq.com

## 协议与致谢

- 免费部分文档内容遵循 [CC BY-NC-SA 4.0](./LICENSE-DOCS.md)（署名-非商业性使用-相同方式共享）
- 示例代码遵循 [MIT License](./LICENSE)
- Part 4 付费内容版权保留，未经授权不得转载/传播（详见 [LICENSE-DOCS.md](./LICENSE-DOCS.md)）
- 感谢 [Datawhale / hello-agents](https://github.com/datawhalechina/hello-agents) 提供的体系化视角启发

如果这套内容对你有帮助，欢迎 Star ⭐，也欢迎提Issue 交流你的 Agent 产品实践。
