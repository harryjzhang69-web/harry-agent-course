# -*- coding: utf-8 -*-
import fitz
d = fitz.open("Harry的Agent实战课-完整版.pdf")
print("total pages", len(d))
targets = [0, 1, len(d) - 1, len(d) - 2]
for i in targets:
    if 0 <= i < len(d):
        d[i].get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(f"_qa2_p{i+1:03d}.png")
print("done")
