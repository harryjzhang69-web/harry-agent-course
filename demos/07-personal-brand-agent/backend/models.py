"""
demos/07-personal-brand-agent/backend/models.py

用 Pydantic 定义整条「个人品牌定位」流水线上，每一步 Agent 的输入/输出结构。
对应课程 番外02 全栈实战文档「数据模型设计」小节。

设计原则（呼应 Part2 第05章 Prompt 设计思路）：
- 每个 Agent 的输出结构，就是喊给下一个 Agent 的"接口协议"——
  结构越明确，下一个 Agent 越不容易"理解偏"。
- 所有字段都尽量用简单类型（str / List[str] / Dict[str,str]），
  方便直接从 LLM 返回的 JSON 反序列化，减少解析出错的概率。
"""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """用户填写的原始输入表单"""

    name: str = Field(..., description="姓名或想展示的昵称")
    background: str = Field(..., description="背景经历，例如学历、过往工作、擅长领域")
    skills: List[str] = Field(default_factory=list, description="技能/标签列表")
    target_audience: str = Field(..., description="想影响/服务的目标受众")
    direction: Optional[str] = Field(None, description="期望的个人品牌方向，如“AI产品经理”“独立开发者”")
    existing_content: Optional[str] = Field(None, description="已有的内容平台/作品链接，可选")


class PositioningResult(BaseModel):
    """定位分析师 Agent 的输出"""

    one_liner: str = Field(..., description="一句话定位（15字以内，能被记住的那种）")
    differentiators: List[str] = Field(..., description="3个具体的差异化角度")
    persona_hooks: List[str] = Field(..., description="目标受众会被打动的3个具体钩子/痛点对应点")
    risk_warning: Optional[str] = Field(None, description="这个定位存在的风险提示（太泛/太窄/同质化等）")


class ContentPillar(BaseModel):
    """一个内容支柱方向"""

    name: str
    description: str
    example_topics: List[str] = Field(default_factory=list)


class CalendarItem(BaseModel):
    """内容日历里的一条选题"""

    week: str = Field(..., description="第几周，如“第1周”")
    topic: str
    channel: str = Field(..., description="建议发布渠道，如“小红书”“公众号”")


class ContentStrategyResult(BaseModel):
    """内容策略师 Agent 的输出"""

    pillars: List[ContentPillar] = Field(..., description="3~4个内容支柱")
    first_month_calendar: List[CalendarItem] = Field(..., description="首月内容日历，建议6~8条")
    channel_tactics: Dict[str, str] = Field(..., description="按渠道给出的具体打法建议")


class CopywritingResult(BaseModel):
    """文案专家 Agent 的输出"""

    bio_short: str = Field(..., description="一句话简介，适合用在个人主页/名片，30字以内")
    bio_long: str = Field(..., description="较长的个人简介，适合公众号/网站关于页面，100~180字")
    social_post_draft: str = Field(..., description="一条首发种草文案草稿（小红书/公众号风格）")
    website_hero: str = Field(..., description="个人网站首页 Hero 区域的一句话标题+一句话副标题")


class BrandReport(BaseModel):
    """最终整合报告——四个 Agent 产出的汇总，附带渲染好的 Markdown 全文"""

    profile: UserProfile
    positioning: PositioningResult
    content_strategy: ContentStrategyResult
    copywriting: CopywritingResult
    editor_summary: str = Field(..., description="整合编辑 Agent 给出的一段总览点评")
    generated_at: str
    markdown: str = Field(..., description="拼装好的完整 Markdown 报告全文，可直接导出")


class GenerateRequest(BaseModel):
    """前端提交表单时的请求体，直接复用 UserProfile"""

    profile: UserProfile


class StageUpdate(BaseModel):
    """流水线执行过程中，某一阶段完成时的进度回执（用于前端展示进度文案）"""

    stage: str
    status: str  # "running" | "done" | "error"
    message: str = ""
