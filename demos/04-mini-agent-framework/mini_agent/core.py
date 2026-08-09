"""Harry 的 Agent 实战课 · Demo 04 —— 迷你 Agent 框架核心实现
对应 docs/part2/08-从零写一个Agent框架.md

三个核心类：
- Tool：封装一个可被模型调用的动作
- Memory：封装对话历史的存取（默认最简单的列表实现，可替换成向量检索版本）
- Agent：驱动ReAct 循环，把 Tool 和 Memory 粘合起来

License: MIT
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, Optional


@dataclass
class Tool:
    """一个可被 Agent 调用的工具。"""

    name: str
    description: str
    func: Callable[[str], str]

    def call(self, input_str: str) -> str:
        try:
            return self.func(input_str)
        except Exception as e:  # noqa: BLE001
            return f"工具执行出错: {e}"


class Memory:
    """最简单的记忆实现：一个消息列表。

    生产环境可以替换成向量检索版本（存历史消息的embedding，按语义相关性召回），
    但对外接口（add / get_context）保持不变——这是框架设计的关键：
    上层 Agent 逻辑不应该关心记忆内部具体怎么实现。
    """

    def __init__(self, max_turns: int = 20):
        self.messages: list[dict] = []
        self.max_turns = max_turns

    def add(self, role: str, content: str) -> None:
        self.messages.append({"role": role, "content": content})
        # 简单截断策略：只保留最近 max_turns 轮，避免上下文无限增长
        if len(self.messages) > self.max_turns * 2:
            self.messages = self.messages[-self.max_turns * 2:]

    def get_context(self) -> list[dict]:
        return self.messages.copy()

    def clear(self) -> None:
        self.messages = []


class Agent:
    """驱动ReAct 循环的最小 Agent 实现。"""

    def __init__(self, llm_client, model: str, system_prompt: str = "", max_steps: int = 6):
        self.llm_client = llm_client
        self.model = model
        self.system_prompt = system_prompt
        self.max_steps = max_steps
        self.tools: dict[str, Tool] = {}
        self.memory = Memory()

    def register_tool(self, tool: Tool) -> None:
        self.tools[tool.name] = tool

    def _build_system_prompt(self) -> str:
        tools_desc = "\n".join(f"- {t.name}: {t.description}" for t in self.tools.values())
        base = self.system_prompt or "你是一个通过工具解决问题的智能体。"
        return (
            f"{base}\n\n可用工具：\n{tools_desc}\n\n"
            "严格按以下格式输出，每次只输出到Action Input 或 Final Answer 为止：\n"
            "Thought: 你的思考过程\n"
            "Action: 工具名称\n"
            "Action Input: 传给工具的输入\n\n"
            "或者，如果已经有足够信息回答：\n"
            "Thought: 你的思考过程\n"
            "Final Answer: 最终答案\n"
        )

    @staticmethod
    def _parse(text: str) -> tuple[Optional[str], Optional[str]]:
        final = re.search(r"Final Answer:\s*(.*)", text, re.DOTALL)
        if final:
            return "final", final.group(1).strip()

        action = re.search(r"Action:\s*(\w+)", text)
        action_input = re.search(r"Action Input:\s*(.*)", text, re.DOTALL)
        if action and action_input:
            return action.group(1).strip(), action_input.group(1).strip().splitlines()[0]

        return None, None

    def run(self, user_input: str, verbose: bool = False) -> str:
        self.memory.add("user", user_input)
        messages = [{"role": "system", "content": self._build_system_prompt()}] + self.memory.get_context()

        for step in range(self.max_steps):
            resp = self.llm_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0,
                stop=["Observation:"],
            )
            content = resp.choices[0].message.content
            if verbose:
                print(f"\n----- Step {step + 1} -----\n{content}")

            action, action_input = self._parse(content)
            messages.append({"role": "assistant", "content": content})

            if action == "final":
                self.memory.add("assistant", action_input)
                return action_input

            tool = self.tools.get(action) if action else None
            observation = tool.call(action_input) if tool else f"错误：未知工具 '{action}'"
            if verbose:
                print(f"Observation: {observation}")

            messages.append({"role": "user", "content": f"Observation: {observation}"})

        return "已达到最大步数限制，任务未能在规划循环内完成。"
