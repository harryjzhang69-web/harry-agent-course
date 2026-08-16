"""
demos/07-personal-brand-agent/backend/agents.py

四个专门 Agent + 一个协调者（Orchestrator），串行协作完成
「输入基本信息 -> 定位分析 -> 内容策略 -> 文案生成 -> 整合报告」的完整流水线。

设计对应课程 番外02「多智能体协作设计」小节，风格参照
Part2 第05章 ReAct 手写实现 + demos/06-multi-agent-collab 的协作模式：
- 每个 Agent 职责单一、边界清晰（呼应 Part6 第24章"场景样例+护栏前置"的任务分工思路）
- Agent 之间用结构化 JSON 传递结果，而不是把上一个 Agent 的自然语言输出直接糊给下一个
- LLM 调用统一走 OpenAI 协议兼容客户端，方便切换 DeepSeek/混元等任意服务商
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime
from typing import Callable, Optional

from openai import OpenAI

from models import (
    BrandReport,
    ContentStrategyResult,
    CopywritingResult,
    PositioningResult,
    UserProfile,
)

ProgressCallback = Optional[Callable[[str, str, str], None]]
# 回调签名：(stage: str, status: "running"|"done"|"error", message: str) -> None


def _parse_json_response(raw: str) -> dict:
    """
    从 LLM 返回文本里抠出 JSON。
    LLM 经常会把 JSON 包在 ```json ... ``` 代码块里，或者前后夹带解释性文字，
    这里做一次稳健的清洗（呼应课程记忆里"Dify LLM 输出要去掉 markdown 代码块"的踩坑经验）。
    """
    text = raw.strip()
    # 去掉 ```json ... ``` 或 ``` ... ``` 代码块包裹
    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    # 兜底：只截取第一个 { 到最后一个 } 之间的内容
    if not text.startswith("{"):
        brace_start = text.find("{")
        brace_end = text.rfind("}")
        if brace_start >= 0 and brace_end > brace_start:
            text = text[brace_start : brace_end + 1]
    return json.loads(text)


class LLMClient:
    """统一封装 OpenAI 协议兼容的调用，四个 Agent 共用一个实例。"""

    def __init__(self, api_key: str, base_url: Optional[str], model: str):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    def chat_json(self, system_prompt: str, user_prompt: str, temperature: float = 0.4) -> dict:
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = resp.choices[0].message.content
        return _parse_json_response(content)

    def chat_text(self, system_prompt: str, user_prompt: str, temperature: float = 0.5) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return resp.choices[0].message.content.strip()


class PositioningAnalystAgent:
    """① 定位分析师：找出用户和"泛泛而谈"之间的差异化"""

    SYSTEM_PROMPT = """你是一名资深的个人品牌定位顾问，擅长从一个人的背景经历里，\
找出能被目标受众记住的差异化定位，而不是写成一份泛泛而谈的自我介绍。

你的输出必须严格是一个 JSON 对象，不要输出任何多余的解释文字，格式如下：
{
  "one_liner": "一句话定位，15字以内，要具体、能被记住，不要空话（如“助力成长”这种词禁止出现）",
  "differentiators": ["差异化角度1", "差异化角度2", "差异化角度3"],
  "persona_hooks": ["目标受众痛点钩子1", "痛点钩子2", "痛点钩子3"],
  "risk_warning": "这个定位如果有风险（定位太泛/太窄/和同类账号同质化），在这里指出来；如果没有明显风险，填 null"
}

要求：
- differentiators 必须结合用户具体的背景和技能来写，不能是通用的空话
- persona_hooks 要站在目标受众的角度，写"他们具体会因为什么而关注你"
- 如果背景信息本身比较普通、缺乏差异化，要在 risk_warning 里如实指出，而不是硬编一个假的差异化角度
"""

    def __init__(self, llm: LLMClient):
        self.llm = llm

    def run(self, profile: UserProfile) -> PositioningResult:
        user_prompt = (
            f"姓名：{profile.name}\n"
            f"背景经历：{profile.background}\n"
            f"技能标签：{', '.join(profile.skills) if profile.skills else '（未填写）'}\n"
            f"目标受众：{profile.target_audience}\n"
            f"期望方向：{profile.direction or '（未指定，请根据背景合理推断）'}\n"
            f"已有内容平台：{profile.existing_content or '（暂无）'}"
        )
        data = self.llm.chat_json(self.SYSTEM_PROMPT, user_prompt)
        return PositioningResult(**data)


class ContentStrategyAgent:
    """② 内容策略师：把定位翻译成"具体要发什么"的可执行计划"""

    SYSTEM_PROMPT = """你是一名内容策略专家，负责把一份"个人品牌定位"翻译成具体可执行的内容规划。

