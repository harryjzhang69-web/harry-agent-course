# -*- coding: utf-8 -*-
import fitz
doc = fitz.open()
page = doc.new_page(width=595, height=842)
page.insert_text((100, 100), "Harry 的 Agent 实战课 测试中文", fontsize=24, fontname="china-s")
doc.save("_qa_font_test2.pdf")
d = fitz.open("_qa_font_test2.pdf")
d[0].get_pixmap(matrix=fitz.Matrix(2, 2)).save("_qa_font_test2.png")
print("OK")
