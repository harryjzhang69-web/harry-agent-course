"""
Harry 的 Agent 实战课 · Demo 03 —— Reflection Agent
对应 docs/part2/05-三大经典范式手把手实现.md

核心思路：让模型在"生成者(Generator)"和"批评者(Critic)"两个角色间来回切换，
自己审查自己的输出、自己发现问题、自己修正，直到批评者认为没问题或达到最大轮数。

用法见同目录 README.md。
License: MIT
"""

import os

from openai import OpenAI

MAX_ROUNDS = 3  # 护栏：防止无限修正循环，多花Token也要有上限


def generate(task: str, feedback: str, client: OpenAI, model: str) -> str:
    if feedback:
        prompt = (
            f"任务：{task}\n\n"
            f"你上一版输出收到了以下批评意见：\n{feedback}\n\n"
            "请针对这些问题修正，重新输出一份完整结果（不要只输出修改部分，要输出完整版本）。"
        )
    else:
        prompt = task
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


def critique(task: str, draft: str, client: OpenAI, model: str) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "你是一个严格且专业的审稿人。仔细检查下面这份针对任务的输出，"
                    "找出事实错误、逻辑漏洞、遗漏的要求、格式问题。"
                    "如果确实完全没有问题，只回复'通过'两个字；"
                    "否则用列表列出具体问题，每条要清楚指出'哪里有问题、该怎么改'。"
                ),
            },
            {"role": "user", "content": f"任务：{task}\n\n输出：\n{draft}"},
        ],
        temperature=0,
    )
    return resp.choices[0].message.content


def run_reflection(task: str, client: OpenAI, model: str, max_rounds: int = MAX_ROUNDS, verbose: bool = True) -> str:
    draft = generate(task, "", client, model)
    if verbose:
        print(f"\n----- 初稿（第1版）-----\n{draft}")

    for round_i in range(1, max_rounds + 1):
        feedback = critique(task, draft, client, model)
        if verbose:
            print(f"\n-----第{round_i}轮批评意见 -----\n{feedback}")

        if feedback.strip().startswith("通过"):
            if verbose:
                print("\n批评者认为已通过，停止迭代。")
            break

        draft = generate(task, feedback, client, model)
        if verbose:
            print(f"\n----- 修正后的版本（第{round_i + 1}版）-----\n{draft}")
    else:
        if verbose:
            print(f"\n已达到最大轮数（{max_rounds}），停止迭代，输出当前最新版本。")

    return draft


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        print("请先设置环境变量 OPENAI_API_KEY")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)

    print("AgentCraft · Reflection Agent Demo")
    print(f"当前模型：{model}（最大迭代轮数：{MAX_ROUNDS}）\n")

    while True:
        task = input("> ").strip()
        if task.lower() in {"exit", "quit"}:
            break
        if not task:
            continue
        final = run_reflection(task, client, model)
        print(f"\n===== 最终结果 =====\n{final}\n")


if __name__ == "__main__":
    main()
