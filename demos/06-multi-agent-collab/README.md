# Demo 06：多智能体协作（调研员 + 审稿人 + 协调者）

> 对应课程 [Part5 第19章 毕业设计capstone项目](../../docs/part5/19-毕业设计Pitch.md)，以及 [Part1 第04章 L3多智能体协作](../../docs/part1/04-Agent产品成熟度分级.md) 的可运行实现。

## 这个 Demo 演示了什么

一个最小但完整的多智能体协作系统：**调研员 Agent** 写研究简报初稿 → **审稿人 Agent** 审查逻辑/事实/遗漏 → 如果没通过，**协调者** 把审查意见带回给调研员修订 → 循环直到通过或达到轮数上限。

```
用户提出主题 → 协调者委派调研员 → 调研员产出初稿 → 协调者委派审稿人 → 审稿人审查
                                                                      ↓
                                                    通过 → 输出最终简报
                                                    不通过 → 带着意见回到调研员，重新修订（最多3轮）
```

## 为什么这么设计（安全护栏，呼应 Part3 第15章）

- **协作轮数有硬上限（`MAX_REVIEW_ROUNDS = 3`）**：防止两个 Agent 互相"审不过/改不好"陷入死循环，Token 无限消耗。
- **完整记录每一轮协作过程（`CollabLog`）**：出问题时能审计"具体是哪一轮、哪个Agent的判断出了偏差"，不是黑箱。
- **达到轮数上限仍未通过时，明确标注状态并提醒人工介入**，而不是把"未达标的版本"包装成"看起来正常的最终结果"静默返回给用户——这是 Human-in-the-loop 护栏思想的最小体现。

## 快速开始

```bash
cd demos/06-multi-agent-collab
pip install -r requirements.txt

export OPENAI_API_KEY=sk-xxxx
export OPENAI_BASE_URL=https://api.deepseek.com   # 换成你用的服务商
export DEMO_TOPIC="你想研究的任意主题"              # 可选，默认有个示例主题

python multi_agent_collab.py
```

## 毕业作业提示

跑通之后，回到 [Part5 第19章](../../docs/part5/19-毕业设计Pitch.md) 的毕业作品部分，尝试用课程学到的框架逐条回答：**为什么这个任务需要两个角色分工而不是一个 Agent 独立完成？协调者的委派逻辑是否合理？如果一直不通过审查，除了轮数上限还应该加什么护栏？**
