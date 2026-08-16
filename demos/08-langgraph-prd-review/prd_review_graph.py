"""
demos/08-langgraph-prd-review/prd_review_graph.py

用 LangGraph（真实框架，不是手写模拟）实现的"PRD 自动生成与多角色评审"流水线。
对应课程 Part2 第07章《主流框架产品化评测》—— 07章只做了纯文字对比，这个 demo 补上真实可跑的框架代码。

业务场景：
  产品经理Agent 写 PRD 初稿 → 评审官Agent 三选一判决：
    ① 通过 → 结束
    ② 小修 → 打回产品经理Agent 修订（循环，有轮数上限护栏）
    ③ 需架构评估 → 转架构师Agent 判断技术可行性 → 反馈给产品经理Agent 修订 → 再送评审

为什么专门挑这个场景做 LangGraph demo（而不是接着demo06的调研员+审稿人两角色循环）：
  demo06 用纯 OpenAI SDK + for 循环就完整实现了"两角色打回循环"，根本不需要引入框架。
  但这里评审官有"三选一"的分支判决（通过/小修/转架构评估），且转架构评估后还要绕回产品经理Agent
  再走一次评审——这种"多分支路由 + 分支汇合"的控制流，手写代码会写出一堆嵌套if/循环标记位，
  容易出错也难维护；LangGraph 的 StateGraph（节点+条件边）恰好是为这种控制流设计的，
  这才是"什么时候真的该用框架"的真实判断依据（对应07章"框架解决的是真实存在的复杂度"这条原则）。

LangGraph 特有的三个价值点，这个 demo 都实际用上了（不是空谈）：
  1. 条件边 add_conditional_edges：一个节点跑完后，根据状态判断走哪条分支，比手写if链更清晰。
  2. 状态持久化 checkpointer：给每次运行一个 thread_id，中途状态自动保存，可以事后用
     get_state_history() 回放"这次PRD评审具体经过了哪几轮、每轮状态是什么"，不用自己维护日志列表。
  3. 自动生成流程图 get_graph().draw_mermaid()：图和代码永远同步，不会像手画的mermaid图那样
     "文档里的图和代码逻辑早就不对应了"。

运行方式见同目录 README.md。
"""

import os
from typing import TypedDict, List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver


MAX_ROUNDS = 3  # 修订轮数上限护栏，避免PM Agent和评审官Agent无限"打太极"


# ---------- 1. 状态定义（LangGraph 的核心：所有节点共享、按需更新同一份State） ----------

class PRDState(TypedDict):
    topic: str                # PRD 要解决的产品需求主题
    draft: str                 # 当前最新的PRD草稿
    verdict: str                # 评审官最新判决："approved" / "minor_revise" / "escalate"
    feedback: str               # 评审官或架构师给出的具体反馈意见
    round: int                   # 当前修订轮数
    architect_checked: bool      # 是否已经过架构师评估（只允许升级评估一次，避免反复转发死循环）
    history: List[Dict[str, Any]]  # 完整过程记录，用于最后打印审计日志


# ---------- 2. 三个Agent节点 ----------

