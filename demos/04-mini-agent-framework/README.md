# 04 迷你 Agent 框架（<300 行）

对应 [Part 2 第09 章](../../docs/part2/09-从零写一个Agent框架.md)。一个不到300 行、从零手写的最小 Agent 框架，覆盖工具注册、ReAct 循环、基础记忆三个核心能力。目的不是"造一个能用的产品级框架"，而是让你看清楚 LangGraph/AutoGen 这类重型框架底层到底在解决什么问题。

## 目录结构

```
mini_agent/
  __init__.py
  core.py        # Tool / Memory / Agent 三个核心类
example_usage.py  # 用这个框架重新实现第01号Demo的能力
```

## 快速开始

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-你的key
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_MODEL=deepseek-chat
python example_usage.py
```

## 和 01号 Demo 的代码量对比

用这个框架重新实现"计算器工具调用"的能力，业务代码从几十行的Prompt 拼接+解析逻辑，缩短到"注册一个工具+调用run"几行代码——这就是框架的核心价值：把可复用的胶水逻辑（Prompt 拼接、输出解析、循环控制）沉淀成基础设施。

## 想扩展成生产可用？

- `Memory` 类现在是纯内存列表，可以替换成向量数据库实现语义检索（对应 Part 3 记忆与检索一章）
- `Agent.run()` 目前是单Agent 循环，如果要支持多Agent协作，需要在这基础上加一层"消息路由"（这一步复杂度上升明显，值不值得做，参考 Part 2 第08章的框架选型讨论）
- 生产环境建议把 `_parse()` 的正则解析换成更稳健的结构化输出（JSON mode / function calling），对应 Part 1 第03 章讲的"L3 结构化约束"
