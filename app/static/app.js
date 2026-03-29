const $ = (id) => document.getElementById(id);

const state = {
  apiBase: localStorage.getItem("API_BASE") || location.origin,
  docs: [],
  docFilter: "",
};

const I18N = {
  zh: {
    brandTitle: "AI RAG System",
    brandSubtitle: "Documents · Vector Search · LLM Answer",
    btnReload: "刷新",
    systemStatus: "系统状态",
    healthOut: "点击上面的按钮查看状态…",
    searchQA: "检索问答",
    queryLabel: "问题",
    queryHint: "⌘/Ctrl + Enter 发送",
    clearQuery: "清空问题",
    useLlmLabel: "使用 LLM 生成回答",
    btnSearch: "搜索",
    answerLabel: "回答",
    topKLabel: "Top-K 结果",
    learningTools: "学习工具",
    genQuestions: "生成习题",
    genQuestionsLead: "粘贴学习材料，生成高质量练习题（单选/多选/填空/简答），可结合知识库扩展。",
    useKbLabel: "结合知识库检索（扩展相关知识）",
    kbQueryLabel: "检索用语（可选，留空则用正文前段）",
    materialLabel: "学习材料",
    btnGenQuestions: "生成习题",
    btnClear: "清空",
    btnPreview: "预览",
    btnRaw: "源码",
    btnCopyMd: "复制 Markdown",
    btnCopy: "复制",
    btnDownloadMd: "下载 .md",
    genNotes: "笔记生成（Markdown）",
    genNotesLead: "按主题检索知识库并生成结构化笔记（标题、列表、要点）。",
    btnGenNotes: "生成笔记",
    questionAnalysis: "题目解析",
    questionAnalysisLead: "输入题目和答案，获取详细知识点解析与延伸讲解。",
    questionContent: "题目内容",
    correctAnswerOpt: "正确答案（可选）",
    btnStartAnalysis: "开始解析",
    docManagement: "文档管理",
    addDoc: "新增文档",
    docTitleLabel: "标题",
    docContentLabel: "内容",
    importWordLabel: "从 Word 导入（.docx）",
    dropzoneText: "拖拽 .docx 到此处，或点击下方选择文件",
    dropzoneHint: "服务端解析后自动创建文档并建索引（≤20MB）",
    dropzoneOr: "或",
    selectDocx: "选择 .docx",
    btnCreate: "创建",
    docList: "文档列表",
    btnRefreshList: "刷新列表",
    filterLabel: "过滤",
    footerTech: "RAG system（Qwen 7B + bge-small-zh）",
    footerTips: "Tips: 学习工具支持生成习题与 Markdown 笔记；默认 chunk_size≈400、TOP_K=3。",
    navHome: "首页",
    navSettings: "设置",
    navDocuments: "文档",
    navQA: "问答",
    navQuestions: "习题",
    navNotes: "笔记",
    navAnalysis: "解析",
    navStudyPlan: "学习计划",
    heroTitle: "欢迎使用 AI RAG 学习助手",
    heroSub: "选择下方模块开始使用",
    modDocuments: "文档管理",
    modDocumentsDesc: "上传、管理文档，支持 Word、纯文本",
    modQA: "检索问答",
    modQADesc: "基于知识库的自然语言问答",
    modQuestions: "生成习题",
    modQuestionsDesc: "从教材生成单选/多选/填空/简答题",
    modNotes: "笔记生成",
    modNotesDesc: "自动生成结构化 Markdown 笔记",
    modAnalysis: "题目解析",
    modAnalysisDesc: "获取题目的详细知识点解析",
    modStudyPlan: "学习计划",
    modStudyPlanDesc: "生成个性化周学习计划",
    modSettings: "系统设置",
    modSettingsDesc: "查看系统状态与配置信息",
    noDocs: "暂无文档",
    noResults: "无结果",
    creating: "正在创建并切分/向量化…（首次可能较慢）",
    createdOk: "创建成功",
    importedOk: "已导入文档",
    deletedOk: "已删除",
    searchDone: "搜索完成",
    questionsDone: "习题已生成",
    notesDone: "笔记已生成",
    analysisDone: "解析完成",
    copiedOk: "已复制",
    copiedMd: "已复制 Markdown",
    downloadedOk: "已下载",
    copiedFail: "复制失败（浏览器权限）",
    emptyTitle: "标题不能为空",
    emptyContent: "内容不能为空",
    emptyMaterial: "请粘贴学习材料",
    emptyQuestion: "请输入题目内容",
    emptyTopic: "请输入主题或关键词",
    emptyQuery: "请输入问题",
    onlyDocx: "仅支持 .docx 文件",
    fileSizeLimit: "文件需 ≤20MB",
    parsing: "正在上传并由服务端解析 docx…",
    confirmDelete: "确认删除？",
    uploadedOk: "上传成功",
    kbHits: "知识库命中",
    retrieved: "检索到",
    chars: "chars",
    docRowView: "查看",
    docRowEdit: "编辑",
    docRowDelete: "删除",
    noModification: "未做任何修改",
    updated: "已更新",
    docsLoaded: "加载文档",
    indexStats: "Index",
    totalDocs: "Total",
    draftRestored: "（上次生成的笔记已自动恢复）",
    switchLight: "切换到浅色模式",
    switchDark: "切换到深色模式",
    studyPlanTitle: "📅 学习计划生成",
    studyPlanLead: "根据你的水平和目标，生成个性化周学习计划",
    studyPlanTopic: "学习主题",
    studyPlanLevel: "用户水平",
    studyPlanDuration: "学习周期（周）",
    studyPlanHours: "每天学习小时数",
    studyPlanStyle: "学习风格",
    studyPlanKnown: "已掌握主题（逗号分隔）",
    studyPlanWeak: "薄弱主题（逗号分隔）",
    levelBeginner: "初级",
    levelIntermediate: "中级",
    levelAdvanced: "高级",
    styleHandsOn: "实践动手",
    styleVisual: "视觉图形",
    styleReading: "阅读理解",
    styleAuditory: "视听听力",
    btnGenStudyPlan: "生成学习计划",
    studyPlanEmptyTopic: "请输入学习主题",
    studyPlanGenerating: "正在生成学习计划…",
    studyPlanDone: "学习计划已生成",
    studyPlanFinalOutcome: "预期成果",
    studyPlanEmptyResult: "无学习计划结果",
    studyPlanUseKb: "结合知识库检索（扩展相关内容）",
    studyPlanKbQuery: "检索用语（可选，留空则用主题）",
  },
  en: {
    brandTitle: "AI RAG System",
    brandSubtitle: "Documents · Vector Search · LLM Answer",
    btnReload: "Reload",
    systemStatus: "System Status",
    healthOut: "Click a button above to check status…",
    searchQA: "Search & QA",
    queryLabel: "Question",
    queryHint: "⌘/Ctrl + Enter to send",
    clearQuery: "Clear question",
    useLlmLabel: "Use LLM to generate answer",
    btnSearch: "Search",
    answerLabel: "Answer",
    topKLabel: "Top-K Results",
    learningTools: "Learning Tools",
    genQuestions: "Generate Questions",
    genQuestionsLead: "Paste study materials to generate high-quality exercises (single/multi-choice, fill-in, essay), with optional knowledge base extension.",
    useKbLabel: "Use knowledge base retrieval (extend related knowledge)",
    kbQueryLabel: "Search query (optional, uses first part of text if empty)",
    materialLabel: "Study Material",
    btnGenQuestions: "Generate Questions",
    btnClear: "Clear",
    btnPreview: "Preview",
    btnRaw: "Raw",
    btnCopyMd: "Copy Markdown",
    btnCopy: "Copy",
    btnDownloadMd: "Download .md",
    genNotes: "Notes (Markdown)",
    genNotesLead: "Search knowledge base by topic and generate structured notes (headings, lists, key points).",
    btnGenNotes: "Generate Notes",
    questionAnalysis: "Question Analysis",
    questionAnalysisLead: "Enter a question and answer to get detailed knowledge analysis and extended explanation.",
    questionContent: "Question Content",
    correctAnswerOpt: "Correct Answer (optional)",
    btnStartAnalysis: "Start Analysis",
    docManagement: "Document Management",
    addDoc: "Add Document",
    docTitleLabel: "Title",
    docContentLabel: "Content",
    importWordLabel: "Import from Word (.docx)",
    dropzoneText: "Drag & drop .docx here, or click to select file",
    dropzoneHint: "Server parses and creates document with index (≤20MB)",
    dropzoneOr: "or",
    selectDocx: "Select .docx",
    btnCreate: "Create",
    docList: "Document List",
    btnRefreshList: "Refresh",
    filterLabel: "Filter",
    footerTech: "RAG system (Qwen 7B + bge-small-zh)",
    footerTips: "Tip: Learning tools generate exercises and Markdown notes; default chunk_size≈400, TOP_K=3.",
    navHome: "Home",
    navSettings: "Settings",
    navDocuments: "Documents",
    navQA: "QA",
    navQuestions: "Questions",
    navNotes: "Notes",
    navAnalysis: "Analysis",
    navStudyPlan: "Study Plan",
    heroTitle: "Welcome to AI RAG Learning Assistant",
    heroSub: "Select a module to get started",
    modDocuments: "Document Management",
    modDocumentsDesc: "Upload and manage documents, supports Word and plain text",
    modQA: "Search & QA",
    modQADesc: "Natural language Q&A based on knowledge base",
    modQuestions: "Generate Questions",
    modQuestionsDesc: "Generate single/multi-choice, fill-in, essay questions from materials",
    modNotes: "Notes Generation",
    modNotesDesc: "Auto-generate structured Markdown notes",
    modAnalysis: "Question Analysis",
    modAnalysisDesc: "Get detailed knowledge analysis for questions",
    modStudyPlan: "Study Plan",
    modStudyPlanDesc: "Generate personalized weekly study plans",
    modSettings: "System Settings",
    modSettingsDesc: "View system status and configuration",
    noDocs: "No documents",
    noResults: "No results",
    creating: "Creating and chunking/vectorizing… (first time may be slow)",
    createdOk: "Created successfully",
    importedOk: "Imported document",
    deletedOk: "Deleted",
    searchDone: "Search done",
    questionsDone: "Questions generated",
    notesDone: "Notes generated",
    analysisDone: "Analysis done",
    copiedOk: "Copied",
    copiedMd: "Copied Markdown",
    downloadedOk: "Downloaded",
    copiedFail: "Copy failed (browser permission)",
    emptyTitle: "Title is required",
    emptyContent: "Content is required",
    emptyMaterial: "Please paste study material",
    emptyQuestion: "Please enter question content",
    emptyTopic: "Please enter a topic or keyword",
    emptyQuery: "Please enter a question",
    onlyDocx: "Only .docx files are supported",
    fileSizeLimit: "File must be ≤20MB",
    parsing: "Uploading and parsing docx on server…",
    confirmDelete: "Confirm delete?",
    uploadedOk: "Uploaded",
    kbHits: "KB hits",
    retrieved: "Retrieved",
    chars: "chars",
    docRowView: "View",
    docRowEdit: "Edit",
    docRowDelete: "Delete",
    noModification: "No modifications made",
    updated: "Updated",
    docsLoaded: "Documents loaded",
    indexStats: "Index",
    totalDocs: "Total",
    draftRestored: "(Last generated notes auto-restored)",
    switchLight: "Switch to light mode",
    switchDark: "Switch to dark mode",
    studyPlanTitle: "📅 Study Plan Generator",
    studyPlanLead: "Generate a personalized weekly study plan based on your level and goals",
    studyPlanTopic: "Study Topic",
    studyPlanLevel: "User Level",
    studyPlanDuration: "Duration (weeks)",
    studyPlanHours: "Daily Hours",
    studyPlanStyle: "Learning Style",
    studyPlanKnown: "Known Topics (comma separated)",
    studyPlanWeak: "Weak Topics (comma separated)",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    styleHandsOn: "Hands-on",
    styleVisual: "Visual",
    styleReading: "Reading",
    styleAuditory: "Auditory",
    btnGenStudyPlan: "Generate Study Plan",
    studyPlanEmptyTopic: "Please enter a study topic",
    studyPlanGenerating: "Generating study plan…",
    studyPlanDone: "Study plan generated",
    studyPlanFinalOutcome: "Expected Outcome",
    studyPlanEmptyResult: "No study plan results",
    studyPlanUseKb: "Use knowledge base (extend related content)",
    studyPlanKbQuery: "Search query (optional, uses topic if empty)",
  },
};

