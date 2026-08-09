"""Harry 的 Agent 实战课 · Demo 04 —— 用迷你框架重新实现第01号Demo的能力。

对比 demos/01-hello-react-agent/react_agent.py：
业务代码从"自己写完整的Prompt拼接+解析+循环"，缩短到"注册工具+调用 run"。
"""

import os
from datetime import datetime

from openai import OpenAI

from mini_agent import Agent, Tool


def calculator(expression: str) -> str:
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed:
        return "错误：表达式包含不允许的字符"
    return str(eval(expression, {"__builtins__": {}}, {}))


def get_current_time(_: str = "") -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        print("请先设置环境变量 OPENAI_API_KEY")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)
    agent = Agent(client, model=model, system_prompt="你是一个通过工具解决问题的智能体。")

    # 注册工具：只需要这两行,不需要再手写Prompt拼接/解析/循环逻辑
    agent.register_tool(Tool("calculator", "计算算术表达式，输入例如 '12 * (3 + 4)'", calculator))
    agent.register_tool(Tool("get_current_time", "获取当前系统时间，传空字符串即可", get_current_time))

    print("Harry的Agent实战课 · 迷你框架 Demo")
    print(f"当前模型：{model}\n")

    while True:
        question = input("> ").strip()
        if question.lower() in {"exit", "quit"}:
            break
        if not question:
            continue
        answer = agent.run(question, verbose=True)
        print(f"\n最终答案：{answer}\n")


if __name__ == "__main__":
    main()
