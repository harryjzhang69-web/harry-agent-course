"""
Harry 的 Agent 实战课 · Demo 02 —— Plan-and-Solve Agent
对应 docs/part2/05-三大经典范式手把手实现.md

核心思路：先让模型一次性生成完整的步骤清单（Plan），再按计划逐条执行（Solve）。
和 01 号 Demo（ReAct）的区别：不是"走一步看一步"，而是"先想清楚全局路径"。

用法见同目录 README.md。
License: MIT
"""

import os

from openai import OpenAI


def make_plan(question: str, client: OpenAI, model: str) -> list[str]:
    """Plan 阶段：把任务拆解成有序的步骤清单。"""
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "你是任务规划专家。把用户问题拆解成一个有序的步骤清单，"
                    "每一步应该是一个明确的、可独立执行的子任务。"
                    "只输出步骤清单，每行一个步骤，格式为'1. xxx'，不要输出多余内容。"
                ),
            },
            {"role": "user", "content": question},
        ],
        temperature=0,
    )
    lines = resp.choices[0].message.content.splitlines()
    steps = [line.strip() for line in lines if line.strip()]
    return steps


def solve_steps(question: str, steps: list[str], client: OpenAI, model: str) -> list[str]:
    """Solve 阶段：按计划逐条执行，每一步都能看到之前步骤的结果。"""
    results: list[str] = []
    for i, step in enumerate(steps, 1):
        history = "\n".join(f"- {s}" for s in results) if results else "（无）"
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "你在执行一个多步任务计划中的其中一步，请直接给出这一步的具体结果，不要重复前面步骤的内容。",
                },
                {
                    "role": "user",
                    "content": (
                        f"总任务：{question}\n\n"
                        f"完整计划：\n" + "\n".join(steps) + "\n\n"
                        f"之前步骤的结果：\n{history}\n\n"
                        f"现在执行第{i}步：{step}"
                    ),
                },
            ],
        )
        results.append(resp.choices[0].message.content)
    return results


def aggregate(question: str, steps: list[str], results: list[str], client: OpenAI, model: str) -> str:
    """汇总阶段：把所有步骤的结果整合成最终答案。"""
    detail = "\n\n".join(f"步骤{i+1}：{s}\n结果：{r}" for i, (s, r) in enumerate(zip(steps, results)))
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "请把以下多步执行结果整合成一份完整、连贯的最终答案。"},
            {"role": "user", "content": f"原始任务：{question}\n\n{detail}"},
        ],
    )
    return resp.choices[0].message.content


def run_plan_and_solve(question: str, client: OpenAI, model: str, verbose: bool = True) -> str:
    steps = make_plan(question, client, model)
    if verbose:
        print("\n----- Plan 阶段：生成的步骤清单 -----")
        for s in steps:
            print(s)

    results = solve_steps(question, steps, client, model)
    if verbose:
        print("\n----- Solve 阶段：逐条执行结果 -----")
        for s, r in zip(steps, results):
            print(f"\n[{s}]\n{r}")

    final = aggregate(question, steps, results, client, model)
    return final


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        print("请先设置环境变量 OPENAI_API_KEY")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)

    print("AgentCraft · Plan-and-Solve Agent Demo")
    print(f"当前模型：{model}\n")

    while True:
        question = input("> ").strip()
        if question.lower() in {"exit", "quit"}:
            break
        if not question:
            continue
        answer = run_plan_and_solve(question, client, model)
        print(f"\n===== 最终答案 =====\n{answer}\n")


if __name__ == "__main__":
    main()
