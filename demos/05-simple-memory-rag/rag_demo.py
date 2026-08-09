"""
Harry 的 Agent 实战课 · Demo 05 —— 最小可用的检索增强记忆（Simple RAG）
对应 docs/part3/09-记忆与检索.md

核心流程：文本 -> Embedding -> 存入内存列表 -> 按余弦相似度检索Top-K -> 拼进Prompt生成回答。
不依赖任何向量数据库，帮你看清楚 RAG 底层到底在做什么。

用法见同目录 README.md。
License: MIT
"""

import os

import numpy as np
from openai import OpenAI


class SimpleVectorStore:
    """最简单的向量存储：一个Python列表，检索时线性扫描算余弦相似度。

    生产环境应替换成专业向量数据库（Milvus/Qdrant/pgvector等）以获得高效的
    近似最近邻搜索，但核心流程（写入时Embedding、检索时算相似度、Top-K拼进Prompt）
    完全不变——这正是这个Demo想讲清楚的：向量数据库只是存储和检索效率的优化。
    """

    def __init__(self, client: OpenAI, embedding_model: str):
        self.client = client
        self.embedding_model = embedding_model
        self._items: list[dict] = []  # 每项: {"name": str, "text": str, "vector": np.ndarray}

    def _embed(self, text: str) -> np.ndarray:
        resp = self.client.embeddings.create(model=self.embedding_model, input=text)
        return np.array(resp.data[0].embedding, dtype=np.float32)

    def add(self, name: str, text: str) -> None:
        vector = self._embed(text)
        self._items.append({"name": name, "text": text, "vector": vector})

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        if not self._items:
            return []
        query_vec = self._embed(query)
        scored = []
        for item in self._items:
            sim = self._cosine_similarity(query_vec, item["vector"])
            scored.append((sim, item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [{"name": it["name"], "text": it["text"], "score": float(s)} for s, it in scored[:top_k]]

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)


def build_demo_knowledge_base(store: SimpleVectorStore) -> None:
    """写入几条示例知识，方便直接体验检索效果。"""
    knowledge = [
        ("course-intro", "Harry的Agent实战课核心内容永久免费，包括前言、Part1认知重建、Part2亲手造轮子、Part3高级能力、Part5毕业设计与展望。"),
        ("part4-pricing", "Part4真实项目复盘单独定价99元，因为这部分是作者亲手做过上线项目的一手踩坑经验，市面上很少有人会无偿公开写这种真实案例。"),
        ("react-pattern", "ReAct范式的核心是让模型一边思考一边行动，每一步的决策都建立在上一步真实的工具执行结果之上，适合任务路径需要根据中间结果动态调整的场景。"),
        ("agent-maturity", "Agent产品成熟度分级L0到L3：L0是规则脚本自动化，L1是单轮工具调用，L2是自主规划循环，L3是多智能体协作，级别越高不可控性和成本也越高。"),
        ("unrelated-fact", "番茄炒蛋是一道常见的家常菜，主要食材是番茄和鸡蛋，做法简单，很多人的入门菜。"),
    ]
    for name, text in knowledge:
        store.add(name, text)


def answer_with_rag(question: str, store: SimpleVectorStore, client: OpenAI, model: str, top_k: int = 3) -> str:
    retrieved = store.search(question, top_k=top_k)

    print("\n----- 检索到的相关片段 -----")
    for r in retrieved:
        print(f"[{r['name']}] 相似度={r['score']:.3f}\n  {r['text']}")

    context = "\n".join(f"- {r['text']}" for r in retrieved)
    prompt = (
        f"请基于以下检索到的参考资料回答用户问题，如果参考资料里没有相关信息，"
        f"请明确说明'参考资料中没有找到相关信息'，不要编造答案。\n\n"
        f"参考资料：\n{context}\n\n用户问题：{question}"
    )

    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return resp.choices[0].message.content


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    embedding_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    if not api_key:
        print("请先设置环境变量 OPENAI_API_KEY")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)
    store = SimpleVectorStore(client, embedding_model)

    print("正在写入示例知识库...")
    build_demo_knowledge_base(store)
    print(f"写入完成，共 {len(store._items)} 条知识。\n")

    print("Harry的Agent实战课 · 最小可用RAG Demo")
    print(f"生成模型：{model}｜ Embedding模型：{embedding_model}\n")

    while True:
        question = input("> ").strip()
        if question.lower() in {"exit", "quit"}:
            break
        if not question:
            continue
        answer = answer_with_rag(question, store, client, model)
        print(f"\n===== 最终回答 =====\n{answer}\n")


if __name__ == "__main__":
    main()
