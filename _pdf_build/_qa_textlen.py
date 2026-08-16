# -*- coding: utf-8 -*-
import fitz
f = fitz.Font('china-s')
samples = [
    '05 三大经典范式手把手实现：ReAct / Plan-and-Solve / Reflection',
    '07 主流框架产品化评测：LangGraph / AutoGen / AgentScope',
    'Part 1 · 认知重建',
    '00 前言',
]
for s in samples:
    print(repr(s), '-> text_length=', f.text_length(s, fontsize=11))
