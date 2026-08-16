# Part 3 · 让Agent 活起来——高级能力 ✅

![Part 3 封面：护栏光环层层保护的Agent](../../assets/images/part3-cover.png)

> 从"怎么让Agent 记住重要的事"到"怎么管理有限的上下文"到"怎么和外部系统/其他Agent 通信"到"什么时候真的需要训练"到"怎么评估效果"再到"怎么防止被攻击/越权"，补上让Agent 从"能跑Demo"到"能在生产里长期可靠运行"所需的全部关键能力。

| 章节 | 标题 | 你会获得 |
|---|---|---|
| 10 | [记忆与检索](./10-记忆与检索.md) | 短期/长期记忆架构设计，RAG 的正确使用边界与常见陷阱 |
| 11 | [上下文工程](./11-上下文工程.md) | 不止是 Prompt Engineering，是给 Agent 管理有限上下文预算的系统方法 |
| 12 | [通信协议速查（MCP/A2A/ANP）](./12-通信协议速查.md) | 给产品经理的协议选型速查表，不用啃 RFC 文档 |
| 13 | [Agentic RL 产品经理版](./13-Agentic-RL产品经理版.md) | SFT→GRPO训练闭环的产品级理解：什么时候真的需要训练 |
| 14 | [Agent 评估体系与常见陷阱](./14-Agent评估体系与常见陷阱.md) | 核心指标、基准测试方法，以及"评估结果好看但产品体验差"的常见坑 |
| 15 | [Agent 安全与风险治理](./15-Agent安全与风险治理.md) | Prompt Injection/越狱防御、Agent越权操作管控，纵深防御架构设计 |

## 配套可运行 Demo

- [`demos/05-simple-memory-rag`](../../demos/05-simple-memory-rag) —— 最小可用的检索增强记忆Demo（Embedding + 相似度召回）
- [`demos/09-custom-mcp-server`](../../demos/09-custom-mcp-server) —— 真实用官方`mcp` SDK搭建的MCP服务器