let currentLang = localStorage.getItem("LANG") || "zh";

function t(key) {
  return (I18N[currentLang]?.[key]) || (I18N.zh[key]) || key;
}

function applyI18n(lang) {
  currentLang = lang;
  localStorage.setItem("LANG", lang);
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const txt = t(key);
    if (txt !== key) el.textContent = txt;
  });
  document.querySelectorAll(".langSwitch__btn").forEach((btn) => {
    btn.classList.toggle("langSwitch__btn--active", btn.getAttribute("data-lang") === lang);
  });
}

function applyTheme(theme) {
  let styleId = "custom-cursor-style";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    $("btnTheme").textContent = "☀️";
    $("btnTheme").setAttribute("title", t(currentLang === "zh" ? "switchLight" : "switchLightEn"));
    styleEl.textContent = `*, *::before, *::after { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='%23667eea' d='M16 4 L12 0 L14 8 L6 10 L10 16 L8 28 L16 24 L24 28 L22 16 L26 10 L18 8 L20 0 Z'/%3E%3Ccircle fill='%23ffd700' cx='12' cy='14' r='2'/%3E%3Ccircle fill='%23ffd700' cx='20' cy='14' r='2'/%3E%3C/svg%3E") 16 16, auto !important; }`;
  } else {
    document.documentElement.removeAttribute("data-theme");
    $("btnTheme").textContent = "🌙";
    $("btnTheme").setAttribute("title", t(currentLang === "zh" ? "switchDark" : "switchDarkEn"));
    styleEl.textContent = `*, *::before, *::after { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='%234a7c59' d='M16 2 Q26 8 26 18 Q26 28 16 30 Q6 28 6 18 Q6 8 16 2 Z'/%3E%3Cpath fill='none' stroke='%233a6147' stroke-width='1.5' d='M16 6 L16 26 M10 12 Q16 16 22 12'/%3E%3C/svg%3E") 16 16, auto !important; }`;
  }
  localStorage.setItem("THEME", theme);
}

