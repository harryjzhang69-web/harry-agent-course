# -*- coding: utf-8 -*-
"""
assemble_pdf.py
把 chapters_raw/ 下的30个原始内容PDF，组装成一份完整的电子书PDF：
封面页 -> 目录页（带正确页码）-> 全部正文（每页加防盗版水印footer）
"""
import json
import os
import fitz

ROOT = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(ROOT, 'chapters_raw')
MANIFEST_PATH = os.path.join(ROOT, 'manifest.json')
OUT_PATH = os.path.join(ROOT, 'Harry的Agent实战课-完整版.pdf')

FONT = 'myfont'
FONT_FILE = 'C:/Windows/Fonts/msyh.ttc'


def new_page(doc):
    """新建一页并注册好中文字体，保证text_length测量和实际渲染宽度一致"""
    page = doc.new_page(width=PAGE_W, height=PAGE_H)
    page.insert_font(fontname=FONT, fontfile=FONT_FILE)
    return page

BRAND = '清华学长harry · AI 产品手艺人 · 全部内容永久免费开源 · 严禁商业售卖'
CONTACT = '公众号「AI产品手艺人」 · 小红书 @清华学长harry · GitHub @harryjzhang69-web · 微信 jialin_69'

PAGE_W, PAGE_H = fitz.paper_size('a4')  # 595.28 x 841.89

PART_TITLES = {
    'part1': 'Part 1 · 认知重建',
    'part2': 'Part 2 · 亲手造轮子',
    'part3': 'Part 3 · 高级能力',
    'part4': 'Part 4 · 真实项目复盘',
    'part5': 'Part 5 · 毕业设计与展望',
    'part6': 'Part 6 · 产品化跃升',
}

COLOR_INDIGO = (0.357, 0.424, 0.961)   # #5b6cf5
COLOR_PURPLE = (0.659, 0.333, 0.969)   # #a855f7
COLOR_DARK = (0.06, 0.07, 0.15)        # 深蓝紫背景
COLOR_TXT = (0.15, 0.16, 0.22)
COLOR_GRAY = (0.55, 0.55, 0.6)


def load_manifest():
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def clean_title(kind, title, part_id):
    """去掉标题里多余的✅/全部免费等标注，供TOC/水印使用更干净"""
    t = title
    for junk in [' ✅免费', '✅ 全部免费', ' ✅', '（三章已全部完稿）']:
        t = t.replace(junk, '')
    return t.strip()


def build_cover(doc):
    page = new_page(doc)
    # 背景：深蓝紫渐变（用多个矩形模拟渐变）
    steps = 260
    for i in range(steps):
        t = i / steps
        r = COLOR_DARK[0] + (0.10 - COLOR_DARK[0]) * t
        g = COLOR_DARK[1] + (0.11 - COLOR_DARK[1]) * t
        b = COLOR_DARK[2] + (0.23 - COLOR_DARK[2]) * t
        y0 = PAGE_H * i / steps
        y1 = PAGE_H * (i + 1) / steps + 0.6
        page.draw_rect(fitz.Rect(0, y0, PAGE_W, y1), color=(r, g, b), fill=(r, g, b), fill_opacity=1, width=0)

    cx = PAGE_W / 2
    # 顶部小标签
    page.insert_textbox(fitz.Rect(0, 90, PAGE_W, 115),
                         'FREE & OPEN SOURCE · 6 PART · 24 CHAPTERS',
                         fontsize=11, fontname='helv', color=(0.6, 0.66, 0.98), align=1)
    # 主标题
    page.insert_textbox(fitz.Rect(40, 300, PAGE_W - 40, 400),
                         'Harry 的 Agent 实战课',
                         fontsize=34, fontname=FONT, color=(1, 1, 1), align=1)
    # 副标题
    page.insert_textbox(fitz.Rect(40, 400, PAGE_W - 40, 440),
                         '从认知到产品，亲手打造你的 AI Agent',
                         fontsize=15, fontname=FONT, color=(0.75, 0.78, 0.95), align=1)
    # 分隔线
    page.draw_line((cx - 60, 470), (cx + 60, 470), color=(0.4, 0.45, 0.9), width=1.2)
    # 统计数字
    page.insert_textbox(fitz.Rect(40, 495, PAGE_W - 40, 525),
                         '6 个 Part · 24 章正文 · 3 个真实项目复盘 · 9 个可运行 Demo',
                         fontsize=12.5, fontname=FONT, color=(0.85, 0.87, 0.98), align=1)
    # 作者
    page.insert_textbox(fitz.Rect(40, 680, PAGE_W - 40, 710),
                         '清华学长 harry · AI 产品手艺人',
                         fontsize=14, fontname=FONT, color=(1, 1, 1), align=1)
    page.insert_textbox(fitz.Rect(40, 708, PAGE_W - 40, 730),
                         '前腾讯游戏产品经理 · 现独立 AI 产品手艺人',
                         fontsize=10.5, fontname=FONT, color=(0.65, 0.68, 0.9), align=1)
    # 底部品牌信息
    page.insert_textbox(fitz.Rect(40, PAGE_H - 90, PAGE_W - 40, PAGE_H - 70),
                         BRAND, fontsize=9, fontname=FONT, color=(0.5, 0.53, 0.75), align=1)
    page.insert_textbox(fitz.Rect(40, PAGE_H - 70, PAGE_W - 40, PAGE_H - 50),
                         CONTACT, fontsize=9, fontname=FONT, color=(0.5, 0.53, 0.75), align=1)


