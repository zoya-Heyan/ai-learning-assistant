from openai import AsyncOpenAI, OpenAI, RateLimitError

from app.core.config import settings


def _prompt(question: str, context: str) -> str:
    return f"""你是一个严谨、可靠的中文检索增强生成（RAG）助手。

【核心原则】
1. 只能基于【检索上下文】回答问题，禁止使用任何外部知识或自行推测。
2. 如果【检索上下文】不足以回答问题，必须明确回答：“我不知道”，并说明缺少哪些信息。
3. 不得编造事实、引用或来源。

【任务要求】
请根据提供的【检索上下文】，回答【用户问题】。

【回答格式】
请严格按照以下结构输出：

### 一、结论
- 用简洁语言直接回答用户问题（优先给出最终答案）

### 二、依据说明
- 分点列出支撑结论的证据
- 每条证据需标注来源：
  （来源：文档标题 + chunk 标识）
- 仅引用与问题直接相关的内容

### 三、逐条问题解答（如适用）
- 如果用户问题包含多个子问题，请逐条拆分并分别回答

### 四、不确定性说明（如适用）
- 如果部分问题无法从上下文得到：
  - 明确指出无法回答的部分
  - 说明原因（例如：上下文缺失 / 信息不足）
  - 可补充：需要哪些信息才能回答

【禁止行为】
- 使用常识补全答案
- 编造不存在的引用或来源
- 输出与上下文无关的信息

【检索上下文】
{context}

【用户问题】
{question}
"""


def _get_sync_client() -> OpenAI:
    base_url = settings.LLM_BASE_URL
    api_key = settings.LLM_API_KEY or "EMPTY"
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)


def _get_async_client() -> AsyncOpenAI:
    base_url = settings.LLM_BASE_URL
    api_key = settings.LLM_API_KEY or "EMPTY"
    if base_url:
        return AsyncOpenAI(api_key=api_key, base_url=base_url)
    return AsyncOpenAI(api_key=api_key)


def ask_llm(question: str, context: str) -> str:
    """Sync LLM call."""
    if not (settings.LLM_API_KEY or settings.LLM_BASE_URL):
        return "LLM not configured. Set LLM_BASE_URL (and optionally LLM_API_KEY)."
    client = _get_sync_client()
    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": _prompt(question, context)},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content
    except RateLimitError:
        return "⚠️ LLM quota exceeded."
    except Exception as e:
        return f"⚠️ LLM error: {str(e)}"


async def ask_llm_async(question: str, context: str) -> str:
    """Async LLM call."""
    if not (settings.LLM_API_KEY or settings.LLM_BASE_URL):
        return "LLM not configured. Set LLM_BASE_URL (and optionally LLM_API_KEY)."
    client = _get_async_client()
    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": _prompt(question, context)},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content
    except RateLimitError:
        return "⚠️ LLM quota exceeded."
    except Exception as e:
        return f"⚠️ LLM error: {str(e)}"


async def chat_async(system: str, user: str, temperature: float = 0.35) -> str:
    """Generic async chat for study tools (custom system prompt)."""
    if not (settings.LLM_API_KEY or settings.LLM_BASE_URL):
        return "LLM not configured. Set LLM_BASE_URL (and optionally LLM_API_KEY)."
    client = _get_async_client()
    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
    except RateLimitError:
        return "⚠️ LLM quota exceeded."
    except Exception as e:
        return f"⚠️ LLM error: {str(e)}"
