"""
demos/09-custom-mcp-server/server.py

用官方 MCP Python SDK（`mcp` 包，FastMCP）从零搭建一个真实可用的 MCP 服务器。
对应课程 Part3 第11章《通信协议速查》—— 11章只是协议层面的速查表，
这个 demo 补上"怎么真的把一个能力封装成标准 MCP 服务、让任意 MCP 客户端都能直接调用"的实操。

业务场景：把 Part5 第19章《转型面试题库》封装成一个 MCP 工具服务。
这样做的价值（对应第11章"MCP=USB"的类比）：任何支持 MCP 的客户端
（Claude Desktop、Cursor、企业自己的Agent、番外01做的Coze Bot同类场景……）
都能直接"插上"这个题库工具，而不需要每个客户端各自重新实现一遍
"读题库文件、按分类筛选、随机抽题"的逻辑——写一次，到处复用。

三个工具：
- list_questions(part)：按分类（A产品向/B技术向/C综合场景/留空=全部）列出题目标题
- get_question_detail(question_id)：查询某道题的完整信息（题目+参考思路+对应课程章节）
- get_random_question(part)：随机抽一道题（用于面试自测场景）

运行方式、发布准备清单见同目录 README.md。
"""

import random

from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="interview-question-bank",
    instructions=(
        "这是 Harry 的 Agent 实战课配套的面试题库 MCP 服务，"
        "覆盖AI产品经理/Agent工程师转型面试常见题目。"
        "调用 list_questions 浏览题目，get_question_detail 查看具体某题，"
        "get_random_question 随机抽题用于自测。"
    ),
)

# 数据来源：docs/part5/19-转型面试题库.md（保持与课程正文完全一致，不重复维护两份数据）
QUESTIONS = [
    {"id": "A-Q1", "part": "A", "title": "什么是 Agent？它跟传统的自动化脚本/RPA有什么区别？",
     "chapter": "Part1 第01章", "hint": "讲清楚'感知-决策-行动'闭环，以及'决策权在谁手里'这条连续谱，不要简单说'Agent就是能自主的AI'这种空话。"},
    {"id": "A-Q2", "part": "A", "title": "你怎么判断一个业务需求，到底需要做到 Agent 的哪个成熟度级别？",
     "chapter": "Part1 第04章", "hint": "用L0~L3分级框架，结合三个判断问题（路径能否枚举/是否需要自主判断终点/是否需要多角色协作）现场推演一个具体案例。"},
    {"id": "A-Q3", "part": "A", "title": "如果老板要求'我们也要做一个Agent产品'，但你觉得现在的技术方案根本不需要Agent，你会怎么处理？",
     "chapter": "Part1 第01章", "hint": "不要直接反对，而是用连续谱框架帮对方理清楚'我们的场景决策权在谁手里'，往往能发现'用工作流编排就够了'，同时提出更低成本的替代方案。"},
    {"id": "A-Q4", "part": "A", "title": "你会怎么给一个Agent产品设计评估指标？",
     "chapter": "Part3 第13章", "hint": "讲清楚任务成功率/效率/安全/用户体验四个维度，并强调'评估指标要跟真实业务目标一致'，举一个'指标好看但业务没提升'的反例。"},
    {"id": "A-Q5", "part": "A", "title": "低代码平台（Dify/Coze）和自己写代码搭Agent，你怎么选？",
     "chapter": "Part2 第06章", "hint": "用决策树框架回答——团队资源、是否多入口复用、流程复杂度三个维度，并提到'低代码平台是验证MVP的最佳工具，不代表长期终态'这个务实观点。"},
    {"id": "A-Q6", "part": "A", "title": "讲一个你真实做过的、后来发现方案不对、又重新调整的AI产品案例。",
     "chapter": "Part4（真实项目复盘）", "hint": "面试官想听的是'你有没有真实的踩坑和迭代经验'，重点讲清楚'最初为什么选那个方案、后来发现了什么局限、怎么调整的'，而不是只讲最终结果多完美。"},
    {"id": "B-Q7", "part": "B", "title": "ReAct、Plan-and-Solve、Reflection 三种范式分别解决什么问题？什么场景下会组合使用？",
     "chapter": "Part2 第05章", "hint": "分别讲清楚三者解决的核心矛盾（动态调整/全局规划/质量把关），并举一个'Plan-and-Solve定大方向+子步骤内部ReAct+关键输出前Reflection'的组合案例。"},
    {"id": "B-Q8", "part": "B", "title": "什么是RAG？什么场景下不需要用RAG？",
     "chapter": "Part3 第09章", "hint": "讲清楚RAG本质是'检索长期记忆+拼进Prompt'，并用决策框架回答——知识量能否塞进单次上下文/查询模式是精确匹配还是语义匹配。"},
    {"id": "B-Q9", "part": "B", "title": "什么是'Lost in the Middle'现象？怎么应对？",
     "chapter": "Part3 第10章", "hint": "模型对上下文首尾的注意力更高，中间部分容易被忽略；应对方式是把最关键信息放在靠近生成位置的末尾，并做上下文压缩/清理。"},
    {"id": "B-Q10", "part": "B", "title": "MCP协议解决了什么问题？跟直接写API对接工具有什么区别？",
     "chapter": "Part3 第11章", "hint": "MCP的核心价值是标准化，'一次实现多处复用'，跟USB类比；当工具/数据源会被多个不同Agent客户端复用时才有明显优势，否则自己写API对接更简单直接。"},
    {"id": "B-Q11", "part": "B", "title": "什么时候应该考虑给Agent做微调（SFT）或强化学习训练，而不是只优化Prompt？",
     "chapter": "Part3 第12章", "hint": "先讲'能力提升手段的成本梯度'（Prompt→工具优化→SFT→RL），再讲SFT适合格式/风格/领域知识不足，RL适合有明确可计算奖励信号的多步决策优化，强调训练是'用尽更便宜手段之后'的选择。"},
    {"id": "B-Q12", "part": "B", "title": "Agent陷入死循环/一直在重复同样的错误动作，你会怎么排查和修复？",
     "chapter": "Part3 第10章 + Part2 第04章", "hint": "先检查是否有最大步数限制，再检查上下文里是否累积了干扰性的历史Observation（上下文污染），必要时设计'子任务完成后清理中间过程'的机制。"},
    {"id": "C-Q13", "part": "C", "title": "假设你要给一个从0到1的创业公司设计Agent产品的技术选型，预算和人力都非常有限，你会怎么规划第一个月和后续三个月的技术路径？",
     "chapter": "综合场景题（无标准答案）", "hint": "建议结合Part1~3学到的所有框架，写一份书面回答。"},
    {"id": "C-Q14", "part": "C", "title": "如果你发现团队做的Agent产品在评估集上表现很好，但真实用户反馈很差，你会从哪些角度排查？",
     "chapter": "综合场景题（无标准答案）", "hint": "建议结合Part1~3学到的所有框架，写一份书面回答。"},
    {"id": "C-Q15", "part": "C", "title": "一个多智能体协作系统，效果始终没有比单Agent明显更好，你怎么判断'是设计问题'还是'这个场景本来就不需要多智能体'？",
     "chapter": "综合场景题（无标准答案）", "hint": "建议结合Part1~3学到的所有框架，写一份书面回答。"},
]

