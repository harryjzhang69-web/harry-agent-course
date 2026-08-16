# 05 最小可用的检索增强记忆（Simple RAG）

对应 [Part 3 第10 章：记忆与检索](../../docs/part3/10-记忆与检索.md)。用不到100行代码实现RAG 的核心流程：**文本→Embedding→存储→按相似度检索→拼进Prompt**，不依赖任何向量数据库，帮你看清楚 RAG 底层到底在做什么。

## 核心流程

```
写入阶段: 文本片段 --Embedding模型--> 向量 --> 存入内存列表(name, text, vector)
检索阶段: 用户问题 --Embedding模型--> 查询向量 --> 与所有存储向量算余弦相似度 -->取Top-K最相似的片段
生成阶段: Top-K片段拼进Prompt --> 连同问题一起发给LLM --> 生成有依据的回答
```

## 快速开始

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-你的key
export OPENAI_BASE_URL=https://api.deepseek.com   # 换成任意支持 embeddings 接口的服务商
export OPENAI_MODEL=deepseek-chat
export OPENAI_EMBEDDING_MODEL=text-embedding-3-small   # 换成你的服务商提供的embedding模型名
python rag_demo.py
```

运行后会先写入几条示例知识（关于本课程的内容简介），然后你可以直接提问，比如：

```
> 这门课的Part4真实项目复盘讲了哪些案例？
```

观察输出里的"检索到的相关片段"部分，就能看到RAG 是怎么把相关知识召回并拼进最终 Prompt 的。

## 想接入真实的向量数据库？

这个Demo 用 Python 列表存所有向量，数据量大了检索会变慢（线性扫描）。生产环境替换成专业向量数据库（如 Milvus/Qdrant/pgvector）即可获得近似最近邻搜索的性能，但**核心流程（写入时Embedding、检索时算相似度、Top-K拼进Prompt）完全不变**——这正是这一章想让你看清楚的：向量数据库只是"存储和检索效率"的优化，不是RAG 概念本身的改变。

## 注意事项

代码里的余弦相似度计算依赖 `numpy`，如果你的Embedding 服务商返回维度不同的向量，需要保证写入和查询用的是同一个Embedding 模型（不同模型的向量空间不可比）。
