# AgentCraft｜从认知到产品：手把手打造你的 AI Agent

> 一个 AI 产品手艺人写的 Agent 实战笔记 —— 不只是教你写代码，更教你像产品经理一样做技术判断。

[![License: Docs CC BY-NC-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--NC--SA%204.0-blue)](./LICENSE-DOCS.md)
[![License: Code MIT](https://img.shields.io/badge/code-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-持续更新中-orange)](./ROADMAP.md)

---

## 这是什么

2025年被称为"Agent 元年"，市面上已经有很多讲"怎么写 Agent 代码"的教程，其中最出圈的一份公开课程是 Datawhale 社区的 [**hello-agents**](https://github.com/datawhalechina/hello-agents) —— 一份非常扎实的工程向教材，从ReAct 范式到 Agentic RL 训练全流程都讲到了。

**AgentCraft 是我在读完并实践完那一整套体系之后，重新设计的一份"产品经理也能看懂、工程师也不会觉得水"的 Agent 教程。** 它不是 hello-agents 的翻译或搬运，而是我基于自己真实做过的几个 Agent 项目（企业 IM 智能问答机器人、游戏安全数据知识库、独立开发者的AI 小产品）重新想清楚之后，从零写的一套内容。

我是谁：清华硕士毕业，前腾讯游戏产品经理，现在是一名独立的「AI 产品手艺人」——不做大而全的平台，只做小而美、能直接用起来的 AI 产品。这套教程延续同样的手艺人风格：**每一章都配一个能跑起来的东西，不是纯理论。**

## 这套东西和别的 Agent 教程有什么不一样

| | 常见的 Agent 教程 | AgentCraft |
|---|---|---|
| 视角 | 纯工程视角，讲怎么实现 | 工程 + 产品双视角，讲怎么实现 **也讲为什么这样设计、值不值得做** |
| 案例 | 教学向虚拟案例（旅行助手 Demo 等） | 附带我自己真实上线过的项目复盘（企业 IM 机器人、数据分析 Agent） |
| 结构 | 章节讲完概念/代码就结束 | 每章末尾固定一份「产品经理决策清单」，教你怎么把知识变成判断力 |
| 交付物 | 学完记笔记 | 学完至少落地一个能跑的 mini demo，符合"下载即用"的手艺人风格 |
| 时效性 | 视发布时间而定 | 持续跟进 2026 年最新模型/协议生态（国内外并重） |

> 说明：本项目在**内容结构、案例、代码全部原创**，仅在"为什么要做一套体系化 Agent 教程"这件事上受到 hello-agents 的启发，在此郑重感谢 Datawhale 社区开源分享的精神。如果你想看更偏算法训练/学术向的内容（比如 Agentic RL 全流程复现），非常推荐去读原版。

## 目录（持续更新，详见 [ROADMAP.md](./ROADMAP.md)）

### 前言
- [00 前言：我为什么要写这套东西](./docs/00-前言.md)

### Part 1 · 认知重建——Agent 到底是什么，别被概念忽悠 ✅
- [01 Agent 不是新物种：从自动化脚本到自主智能体的连续谱](./docs/part1/01-Agent不是新物种.md)
- [02 一张图看懂 Agent 进化史](./docs/part1/02-一张图看懂Agent进化史.md)
- [03 大模型是发动机，不是车](./docs/part1/03-大模型是发动机不是车.md)
- [04 Agent 产品成熟度分级：L0~L3](./docs/part1/04-Agent产品成熟度分级.md)

### Part 2 · 亲手造轮子——从 Prompt 到框架 🚧
- [概览与进度](./docs/part2/README.md)：ReAct/Plan-and-Solve/Reflection 手把手实现、低代码平台怎么选、主流框架产品化评测、从零写一个 <300 行的 Agent 框架

### Part 3 · 让 Agent 活起来——高级能力 🚧
- [概览与进度](./docs/part3/README.md)：记忆与检索、上下文工程、MCP/A2A 通信协议速查、Agentic RL 产品经理版、Agent 评估体系

### Part 4 · 从 Demo 到产品——真实项目复盘 🚧
- [概览与进度](./docs/part4/README.md)：企业 IM 机器人复盘、数据分析 Agent 架构演进、独立开发者一周做出 AI 小产品

### Part 5 · 毕业设计与展望 🚧
- [概览与进度](./docs/part5/README.md)：设计你自己的 Agent 产品 Pitch、AI 产品经理 / Agent 工程师转型面试题库

### 可运行 Demo
- [demos/01-hello-react-agent](./demos/01-hello-react-agent)：5分钟跑起来的最小 ReAct Agent

## 怎么读

- **转型 AI 产品经理的人**：按 Part 1 → Part 4 → Part 5 顺序读，代码部分可以跳过实现细节，重点看每章的"决策清单"。
- **工程师 / 想动手实现的人**：Part 1 快速过一遍建立框架感，然后重点啃 Part 2、Part 3，把 demo 都跑一遍。
- **独立开发者**：直接看 Part 4 的真实项目复盘 + Part 5 的毕业设计，抄作业式地把方法论套到自己的产品上。

## 快速开始

```bash
git clone https://github.com/harryjzhang69-web/agentcraft.git
cd agentcraft/demos/01-hello-react-agent
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

- 文档内容遵循 [CC BY-NC-SA 4.0](./LICENSE-DOCS.md)（署名-非商业性使用-相同方式共享）
- 示例代码遵循 [MIT License](./LICENSE)
- 感谢 [Datawhale / hello-agents](https://github.com/datawhalechina/hello-agents) 提供的体系化视角启发

如果这套内容对你有帮助，欢迎 Star ⭐，也欢迎提Issue 交流你的 Agent 产品实践。
