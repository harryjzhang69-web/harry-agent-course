# -*- coding: utf-8 -*-
import fitz
f = fitz.Font(fontfile='C:/Windows/Fonts/msyh.ttc')
samples = [
    '05 三大经典范式手把手实现：ReAct / Plan-and-Solve / Reflection',
    '07 主流框架产品化评测：LangGraph / AutoGen / AgentScope',
    'Part 1 · 认知重建',
    '00 前言',
]
for s in samples:
    print(repr(s), '-> text_length=', f.text_length(s, fontsize=11))

# 实测：插入并渲染看是否与text_length吻合
doc = fitz.open()
page = doc.new_page(width=595, height=842)
page.insert_font(fontname='F0', fontfile='C:/Windows/Fonts/msyh.ttc')
x0 = 66
page.insert_text((x0, 100), samples[0], fontsize=11, fontname='F0')
page.draw_line((x0 + 317.37, 90), (x0 + 317.37, 110), color=(1, 0, 0))  # 标记旧字体算出的宽度位置
tl = f.text_length(samples[0], fontsize=11)
page.draw_line((x0 + tl, 92), (x0 + tl, 108), color=(0, 0.6, 0))  # 标记新字体算出的宽度位置
doc.save('_qa_textlen2.pdf')
d = fitz.open('_qa_textlen2.pdf')
d[0].get_pixmap(matrix=fitz.Matrix(2, 2), clip=fitz.Rect(40, 80, 595, 120)).save('_qa_textlen2.png')
print('saved, new tl=', tl)