function initTheme() {
  const saved = localStorage.getItem("THEME");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
}

function setApiBase(base) {
  state.apiBase = base.replace(/\/+$/, "");
  localStorage.setItem("API_BASE", state.apiBase);
  $("apiBasePill").textContent = state.apiBase;
}

function toast(msg, kind = "ok") {
  const el = $("toast");
  el.textContent = msg;
  el.className = `toast toast--show ${kind === "ok" ? "toast--ok" : "toast--bad"}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = "toast"; }, 2400);
}

async function api(path, { method = "GET", body } = {}) {
  const url = `${state.apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  const init = { method, headers: {} };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = data?.detail || (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return data;
}

async function apiForm(path, formData) {
  const url = `${state.apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = data?.detail || (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return data;
}

function prettyJson(x) {
  try { return JSON.stringify(x, null, 2); } catch { return String(x); }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function typewriter(el, text, speed = 18) {
  el.textContent = "";
  let i = 0;
  function step() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(step, speed);
    }
  }
  step();
}

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

/* ─────────────────────────────────────────────
   HOME PAGE — Landing
───────────────────────────────────────────── */
function initHome() {
  const canvas = document.getElementById("bannerCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const text = "AI RAG System";
  const chars = text.split("");
  let x = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#4a7c59";
    const char = chars[x % chars.length];
    ctx.fillText(char, 20 + x * 18, 50);
    x++;
    if (x < chars.length * 3) requestAnimationFrame(draw);
  }
  draw();
}

/* ─────────────────────────────────────────────
   STUDY PLAN — Generate Study Plan
───────────────────────────────────────────── */
function initStudyPlan() {
  const out = $("studyPlanOut");
  if (!out) return;

  $("spUseKb").addEventListener("change", () => {
    $("spKbRow").style.display = $("spUseKb").checked ? "block" : "none";
  });

  async function doGenStudyPlan() {
    const topic = $("spTopic").value.trim();
    if (!topic) { toast(t("studyPlanEmptyTopic"), "bad"); return; }
    const level = $("spLevel").value;
    const duration_weeks = Number($("spDuration").value) || 4;
    const daily_hours = Number($("spHours").value) || 2;
    const learning_style = $("spStyle").value;
    const known_topics = ($("spKnown").value || "").split(",").map((s) => s.trim()).filter(Boolean);
    const weak_topics = ($("spWeak").value || "").split(",").map((s) => s.trim()).filter(Boolean);
    const use_knowledge_base = $("spUseKb").checked;
    const kb_query = $("spKbQuery").value.trim() || null;

    out.innerHTML = `<div class="muted">${t("studyPlanGenerating")}</div>`;
    try {
      const payload = await api("/study-plan/generate", {
        method: "POST",
        body: { level, known_topics, weak_topics, learning_style, topic, duration_weeks, daily_hours, use_knowledge_base, kb_query },
      });
      renderStudyPlan(payload);
      toast(t("studyPlanDone"), "ok");
    } catch (e) {
      out.innerHTML = `<span class="danger">Error: ${escapeHtml(e.message)}</span>`;
      toast(e.message, "bad");
    }
  }

  function renderStudyPlan(data) {
    if (!data?.weeks?.length) {
      out.innerHTML = `<div class="muted">${data?.final_outcome || t("studyPlanEmptyResult")}</div>`;
      return;
    }
    const weeks = data.weeks;
    const finalOutcome = data.final_outcome || "";

    let html = `<div class="study-plan">`;
    for (const week of weeks) {
      html += `<div class="study-plan-week">
        <div class="study-plan-week__header">
          <span class="study-plan-week__num">Week ${week.week}</span>
          <span class="study-plan-week__focus">${escapeHtml(week.focus)}</span>
        </div>
        <div class="study-plan-week__body">
          <div class="study-plan-week__section">
            <div class="study-plan-week__label">Topics</div>
            <div class="study-plan-week__value">${week.topics.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ")}</div>
          </div>
          <div class="study-plan-week__section">
            <div class="study-plan-week__label">Tasks</div>
            <ul class="study-plan-week__list">${week.tasks.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
          <div class="study-plan-week__section">
            <div class="study-plan-week__label">Practice</div>
            <ul class="study-plan-week__list">${week.practice.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
          </div>
          <div class="study-plan-week__section">
            <div class="study-plan-week__label">Milestone</div>
            <div class="study-plan-week__milestone">${escapeHtml(week.milestone)}</div>
          </div>
        </div>
      </div>`;
    }
    html += `</div>`;

    if (finalOutcome) {
      html += `<div class="study-plan-final">
        <div class="study-plan-final__label">${t("studyPlanFinalOutcome")}</div>
        <div class="study-plan-final__value">${escapeHtml(finalOutcome)}</div>
      </div>`;
    }

    out.innerHTML = html;
  }

  $("btnGenStudyPlan").addEventListener("click", doGenStudyPlan);
  $("btnClearStudyPlan").addEventListener("click", () => {
    $("spTopic").value = "";
    $("spKnown").value = "";
    $("spWeak").value = "";
    $("spUseKb").checked = false;
    $("spKbQuery").value = "";
    $("spKbRow").style.display = "none";
    out.innerHTML = "";
  });
}

/* ─────────────────────────────────────────────
   QA PAGE — Search & Answer
───────────────────────────────────────────── */
function initQA() {
  const answerOut = $("answerOut");
  if (!answerOut) return;

  async function doSearch() {
    const query = $("queryInput").value.trim();
    if (!query) { toast(t("emptyQuery"), "bad"); return; }
    answerOut.textContent = "…";
    $("resultsOut").innerHTML = `<div class="muted">…</div>`;
    const use_llm = $("useLlm").checked;
    const top_k = Number($("topK").value) || 3;
    try {
      const payload = await api("/search/", { method: "POST", body: { query, use_llm, top_k } });
      renderSearchResults(payload);
      toast(t("searchDone"), "ok");
    } catch (e) {
      answerOut.innerHTML = `<span class="danger">Error: ${escapeHtml(e.message)}</span>`;
    }
  }

  function renderSearchResults(payload) {
    const text = payload?.answer ?? "—";
    typewriter(answerOut, text);
    const list = payload?.top_k_results || [];
    const out = $("resultsOut");
    if (!list.length) { out.innerHTML = `<div class="muted">${t("noResults")}</div>`; return; }
    out.innerHTML = list.map((r) => {
      const title = r.document_title || `document#${r.document_id}`;
      const meta = r.score !== undefined ? `score=${r.score.toFixed(3)}` : "";
      const chunk = r.chunk_index !== undefined ? `chunk=${r.chunk_index}` : "";
      const top = [title, chunk, meta].filter(Boolean).join(" · ");
      const content = r.content_preview || r.content || "";
      return `<div class="resultItem">
        <div class="resultItem__top"><span>${escapeHtml(top)}</span></div>
        <div class="resultItem__content">${escapeHtml(content)}</div>
      </div>`;
    }).join("");
  }

  $("queryInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doSearch(); }
  });
  $("btnSearch").addEventListener("click", () => doSearch());
  $("btnClearQuery").addEventListener("click", () => { $("queryInput").value = ""; $("queryInput").focus(); });
}

/* ─────────────────────────────────────────────
   SETTINGS PAGE — System Status & Documents
───────────────────────────────────────────── */
function initSettings() {
  async function loadHealth() {
    try {
      const data = await api("/health/");
      $("healthOut").textContent = prettyJson(data);
      toast("health ok", "ok");
    } catch (e) { $("healthOut").textContent = "Error: " + e.message; }
  }

  async function loadIndexStats() {
    try {
      const data = await api("/health/index");
      const ntotal = data?.ntotal ?? "?";
      const version = data?.version ?? "";
      const ready = data?.ready ?? false;
      const status = ready ? "✓ Ready" : "✗ Not Ready";
      $("healthOut").textContent = `Status: ${status}  |  Index docs: ${ntotal}  |  Version: ${version}`;
      toast("index stats ok", "ok");
    } catch (e) { $("healthOut").textContent = "Error: " + e.message; }
  }

  /* ── Docs ── */
  async function loadDocs() {
    try {
      const res = await api("/documents/");
      state.docs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      renderDocs();
      toast(`${t("docsLoaded")}: ${state.docs.length}`, "ok");
    } catch (e) { toast(e.message, "bad"); }
  }

  function renderDocs() {
    const out = $("docsOut");
    const q = state.docFilter.trim().toLowerCase();
    const rows = state.docs
      .map((d) => ({ id: d.id, title: d.title ?? "(untitled)", content: d.content ?? "" }))
      .filter((d) => {
        if (!q) return true;
        return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
      });
    if (!rows.length) { out.innerHTML = `<div class="muted">${t("noDocs")}</div>`; return; }
    out.innerHTML = rows.map((d) => {
      const preview = d.content.slice(0, 180) + (d.content.length > 180 ? "…" : "");
      return `<div class="docRow" data-docid="${d.id}">
        <div class="docRow__title">${escapeHtml(d.title)}</div>
        <div class="docRow__meta"><span>#${d.id}</span><span>${d.content.length} ${t("chars")}</span></div>
        <div class="muted" style="white-space:pre-wrap;font-size:12px;margin-bottom:10px">${escapeHtml(preview)}</div>
        <div class="docRow__actions">
          <button class="btn btn--sm" data-action="view">${t("docRowView")}</button>
          <button class="btn btn--sm" data-action="edit">${t("docRowEdit")}</button>
          <button class="btn btn--sm btn--danger" data-action="delete">${t("docRowDelete")}</button>
        </div>
      </div>`;
    }).join("");
  }

  async function deleteDoc(id) {
    await api(`/documents/${id}`, { method: "DELETE" });
    toast(`${t("deletedOk")}: #${id}`, "ok");
    await loadDocs();
  }

  async function viewDoc(id) {
    const doc = await api(`/documents/${id}`);
    $("healthOut").textContent = prettyJson(doc);
    toast(`#${id} → 状态栏`, "ok");
  }

  async function editDoc(id) {
    const doc = await api(`/documents/${id}`);
    const newTitle = window.prompt("编辑标题（留空不修改）", doc.title || "");
    if (newTitle === null) return;
    const newContent = window.prompt("编辑内容（留空不修改）", doc.content || "");
    if (newContent === null) return;
    const body = {};
    if (newTitle.trim() && newTitle.trim() !== doc.title) body.title = newTitle.trim();
    if (newContent.trim() && newContent !== doc.content) body.content = newContent;
    if (!Object.keys(body).length) { toast(t("noModification"), "ok"); return; }
    await api(`/documents/${id}`, { method: "PUT", body });
    toast(`${t("updated")}: #${id}`, "ok");
    await loadDocs();
  }

  async function createDoc() {
    const title = $("docTitle").value.trim();
    const content = $("docContent").value;
    if (!title) { toast(t("emptyTitle"), "bad"); return; }
    if (!content.trim()) { toast(t("emptyContent"), "bad"); return; }
    $("createHint").textContent = t("creating");
    const doc = await api("/documents/", { method: "POST", body: { title, content } });
    $("createHint").textContent = `${t("createdOk")}: #${doc.id}`;
    toast(`${t("createdOk")}: #${doc.id}`, "ok");
    $("docTitle").value = ""; $("docContent").value = "";
    await loadDocs();
  }

  async function handleFile(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['docx', 'pdf'].includes(ext)) { toast(t("onlyDocx"), "bad"); return; }
    if (file.size > 20 * 1024 * 1024) { toast(t("fileSizeLimit"), "bad"); return; }
    $("createHint").textContent = t("parsing");
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const doc = await apiForm("/documents/import-file", fd);
      $("docTitle").value = ""; $("docContent").value = "";
      const typeLabel = ext === 'pdf' ? '(PDF转Word)' : '';
      $("createHint").textContent = `${t("importedOk")} #${doc.id}：${doc.title} ${typeLabel}`;
      toast(`${t("importedOk")} #${doc.id}`, "ok");
      await loadDocs();
    } catch (e) { $("createHint").textContent = e.message; toast(e.message, "bad"); }
  }

  /* ── Event Bindings ── */
  $("btnHealth").addEventListener("click", loadHealth);
  $("btnIndex").addEventListener("click", loadIndexStats);
  $("btnLoadDocs").addEventListener("click", () => loadDocs());
  $("btnCreateDoc").addEventListener("click", () => createDoc());
  $("btnClearCreate").addEventListener("click", () => {
    $("docTitle").value = ""; $("docContent").value = ""; $("createHint").textContent = "";
  });
  $("docFilter").addEventListener("input", (e) => { state.docFilter = e.target.value; renderDocs(); });

  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const btnSelectFile = $("btnSelectFile");
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dropzone--dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dropzone--dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault(); dropzone.classList.remove("dropzone--dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  btnSelectFile.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener("change", () => { const file = fileInput.files?.[0]; if (file) handleFile(file); fileInput.value = ""; });

  $("docsOut").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = e.target.closest(".docRow");
    if (!row) return;
    const id = row.getAttribute("data-docid");
    const action = btn.getAttribute("data-action");
    if (!id) return;
    if (action === "delete") {
      if (window.confirm(t("confirmDelete"))) deleteDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    } else if (action === "view") {
      viewDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    } else if (action === "edit") {
      editDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    }
  });

  loadDocs();
}

