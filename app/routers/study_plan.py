"""Study plan generation module with LLM enhancement."""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

from app.services.llm import chat_async
from app.services.retrieval import retrieve_context
from app.services.study_plan_generator import generate_study_plan
from app.core.config import settings

router = APIRouter(prefix="/study-plan", tags=["study-plan"])

_STUDY_PLAN_SYSTEM = """你是学习规划专家，根据用户的情况和目标，生成个性化、结构化的周学习计划。

你必须输出一个合法的 JSON 对象，不要包含任何其他文字说明。JSON 格式如下：
{
  "weeks": [
    {
      "week": 1,
      "focus": "本周焦点（简短标题）",
      "topics": ["topic1", "topic2"],
      "tasks": ["任务1", "任务2"],
      "practice": ["练习1", "练习2"],
      "milestone": "本周完成时的里程碑描述"
    }
  ],
  "final_outcome": "完成计划后的最终成果描述"
}

注意：
- topics 只列出主题名称（英文或中文都可以）
- tasks 和 practice 必须是具体可执行的任务描述
- milestone 描述完成本周学习后的可见进步
- final_outcome 描述整体计划完成后的能力提升
- 如果有薄弱主题要复习，优先安排在第一周
- 确保每周的任务量与用户每天可用小时数匹配
- 语言使用简体中文（用户输入和输出都是中文环境）"""


class StudyPlanRequest(BaseModel):
    level: str = Field(..., description="用户水平: beginner, intermediate, advanced")
    known_topics: list[str] = Field(default_factory=list, description="已掌握的主题列表")
    weak_topics: list[str] = Field(default_factory=list, description="薄弱主题列表")
    learning_style: str = Field(default="hands-on", description="学习风格: visual, hands-on, reading, auditory")
    topic: str = Field(..., min_length=1, max_length=200, description="学习主题")
    duration_weeks: int = Field(..., ge=1, le=52, description="计划周期（周）")
    daily_hours: int = Field(..., ge=1, le=24, description="每天学习小时数")
    use_knowledge_base: bool = Field(default=False, description="是否使用知识库增强")
    kb_query: str | None = Field(default=None, max_length=4000, description="知识库检索词")


@router.post("/generate")
async def create_study_plan(request: Request, body: StudyPlanRequest):
    if body.duration_weeks <= 0:
        raise HTTPException(status_code=400, detail="duration_weeks must be at least 1")

    if body.daily_hours <= 0:
        raise HTTPException(status_code=400, detail="daily_hours must be at least 1")

    valid_levels = ["beginner", "intermediate", "advanced"]
    if body.level.lower() not in valid_levels:
        raise HTTPException(status_code=400, detail=f"level must be one of: {', '.join(valid_levels)}")

    kb_context = ""
    if body.use_knowledge_base:
        q = (body.kb_query or body.topic).strip()[:2000]
        try:
            refs, ctx = await retrieve_context(
                request,
                q,
                settings.SEARCH_TOP_K,
            )
            if ctx.strip():
                kb_context = f"\n\n【知识库相关资料】\n{ctx}\n"
        except Exception:
            kb_context = ""

    level_labels = {"beginner": "初级", "intermediate": "中级", "advanced": "高级"}
    style_labels = {
        "hands-on": "实践动手型",
        "visual": "视觉图形型",
        "reading": "阅读理解型",
        "auditory": "视听听力型",
    }

    user_prompt = f"""请为以下用户生成个性化的{body.duration_weeks}周学习计划：

【用户基本信息】
- 学习主题：{body.topic}
- 当前水平：{level_labels.get(body.level.lower(), body.level)}
- 每天可用时间：{body.daily_hours}小时
- 学习风格：{style_labels.get(body.learning_style, body.learning_style)}
- 已掌握主题：{', '.join(body.known_topics) if body.known_topics else '无'}
- 薄弱主题：{', '.join(body.weak_topics) if body.weak_topics else '无'}
{kb_context}

请生成一个循序渐进的周学习计划，确保：
1. 薄弱主题优先复习（如果有）
2. 已掌握的主题不重复安排
3. 每周任务量适中，可在 {body.daily_hours} 小时/天 内完成
4. 任务类型与学习风格匹配
5. 最后一周用于整合复习"""

    try:
        text = await chat_async(_STUDY_PLAN_SYSTEM, user_prompt, temperature=0.4)
        import json
        try:
            result = json.loads(text)
            if "weeks" in result and "final_outcome" in result:
                return result
        except json.JSONDecodeError:
            pass
        fallback = generate_study_plan(
            level=body.level,
            known_topics=body.known_topics,
            weak_topics=body.weak_topics,
            learning_style=body.learning_style,
            topic=body.topic,
            duration_weeks=body.duration_weeks,
            daily_hours=body.daily_hours,
        )
        if kb_context:
            fallback["final_outcome"] = fallback.get("final_outcome", "") + "（结合知识库补充内容）"
        return fallback
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成学习计划失败: {str(e)}")