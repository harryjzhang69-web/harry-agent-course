"""
demos/06-multi-agent-collab/multi_agent_collab.py

最小可运行的多智能体协作Demo：调研员Agent + 审稿人Agent + 协调者
对应课程 Part5 第18章 毕业设计capstone项目 / Part1 第04章 L3多智能体协作

设计要点（呼应 Part3 第14章 安全护栏思想）：
- 协作轮数有明确上限，防止两个Agent互相"打太极"陷入死循环
- 每一轮的委派、返回都完整记录，方便审计和调试（对应"输出/行为审计"护栏）
- 最终结果无论是否通过审查，都会明确标注状态，不会静默失败
"""

import os
from dataclasses import dataclass, field
from openai import OpenAI


MAX_REVIEW_ROUNDS = 3  # 协作轮数上限，避免无限循环


@dataclass
class CollabLog:
    """完整记录每一轮协作过程，用于审计和调试"""
    entries: list = field(default_factory=list)

    def add(self, role: str, action: str, content: str):
        self.entries.append({"role": role, "action": action, "content": content})

    def print_all(self):
        for i, e in enumerate(self.entries, 1):
            print(f"\n[{i}] {e['role']} · {e['action']}")
            print("-" * 40)
            print(e["content"][:500] + ("..." if len(e["content"]) > 500 else ""))


class ResearcherAgent:
    """调研员Agent：负责收集要点、生成/修订研究简报初稿"""

    def __init__(self, client: OpenAI, model: str):
        self.client = client
        self.model = model

    def draft(self, topic: str, previous_feedback: str = "") -> str:
        if not previous_feedback:
            prompt = f"请针对主题「{topic}」，写一份300字左右的研究简报初稿，包含：核心结论、支撑理由、潜在局限。"
        else:
            prompt = (
                f"你之前针对主题「{topic}」写的简报收到了审稿意见：\n{previous_feedback}\n\n"
                "请根据这些意见修订简报，输出修订后的完整版本（不要只写修改说明，要输出完整简报）。"
            )
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "你是一个严谨的调研员，只基于合理推理和常识撰写简报，不编造具体数据来源。"},
                {"role": "user", "content": prompt},
            ],
        )
        return resp.choices[0].message.content


class ReviewerAgent:
    """审稿人Agent：负责审查简报的逻辑漏洞、遗漏和事实风险"""

    def __init__(self, client: OpenAI, model: str):
        self.client = client
        self.model = model

    def review(self, topic: str, draft: str) -> tuple[bool, str]:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": (
                    "你是一个严格的审稿人。检查简报是否有逻辑漏洞、明显遗漏、"
                    "过于绝对的断言（缺乏'潜在局限'说明）。"
                    "如果完全没问题，第一行只回复'通过'；"
                    "否则第一行回复'需修正'，接下来列出具体问题（分点，简短）。"
                )},
                {"role": "user", "content": f"研究主题：{topic}\n\n简报内容：\n{draft}"},
            ],
        )
        content = resp.choices[0].message.content
        approved = content.strip().startswith("通过")
        return approved, content


class Orchestrator:
    """协调者：负责委派任务、判断是否需要继续协作轮次、防止无限循环"""

    def __init__(self, researcher: ResearcherAgent, reviewer: ReviewerAgent, log: CollabLog):
        self.researcher = researcher
        self.reviewer = reviewer
        self.log = log

    def run(self, topic: str) -> dict:
        feedback = ""
        draft = ""

        for round_i in range(1, MAX_REVIEW_ROUNDS + 1):
            draft = self.researcher.draft(topic, feedback)
            self.log.add("调研员Agent", f"第{round_i}轮生成/修订初稿", draft)

            approved, review_content = self.reviewer.review(topic, draft)
            self.log.add("审稿人Agent", f"第{round_i}轮审查", review_content)

            if approved:
                return {"status": "approved", "rounds": round_i, "final_draft": draft}

            feedback = review_content

        # 达到最大轮数仍未通过：明确标注状态，不静默返回"看起来正常"的结果
        return {"status": "max_rounds_reached", "rounds": MAX_REVIEW_ROUNDS, "final_draft": draft, "last_feedback": feedback}


def main():
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY", "sk-demo"),
        base_url=os.environ.get("OPENAI_BASE_URL"),
    )
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    topic = os.environ.get("DEMO_TOPIC", "国产开源大模型在2026年的商业化路径")

    log = CollabLog()
    orchestrator = Orchestrator(ResearcherAgent(client, model), ReviewerAgent(client, model), log)

    result = orchestrator.run(topic)

    log.print_all()

    print("\n" + "=" * 50)
    print(f"最终状态：{result['status']}（共 {result['rounds']} 轮协作）")
    print("=" * 50)
    print(result["final_draft"])

    if result["status"] == "max_rounds_reached":
        print("\n[提醒] 达到最大协作轮数仍未通过审查，建议人工介入判断，而不是直接采信当前版本。")


if __name__ == "__main__":
    main()