def truncate_to_width(font_obj, text, fontsize, max_width):
    """按实际渲染像素宽度截断文字，末尾加省略号，避免与右侧页码列重叠"""
    if font_obj.text_length(text, fontsize=fontsize) <= max_width:
        return text
    ell = '…'
    lo, hi = 0, len(text)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        cand = text[:mid] + ell
        if font_obj.text_length(cand, fontsize=fontsize) <= max_width:
            lo = mid
        else:
            hi = mid - 1
    return text[:lo] + ell if lo > 0 else ell


def build_toc(doc, manifest, offsets):
    """offsets: seq(1-based manifest index) -> content page number (1-based, in final doc)"""
    font_obj = fitz.Font(fontfile=FONT_FILE)
    NUM_COL_X = 490
    TITLE_MAX_X = NUM_COL_X - 20  # 标题列右边界，留20pt安全间隙

    page = new_page(doc)
    y = 70
    page.insert_textbox(fitz.Rect(50, y, PAGE_W - 50, y + 40), '目录', fontsize=24, fontname=FONT, color=COLOR_DARK)
    y += 50
    page.draw_line((50, y), (PAGE_W - 50, y), color=COLOR_INDIGO, width=1)
    y += 18

    line_h = 20.5
    part_gap = 10

    def ensure_space(needed):
        nonlocal page, y
        if y + needed > PAGE_H - 60:
            page = new_page(doc)
            y = 60

    for i, m in enumerate(manifest):
        pno = offsets[i]
        pno_x = NUM_COL_X + 8
        if m['kind'] == 'preface':
            ensure_space(line_h)
            page.insert_text((50, y), '前言', fontsize=12.5, fontname=FONT, color=COLOR_INDIGO)
            page.insert_text((pno_x, y), str(pno), fontsize=11, fontname=FONT, color=COLOR_GRAY)
            y += line_h + 6
            continue
        if m['kind'] == 'part-readme':
            ensure_space(line_h + part_gap)
            y += part_gap
            part_title = PART_TITLES.get(m['partId'], m['partId'])
            disp = truncate_to_width(font_obj, part_title, 13.5, TITLE_MAX_X - 50)
            page.insert_text((50, y), disp, fontsize=13.5, fontname=FONT, color=COLOR_INDIGO)
            page.insert_text((pno_x, y), str(pno), fontsize=11, fontname=FONT, color=COLOR_GRAY)
            y += line_h
            continue
        # chapter
        ensure_space(line_h)
        title = clean_title(m['kind'], m['title'], m['partId'])
        disp = truncate_to_width(font_obj, title, 11, TITLE_MAX_X - 66)
        page.insert_text((66, y), disp, fontsize=11, fontname=FONT, color=COLOR_TXT)
        page.insert_text((pno_x, y), str(pno), fontsize=11, fontname=FONT, color=COLOR_GRAY)
        y += line_h


