# -*- coding: utf-8 -*-
import fitz
d = fitz.open("Harry的Agent实战课-完整版.pdf")
print("total pages", len(d))
targets = [0, 1, 2, 3, 10, 50, 100, 150, 200, len(d) - 1]
for i in targets:
    if i < len(d):
        d[i].get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(f"_qa_p{i+1:03d}.png")
print("done")
