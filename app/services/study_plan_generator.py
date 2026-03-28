from typing import TypedDict


class WeekPlan(TypedDict):
    week: int
    focus: str
    topics: list[str]
    tasks: list[str]
    practice: list[str]
    milestone: str


class StudyPlanOutput(TypedDict):
    weeks: list[WeekPlan]
    final_outcome: str


def generate_study_plan(
    level: str,
    known_topics: list[str],
    weak_topics: list[str],
    learning_style: str,
    topic: str,
    duration_weeks: int,
    daily_hours: int,
) -> StudyPlanOutput:
    if duration_weeks <= 0:
        return {"weeks": [], "final_outcome": "Invalid duration. Please specify at least 1 week."}

    known_set = set(known_topics)
    weak_set = set(weak_topics)
    target_topics = _get_target_topics(topic, level)

    topics_pool = [t for t in target_topics if t not in known_set]
    prerequisite_review = [t for t in weak_topics if t not in known_set]

    if not topics_pool:
        return {
            "weeks": [],
            "final_outcome": f"You already know all topics in {topic}. Consider expanding to related areas."
        }

    weeks_data: list[WeekPlan] = []
    topics_per_week = max(1, len(topics_pool) // duration_weeks)
    hours_per_week = daily_hours * 7

    if prerequisite_review:
        weeks_data.append(_build_prerequisite_week(prerequisite_review, hours_per_week))
        duration_weeks -= 1

    week_offset = len(weeks_data)
    for i in range(duration_weeks):
        start_idx = i * topics_per_week
        end_idx = start_idx + topics_per_week
        week_topics = topics_pool[start_idx:end_idx]

        if not week_topics:
            continue

        focus = _determine_focus(week_topics, level, i, duration_weeks)
        tasks = _generate_tasks(week_topics, learning_style, daily_hours)
        practice = _generate_practice(week_topics, learning_style)
        milestone = _generate_milestone(week_topics, i + week_offset + 1)

        weeks_data.append(WeekPlan(
            week=i + week_offset + 1,
            focus=focus,
            topics=week_topics,
            tasks=tasks,
            practice=practice,
            milestone=milestone,
        ))

    if not weeks_data:
        return {"weeks": [], "final_outcome": "Unable to generate study plan with given parameters."}

    final_outcome = _generate_final_outcome(topic, level, known_topics, weak_topics, weeks_data)

    return StudyPlanOutput(weeks=weeks_data, final_outcome=final_outcome)


def _get_target_topics(topic: str, level: str) -> list[str]:
    topic_defaults: dict[str, dict[str, list[str]]] = {
        "python": {
            "beginner": ["variables", "data_types", "conditionals", "loops", "functions", "lists", "dicts", "file_io"],
            "intermediate": ["oop", "error_handling", "modules", "decorators", "generators", "context_managers", "testing"],
            "advanced": ["metaclasses", "async_io", "concurrency", "design_patterns", "testing_advanced", "profiling", "c_extensions"],
        },
        "javascript": {
            "beginner": ["variables", "data_types", "functions", "conditionals", "loops", "dom", "events"],
            "intermediate": ["closures", "promises", "async_await", "modules", "classes", "testing"],
            "advanced": ["event_loop", "memory_management", "proxies", "generators", "web_components", "optimization"],
        },
        "machine_learning": {
            "beginner": ["linear_regression", "logistic_regression", "decision_trees", "data_preprocessing", "visualization"],
            "intermediate": ["svm", "ensemble_methods", "feature_engineering", "model_selection", "neural_networks"],
            "advanced": ["deep_learning", "cnns", "rnns", "transformers", "reinforcement_learning", "ml_system_design"],
        },
        "data_science": {
            "beginner": ["pandas_basics", "numpy_basics", "data_visualization", "statistics_basics", "data_cleaning"],
            "intermediate": ["statistical_analysis", "feature_engineering", "exploratory_analysis", "sql_advanced", "visualization_advanced"],
            "advanced": ["time_series", "bayesian_methods", "causal_inference", "ml_for_data_science", "big_data_tools"],
        },
        "web_development": {
            "beginner": ["html", "css", "javascript_basics", "dom_manipulation", "responsive_design"],
            "intermediate": ["frontend_frameworks", "backend_basics", "databases", "api_design", "authentication"],
            "advanced": ["microservices", "caching_strategies", "security_advanced", "deployment", "performance_optimization"],
        },
    }

    if topic.lower() in topic_defaults:
        level_key = level.lower()
        return topic_defaults[topic.lower()].get(level_key, topic_defaults[topic.lower()]["beginner"])

    generic_topics: dict[str, list[str]] = {
        "beginner": ["fundamentals", "basic_concepts", "syntax", "core_principles", "simple_projects"],
        "intermediate": ["intermediate_concepts", "best_practices", "common_patterns", "tooling", "building_projects"],
        "advanced": ["advanced_patterns", "architecture", "optimization", "scalability", "expert_level_concepts"],
    }
    return generic_topics.get(level.lower(), generic_topics["beginner"])


def _build_prerequisite_week(prerequisite_review: list[str], hours_per_week: int) -> WeekPlan:
    topics_to_review = prerequisite_review[:3]
    tasks = [f"Review and practice {topic} fundamentals" for topic in topics_to_review]
    practice = [f"Complete exercises on {topic}" for topic in topics_to_review]

    return WeekPlan(
        week=1,
        focus="Prerequisite Review",
        topics=topics_to_review,
        tasks=tasks,
        practice=practice,
        milestone=f"Strong foundation in {', '.join(topics_to_review)}",
    )


def _determine_focus(topics: list[str], level: str, week_index: int, total_weeks: int) -> str:
    is_first_half = week_index < total_weeks / 2
    is_last_week = week_index == total_weeks - 1

    if is_last_week:
        return "Integration & Review"
    elif is_first_half:
        return "Core Concepts"
    elif level.lower() == "advanced":
        return "Advanced Patterns"
    else:
        return "Building & Applying"


def _generate_tasks(topics: list[str], learning_style: str, daily_hours: int) -> list[str]:
    style_lower = learning_style.lower()
    tasks: list[str] = []

    if "visual" in style_lower:
        tasks.append(f"Create diagrams or charts explaining {topics[0]}")
    if "hands" in style_lower or "practical" in style_lower:
        tasks.append(f"Build a small project using {topics[0]}")
        tasks.append(f"Complete coding exercises on {topics[1] if len(topics) > 1 else topics[0]}")
    if "reading" in style_lower or "theoretical" in style_lower:
        tasks.append(f"Read documentation on {topics[0]}")
        tasks.append(f"Take notes on key concepts")
    if "auditory" in style_lower or "video" in style_lower:
        tasks.append(f"Watch tutorial videos on {topics[0]}")
        tasks.append(f"Explain concepts aloud")

    if not tasks:
        tasks.append(f"Study and practice {', '.join(topics[:2])}")

    return tasks


def _generate_practice(topics: list[str], learning_style: str) -> list[str]:
    style_lower = learning_style.lower()
    practice: list[str] = []

    for topic in topics[:2]:
        if "visual" in style_lower:
            practice.append(f"Create visual representations of {topic}")
        elif "hands" in style_lower or "practical" in style_lower:
            practice.append(f"Build something with {topic}")
        elif "reading" in style_lower or "theoretical" in style_lower:
            practice.append(f"Write summary notes on {topic}")
        else:
            practice.append(f"Practice exercises on {topic}")

    return practice


def _generate_milestone(topics: list[str], week_num: int) -> str:
    return f"By end of week {week_num}: Comfortable with {', '.join(topics[:2])}"


def _generate_final_outcome(
    topic: str,
    level: str,
    known_topics: list[str],
    weak_topics: list[str],
    weeks_data: list[WeekPlan],
) -> str:
    all_covered_topics = []
    for week in weeks_data:
        all_covered_topics.extend(week["topics"])

    unique_topics = set(all_covered_topics)

    outcome = f"After completing this {len(weeks_data)}-week {topic} study plan, "
    outcome += f"you will have a solid understanding of {', '.join(unique_topics)}. "

    if weak_topics:
        outcome += f"You will also have addressed your weak areas: {', '.join(weak_topics[:2])}. "

    if level.lower() == "beginner":
        outcome += "You will be ready to move to intermediate topics."
    elif level.lower() == "intermediate":
        outcome += "You will be prepared for advanced concepts and real-world projects."
    else:
        outcome += "You will be equipped with expert-level knowledge and best practices."

    return outcome


if __name__ == "__main__":
    sample_input = {
        "level": "intermediate",
        "known_topics": ["functions", "lists"],
        "weak_topics": ["oop", "decorators"],
        "learning_style": "hands-on",
        "topic": "python",
        "duration_weeks": 3,
        "daily_hours": 2,
    }

    result = generate_study_plan(**sample_input)
    import json
    print(json.dumps(result, indent=2))