#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch_papers.py
每日自动拉取 arXiv 最新 AI 前沿论文，用 LLM（DeepSeek，OpenAI 兼容接口）生成中文深度解读，
生成当天的论文日报 md，追加到 papers/archive/，并更新侧边栏与首页统计。
设计为在 GitHub Actions 里跑（也可本地跑做测试）：全部用标准库实现，不依赖任何第三方包，
避免 CI 因为装包失败而挂掉。

用法：
  python fetch_papers.py                # 正常运行（读 DEEPSEEK_API_KEY 环境变量）
  DEEP_LIMIT=3 python fetch_papers.py    # 本地小规模测试，只深度总结3篇
"""
import os
import re
import json
import time
import random
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # papers/
ARCHIVE_DIR = os.path.join(ROOT, 'archive')
STATE_FILE = os.path.join(ROOT, 'scripts', 'state.json')
SIDEBAR_FILE = os.path.join(ROOT, '_sidebar.md')
README_FILE = os.path.join(ROOT, 'README.md')

# ---------------- 配置 ----------------
CATEGORIES = ['cs.AI', 'cs.CL', 'cs.LG', 'cs.CV', 'cs.MA', 'cs.RO', 'cs.NE', 'stat.ML']
DEEP_LIMIT = int(os.environ.get('DEEP_LIMIT', '12'))       # 深度AI解读篇数上限
LIGHT_LIMIT = int(os.environ.get('LIGHT_LIMIT', '40'))      # 轻量列出篇数上限
MAX_PAGES = 3                                               # arXiv 分页安全上限（每页200条）
PAGE_SIZE = 200
DEFAULT_LOOKBACK_HOURS = int(os.environ.get('LOOKBACK_HOURS', '26'))  # 首次运行/手动补种时的回溯窗口

DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '').strip()
DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
DEEPSEEK_MODEL = os.environ.get('DEEPSEEK_MODEL', 'deepseek-chat')

FRONTIER_KEYWORDS = [
    'agent', 'multi-agent', 'reasoning', 'chain-of-thought', 'rlhf', 'dpo', 'grpo',
    'alignment', 'safety', 'multimodal', 'vision-language', 'diffusion', 'world model',
    'scaling law', 'mixture-of-experts', 'moe', 'retrieval-augmented', 'rag', 'benchmark',
    'foundation model', 'large language model', 'llm', 'in-context learning', 'tool use',
    'tool-use', 'planning', 'long-context', 'hallucination', 'evaluation',
    'instruction tuning', 'fine-tuning', 'pretraining', 'emergent', 'interpretability',
    'reward model', 'test-time', 'inference scaling', 'sparse', 'vision transformer',
    'video generation', 'text-to-image', 'robotics', 'embodied', 'code generation',
    'autonomous', 'self-improve', 'memory',
]

ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}


# ---------------- 工具函数 ----------------
def log(msg):
    print(f'[fetch_papers] {msg}', flush=True)


def http_get(url, retries=3, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': 'harry-agent-course-paper-bot/1.0 (mailto:2385069706@qq.com)'})
    for i in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as e:
            log(f'  GET失败(第{i+1}次): {e}')
            time.sleep(3 + i * 3)
    return None


def http_post_json(url, payload, headers, retries=3, timeout=60):
    data = json.dumps(payload).encode('utf-8')
    for i in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8', 'ignore')
            log(f'  POST HTTP错误(第{i+1}次): {e.code} {body[:200]}')
        except Exception as e:
            log(f'  POST失败(第{i+1}次): {e}')
        time.sleep(3 + i * 3)
    return None


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {'last_max_published': None, 'total_papers': 0, 'total_days': 0}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def parse_dt(s):
    return datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)


# ---------------- arXiv 拉取 ----------------
def fetch_arxiv_entries(cutoff_dt):
    """从 arXiv API 拉取所有 published > cutoff_dt 的论文，跨多个分类去重。"""
    cat_query = '+OR+'.join(f'cat:{c}' for c in CATEGORIES)
    seen_ids = set()
    entries = []
    for page in range(MAX_PAGES):
        start = page * PAGE_SIZE
        params = {
            'search_query': f'({cat_query})',
            'sortBy': 'submittedDate',
            'sortOrder': 'descending',
            'start': str(start),
            'max_results': str(PAGE_SIZE),
        }
        url = 'http://export.arxiv.org/api/query?' + urllib.parse.urlencode(params, safe='()+:')
        # urlencode 会把 () 和 : 转义，手动还原 search_query 里的特殊字符
        url = url.replace('%28', '(').replace('%29', ')').replace('%3A', ':').replace('%2B', '+')
        log(f'拉取 arXiv 第 {page+1} 页 (start={start}) ...')
        raw = http_get(url)
        if not raw:
            log('  该页拉取失败，跳过后续分页')
            break
        try:
            root = ET.fromstring(raw)
        except Exception as e:
            log(f'  XML解析失败: {e}')
            break
        page_entries = root.findall('atom:entry', ATOM_NS)
        if not page_entries:
            break
        hit_old = False
        for e in page_entries:
            arxiv_id = e.find('atom:id', ATOM_NS).text.strip().split('/abs/')[-1]
            if arxiv_id in seen_ids:
                continue
            seen_ids.add(arxiv_id)
            published_s = e.find('atom:published', ATOM_NS).text.strip()
            published = parse_dt(published_s)
            if published <= cutoff_dt:
                hit_old = True
                continue
            title = ' '.join(e.find('atom:title', ATOM_NS).text.split())
            summary = ' '.join(e.find('atom:summary', ATOM_NS).text.split())
            authors = [a.find('atom:name', ATOM_NS).text for a in e.findall('atom:author', ATOM_NS)]
            cats = [c.get('term') for c in e.findall('atom:category', ATOM_NS)]
            link = f'https://arxiv.org/abs/{arxiv_id}'
            entries.append({
                'id': arxiv_id, 'title': title, 'summary': summary,
                'authors': authors, 'categories': cats, 'link': link,
                'published': published_s,
            })
        log(f'  本页新增 {len(page_entries)} 条，累计候选 {len(entries)} 条')
        if hit_old:
            break  # 已经翻到 cutoff 之前，无需再翻页
        time.sleep(3)  # arXiv API 礼仪：请求间隔 >=3s
    return entries


# ---------------- 打分排序 ----------------
def score_entry(e):
    title_l = e['title'].lower()
    abs_l = e['summary'].lower()
    score = 0
    for kw in FRONTIER_KEYWORDS:
        if kw in title_l:
            score += 3
        if kw in abs_l:
            score += 1
    return score


# ---------------- LLM 深度总结 ----------------
def summarize_with_llm(entry):
    if not DEEPSEEK_API_KEY:
        return None
    prompt = (
        f"标题: {entry['title']}\n"
        f"作者: {', '.join(entry['authors'][:6])}\n"
        f"分类: {', '.join(entry['categories'][:4])}\n"
        f"摘要: {entry['summary']}\n\n"
        "请你作为一名资深AI科研编辑，用中文帮我提炼这篇论文的速读卡片，只输出一个JSON对象，"
        "不要有任何多余文字或markdown代码块标记，字段如下：\n"
        '{"one_liner": "一句话说清楚这篇论文做了什么，不超过40字", '
        '"why_matters": "为什么重要/解决了什么痛点，2-3句话", '
        '"novelty": "相比已有方法的核心创新点，1-2句话", '
        '"tags": ["标签1", "标签2", "标签3"]}'
    )
    payload = {
        'model': DEEPSEEK_MODEL,
        'messages': [
            {'role': 'system', 'content': '你是一个严谨的AI科研编辑，只输出要求的JSON，不输出任何解释性文字。'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.3,
        'max_tokens': 500,
    }
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
    }
    resp = http_post_json(DEEPSEEK_URL, payload, headers)
    if not resp:
        return None
    try:
        content = resp['choices'][0]['message']['content'].strip()
        content = re.sub(r'^```(json)?|```$', '', content, flags=re.MULTILINE).strip()
        data = json.loads(content)
        return data
    except Exception as e:
        log(f'  LLM返回解析失败: {e} | raw={str(resp)[:200]}')
        return None


# ---------------- Markdown 生成 ----------------
def fmt_authors(authors):
    if len(authors) <= 3:
        return ', '.join(authors)
    return ', '.join(authors[:3]) + f' 等{len(authors)}人'


def render_deep_card(entry, ai):
    tags = '、'.join(ai.get('tags', [])[:5]) if ai else ''
    cats = ' '.join(f'`{c}`' for c in entry['categories'][:3])
    date_s = entry['published'][:10]
    lines = [
        f"### [{entry['title']}]({entry['link']}) {cats}",
        '',
        f"**一句话**：{ai.get('one_liner', '') if ai else ''}",
        '',
        f"**为什么重要**：{ai.get('why_matters', '') if ai else ''}",
        '',
        f"**创新点**：{ai.get('novelty', '') if ai else ''}",
        '',
        f"**标签**：{tags}",
        '',
        f"**作者**：{fmt_authors(entry['authors'])} · **发布**：{date_s}",
        '',
        '---',
        '',
    ]
    return '\n'.join(lines)


def render_light_item(entry):
    cats = entry['categories'][0] if entry['categories'] else ''
    snippet = entry['summary'][:90].replace('\n', ' ').strip()
    return f"- **[{entry['title']}]({entry['link']})** `{cats}` — {snippet}…"


def render_fallback_card(entry):
    """没有 DEEPSEEK_API_KEY 时的降级展示：直接摘录英文摘要，不做AI提炼。"""
    cats = ' '.join(f'`{c}`' for c in entry['categories'][:3])
    date_s = entry['published'][:10]
    abstract = entry['summary'][:280].replace('\n', ' ').strip()
    return '\n'.join([
        f"### [{entry['title']}]({entry['link']}) {cats}",
        '',
        f"> {abstract}…",
        '',
        f"**作者**：{fmt_authors(entry['authors'])} · **发布**：{date_s}",
        '',
        '_（AI 深度解读待接入 DEEPSEEK_API_KEY，当前为原摘要展示）_',
        '',
        '---',
        '',
    ])


def build_day_markdown(date_str, deep_cards, light_items, has_key, total):
    lines = [f'# {date_str} AI 前沿论文日报', '']
    mode_note = '（本期含 AI 深度解读）' if has_key else '（本期为摘要直展版，AI 深度解读接入后自动升级）'
    lines.append(f'> 本期共收录 **{total}** 篇新论文，覆盖 LLM / Agent / 多模态 / 强化学习 / 对齐等方向 {mode_note}。')
    lines.append('')
    if deep_cards:
        title = '## 🔥 精选深度解读' if has_key else '## 🔥 精选论文'
        lines.append(title)
        lines.append('')
        lines.extend(deep_cards)
    if light_items:
        lines.append('## 📎 其他值得关注')
        lines.append('')
        lines.extend(light_items)
        lines.append('')
    lines.append('> 数据来源：[arXiv](https://arxiv.org) 公开 API，每日自动抓取与筛选，AI 解读由 DeepSeek 生成，仅供参考，请以原文为准。')
    return '\n'.join(lines)


def update_sidebar(date_str):
    header = [
        '- [📚 论文集首页](README.md)', '',
        '- **每日论文日报**',
    ]
    dates = []
    if os.path.exists(SIDEBAR_FILE):
        with open(SIDEBAR_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                m = re.search(r'archive/(\d{4}-\d{2}-\d{2})\.md', line)
                if m:
                    dates.append(m.group(1))
    if date_str not in dates:
        dates.append(date_str)
    dates = sorted(set(dates), reverse=True)
    body = [f'  - [{d}](archive/{d}.md)' for d in dates]
    footer = [
        '',
        '- [← 返回课程首页](https://harryjzhang69-web.github.io/harry-agent-course/index.html)',
        '',
    ]
    with open(SIDEBAR_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(header + body + footer))


def update_readme(state, date_str, total_today, recent_titles):
    dates_listed = recent_titles[:10]
    lines = [
        '# AI 前沿论文日报', '',
        '> 每天自动从 arXiv 抓取 LLM / Agent / 多模态 / 强化学习 / 对齐等方向的最新论文，用 AI 生成中文深度解读——'
        '不需要开着电脑、不需要人工整理，全部由 GitHub Actions 定时任务自动完成。', '',
        f'- 累计收录论文：**{state["total_papers"]}** 篇',
        f'- 累计更新天数：**{state["total_days"]}** 天',
        f'- 最近更新：**{date_str}**（新增 {total_today} 篇）', '',
        '## 最近几期', '',
    ]
    for d in dates_listed:
        lines.append(f'- [{d}](archive/{d}.md)')
    lines += [
        '', '## 这是怎么做到的', '',
        '1. 每天由 GitHub Actions 定时任务在云端自动触发（不依赖任何本地设备）', '',
        '2. 调用 arXiv 官方 API，拉取 `cs.AI / cs.CL / cs.LG / cs.CV / cs.MA / cs.RO / cs.NE / stat.ML` 等分类下的最新论文', '',
        '3. 按前沿关键词（Agent / 推理 / 对齐 / 多模态 / RLHF 等）打分排序，精选出最值得读的一批深度解读，其余轻量列出标题摘要', '',
        '4. 用 DeepSeek 大模型对精选论文生成中文速读卡片（一句话总结 / 为什么重要 / 创新点 / 标签）', '',
        '5. 自动生成当天的日报页面，提交回本仓库，GitHub Pages 自动重新部署', '',
        '> 数据来源 arXiv 公开 API，AI 解读仅供参考，请以论文原文为准。', '',
        '[← 返回课程首页](https://harryjzhang69-web.github.io/harry-agent-course/index.html)', '',
    ]
    with open(README_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


# ---------------- 主流程 ----------------
def main():
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    state = load_state()
    now = datetime.now(timezone.utc)

    if state.get('last_max_published'):
        cutoff = parse_dt(state['last_max_published'])
    else:
        cutoff = now - timedelta(hours=DEFAULT_LOOKBACK_HOURS)
    log(f'本次拉取 cutoff = {cutoff.isoformat()}  (是否首次运行: {state.get("last_max_published") is None})')

    entries = fetch_arxiv_entries(cutoff)
    log(f'共获取 {len(entries)} 篇新论文（cutoff之后）')

    if not entries:
        log('没有新论文，本次不生成日报。')
        return

    # 更新游标为本批最大 published 时间，避免下次重复抓取
    max_published = max(entries, key=lambda e: e['published'])['published']

    for e in entries:
        e['score'] = score_entry(e)
    entries.sort(key=lambda e: e['score'], reverse=True)

    deep_entries = entries[:DEEP_LIMIT]
    light_entries = entries[DEEP_LIMIT:DEEP_LIMIT + LIGHT_LIMIT]

    has_key = bool(DEEPSEEK_API_KEY)
    deep_cards = []
    for i, e in enumerate(deep_entries):
        log(f'深度总结 {i+1}/{len(deep_entries)}: {e["title"][:50]}...')
        if has_key:
            ai = summarize_with_llm(e)
            if ai:
                deep_cards.append(render_deep_card(e, ai))
            else:
                deep_cards.append(render_fallback_card(e))
            time.sleep(1.5)
        else:
            deep_cards.append(render_fallback_card(e))

    light_items = [render_light_item(e) for e in light_entries]

    date_str = now.strftime('%Y-%m-%d')
    day_md = build_day_markdown(date_str, deep_cards, light_items, has_key, len(entries))
    day_path = os.path.join(ARCHIVE_DIR, f'{date_str}.md')
    # 若当天已存在（同日多次运行），合并追加而不是覆盖
    if os.path.exists(day_path):
        with open(day_path, 'r', encoding='utf-8') as f:
            old = f.read()
        day_md = old + '\n\n---\n\n' + day_md
    with open(day_path, 'w', encoding='utf-8') as f:
        f.write(day_md)
    log(f'已写入 {day_path}')

    update_sidebar(date_str)

    state['last_max_published'] = max_published
    state['total_papers'] = state.get('total_papers', 0) + len(entries)
    state['total_days'] = state.get('total_days', 0) + 1
    save_state(state)

    # 生成首页概览用的最近日期列表
    recent_dates = []
    if os.path.exists(SIDEBAR_FILE):
        with open(SIDEBAR_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                m = re.search(r'archive/(\d{4}-\d{2}-\d{2})\.md', line)
                if m:
                    recent_dates.append(m.group(1))
    update_readme(state, date_str, len(entries), recent_dates)

    log(f'完成。今日新增 {len(entries)} 篇（深度 {len(deep_cards)} / 轻量 {len(light_items)}），累计 {state["total_papers"]} 篇。')


if __name__ == '__main__':
    main()
