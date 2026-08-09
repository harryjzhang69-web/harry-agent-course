# 03 Reflection Agent

对应 [Part 2 第05 章](../../docs/part2/05-三大经典范式手把手实现.md)。核心思路：模型在"生成者"和"批评者"两个角色间来回切换，自己审查自己的输出并修正，直到批评者认为通过或达到最大轮数。

## 快速开始

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-你的key
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_MODEL=deepseek-chat
python reflection_agent.py
```

试试输入一个容易漏细节的任务，比如："写一份产品需求文档大纲，要包含背景、目标用户、核心功能、非功能需求、验收标准。"——观察批评者会不会指出初稿遗漏了哪些要求。

## 使用提醒

Reflection 至少比单轮生成多花一倍以上的 Token 和延迟，且对"模型本身就不具备判断能力"的错误类型无效（比如模型没有的知识盲区）。适合用在"输出质量要求高、容错率低"的场景，不建议无差别套用在所有任务上。
