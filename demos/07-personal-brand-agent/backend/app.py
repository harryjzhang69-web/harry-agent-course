"""
demos/07-personal-brand-agent/backend/app.py

FastAPI 主入口：
- 挂载前端静态文件（frontend/），打开根路径即可看到完整 Web 界面
- 提供 /api/generate 接口（SSE 流式返回四个 Agent 的进度 + 最终报告）
- 提供 /api/health 健康检查接口

启动方式见同目录 README.md：
    cd demos/07-personal-brand-agent
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-xxxx
    python backend/app.py
"""

from __future__ import annotations

import json
import os
import queue
import sys
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

# 允许直接 `python backend/app.py` 运行时也能找到同目录的 models.py / agents.py
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents import BrandPositioningOrchestrator, build_default_llm_client  # noqa: E402
from models import GenerateRequest  # noqa: E402

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="个人品牌定位 Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    return {"status": "ok", "llm_configured": has_key}


@app.post("/api/generate")
def generate(req: GenerateRequest):
    """
    用 SSE（Server-Sent Events）把四个 Agent 的执行进度实时推给前端，
    最后一条 event 是完整的报告 JSON。
    选 SSE 而不是等全部跑完再一次性返回，是因为四次 LLM 调用串行下来
    通常要 15~40 秒，纯等待的白屏体验很差——这也是产品设计里
    "把长耗时任务的中间状态暴露给用户"的一个具体示范。
    """
    try:
        llm = build_default_llm_client()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    orchestrator = BrandPositioningOrchestrator(llm)
    event_queue: "queue.Queue[tuple[str, dict]]" = queue.Queue()
    SENTINEL = object()

    def worker():
        """
        orchestrator.run 是同步阻塞调用（内部串行发4次LLM请求），
        放到后台线程跑，主线程的生成器只负责从队列里实时取事件并 yield 出去，
        这样前端才能在第一个 Agent 跑完的瞬间就收到进度更新，而不是等全部跑完再一次性收到。
        """
        try:
            def on_progress(stage: str, status: str, message: str):
                event_queue.put(("progress", {"stage": stage, "status": status, "message": message}))

            report = orchestrator.run(req.profile, on_progress=on_progress)
            event_queue.put(("done", {"report": report.model_dump()}))
        except Exception as e:  # noqa: BLE001
            event_queue.put(("error", {"message": str(e)}))
        finally:
            event_queue.put((SENTINEL, None))

    def event_stream():
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        while True:
            event_name, payload = event_queue.get()
            if event_name is SENTINEL:
                break
            yield f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# 挂载静态前端（放在所有 API 路由注册之后，避免 / 覆盖了 /api/* 路由）
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8420"))
    print(f"个人品牌定位 Agent 已启动：http://127.0.0.1:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
