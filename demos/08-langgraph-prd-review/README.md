# Demo 08：用 LangGraph 真实框架实现「PRD 自动生成与多角色评审」

> 对应课程 [Part2 第07章 主流框架产品化评测](../../docs/part2/07-主流框架产品化评测.md)。07章只做了 LangGraph / AutoGen / AgentScope 的纯文字对比评测，这个 demo 是**唯一一个真实调用框架 SDK（`langgraph`）跑起来的可运行代码**，不是自己拿 OpenAI SDK 手写模拟。

## 这个 Demo 演示了什么

一个三角色协作的 PRD（产品需求文档）生成与评审流水线：

```
产品经理Agent 写PRD初稿
        ↓
   评审官Agent 三选一判决
        ↓
   ┌────┼────────────┐
 通过   小修           需架构评估
   ↓     ↓（回到PM）      ↓
 结束   PM修订→再评审   架构师Agent介入
                          ↓
                       反馈给PM修订→再评审
```

评审官不是简单的"过/不过"二元判断，而是**三选一**：
- `approved`（通过）→ 结束
- `minor_revise`（小修）→ 打回产品经理Agent 修订，重新评审
- `escalate`（需架构评估）→ 转架构师Agent 判断技术可行性，反馈给产品经理Agent 修订后再评审（只允许升级一次，避免反复转发）

## 为什么这个场景值得专门写一个 LangGraph 版本（而不是像 Demo06 一样手写）

[Demo06](../06-multi-agent-collab) 的"调研员+审稿人"两角色打回循环，用纯 `for` 循环 + `if` 判断就完整实现了，**根本不需要引入任何框架**——这恰好呼应第07章的核心观点："框架的价值是处理真实存在的复杂度，没有复杂度就不要引入框架"。

但这个 PRD 评审场景不一样：评审官的判决是**三分支**，其中一条分支（升级架构评估）还要**绕道另一个 Agent 再汇合回原节点**，形成"部分节点会重复经过、但不是简单循环"的控制流。手写代码要维护"是否已经升级过""现在应该回到哪个节点"这类状态标记位，容易写错也难读——这才是 LangGraph 的**状态图（节点+条件边）**真正派上用场的地方。

这个 demo 实际用上了 LangGraph 三个具体价值点（不是空谈，代码里都有）：

| 价值点 | 对应代码 | 好在哪 |
|---|---|---|
| 条件边路由 | `add_conditional_edges("reviewer", route_after_review, {...})` | 三分支判决一行代码声明清楚，不是嵌套 if |
| 状态持久化 | `MemorySaver()` + `thread_id` + `get_state_history()` | 不用自己维护日志列表，事后能完整回放每一步的状态快照 |
| 自动生成流程图 | `app.get_graph().draw_mermaid()` | 图和代码永远同步，不会像手画的示意图那样"文档图和代码逻辑早就不对应了" |

## 快速开始

```bash
cd demos/08-langgraph-prd-review
pip install -r requirements.txt

export OPENAI_API_KEY=sk-xxxx
export OPENAI_BASE_URL=https://api.deepseek.com   # 换成你用的服务商
export DEMO_TOPIC="你想生成PRD的任意产品需求"        # 可选，默认有个示例主题

python prd_review_graph.py
```

## 没有 API Key？先跑 selftest 模式看路由逻辑

```bash
# Windows PowerShell
$env:DEMO_SELFTEST="1"; python prd_review_graph.py

# macOS / Linux
DEMO_SELFTEST=1 python prd_review_graph.py
```

`selftest` 模式不会真实调用大模型，用固定剧本模拟三轮判决（第1轮升级架构评估→第2轮小修→第3轮通过），刚好覆盖三条分支的完整路径，运行结束会打印：
- 自动生成的 mermaid 流程图源码
- 9 个历史 checkpoint（对应 start→drafter→reviewer→architect→drafter→reviewer→drafter→reviewer→end 九个状态节点）
- 完整的 7 步协作过程（产品经理写稿→评审→架构师介入→产品经理修订→评审→产品经理再修订→评审通过）

这套 selftest 已经过实测验证，路由逻辑（三分支跳转 + 架构师介入后正确绕回产品经理Agent）全部符合预期。真实调用大模型时，Prompt 的设计模式与 [Demo06](../06-multi-agent-collab) 已验证过的写法一致（system角色设定+明确的输出格式约束），只是判决从二元变成了三元。

## 产品经理清单

> - [ ] 这个场景真的需要"多分支路由+分支汇合"这种复杂控制流吗？如果只是简单的两方打回循环，直接学 [Demo06](../06-multi-agent-collab) 就够，不需要上框架。
> - [ ] 我有没有给循环设置轮数上限？（这里是 `MAX_ROUNDS = 3`，防止产品经理Agent和评审官Agent无限"打太极"）
> - [ ] 架构师升级评估这条分支，我有没有限制"只允许触发一次"？如果不限制，评审官每次都判定"需要架构评估"，图会在 drafter↔architect 之间死循环。

## 毕业作业提示

跑通之后，回到 [Part2 第07章](../../docs/part2/07-主流框架产品化评测.md) 的选型清单部分，尝试回答：**如果把"架构师评估"这条分支去掉，只保留"通过/小修"二元判决，这个场景还值得用 LangGraph 吗？还是退化成 Demo06 的纯手写方案更合适？**