/* ─────────────────────────────────────────────
   DOCUMENTS PAGE — Document Management
───────────────────────────────────────────── */
function initDocuments() {
  if (!$("docsOut")) return;

  async function loadDocs() {
    try {
      const res = await api("/documents/");
      state.docs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      renderDocs();
      toast(`${t("docsLoaded")}: ${state.docs.length}`, "ok");
    } catch (e) { toast(e.message, "bad"); }
  }

  function renderDocs() {
    const out = $("docsOut");
    const q = state.docFilter.trim().toLowerCase();
    const rows = state.docs
      .map((d) => ({ id: d.id, title: d.title ?? "(untitled)", content: d.content ?? "" }))
      .filter((d) => {
        if (!q) return true;
        return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
      });
    if (!rows.length) { out.innerHTML = `<div class="muted">${t("noDocs")}</div>`; return; }
    out.innerHTML = rows.map((d) => {
      const preview = d.content.slice(0, 180) + (d.content.length > 180 ? "…" : "");
      return `<div class="docRow" data-docid="${d.id}">
        <div class="docRow__title">${escapeHtml(d.title)}</div>
        <div class="docRow__meta"><span>#${d.id}</span><span>${d.content.length} ${t("chars")}</span></div>
        <div class="muted" style="white-space:pre-wrap;font-size:12px;margin-bottom:10px">${escapeHtml(preview)}</div>
        <div class="docRow__actions">
          <button class="btn btn--sm" data-action="view">${t("docRowView")}</button>
          <button class="btn btn--sm" data-action="edit">${t("docRowEdit")}</button>
          <button class="btn btn--sm btn--danger" data-action="delete">${t("docRowDelete")}</button>
        </div>
      </div>`;
    }).join("");
  }

  async function deleteDoc(id) {
    await api(`/documents/${id}`, { method: "DELETE" });
    toast(`${t("deletedOk")}: #${id}`, "ok");
    await loadDocs();
  }

  async function viewDoc(id) {
    const doc = await api(`/documents/${id}`);
    $("healthOut").textContent = prettyJson(doc);
    toast(`#${id} → 状态栏`, "ok");
  }

  async function editDoc(id) {
    const doc = await api(`/documents/${id}`);
    const newTitle = window.prompt("编辑标题（留空不修改）", doc.title || "");
    if (newTitle === null) return;
    const newContent = window.prompt("编辑内容（留空不修改）", doc.content || "");
    if (newContent === null) return;
    const body = {};
    if (newTitle.trim() && newTitle.trim() !== doc.title) body.title = newTitle.trim();
    if (newContent.trim() && newContent !== doc.content) body.content = newContent;
    if (!Object.keys(body).length) { toast(t("noModification"), "ok"); return; }
    await api(`/documents/${id}`, { method: "PUT", body });
    toast(`${t("updated")}: #${id}`, "ok");
    await loadDocs();
  }

  async function createDoc() {
    const title = $("docTitle").value.trim();
    const content = $("docContent").value;
    if (!title) { toast(t("emptyTitle"), "bad"); return; }
    if (!content.trim()) { toast(t("emptyContent"), "bad"); return; }
    $("createHint").textContent = t("creating");
    const doc = await api("/documents/", { method: "POST", body: { title, content } });
    $("createHint").textContent = `${t("createdOk")}: #${doc.id}`;
    toast(`${t("createdOk")}: #${doc.id}`, "ok");
    $("docTitle").value = ""; $("docContent").value = "";
    await loadDocs();
  }

  async function handleFile(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['docx', 'pdf'].includes(ext)) { toast(t("onlyDocx"), "bad"); return; }
    if (file.size > 20 * 1024 * 1024) { toast(t("fileSizeLimit"), "bad"); return; }
    $("createHint").textContent = t("parsing");
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const doc = await apiForm("/documents/import-file", fd);
      $("docTitle").value = ""; $("docContent").value = "";
      const typeLabel = ext === 'pdf' ? '(PDF转Word)' : '';
      $("createHint").textContent = `${t("importedOk")} #${doc.id}：${doc.title} ${typeLabel}`;
      toast(`${t("importedOk")} #${doc.id}`, "ok");
      await loadDocs();
    } catch (e) { $("createHint").textContent = e.message; toast(e.message, "bad"); }
  }

  $("btnLoadDocs").addEventListener("click", () => loadDocs());
  $("btnCreateDoc").addEventListener("click", () => createDoc());
  $("btnClearCreate").addEventListener("click", () => {
    $("docTitle").value = ""; $("docContent").value = ""; $("createHint").textContent = "";
  });
  $("docFilter").addEventListener("input", (e) => { state.docFilter = e.target.value; renderDocs(); });

  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const btnSelectFile = $("btnSelectFile");
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dropzone--dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dropzone--dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault(); dropzone.classList.remove("dropzone--dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  btnSelectFile.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener("change", () => { const file = fileInput.files?.[0]; if (file) handleFile(file); fileInput.value = ""; });

  $("docsOut").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = e.target.closest(".docRow");
    if (!row) return;
    const id = row.getAttribute("data-docid");
    const action = btn.getAttribute("data-action");
    if (!id) return;
    if (action === "delete") {
      if (window.confirm(t("confirmDelete"))) deleteDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    } else if (action === "view") {
      viewDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    } else if (action === "edit") {
      editDoc(Number(id)).catch((err) => toast(err.message, "bad"));
    }
  });

  loadDocs();
}