def stamp_watermark(page, page_no):
    page.insert_font(fontname=FONT, fontfile=FONT_FILE)
    rect = fitz.Rect(30, PAGE_H - 32, PAGE_W - 30, PAGE_H - 16)
    page.insert_textbox(rect, BRAND, fontsize=7.5, fontname=FONT, color=(0.62, 0.62, 0.66), align=1)
    page.insert_text((PAGE_W - 50, PAGE_H - 14), str(page_no), fontsize=8.5, fontname=FONT, color=(0.5, 0.5, 0.55))


def main():
    manifest = load_manifest()

    # 第一步：先把所有内容页数算出来（不含封面/目录），用于确定目录预留页数与最终页码
    content_page_counts = []
    for m in manifest:
        p = os.path.join(CHAPTERS_DIR, m['pdfName'])
        d = fitz.open(p)
        content_page_counts.append(len(d))
        d.close()
    total_content_pages = sum(content_page_counts)
    print('内容总页数:', total_content_pages)

    # 目录预估页数：按30条目 + 6个part头间隔，粗略估算，取2页起（后续ensure_space会自动加页，这里只是用来算offset起点）
    TOC_PAGES_GUESS = 2
    COVER_PAGES = 1
    start_page = COVER_PAGES + TOC_PAGES_GUESS + 1  # 第一篇内容的页码（1-based，从这里开始编号）

    offsets = []
    cur = start_page
    for cnt in content_page_counts:
        offsets.append(cur)
        cur += cnt

    doc = fitz.open()
    build_cover(doc)
    build_toc(doc, manifest, offsets)

    # 如果目录实际用的页数和猜测不一致，需要重新计算offset并重建（简单起见：先看实际用了几页）
    actual_toc_pages = len(doc) - COVER_PAGES
    if actual_toc_pages != TOC_PAGES_GUESS:
        print(f'目录实际用了{actual_toc_pages}页（预估{TOC_PAGES_GUESS}页），重新计算页码...')
        doc.close()
        start_page = COVER_PAGES + actual_toc_pages + 1
        offsets = []
        cur = start_page
        for cnt in content_page_counts:
            offsets.append(cur)
            cur += cnt
        doc = fitz.open()
        build_cover(doc)
        build_toc(doc, manifest, offsets)

    # 插入正文内容 + 加水印
    page_counter = COVER_PAGES + (len(doc) - COVER_PAGES)  # 当前doc页数 = 封面+目录
    for i, m in enumerate(manifest):
        p = os.path.join(CHAPTERS_DIR, m['pdfName'])
        src = fitz.open(p)
        doc.insert_pdf(src, from_page=0, to_page=len(src) - 1)
        src.close()
    # 统一对内容区(从 封面+目录之后)加水印页码
    n_pre = COVER_PAGES + (len(doc) - COVER_PAGES - total_content_pages)
    for idx in range(n_pre, len(doc)):
        pno = idx - n_pre + start_page
        stamp_watermark(doc[idx], pno)

    doc.set_metadata({
        'title': 'Harry 的 Agent 实战课',
        'author': 'Harry Zhang (清华学长harry)',
        'subject': '从认知到产品，亲手打造你的 AI Agent',
        'creator': 'harry-agent-course',
    })
    try:
        doc.subset_fonts()
    except Exception as e:
        print('subset_fonts failed (ignored):', e)
    doc.save(OUT_PATH, garbage=4, deflate=True)
    print('DONE ->', OUT_PATH, os.path.getsize(OUT_PATH), 'bytes, total pages =', len(doc))


if __name__ == '__main__':
    main()