PART_NAMES = {"A": "产品向问题", "B": "技术向问题", "C": "综合场景题"}


@mcp.tool()
def list_questions(part: str = "") -> str:
    """列出题库中的题目标题。

    Args:
        part: 可选，题库分类："A"(产品向)/"B"(技术向)/"C"(综合场景)，留空返回全部15题。
    """
    part = part.strip().upper()
    items = [q for q in QUESTIONS if not part or q["part"] == part]
    if not items:
        return f"未找到分类 '{part}' 对应的题目，可选分类：A / B / C（留空=全部）。"
    lines = [f"共 {len(items)} 题："]
    for q in items:
        lines.append(f"[{q['id']}] {q['title']}")
    return "\n".join(lines)


@mcp.tool()
def get_question_detail(question_id: str) -> str:
    """查询某道题目的完整信息，包括题目、参考思路、对应课程章节。

    Args:
        question_id: 题目编号，如 "A-Q1"、"B-Q10"、"C-Q13"（大小写不敏感）。
    """
    question_id = question_id.strip().upper()
    for q in QUESTIONS:
        if q["id"] == question_id:
            return (
                f"【{q['id']}】{PART_NAMES[q['part']]}\n"
                f"题目：{q['title']}\n"
                f"对应课程章节：{q['chapter']}\n"
                f"参考思路：{q['hint']}"
            )
    return f"未找到题目编号 '{question_id}'，请先调用 list_questions 查看可用编号。"


@mcp.tool()
def get_random_question(part: str = "") -> str:
    """随机抽一道题，用于面试自测。

    Args:
        part: 可选，题库分类："A"(产品向)/"B"(技术向)/"C"(综合场景)，留空全库随机。
    """
    part = part.strip().upper()
    items = [q for q in QUESTIONS if not part or q["part"] == part]
    if not items:
        return f"未找到分类 '{part}' 对应的题目，可选分类：A / B / C（留空=全部）。"
    q = random.choice(items)
    return (
        f"【随机抽到】{q['id']} · {PART_NAMES[q['part']]}\n"
        f"题目：{q['title']}\n"
        f"（先自己想30秒思路，再调用 get_question_detail('{q['id']}') 看参考答案）"
    )


if __name__ == "__main__":
    mcp.run()  # 默认 stdio 传输，适合本地被Claude Desktop/Cursor等客户端拉起
