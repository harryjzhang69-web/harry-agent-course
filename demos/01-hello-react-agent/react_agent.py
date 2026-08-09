"""
Harry 的 Agent 实战课 · Demo 01 —— 最小 ReAct Agent
对应 docs/part1（认知基础）与即将发布的 Part 2 第05 章。

一个不依赖任何 Agent 框架、从零手写的 ReAct（Reasoning + Acting）循环实现。
目的：让你看清楚"自主规划循环"内部到底在做什么，而不是直接把这层抽象藏进框架里。

用法见同目录 README.md。
License: MIT
"""

import os
import re
import time
from datetime import datetime

from openai import OpenAI

# ------------------------------------------------------------------
# 1. 工具注册表：新增一个工具只需要写一个函数 + 在这里注册一行
# ------------------------------------------------------------------


def tool_calculator(expression: str) -> str:
    """计算一个只包含数字和+ - * / ( ) . 的算术表达式，避免使用 eval 带来的安全风险。"""
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed:
        return "错误：表达式包含不允许的字符，只能使用数字和 + - * / ( ) ."
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:  # noqa: BLE001
        return f"计算出错：{e}"


def tool_get_current_time(_: str = "") -> str:
    """返回当前系统时间。"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


TOOLS = {
    "calculator": {
        "func": tool_calculator,
        "desc": "计算一个算术表达式，输入例如 '12 * (3 + 4)'",
    },
    "get_current_time": {
        "func": tool_get_current_time,
        "desc": "获取当前系统时间，不需要输入参数，传空字符串即可",
    },
}

MAX_STEPS = 6  # 护栏：防止模型陷入死循环，对应第04章讲的"L2 自主规划循环必须配套的护栏"


# ------------------------------------------------------------------
# 2. System Prompt：用结构化约束逼模型输出可解析的格式（第03章L3 Prompt工程）
# ------------------------------------------------------------------

def build_system_prompt() -> str:
    tools_desc = "\n".join(f"- {name}: {info['desc']}" for name, info in TOOLS.items())
    return f"""你是一个通过 ReAct（Reasoning + Acting）范式解决问题的智能体。

可用工具：
{tools_desc}

严格按照以下格式输出，每次只输出到Action Input 或 Final Answer 为止，然后停止，等待 Observation：

Thought: 你的思考过程，判断当前该做什么
Action: 工具名称（必须是上面列表里的一个，一次只能选一个）
Action Input: 传给这个工具的输入

如果你已经有足够信息回答用户，直接输出：
Thought: 你的思考过程
Final Answer: 最终答案

不要自己编造 Observation，Observation 会由系统在你输出 Action Input 之后提供给你。
"""


# ------------------------------------------------------------------
# 3. 解析模型输出：从文本里抠出 Action / Action Input / Final Answer
# ------------------------------------------------------------------

def parse_action(text: str):
    final_match = re.search(r"Final Answer:\s*(.*)", text, re.DOTALL)
    if final_match:
        return "final", final_match.group(1).strip()

    action_match = re.search(r"Action:\s*(\w+)", text)
    input_match = re.search(r"Action Input:\s*(.*)", text, re.DOTALL)
    if action_match and input_match:
        action = action_match.group(1).strip()
        action_input = input_match.group(1).strip().splitlines()[0].strip()
        return action, action_input

    return None, None


# ------------------------------------------------------------------
# 4. ReAct 主循环
# ------------------------------------------------------------------

def run_react_agent(question: str, client: OpenAI, model: str, verbose: bool = True) -> str:
    messages = [
        {"role": "system", "content": build_system_prompt()},
        {"role": "user", "content": question},
    ]

    for step in range(1, MAX_STEPS + 1):
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0,
            stop=["Observation:"],  # 防止模型自己编造 Observation
        )
        content = resp.choices[0].message.content
        if verbose:
            print(f"\n----- Step {step} -----\n{content}")

        action, action_input = parse_action(content)
        messages.append({"role": "assistant", "content": content})

        if action == "final":
            return action_input

        if action not in TOOLS:
            observation = f"错误：未知工具 '{action}'，请从可用工具列表中选择。"
        else:
            observation = TOOLS[action]["func"](action_input)

        if verbose:
            print(f"Observation: {observation}")

        messages.append({"role": "user", "content": f"Observation: {observation}"})

    return "已达到最大步数限制，任务未能在规划循环内完成，请检查任务复杂度或调大 MAX_STEPS。"


# ------------------------------------------------------------------
# 5. 命令行入口
# ------------------------------------------------------------------

def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")  # 留空则默认走 OpenAI 官方地址
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        print("请先设置环境变量 OPENAI_API_KEY（可以是任意 OpenAI 协议兼容服务商的key）")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)

    print("AgentCraft · 最小 ReAct Agent Demo")
    print(f"当前模型：{model}（可用环境变量 OPENAI_MODEL 切换）")
    print("输入你的问题（输入 exit 退出）：\n")

    while True:
        question = input("> ").strip()
        if question.lower() in {"exit", "quit"}:
            break
        if not question:
            continue
        start = time.time()
        answer = run_react_agent(question, client, model)
        elapsed = time.time() - start
        print(f"\n最终答案：{answer}\n（耗时 {elapsed:.1f}s）\n")


if __name__ == "__main__":
    main()
