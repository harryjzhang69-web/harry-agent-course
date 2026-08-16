# Demo 09：从零搭建一个真实可用的 MCP 服务器

> 对应课程 [Part3 第11章 通信协议速查](../../docs/part3/11-通信协议速查.md)，以及番外篇 [《零基础保姆级：从零搭一个MCP服务器并接入客户端》](../../docs/bonus/番外03-MCP服务器从零搭建保姆级教程.md)。11章只是协议层面的速查表，这个demo是**真实用官方 `mcp` SDK 跑起来的服务器**，不是自己模拟协议格式。

## 这个 Demo 演示了什么

把课程 [Part5 第19章《转型面试题库》](../../docs/part5/19-转型面试题库.md) 的15道题封装成一个标准 MCP 服务器，暴露3个工具：

| 工具 | 功能 |
|---|---|
| `list_questions(part)` | 按分类（A产品向/B技术向/C综合场景）列出题目标题 |
| `get_question_detail(question_id)` | 查询某道题的完整信息（题目+参考思路+对应课程章节） |
| `get_random_question(part)` | 随机抽一道题，用于面试自测 |

这样做的价值：任何支持 MCP 的客户端（Claude Desktop、Cursor、企业自己的Agent……）**都能直接"插上"这个题库工具**，不需要每个客户端重新实现一遍"读题库、按分类筛选、随机抽题"的逻辑——这正是 MCP "一次实现、多处复用"的核心价值（对应第11章的USB类比）。

## 环境要求

⚠️ 官方 `mcp` SDK 要求 **Python 3.10 及以上**。如果你的环境是 Python 3.9 或更低，需要先升级（比如用 `pyenv`/官网安装器装一个新版本，虚拟环境里用新版本）。

## 快速开始

```bash
cd demos/09-custom-mcp-server
pip install -r requirements.txt

# 直接启动服务器（stdio传输，等待客户端连接，不会有任何输出，这是正常的）
python server.py
```

## 真实端到端测试（协议层验证，不是自己在代码里直接调函数）

```bash
python client_test.py
```

这个测试脚本用官方 SDK 的客户端，以 **Stdio 传输方式**真实启动 `server.py` 子进程、走完整的 MCP 协议握手（`initialize` → `list_tools` → `call_tool`），验证：
1. 客户端能正确发现全部3个工具（协议自动生成的Schema）
2. 三个工具的业务逻辑（分类筛选/精确查询/随机抽题）都符合预期
3. 错误输入（不存在的题目编号）有明确的兜底提示，而不是协议层崩溃

实测输出（已验证，5项断言全部通过）：
```
[发现工具] ['get_question_detail', 'get_random_question', 'list_questions']
[list_questions(part='B')] 共 6 题：...
[get_question_detail('b-q10')] 【B-Q10】技术向问题 ...（大小写不敏感也能命中）
[get_random_question(part='C')] 【随机抽到】C-Q15 · 综合场景题 ...
[get_question_detail('Z-Q99')（不存在）] 未找到题目编号 'Z-Q99'，请先调用 list_questions 查看可用编号。
全部5项断言通过 —— MCP服务器协议层与业务逻辑均验证正常。
```

## 接入真实客户端 & 发布准备

详细的保姆级步骤（配置 Claude Desktop/Cursor、准备发布到 Smithery 市场的标准目录结构）见番外篇：[《零基础保姆级：从零搭一个MCP服务器并接入客户端》](../../docs/bonus/番外03-MCP服务器从零搭建保姆级教程.md)。

## 产品经理清单

> - [ ] 这个能力真的会被"多个不同客户端"复用吗？如果只有一个固定的调用方，直接写函数调用，不需要包一层MCP协议（呼应第11章"MCP的优势只在多方复用时才明显"这条判断）。
> - [ ] 工具的 docstring 是不是写得足够清楚？MCP客户端（尤其是LLM）完全依赖 docstring 判断"这个工具是干什么的、什么时候该调用它"，含糊的描述会导致模型调错工具或漏调。
> - [ ] 错误输入有没有清晰的兜底提示？MCP工具被LLM调用时，"崩溃"和"清晰报错"对模型后续决策的影响天差地别。
