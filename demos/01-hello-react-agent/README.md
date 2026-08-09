# 01 最小 ReAct Agent

对应 [Part 1 第01/04 章](../../docs/part1)讲的"自主规划循环"，以及即将发布的 Part 2 第05 章。这是一个**从零手写**的 ReAct（Reasoning + Acting）循环实现，不依赖任何 Agent 框架，只用最基础的字符串解析，目的是让你看清楚 ReAct 循环内部到底在做什么——这也是本书的一贯风格：先看透原理，再谈用什么框架。

## ReAct 循环长什么样

```
用户提问
  ↓
Thought（模型思考：我该做什么）
  ↓
Action（模型决定调用哪个工具，传什么参数）
  ↓
Observation（工具真实执行后返回的结果）
  ↓ 回到 Thought，直到模型输出 Final Answer
```

## 快速开始

```bash
pip install -r requirements.txt

# 任选一个 OpenAI 协议兼容的服务商，例如深度求索：
export OPENAI_API_KEY=sk-你的key
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_MODEL=deepseek-chat

python react_agent.py
```

运行后直接在命令行里提问即可，比如：

```
> 现在几点了？如果再过90分钟是几点？
```

模型会自己规划：先调用 `get_current_time` 工具拿到当前时间，再调用 `calculator` 工具做加法，最后给出 Final Answer。

## 代码里的三个关键设计点

1. **工具注册表（TOOLS 字典）**：新增一个工具，只需要写一个函数并注册进字典，不需要改循环逻辑——这是所有 Agent 框架"工具系统"的最小雏形。
2. **严格的输出格式约束**：Prompt 里明确要求模型只能按 `Thought/Action/Action Input/Observation/Final Answer` 的格式输出，这是第03 章讲的"结构化约束（L3 Prompt工程）"的直接应用——没有这个约束，代码几乎不可能稳定解析模型输出。
3. **最大步数护栏**：`MAX_STEPS` 限制了循环最多跑几轮，这是第04 章讲的"L2 自主规划循环必须配套的护栏"之一，防止模型陷入死循环消耗你的Token 预算。

## 想接入真实工具？

把 `TOOLS` 字典里的 `calculator` / `get_current_time` 换成你自己的函数即可，比如接入一个真实的搜索 API、数据库查询、或者你公司内部的接口——工具注册表的写法不需要改。