def build_graph(llm: ChatOpenAI, selftest: bool = False):
    """
    构建LangGraph状态图。selftest=True 时不真实调用大模型，
    用固定脚本模拟三轮判决（通过/小修/升级架构评估各触发一次），
    方便没有API Key时也能验证整个图的路由逻辑是否正确。
    """

    def _call_llm(system: str, user: str) -> str:
        if selftest:
            raise RuntimeError("selftest 模式下不应该真实调用LLM，请检查节点逻辑")
        resp = llm.invoke([SystemMessage(content=system), HumanMessage(content=user)])
        return resp.content

    # --- 节点1：产品经理Agent，负责写/改PRD初稿 ---
    def pm_drafter_node(state: PRDState) -> dict:
        round_num = state["round"] + 1
        if selftest:
            # 用轮数模拟不同阶段的草稿内容，不真实调用LLM
            draft = f"[selftest草稿·第{round_num}轮] 关于「{state['topic']}」的PRD初稿（已根据反馈：{state.get('feedback','无')}）"
        else:
            if not state.get("feedback"):
                prompt = f"请针对产品需求「{state['topic']}」，写一份300字左右的PRD初稿，包含：问题背景、核心方案、验收标准。"
            else:
                prompt = (
                    f"你之前针对「{state['topic']}」写的PRD收到了以下反馈：\n{state['feedback']}\n\n"
                    "请输出修订后的完整PRD（不要只写修改说明，要输出完整版本）。"
                )
            draft = _call_llm(
                "你是一名严谨的产品经理，只基于合理推理撰写PRD，不编造不存在的数据指标。",
                prompt,
            )

        history = state["history"] + [{"node": "产品经理Agent", "round": round_num, "action": "撰写/修订PRD", "content": draft}]
        return {"draft": draft, "round": round_num, "history": history}

    # --- 节点2：评审官Agent，三选一判决 ---
    def reviewer_node(state: PRDState) -> dict:
        if selftest:
            # 固定剧本：第1轮升级架构评估，第2轮小修，第3轮通过——刚好覆盖三条分支
            script = {1: "escalate", 2: "minor_revise", 3: "approved"}
            verdict = script.get(state["round"], "approved")
            feedback = {
                "escalate": "这个方案涉及跨系统数据同步，需要架构师评估技术可行性。",
                "minor_revise": "验收标准写得太模糊，请补充具体的量化指标。",
                "approved": "",
            }[verdict]
            content = f"[selftest判决] {verdict} | {feedback}"
        else:
            resp = _call_llm(
                (
                    "你是一名严格的产品评审官。基于PRD内容判断，第一行只能是以下三种之一（不要有多余字符）：\n"
                    "approved（方案清晰、验收标准可量化，可以直接推进）\n"
                    "minor_revise（有明显但不涉及技术可行性的问题，比如验收标准模糊、遗漏边界情况）\n"
                    "escalate（涉及你判断不了的技术可行性风险，需要架构师介入评估）\n"
                    "第二行开始写具体理由（approved时可留空）。"
                ),
                f"产品需求：{state['topic']}\n\nPRD内容：\n{state['draft']}",
            )
            lines = resp.strip().split("\n", 1)
            verdict_raw = lines[0].strip().lower()
            feedback = lines[1].strip() if len(lines) > 1 else ""
            if "approved" in verdict_raw:
                verdict = "approved"
            elif "escalate" in verdict_raw:
                verdict = "escalate"
            else:
                verdict = "minor_revise"
            content = resp

        history = state["history"] + [{"node": "评审官Agent", "round": state["round"], "action": f"判决：{verdict}", "content": content}]
        return {"verdict": verdict, "feedback": feedback, "history": history}

    # --- 节点3：架构师Agent，只在被升级评估时介入 ---
    def architect_node(state: PRDState) -> dict:
        if selftest:
            feedback = "[selftest架构反馈] 跨系统同步建议用消息队列异步处理，避免强一致性依赖导致的性能问题。"
            content = feedback
        else:
            content = _call_llm(
                "你是一名资深架构师，只评估技术可行性和风险，给出具体的技术建议，不评价产品逻辑本身。",
                f"产品需求：{state['topic']}\n\n当前PRD：\n{state['draft']}\n\n评审官认为需要评估的技术可行性问题：{state['feedback']}",
            )
            feedback = content

        history = state["history"] + [{"node": "架构师Agent", "round": state["round"], "action": "技术可行性评估", "content": content}]
        return {"feedback": feedback, "architect_checked": True, "history": history}

    # --- 条件路由：评审官判决之后，走哪条分支 ---
    def route_after_review(state: PRDState) -> str:
        if state["verdict"] == "approved":
            return "end"
        if state["verdict"] == "escalate" and not state["architect_checked"]:
            return "architect"
        if state["round"] >= MAX_ROUNDS:
            return "end"  # 达到轮数上限，强制结束（安全护栏，避免死循环）
        return "drafter"

    # ---------- 3. 组装状态图 ----------
    graph = StateGraph(PRDState)
    graph.add_node("drafter", pm_drafter_node)
    graph.add_node("reviewer", reviewer_node)
    graph.add_node("architect", architect_node)

    graph.set_entry_point("drafter")
    graph.add_edge("drafter", "reviewer")
    graph.add_conditional_edges(
        "reviewer",
        route_after_review,
        {"end": END, "architect": "architect", "drafter": "drafter"},
    )
    graph.add_edge("architect", "drafter")  # 架构师评估完，回到产品经理Agent修订

    return graph


def run(topic: str, selftest: bool = False) -> dict:
    if selftest:
        llm = None
    else:
        llm = ChatOpenAI(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=os.environ.get("OPENAI_API_KEY", "sk-demo"),
            base_url=os.environ.get("OPENAI_BASE_URL") or None,
        )

    graph = build_graph(llm, selftest=selftest)
    checkpointer = MemorySaver()
    app = graph.compile(checkpointer=checkpointer)

    # 打印自动生成的流程图（LangGraph价值点③：图和代码100%对应，不用自己手画）
    print("=" * 60)
    print("LangGraph 自动生成的流程图（Mermaid语法，可直接贴进文档渲染）：")
    print("=" * 60)
    try:
        print(app.get_graph().draw_mermaid())
    except Exception as e:  # noqa: BLE001
        print(f"[跳过] 绘图依赖未安装，不影响核心逻辑运行：{e}")

    initial_state: PRDState = {
        "topic": topic,
        "draft": "",
        "verdict": "",
        "feedback": "",
        "round": 0,
        "architect_checked": False,
        "history": [],
    }

    thread_id = "prd-review-demo-001"
    config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 20}
    final_state = app.invoke(initial_state, config=config)

    # LangGraph价值点②：状态持久化——不用自己维护日志变量，事后用get_state_history回放全过程
    print("\n" + "=" * 60)
    print(f"状态持久化回放（thread_id={thread_id}，共 {len(list(app.get_state_history(config)))} 个历史checkpoint）")
    print("=" * 60)

    print("\n" + "=" * 60)
    print("完整协作过程（history字段）：")
    print("=" * 60)
    for i, entry in enumerate(final_state["history"], 1):
        print(f"\n[{i}] {entry['node']} · 第{entry['round']}轮 · {entry['action']}")
        print("-" * 40)
        content = entry["content"]
        print(content[:400] + ("..." if len(content) > 400 else ""))

    status = "approved" if final_state["verdict"] == "approved" else "max_rounds_reached"
    print("\n" + "=" * 60)
    print(f"最终状态：{status}（共 {final_state['round']} 轮，架构师是否介入：{final_state['architect_checked']}）")
    print("=" * 60)
    print(final_state["draft"])

    if status == "max_rounds_reached":
        print("\n[提醒] 达到最大修订轮数仍未通过评审，建议人工介入判断，而不是直接采信当前版本。")

    return final_state


def main():
    selftest = os.environ.get("DEMO_SELFTEST") == "1"
    topic = os.environ.get("DEMO_TOPIC", "在举报处理流程中新增「AI辅助初判」环节")
    run(topic, selftest=selftest)


if __name__ == "__main__":
    main()
