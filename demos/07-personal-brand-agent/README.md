# Demo 07：个人品牌定位 Agent（完整全栈项目）

> 对应课程 [番外02 全栈实战文档](../../docs/bonus/番外02-个人品牌定位Agent全栈实战.md)。这是全课程第一个**可以 clone 下来直接跑起来的完整 Web 应用**（前端 + 后端 + 4个Agent协作），不再是命令行级别的最小示例。

## 这个 Demo 演示了什么

输入你的背景、技能、目标受众，四个专门 Agent 依次接力，产出一份**可以直接用**的个人品牌定位报告：

```
用户填表 → ①定位分析师(找差异化) → ②内容策略师(排内容支柱+首月日历)
        → ③文案专家(生成简介/首发文案) → ④整合编辑(汇总成完整报告)
        → 前端实时展示进度 + 可导出 Markdown
```

选这个场景练手，是因为它足够真实：这套课的核心读者（转型AI产品经理的人）本身就需要给自己做一次定位，用自己的真实信息跑一遍，产出的东西能直接用，不是一个"演示完就扔"的玩具案例。

## 技术架构

- **后端**：FastAPI + 4个Agent类（`backend/agents.py`）+ Pydantic数据模型（`backend/models.py`），LLM调用统一走 OpenAI 协议兼容客户端，可以换成 DeepSeek/混元/OpenAI 官方任意服务商
- **前端**：纯静态 HTML/CSS/JS，**没有任何构建步骤**（不需要装 Node/npm），FastAPI 直接把 `frontend/` 目录当静态站点托管
- **进度推送**：用 SSE（Server-Sent Events）把4个Agent的执行进度实时推给前端，避免4次串行LLM调用（通常15~40秒）期间纯白屏等待

## 快速开始

```bash
cd demos/07-personal-brand-agent
pip install -r requirements.txt

# 复制 .env.example 为 .env，或者直接 export 环境变量
export OPENAI_API_KEY=sk-xxxx
export OPENAI_BASE_URL=https://api.deepseek.com   # 换成你用的服务商
export OPENAI_MODEL=deepseek-chat

python backend/app.py
```

启动后打开浏览器访问 **http://127.0.0.1:8420** ，填表体验完整流程。

## 目录结构

```
demos/07-personal-brand-agent/
├── backend/
│   ├── app.py       # FastAPI 主入口，挂载前端静态文件 + /api/generate 接口
│   ├── agents.py     # 4个专门Agent + 协调者(Orchestrator)
│   └── models.py     # Pydantic 数据模型，定义每一步Agent的输入/输出结构
├── frontend/
│   ├── index.html    # 单页应用：左侧表单 + 右侧结果展示
│   ├── style.css
│   └── app.js         # 表单提交、SSE消费、结果渲染、Markdown导出
├── requirements.txt
├── .env.example
└── README.md
```

## 为什么这么设计（几个具体的产品/工程取舍）

- **前端不用任何构建工具**：这套课的核心读者是转型AI产品经理，很多人没有完整的前端开发环境，纯静态HTML能让"clone下来就能跑"这件事成立，而不是先卡在 `npm install` 报错上。
- **SSE 而不是等全部跑完再一次性返回**：4次LLM串行调用不是瞬间完成的，把中间状态暴露给用户，是"怎么处理长耗时任务"的一个具体产品设计示范（对应课程 Part6 第21章 AB测试思路里"体验指标"的概念）。
- **最后一步"整合编辑"故意不用LLM排版，只用LLM生成一段点评**：报告的结构是确定的，没必要为了排版效果再花一次调用的钱和时间——这是"哪些环节该用LLM、哪些该用确定性代码"的具体示范。

## 毕业作业提示

跑通之后，可以试着回答这几个问题（也是番外02文档结尾的自测方向）：
- 为什么要拆成4个Agent串行，而不是写一个超长Prompt让一个Agent一次性搞定？拆分的代价（4次调用、更长耗时）换来了什么好处？
- 如果"定位分析师"给出的 `risk_warning` 明确提示"这个定位太泛"，后面3个Agent要不要因此调整策略？现在的设计里它们完全没看到这个风险提示，这是不是一个值得优化的点？
- 尝试给这个项目加一个"同类定位对标搜索"工具（参考 Part2 第05章 ReAct 案例用 SerpApi 的方式），让定位分析师能查到真实的同类账号做参考，而不是完全靠模型的预训练知识。