/* ─────────────────────────────────────────────
   QUESTIONS PAGE — Generate Questions
───────────────────────────────────────────── */
function initQuestions() {
  if (!$("wrongInput")) return;

  let questionsMd = "";

  function stripMd(md) {
    return (md || "").replace(/```(?:markdown|md)?\n?[\s\S]*?```/gi, "").replace(/^```\s*$/gm, "").trim();
  }

  function renderMdPreview(previewId, outId, md) {
    const preview = $(previewId);
    const out = $(outId);
    if (!md || !md.trim()) { preview.innerHTML = `<span class="muted">—</span>`; return; }
    const clean = stripMd(md);
    if (typeof marked !== "undefined") {
      preview.innerHTML = marked.parse(clean);
      preview.hidden = false;
      out.hidden = true;
    } else {
      out.textContent = md;
      out.hidden = false;
      preview.hidden = true;
    }
  }

  function downloadMd(text, filename) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(URL);
    toast(`${t("downloadedOk")}: ${filename}`, "ok");
  }

  function copyMd(preId) {
    const text = $(preId)?.textContent ?? "";
    if (!text.trim()) { toast(t("emptyMaterial"), "bad"); return; }
    copyText(text).then(() => toast(t("copiedMd"), "ok")).catch(() => toast(t("copiedFail"), "bad"));
  }

  async function doQuestions() {
    const source_text = $("wrongInput").value.trim();
    if (!source_text) { toast(t("emptyMaterial"), "bad"); return; }
    $("wrongMeta").textContent = "…";
    $("wrongOut").hidden = true; $("wrongPreview").hidden = true; $("wrongActions").hidden = true;
    const use_knowledge_base = $("wrongUseKb").checked;
    const kb_query = $("wrongKbQuery").value.trim() || null;
    const top_k = Number($("wrongTopK").value) || 5;
    try {
      const payload = await api("/tools/generate-questions", {
        method: "POST", body: { source_text, use_knowledge_base, kb_query, top_k },
      });
      questionsMd = payload?.markdown ?? "—";
      typewriter($("wrongOut"), questionsMd);
      renderMdPreview("wrongPreview", "wrongOut", questionsMd);
      $("wrongActions").hidden = false;
      let meta = t("questionsDone");
      if (use_knowledge_base) meta += ` · ${t("kbHits")} ${payload.kb_hits ?? 0}`;
      $("wrongMeta").textContent = meta;
      const el = $("wrongRefs");
      if (el) {
        const results = payload?.top_k_results || [];
        const titles = results.slice(0, 3).map((r) => r.document_title || `#${r.document_id}`).join(", ");
        el.textContent = titles + (results.length > 3 ? ` +${results.length - 3}` : "");
      }
      toast(t("questionsDone"), "ok");
    } catch (e) {
      $("wrongMeta").textContent = e.message;
      toast(e.message, "bad");
    }
  }

  function setQuestionsView(view) {
    $("btnWrongView")?.classList.toggle("btn--active", view === "preview");
    $("btnWrongRaw")?.classList.toggle("btn--active", view === "raw");
    if (view === "preview") { $("wrongPreview").hidden = false; $("wrongOut").hidden = true; }
    else { $("wrongPreview").hidden = true; $("wrongOut").hidden = false; }
  }

  $("wrongUseKb").addEventListener("change", () => {
    $("wrongKbRow").classList.toggle("is-hidden", !$("wrongUseKb").checked);
  });
  $("btnWrongGo").addEventListener("click", doQuestions);
  $("btnWrongClear").addEventListener("click", () => {
    $("wrongInput").value = ""; $("wrongMeta").textContent = "";
    $("wrongOut").textContent = ""; $("wrongOut").hidden = true;
    $("wrongPreview").innerHTML = ""; $("wrongPreview").hidden = true;
    $("wrongActions").hidden = true; questionsMd = "";
  });
  $("btnWrongView").addEventListener("click", () => setQuestionsView("preview"));
  $("btnWrongRaw").addEventListener("click", () => setQuestionsView("raw"));
  $("btnWrongCopy").addEventListener("click", () => copyMd("wrongOut"));
  $("btnWrongDownload").addEventListener("click", () => {
    const fn = `questions_${Date.now()}.md`;
    downloadMd($("wrongOut").textContent || questionsMd, fn);
  });
}

