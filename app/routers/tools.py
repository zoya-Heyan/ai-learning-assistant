"""Study helpers: question generation + Markdown notes (RAG-backed)."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.llm import chat_async
from app.services.retrieval import retrieve_context

router = APIRouter(prefix="/tools", tags=["tools"])

_QUESTIONS_SYSTEM = """你是出题助手，根据给定的知识材料生成高质量练习题。

输出格式（严格分两部分）：

**第一部分：题目**
- 仅输出题目和选项，不输出答案和解析
- 每道题加编号如「**第1题**」「**第2题**」
- 支持单选题、多选题、填空题、简答题

**第二部分：答案与解析**
- 按编号顺序，每题给出「答案：X」和「解析：……」
- 解析有深度，讲解知识点与解题思路

注意：输出用纯 Markdown，不用代码块包裹，语言为简体中文。"""

_ANALYSIS_SYSTEM = """你是学习辅导助手，擅长对题目进行深入浅出的分析与讲解。
输出使用 Markdown，要求：
- 指出题目考查的知识点，说明解题思路与关键步骤
- 拓展相关概念、易错点与延伸思考
- 如有正确答案，给出详细推导过程
- 语言为简体中文，条理清晰，适合学习者阅读。"""


class AnalyzeQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=20000)
    answer: str | None = Field(default=None, max_length=2000)

_NOTES_SYSTEM = """你是笔记助手，根据用户主题与给定资料生成学习笔记。
输出必须是合法的 Markdown：适当使用 #/## 标题、列表、表格、加粗、行内代码与代码块（如需要）。
语言为简体中文。不要编造资料中不存在的内容；资料不足时明确写出「资料未覆盖：…」。"""


class GenerateQuestionsRequest(BaseModel):
    source_text: str = Field(..., min_length=1, max_length=120_000)
    use_knowledge_base: bool = False
    kb_query: str | None = Field(default=None, max_length=4000)
    top_k: int | None = Field(default=5, ge=1, le=16)
    question_types: list[str] = Field(
        default=["single", "multi", "fill", "qa"],
        description="题型列表，可选：single(单选), multi(多选), fill(填空), qa(简答)",
    )
    quantities: dict[str, int] = Field(
        default={"single": 2, "multi": 1, "fill": 1, "qa": 1},
        description="每种题型的生成数量",
    )


class MarkdownNotesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=8000)
    top_k: int | None = Field(default=6, ge=1, le=16)


@router.post("/generate-questions")
async def generate_questions(request: Request, body: GenerateQuestionsRequest):
    kb_block = ""
    refs: list[dict] = []
    if body.use_knowledge_base:
        q = (body.kb_query or body.source_text).strip()[:2000]
        if not q:
            raise HTTPException(status_code=400, detail="知识库检索需要 kb_query 或 source_text")
        try:
            refs, ctx = await retrieve_context(
                request,
                q,
                body.top_k if body.top_k is not None else settings.SEARCH_TOP_K,
            )
        except ValueError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"检索失败: {e}")
        if ctx.strip():
            kb_block = f"\n\n【知识库补充资料】\n{ctx}\n"

    type_label = {
        "single": "单选题",
        "multi": "多选题",
        "fill": "填空题",
        "qa": "简答题",
    }
    type_list_str = "、".join(type_label[t] for t in body.question_types if t in type_label)
    total = sum(body.quantities.get(t, 0) for t in body.question_types if t in body.quantities)
    type_req_str = "、".join(
        f"**{type_label[t]}** × {body.quantities.get(t, 0)}道"
        for t in body.question_types if t in type_label and body.quantities.get(t, 0) > 0
    )

    user_prompt = f"""根据以下材料生成{total}道高质量练习题，题型配比为：{type_req_str}。

输出结构（分两部分，严格按顺序）：

**第一部分：题目**
- 仅输出题目和选项（填空题输出题目和空的下划线），不输出答案和解析
- 每道题目前加编号，如「**第1题**」「**第2题」」
- 依次列出所有题目

**第二部分：答案与解析**
- 按编号顺序，每道题给出「**第X题**」后跟「答案：X」「解析：……」（如有多个选项正确须列出所有正确选项，如为填空题须给出参考答案）
- 解析要有深度，讲解知识点与解题思路，不要泛泛而谈

其他要求：
- 必须严格按上述顺序输出两大部分，不得合并
- 输出使用纯 Markdown，不用代码块包裹
- 语言为简体中文

【材料内容】
{body.source_text}
{kb_block}"""

    text = await chat_async(_QUESTIONS_SYSTEM, user_prompt, temperature=0.3)
    return {"markdown": text, "kb_hits": len(refs), "top_k_results": refs if body.use_knowledge_base else []}


@router.post("/markdown-notes")
async def generate_markdown_notes(request: Request, body: MarkdownNotesRequest):
    try:
        results, context = await retrieve_context(
            request,
            body.topic,
            body.top_k if body.top_k is not None else settings.SEARCH_TOP_K,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"检索失败: {e}")

    if not results:
        user_prompt = f"""主题：{body.topic}

当前知识库中未检索到相关片段。请基于主题生成一份「大纲型」笔记 Markdown（可写应掌握要点清单），并在文首用引用块说明：资料库暂无匹配内容，笔记为通用提纲。"""
    else:
        user_prompt = f"""主题：{body.topic}

【检索到的资料片段】
{context}

请生成结构化的学习笔记（Markdown）。"""

    text = await chat_async(_NOTES_SYSTEM, user_prompt, temperature=0.3)
    return {
        "markdown": text,
        "topic": body.topic,
        "top_k_results": results,
    }


@router.post("/analyze-question")
async def analyze_question(body: AnalyzeQuestionRequest):
    answer_block = f"\n\n【正确答案】\n{body.answer}\n" if body.answer else ""
    user_prompt = f"""请对以下题目进行详细分析与讲解：

【题目内容】
{body.question}
{answer_block}"""

    text = await chat_async(_ANALYSIS_SYSTEM, user_prompt, temperature=0.3)
    return {"markdown": text}