你的输出必须严格是一个 JSON 对象，不要输出任何多余的解释文字，格式如下：
{
  "pillars": [
    {"name": "内容支柱名称", "description": "这个支柱解决什么问题/传达什么价值", "example_topics": ["示例选题1", "示例选题2"]}
  ],
  "first_month_calendar": [
    {"week": "第1周", "topic": "具体选题标题", "channel": "建议发布渠道"}
  ],
  "channel_tactics": {"渠道名": "这个渠道具体应该怎么打法（风格/频率/互动方式）"}
}

要求：
- pillars 给3~4个内容支柱，每个都要能对应到用户的定位和差异化角度
- first_month_calendar 给6~8条具体选题（不要写成"分享一些心得"这种空话标题，要具体到能直接拿去写）
- channel_tactics 至少覆盖2个渠道，每条建议要具体（不要说"多互动"这种空话）
"""

    def __init__(self, llm: LLMClient):
        self.llm = llm

    def run(self, profile: UserProfile, positioning: PositioningResult) -> ContentStrategyResult:
        user_prompt = (
            f"用户背景：{profile.background}\n"
            f"目标受众：{profile.target_audience}\n"
            f"一句话定位：{positioning.one_liner}\n"
            f"差异化角度：{'; '.join(positioning.differentiators)}\n"
            f"目标受众钩子：{'; '.join(positioning.persona_hooks)}\n"
            f"已有内容平台：{profile.existing_content or '（暂无，视为新号起步）'}"
        )
        data = self.llm.chat_json(self.SYSTEM_PROMPT, user_prompt)
        return ContentStrategyResult(**data)


class CopywritingAgent:
    """③ 文案专家：把定位+策略落成具体能直接用的文字"""

    SYSTEM_PROMPT = """你是一名擅长个人品牌文案的写手，语言要真实、有手艺感，\
不要写成培训机构式的营销口吻，不要堆砌"赋能""链接""闭环"这类空话。

你的输出必须严格是一个 JSON 对象，不要输出任何多余的解释文字，格式如下：
{
  "bio_short": "一句话简介，30字以内，适合放在个人主页/名片",
  "bio_long": "较长的个人简介，100~180字，适合公众号/网站关于页面",
  "social_post_draft": "一条首发种草文案草稿，风格自然、有具体细节，不要写成广告腔",
  "website_hero": "个人网站首页Hero区域文案，格式为“一句话标题 + 一句话副标题”，用换行分隔"
}
"""

    def __init__(self, llm: LLMClient):
        self.llm = llm

    def run(
        self,
        profile: UserProfile,
        positioning: PositioningResult,
        strategy: ContentStrategyResult,
    ) -> CopywritingResult:
        pillars_desc = "; ".join(f"{p.name}：{p.description}" for p in strategy.pillars)
        user_prompt = (
            f"姓名：{profile.name}\n"
            f"背景：{profile.background}\n"
            f"一句话定位：{positioning.one_liner}\n"
            f"差异化角度：{'; '.join(positioning.differentiators)}\n"
            f"内容支柱：{pillars_desc}\n"
            f"目标受众：{profile.target_audience}"
        )
        data = self.llm.chat_json(self.SYSTEM_PROMPT, user_prompt)
        return CopywritingResult(**data)


class ReportEditorAgent:
    """④ 整合编辑：给出一段总览点评，并把前三个 Agent 的结构化结果拼装成完整报告"""

    SYSTEM_PROMPT = """你是一名经验丰富的个人品牌顾问总编辑，现在需要给一份刚生成的\