/* ─────────────────────────────────────────────
   NOTES PAGE — Generate Notes
───────────────────────────────────────────── */
function initNotes() {
  if (!$("notesTopic")) return;

  let notesMd = "";

  function stripMd(md) {
    return (md || "").replace(/```(?:markdown|md)?\n?[\s\S]*?```/gi, "").replace(/^```\s*$/gm, "").trim();
  }

  function renderMdPreview(previewId, outId, md) {
    const preview = $(previewId);
    const out = $(outId);
    if (!md || !md.trim()) { preview.innerHTML = `<span class="muted">—</span>`; return; }
    const clean = stripMd(md);
    if (typeof marked !== "undefined") {
      preview.innerHTML = marked.parse(clean);
      preview.hidden = false;
      out.hidden = true;
    } else {
      out.textContent = md;
      out.hidden = false;
      preview.hidden = true;
    }
  }

  function downloadMd(text, filename) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(URL);
    toast(`${t("downloadedOk")}: ${filename}`, "ok");
  }

  function copyMd(preId) {
    const text = $(preId)?.textContent ?? "";
    if (!text.trim()) { toast(t("emptyMaterial"), "bad"); return; }
    copyText(text).then(() => toast(t("copiedMd"), "ok")).catch(() => toast(t("copiedFail"), "bad"));
  }

  function saveNotesHistory(topic) {
    try {
      const raw = localStorage.getItem("notes_history") || "[]";
      const arr = JSON.parse(raw);
      const filtered = arr.filter((x) => x !== topic);
      localStorage.setItem("notes_history", JSON.stringify([topic, ...filtered].slice(0, 20)));
      renderNotesHistory();
    } catch {}
  }

  function renderNotesHistory() {
    try {
      const raw = localStorage.getItem("notes_history") || "[]";
      const arr = JSON.parse(raw);
      const dl = $("notesHistory");
      if (!dl) return;
      dl.innerHTML = arr.map((x) => `<option value="${escapeHtml(x)}">`).join("");
    } catch {}
  }

  function saveNotesDraft(topic, md) {
    try { localStorage.setItem("notes_draft", JSON.stringify({ topic, md, ts: Date.now() })); } catch {}
  }

  function loadNotesDraft() {
    try {
      const raw = localStorage.getItem("notes_draft");
      if (!raw) return;
      const { topic, md, ts } = JSON.parse(raw);
      if (!topic || !md) return;
      if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) { localStorage.removeItem("notes_draft"); return; }
      $("notesTopic").value = topic;
      notesMd = md;
      $("notesOut").textContent = md;
      renderMdPreview("notesPreview", "notesOut", md);
      $("notesActions").hidden = false;
      $("notesMeta").textContent = t("draftRestored");
    } catch {}
  }

  async function doNotes() {
    const topic = $("notesTopic").value.trim();
    if (!topic) { toast(t("emptyTopic"), "bad"); return; }
    $("notesMeta").textContent = "…";
    $("notesOut").hidden = true; $("notesPreview").hidden = true; $("notesActions").hidden = true;
    const top_k = Number($("notesTopK").value) || 6;
    try {
      const payload = await api("/tools/markdown-notes", { method: "POST", body: { topic, top_k } });
      notesMd = payload?.markdown ?? "—";
      typewriter($("notesOut"), notesMd);
      renderMdPreview("notesPreview", "notesOut", notesMd);
      $("notesActions").hidden = false;
      const n = (payload?.top_k_results || []).length;
      $("notesMeta").textContent = `${t("retrieved")} ${n} ${t("chars")} · Markdown ${t("notesDone")}`;
      saveNotesHistory(topic);
      saveNotesDraft(topic, notesMd);
      const el = $("notesRefs");
      if (el) {
        const results = payload?.top_k_results || [];
        const titles = results.slice(0, 3).map((r) => r.document_title || `#${r.document_id}`).join(", ");
        el.textContent = titles + (results.length > 3 ? ` +${results.length - 3}` : "");
      }
      toast(t("notesDone"), "ok");
    } catch (e) {
      $("notesMeta").textContent = e.message;
      toast(e.message, "bad");
    }
  }

  function setNotesView(view) {
    $("btnNotesView")?.classList.toggle("btn--active", view === "preview");
    $("btnNotesRaw")?.classList.toggle("btn--active", view === "raw");
    if (view === "preview") { $("notesPreview").hidden = false; $("notesOut").hidden = true; }
    else { $("notesPreview").hidden = true; $("notesOut").hidden = false; }
  }

  $("btnNotesGo").addEventListener("click", doNotes);
  $("btnNotesClear").addEventListener("click", () => {
    $("notesTopic").value = ""; $("notesMeta").textContent = "";
    $("notesOut").textContent = ""; $("notesOut").hidden = true;
    $("notesPreview").innerHTML = ""; $("notesPreview").hidden = true;
    $("notesActions").hidden = true; notesMd = "";
    localStorage.removeItem("notes_draft");
  });
  $("btnNotesView").addEventListener("click", () => setNotesView("preview"));
  $("btnNotesRaw").addEventListener("click", () => setNotesView("raw"));
  $("btnNotesCopy").addEventListener("click", () => copyMd("notesOut"));
  $("btnNotesDownload").addEventListener("click", () => {
    const topic = $("notesTopic").value.trim() || "notes";
    const fn = `${topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.md`;
    downloadMd($("notesOut").textContent || notesMd, fn);
  });

  loadNotesDraft();
  renderNotesHistory();
}

