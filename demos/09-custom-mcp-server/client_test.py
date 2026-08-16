"""
demos/09-custom-mcp-server/client_test.py

用官方 MCP Python SDK 的客户端，以 Stdio 传输方式启动 server.py 子进程并真实调用三个工具。
这是证明"这个MCP服务器真的能被任意MCP客户端发现和调用"的最小闭环测试，
不是自己在server.py内部直接调函数（那样测不出协议层是否正确）。
"""

import asyncio
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER_SCRIPT = str(Path(__file__).parent / "server.py")


async def main():
    server_params = StdioServerParameters(command=sys.executable, args=[SERVER_SCRIPT])

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # 测试1：客户端能否正确发现全部3个工具（协议自动生成的Schema）
            tools_result = await session.list_tools()
            tool_names = sorted(t.name for t in tools_result.tools)
            print(f"[发现工具] {tool_names}")
            assert tool_names == ["get_question_detail", "get_random_question", "list_questions"], "工具列表不符合预期"

            # 测试2：list_questions 按分类筛选
            r1 = await session.call_tool("list_questions", {"part": "B"})
            text1 = r1.content[0].text
            print(f"\n[list_questions(part='B')]\n{text1}")
            assert "共 6 题" in text1, "B分类应有6题"

            # 测试3：get_question_detail 查具体某题
            r2 = await session.call_tool("get_question_detail", {"question_id": "b-q10"})  # 故意用小写测试大小写不敏感
            text2 = r2.content[0].text
            print(f"\n[get_question_detail('b-q10')]\n{text2}")
            assert "MCP协议解决了什么问题" in text2, "应命中B-Q10题干"

            # 测试4：get_random_question 随机抽题（分类筛选）
            r3 = await session.call_tool("get_random_question", {"part": "C"})
            text3 = r3.content[0].text
            print(f"\n[get_random_question(part='C')]\n{text3}")
            assert "综合场景题" in text3, "应从C分类抽题"

            # 测试5：错误输入的兜底处理（不存在的题目编号）
            r4 = await session.call_tool("get_question_detail", {"question_id": "Z-Q99"})
            text4 = r4.content[0].text
            print(f"\n[get_question_detail('Z-Q99')（不存在）]\n{text4}")
            assert "未找到题目编号" in text4, "不存在的题目应返回明确提示，而不是报错崩溃"

            print("\n全部5项断言通过 —— MCP服务器协议层与业务逻辑均验证正常。")


if __name__ == "__main__":
    asyncio.run(main())