「个人品牌定位报告」写一段简短的总览点评（不超过120字），语言要真诚、具体，\
指出这份定位方案最值得关注的1个亮点和1个需要在实践中验证的地方。
只输出这段点评文字本身，不要输出JSON、不要输出标题、不要加多余的前后缀。"""

    def __init__(self, llm: LLMClient):
        self.llm = llm

    def run(
        self,
        profile: UserProfile,
        positioning: PositioningResult,
        strategy: ContentStrategyResult,
        copywriting: CopywritingResult,
    ) -> BrandReport:
        user_prompt = (
            f"用户：{profile.name}\n"
            f"一句话定位：{positioning.one_liner}\n"
            f"差异化角度：{'; '.join(positioning.differentiators)}\n"
            f"风险提示：{positioning.risk_warning or '无'}\n"
            f"内容支柱数：{len(strategy.pillars)}个\n"
        )
        editor_summary = self.llm.chat_text(self.SYSTEM_PROMPT, user_prompt, temperature=0.6)

        markdown = self._render_markdown(profile, positioning, strategy, copywriting, editor_summary)

        return BrandReport(
            profile=profile,
            positioning=positioning,
            content_strategy=strategy,
            copywriting=copywriting,
            editor_summary=editor_summary,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
            markdown=markdown,
        )

    @staticmethod
    def _render_markdown(
        profile: UserProfile,
        positioning: PositioningResult,
        strategy: ContentStrategyResult,
        copywriting: CopywritingResult,
        editor_summary: str,
    ) -> str:
        """
        这一步故意不再调用 LLM，而是用 Python 模板直接拼装——
        因为报告的"结构"是确定的，没必要为了排版再花一次 LLM 调用的钱和时间，
        这也是"哪些环节该用LLM、哪些环节该用确定性代码"的一个具体示范。
        """
        lines: list[str] = []
        lines.append(f"# {profile.name} 的个人品牌定位报告")
        lines.append("")
        lines.append(f"> {editor_summary}")
        lines.append("")
        lines.append("## 一、定位")
        lines.append(f"**一句话定位**：{positioning.one_liner}")
        lines.append("")
        lines.append("**差异化角度**：")
        for d in positioning.differentiators:
            lines.append(f"- {d}")
        lines.append("")
        lines.append("**目标受众钩子**：")
        for h in positioning.persona_hooks:
            lines.append(f"- {h}")
        if positioning.risk_warning:
            lines.append("")
            lines.append(f"> ⚠️ 风险提示：{positioning.risk_warning}")
        lines.append("")
        lines.append("## 二、内容策略")
        for pillar in strategy.pillars:
            lines.append(f"### {pillar.name}")
            lines.append(pillar.description)
            if pillar.example_topics:
                lines.append("示例选题：" + "、".join(pillar.example_topics))
            lines.append("")
        lines.append("**首月内容日历**：")
        lines.append("")
        lines.append("| 周次 | 选题 | 渠道 |")
        lines.append("|---|---|---|")
        for item in strategy.first_month_calendar:
            lines.append(f"| {item.week} | {item.topic} | {item.channel} |")
        lines.append("")
        lines.append("**渠道打法**：")
        for channel, tactic in strategy.channel_tactics.items():
            lines.append(f"- **{channel}**：{tactic}")
        lines.append("")
        lines.append("## 三、可直接使用的文案")
        lines.append(f"**一句话简介**：{copywriting.bio_short}")
        lines.append("")
        lines.append(f"**长简介**：{copywriting.bio_long}")
        lines.append("")
        lines.append("**首发种草文案草稿**：")
        lines.append("")
        lines.append(copywriting.social_post_draft)
        lines.append("")
        lines.append("**个人网站 Hero 文案**：")
        lines.append("")
        lines.append(copywriting.website_hero)
        lines.append("")
        return "\n".join(lines)


class BrandPositioningOrchestrator:
    """协调者：串行调度四个 Agent，任何一步失败都明确报错而不是静默吞掉"""

    def __init__(self, llm: LLMClient):
        self.positioning_agent = PositioningAnalystAgent(llm)
        self.content_agent = ContentStrategyAgent(llm)
        self.copywriting_agent = CopywritingAgent(llm)
        self.editor_agent = ReportEditorAgent(llm)

    def run(self, profile: UserProfile, on_progress: ProgressCallback = None) -> BrandReport:
        def notify(stage: str, status: str, message: str = ""):
            if on_progress:
                on_progress(stage, status, message)

        notify("positioning", "running", "定位分析师正在分析你的差异化角度...")
        positioning = self.positioning_agent.run(profile)
        notify("positioning", "done", positioning.one_liner)

        notify("content_strategy", "running", "内容策略师正在规划内容支柱和首月日历...")
        strategy = self.content_agent.run(profile, positioning)
        notify("content_strategy", "done", f"生成了 {len(strategy.pillars)} 个内容支柱")

        notify("copywriting", "running", "文案专家正在生成简介与首发文案...")
        copywriting = self.copywriting_agent.run(profile, positioning, strategy)
        notify("copywriting", "done", "文案生成完成")

        notify("report", "running", "整合编辑正在生成最终报告...")
        report = self.editor_agent.run(profile, positioning, strategy, copywriting)
        notify("report", "done", "报告生成完成")

        return report


def build_default_llm_client() -> LLMClient:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "请先设置环境变量 OPENAI_API_KEY（可以是任意 OpenAI 协议兼容服务商的 key，"
            "如 DeepSeek / 混元 / OpenAI 官方）"
        )
    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    return LLMClient(api_key=api_key, base_url=base_url, model=model)
