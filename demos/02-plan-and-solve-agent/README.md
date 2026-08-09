# 02 Plan-and-Solve Agent

对应 [Part 2 第05 章](../../docs/part2/05-三大经典范式手把手实现.md)。与01 号Demo（ReAct）的区别：**先一次性生成完整步骤清单，再按计划逐条执行**，而不是"走一步看一步"。适合路径基本确定、但需要多步骤协作的任务。

## 快速开始

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-你的key
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_MODEL=deepseek-chat
python plan_and_solve_agent.py
```

试试输入："帮我规划一下学习 Python 的三周计划，并说明每周的验收标准。"——你会看到它先输出完整的步骤清单（Plan），再逐条给出具体内容（Solve），这是和 ReAct demo 最直观的行为差异。

## 和 01 号 Demo 对比着看

| |01-hello-react-agent | 02-plan-and-solve-agent |
|---|---|---|
| 决策方式 | 走一步、看结果、再决定下一步 | 先想清楚全部步骤，再依次执行 |
| 适合场景 | 路径依赖中间结果动态调整 | 路径基本确定、需要全局视角避免绕路 |
| 主要风险 | 局部最优/绕路 | Plan 阶段想错了，Solve 阶段会忠实执行错误计划 |