/* ─────────────────────────────────────────────
   ANALYSIS PAGE — Question Analysis
───────────────────────────────────────────── */
function initAnalysis() {
  if (!$("analysisQuestion")) return;

  let analysisMd = "";

  function stripMd(md) {
    return (md || "").replace(/```(?:markdown|md)?\n?[\s\S]*?```/gi, "").replace(/^```\s*$/gm, "").trim();
  }

  function renderMdPreview(previewId, outId, md) {
    const preview = $(previewId);
    const out = $(outId);
    if (!md || !md.trim()) { preview.innerHTML = `<span class="muted">—</span>`; return; }
    const clean = stripMd(md);
    if (typeof marked !== "undefined") {
      preview.innerHTML = marked.parse(clean);
      preview.hidden = false;
      out.hidden = true;
    } else {
      out.textContent = md;
      out.hidden = false;
      preview.hidden = true;
    }
  }

  function copyMd(preId) {
    const text = $(preId)?.textContent ?? "";
    if (!text.trim()) { toast(t("emptyMaterial"), "bad"); return; }
    copyText(text).then(() => toast(t("copiedMd"), "ok")).catch(() => toast(t("copiedFail"), "bad"));
  }

  async function doAnalysis() {
    const question = $("analysisQuestion").value.trim();
    if (!question) { toast(t("emptyQuestion"), "bad"); return; }
    $("analysisMeta").textContent = "…";
    $("analysisOut").hidden = true; $("analysisPreview").hidden = true; $("analysisActions").hidden = true;
    const answer = $("analysisAnswer").value.trim() || null;
    try {
      const payload = await api("/tools/analyze-question", {
        method: "POST", body: { question, answer },
      });
      analysisMd = payload?.markdown ?? "—";
      typewriter($("analysisOut"), analysisMd);
      renderMdPreview("analysisPreview", "analysisOut", analysisMd);
      $("analysisActions").hidden = false;
      $("analysisMeta").textContent = t("analysisDone");
      toast(t("analysisDone"), "ok");
    } catch (e) {
      $("analysisMeta").textContent = e.message;
      toast(e.message, "bad");
    }
  }

  function setAnalysisView(view) {
    $("btnAnalysisView")?.classList.toggle("btn--active", view === "preview");
    $("btnAnalysisRaw")?.classList.toggle("btn--active", view === "raw");
    if (view === "preview") { $("analysisPreview").hidden = false; $("analysisOut").hidden = true; }
    else { $("analysisPreview").hidden = true; $("analysisOut").hidden = false; }
  }

  $("btnAnalysisGo").addEventListener("click", doAnalysis);
  $("btnAnalysisClear").addEventListener("click", () => {
    $("analysisQuestion").value = ""; $("analysisAnswer").value = "";
    $("analysisMeta").textContent = "";
    $("analysisOut").textContent = ""; $("analysisOut").hidden = true;
    $("analysisPreview").innerHTML = ""; $("analysisPreview").hidden = true;
    $("analysisActions").hidden = true; analysisMd = "";
  });
  $("btnAnalysisView").addEventListener("click", () => setAnalysisView("preview"));
  $("btnAnalysisRaw").addEventListener("click", () => setAnalysisView("raw"));
  $("btnAnalysisCopy").addEventListener("click", () => copyMd("analysisOut"));
}

/* ─────────────────────────────────────────────
   SHARED INIT
───────────────────────────────────────────── */
function initLangSwitch() {
  document.querySelectorAll(".langSwitch__btn").forEach((btn) => {
    btn.addEventListener("click", () => applyI18n(btn.getAttribute("data-lang")));
  });
}

function initApiBasePill() {
  try {
    const u = new URL(state.apiBase);
    $("apiBasePill").textContent = u.host;
  } catch {
    $("apiBasePill").textContent = state.apiBase;
  }
}

function init() {
  initTheme();
  applyI18n(currentLang);
  initLangSwitch();
  setApiBase(state.apiBase);
  initApiBasePill();
  $("btnTheme").addEventListener("click", toggleTheme);

  const path = location.pathname;
  if (path === "/" || path === "") {
    initHome();
    initStudyPlan();
  } else if (path === "/documents") {
    initDocuments();
  } else if (path === "/qa") {
    initQA();
  } else if (path === "/questions") {
    initQuestions();
  } else if (path === "/notes") {
    initNotes();
  } else if (path === "/analysis") {
    initAnalysis();
  } else if (path === "/settings") {
    initSettings();
  }
}

document.addEventListener("DOMContentLoaded", init);