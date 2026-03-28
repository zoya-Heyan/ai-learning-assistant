const $ = (id) => document.getElementById(id);

const state = {
  apiBase: window.localStorage.getItem("API_BASE") || window.location.origin,
  docs: [],
  docFilter: "",
};

function setApiBase(base) {
  state.apiBase = base.replace(/\/+$/, "");
  window.localStorage.setItem("API_BASE", state.apiBase);
  $("apiBasePill").textContent = `API: ${state.apiBase}`;
}

function toast(msg, kind = "ok") {
  const el = $("toast");
  el.textContent = msg;
  el.className = `toast toast--show ${kind === "ok" ? "toast--ok" : "toast--bad"}`;
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => {
    el.className = "toast";
  }, 2400);
}

async function api(path, { method = "GET", body, headers } = {}) {
  const url = `${state.apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  const init = { method, headers: { ...(headers || {}) } };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = data?.detail || (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return data;
}

function prettyJson(x) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function normalizeDocRow(raw) {
  // APIResponse data likely list[dict] from db layer. Keep fields flexible.
  return {
    id: raw.id,
    title: raw.title ?? "(untitled)",
    content: raw.content ?? "",
  };
}

function renderDocs() {
  const out = $("docsOut");
  const q = state.docFilter.trim().toLowerCase();
  const rows = (state.docs || [])
    .map(normalizeDocRow)
    .filter((d) => {
      if (!q) return true;
      return (d.title || "").toLowerCase().includes(q) || (d.content || "").toLowerCase().includes(q);
    });

  if (!rows.length) {
    out.innerHTML = `<div class="muted">暂无文档。你可以先在左侧创建一篇。</div>`;
    return;
  }

  out.innerHTML = rows
    .map((d) => {
      const preview = (d.content || "").slice(0, 180) + ((d.content || "").length > 180 ? "…" : "");
      return `
        <div class="docRow" data-docid="${d.id}">
          <div class="docRow__title">${escapeHtml(d.title)}</div>
          <div class="docRow__meta">
            <span>#${d.id}</span>
            <span>${d.content.length} chars</span>
          </div>
          <div class="muted" style="white-space: pre-wrap; font-size: 12px; margin-bottom: 10px;">${escapeHtml(preview)}</div>
          <div class="docRow__actions">
            <button class="btn" data-action="view">查看</button>
            <button class="btn" data-action="edit">编辑</button>
            <button class="btn btn--danger" data-action="delete">删除</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSearchResults(payload) {
  $("answerOut").textContent = payload?.answer ?? "—";
  const list = payload?.top_k_results || [];
  const out = $("resultsOut");
  if (!list.length) {
    out.innerHTML = `<div class="muted">无结果</div>`;
    return;
  }
  out.innerHTML = list
    .map((r) => {
      const title = r.document_title || `document#${r.document_id}`;
      const meta = r.score !== undefined ? `score=${r.score}` : "";
      const chunk = r.chunk_index !== undefined ? `chunk=${r.chunk_index}` : "";
      const top = [title, chunk, meta].filter(Boolean).join(" · ");
      const content = r.content_preview || r.content || "";
      return `
        <div class="resultItem">
          <div class="resultItem__top">
            <span>${escapeHtml(top)}</span>
            <span class="muted">${escapeHtml(r.chunk_id !== undefined ? `chunk_id=${r.chunk_id}` : "")}</span>
          </div>
          <div class="resultItem__content">${escapeHtml(content)}</div>
        </div>
      `;
    })
    .join("");
}

async function loadHealth() {
  const data = await api("/health/");
  $("healthOut").textContent = prettyJson(data);
  toast("health ok", "ok");
}

async function loadIndexStats() {
  const data = await api("/health/index");
  $("healthOut").textContent = prettyJson(data);
  toast("index stats ok", "ok");
}

async function loadDocs({ silent = false } = {}) {
  const res = await api("/documents/");
  const list = res?.data ?? res;
  state.docs = Array.isArray(list) ? list : [];
  renderDocs();
  if (!silent) toast(`加载文档：${state.docs.length} 条`, "ok");
}

async function apiForm(path, formData) {
  const url = `${state.apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = data?.detail || (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  return data;
}

async function createDoc() {
  const title = $("docTitle").value.trim();
  const content = $("docContent").value;
  if (!title) throw new Error("标题不能为空");
  if (!content.trim()) throw new Error("内容不能为空");
  $("createHint").textContent = "正在创建并切分/向量化…（首次可能较慢）";
  const doc = await api("/documents/", { method: "POST", body: { title, content } });
  $("createHint").textContent = `创建成功：#${doc.id}`;
  toast(`创建成功：#${doc.id}`, "ok");
  await loadDocs();
}

async function deleteDoc(id) {
  await api(`/documents/${id}`, { method: "DELETE" });
  toast(`已删除：#${id}`, "ok");
  await loadDocs();
}

async function viewDoc(id) {
  const doc = await api(`/documents/${id}`);
  $("healthOut").textContent = prettyJson(doc);
  toast(`已载入文档 #${id}（输出到状态栏）`, "ok");
}

async function editDoc(id) {
  const doc = await api(`/documents/${id}`);
  const newTitle = window.prompt("编辑标题（留空表示不修改）", doc.title || "");
  if (newTitle === null) return;
  const newContent = window.prompt("编辑内容（留空表示不修改）", doc.content || "");
  if (newContent === null) return;
  const body = {};
  if (newTitle.trim() && newTitle.trim() !== doc.title) body.title = newTitle.trim();
  if (newContent.trim() && newContent !== doc.content) body.content = newContent;
  if (!Object.keys(body).length) {
    toast("未做任何修改", "ok");
    return;
  }
  await api(`/documents/${id}`, { method: "PUT", body });
  toast(`已更新：#${id}`, "ok");
  await loadDocs();
}

function syncQueryCharCount() {
  const countEl = $("queryCharCount");
  const el = $("queryInput");
  if (!countEl || !el) return;
  const n = el.value.length;
  const max = el.maxLength || 8000;
  countEl.textContent = `${n} / ${max}`;
}

async function copyMarkdown(preId) {
  const el = $(preId);
  const text = el?.textContent ?? "";
  if (!text.trim()) {
    toast("没有可复制的内容", "bad");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制 Markdown", "ok");
  } catch {
    toast("复制失败（浏览器权限）", "bad");
  }
}

async function doWrongQuestions() {
  const source_text = $("wrongInput").value.trim();
  if (!source_text) throw new Error("请粘贴学习材料");
  $("wrongMeta").textContent = "生成中…";
  $("wrongOut").hidden = true;
  $("wrongPreview").hidden = true;
  $("wrongActions").hidden = true;

  const use_knowledge_base = $("wrongUseKb").checked;
  const kb_query = $("wrongKbQuery").value.trim() || null;
  const top_k = Number($("wrongTopK").value) || 5;
  const payload = await api("/tools/generate-questions", {
    method: "POST",
    body: { source_text, use_knowledge_base, kb_query, top_k },
  });
  const md = payload?.markdown ?? "—";
  $("wrongOut").textContent = md;
  const cleanMd = md.replace(/```(?:markdown|md)?\n?([\s\S]*?)```/gi, "$1").replace(/^```\s*$/gm, "").trim();

  if (typeof marked !== "undefined") {
    $("wrongPreview").innerHTML = marked.parse(cleanMd);
    $("wrongPreview").hidden = false;
    $("wrongOut").hidden = true;
    setWrongView("preview");
  } else {
    $("wrongOut").hidden = false;
    setWrongView("raw");
  }
  $("wrongActions").hidden = false;

  let meta = "习题已生成";
  if (use_knowledge_base) meta += ` · 知识库命中 ${payload.kb_hits ?? 0} 条`;
  $("wrongMeta").textContent = meta;

  renderWrongRefs(payload?.top_k_results || []);
  toast("习题已生成", "ok");
}

function setWrongView(view) {
  $("btnWrongView")?.classList.toggle("btn--active", view === "preview");
  $("btnWrongRaw")?.classList.toggle("btn--active", view === "raw");
  if (view === "preview") {
    $("wrongPreview").hidden = false;
    $("wrongOut").hidden = true;
  } else {
    $("wrongPreview").hidden = true;
    $("wrongOut").hidden = false;
  }
}

function renderWrongRefs(results) {
  const el = $("wrongRefs");
  if (!el || !results.length) { el && (el.textContent = ""); return; }
  const titles = results.slice(0, 3).map((r) => r.document_title || `#${r.document_id}`).join(", ");
  el.textContent = titles + (results.length > 3 ? ` +${results.length - 3}` : "");
  el.title = results.map((r) => `${r.document_title || r.document_id}: ${(r.content_preview || "").slice(0, 60)}…`).join("\n");
}

async function doAnalysis() {
  const question = $("analysisQuestion").value.trim();
  if (!question) throw new Error("请输入题目内容");
  $("analysisMeta").textContent = "解析中…";
  $("analysisOut").hidden = true;
  $("analysisPreview").hidden = true;
  $("analysisActions").hidden = true;

  const answer = $("analysisAnswer").value.trim() || null;
  const payload = await api("/tools/analyze-question", {
    method: "POST",
    body: { question, answer },
  });
  const md = payload?.markdown ?? "—";
  $("analysisOut").textContent = md;
  const cleanMd = md.replace(/```(?:markdown|md)?\n?([\s\S]*?)```/gi, "$1").replace(/^```\s*$/gm, "").trim();

  if (typeof marked !== "undefined") {
    $("analysisPreview").innerHTML = marked.parse(cleanMd);
    $("analysisPreview").hidden = false;
    $("analysisOut").hidden = true;
    setAnalysisView("preview");
  } else {
    $("analysisOut").hidden = false;
    setAnalysisView("raw");
  }
  $("analysisActions").hidden = false;
  $("analysisMeta").textContent = "解析完成";
  toast("解析完成", "ok");
}

function setAnalysisView(view) {
  $("btnAnalysisView")?.classList.toggle("btn--active", view === "preview");
  $("btnAnalysisRaw")?.classList.toggle("btn--active", view === "raw");
  if (view === "preview") {
    $("analysisPreview").hidden = false;
    $("analysisOut").hidden = true;
  } else {
    $("analysisPreview").hidden = true;
    $("analysisOut").hidden = false;
  }
}

function clearAnalysisDraft() {
  $("analysisQuestion").value = "";
  $("analysisAnswer").value = "";
  $("analysisOut").textContent = "";
  $("analysisOut").hidden = true;
  $("analysisPreview").innerHTML = "";
  $("analysisPreview").hidden = true;
  $("analysisActions").hidden = true;
  $("analysisMeta").textContent = "";
}

function clearWrongDraft() {
  $("wrongInput").value = "";
  $("wrongOut").textContent = "";
  $("wrongOut").hidden = true;
  $("wrongActions").hidden = true;
  $("wrongMeta").textContent = "";
  $("wrongRefs").textContent = "";
}

async function downloadMarkdown(text, filename) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`已下载：${filename}`, "ok");
}

async function doMarkdownNotes() {
  const topic = $("notesTopic").value.trim();
  if (!topic) throw new Error("请输入主题或关键词");
  $("notesMeta").textContent = "检索并生成中…";
  $("notesOut").hidden = true;
  $("notesPreview").hidden = true;
  $("notesActions").hidden = true;
  const top_k = Number($("notesTopK").value) || 6;
  const payload = await api("/tools/markdown-notes", {
    method: "POST",
    body: { topic, top_k },
  });
  const md = payload?.markdown ?? "—";
  $("notesOut").textContent = md;
  $("notesOut").hidden = false;
  $("notesActions").hidden = false;
  const n = (payload?.top_k_results || []).length;
  $("notesMeta").textContent = `检索到 ${n} 条片段 · 已生成 Markdown`;

  saveNotesHistory(topic);
  saveNotesDraft(topic, md);

  if (typeof marked !== "undefined") {
    $("notesPreview").innerHTML = marked.parse(md);
    $("notesPreview").hidden = false;
    $("notesOut").hidden = true;
    setActiveView("preview");
  } else {
    $("notesOut").hidden = false;
    $("notesPreview").hidden = true;
    setActiveView("raw");
  }

  renderNotesRefs(payload?.top_k_results || []);
  toast("笔记已生成", "ok");
}

function setActiveView(view) {
  $("btnNotesView")?.classList.toggle("btn--active", view === "preview");
  $("btnNotesRaw")?.classList.toggle("btn--active", view === "raw");
}

function renderNotesRefs(results) {
  const el = $("notesRefs");
  if (!el || !results.length) { el && (el.textContent = ""); return; }
  const titles = results.slice(0, 3).map((r) => r.document_title || `#${r.document_id}`).join(", ");
  el.textContent = titles + (results.length > 3 ? ` +${results.length - 3}` : "");
  el.title = results.map((r) => `${r.document_title || r.document_id}: ${(r.content_preview || "").slice(0, 60)}…`).join("\n");
}

function saveNotesHistory(topic) {
  try {
    const raw = localStorage.getItem("notes_history") || "[]";
    const arr = JSON.parse(raw);
    const filtered = arr.filter((t) => t !== topic);
    const updated = [topic, ...filtered].slice(0, 20);
    localStorage.setItem("notes_history", JSON.stringify(updated));
    renderNotesHistory();
  } catch {}
}

function renderNotesHistory() {
  try {
    const raw = localStorage.getItem("notes_history") || "[]";
    const arr = JSON.parse(raw);
    const dl = $("notesHistory");
    if (!dl) return;
    dl.innerHTML = arr.map((t) => `<option value="${escapeHtml(t)}">`).join("");
  } catch {}
}

function saveNotesDraft(topic, md) {
  try {
    localStorage.setItem("notes_draft", JSON.stringify({ topic, md, ts: Date.now() }));
  } catch {}
}

function loadNotesDraft() {
  try {
    const raw = localStorage.getItem("notes_draft");
    if (!raw) return;
    const { topic, md } = JSON.parse(raw);
    if (!topic || !md) return;
    if (Date.now() - (JSON.parse(raw).ts || 0) > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("notes_draft");
      return;
    }
    $("notesTopic").value = topic;
    $("notesOut").textContent = md;
    $("notesOut").hidden = false;
    $("notesActions").hidden = false;
    $("notesMeta").textContent = "（上次生成的笔记已自动恢复）";
    if (typeof marked !== "undefined") {
      $("notesPreview").innerHTML = marked.parse(md);
      $("notesPreview").hidden = false;
      $("notesOut").hidden = true;
      setActiveView("preview");
    }
    renderNotesRefs([]);
  } catch {}
}

function clearNotesDraft() {
  $("notesTopic").value = "";
  $("notesOut").textContent = "";
  $("notesOut").hidden = true;
  $("notesPreview").innerHTML = "";
  $("notesPreview").hidden = true;
  $("notesActions").hidden = true;
  $("notesMeta").textContent = "";
  localStorage.removeItem("notes_draft");
}

async function doSearch() {
  const query = $("queryInput").value.trim();
  if (!query) throw new Error("请输入问题");
  $("answerOut").textContent = "检索中…";
  $("resultsOut").innerHTML = `<div class="muted">检索中…</div>`;
  const use_llm = $("useLlm").checked;
  const top_k = Number($("topK").value) || 3;
  const payload = await api("/search/", {
    method: "POST",
    body: { query, use_llm, top_k },
  });
  renderSearchResults(payload);
  toast("搜索完成", "ok");
}

function bindEvents() {
  $("btnReload").addEventListener("click", () => window.location.reload());
  $("btnHealth").addEventListener("click", () => loadHealth().catch((e) => toast(e.message, "bad")));
  $("btnIndex").addEventListener("click", () => loadIndexStats().catch((e) => toast(e.message, "bad")));
  $("btnLoadDocs").addEventListener("click", () => loadDocs().catch((e) => toast(e.message, "bad")));
  $("btnCreateDoc").addEventListener("click", () => {
    createDoc().catch((e) => {
      $("createHint").textContent = e.message;
      toast(e.message, "bad");
    });
  });
  $("btnClearCreate").addEventListener("click", () => {
    $("docTitle").value = "";
    $("docContent").value = "";
    $("createHint").textContent = "";
  });

  const dropzone = $("dropzone");
  const fileInput = $("fileInput");
  const btnSelectFile = $("btnSelectFile");

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dropzone--dragover");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dropzone--dragover");
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dropzone--dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file) handleDocxFile(file);
  });
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  btnSelectFile.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) handleDocxFile(file);
    fileInput.value = "";
  });
  $("docFilter").addEventListener("input", (e) => {
    state.docFilter = e.target.value;
    renderDocs();
  });
  $("queryInput").addEventListener("input", syncQueryCharCount);
  $("queryInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doSearch().catch((err) => toast(err.message, "bad"));
    }
  });
  $("btnClearQuery").addEventListener("click", () => {
    $("queryInput").value = "";
    syncQueryCharCount();
    $("queryInput").focus();
  });
  $("btnSearch").addEventListener("click", () => doSearch().catch((e) => toast(e.message, "bad")));

  $("wrongUseKb").addEventListener("change", () => {
    $("wrongKbRow").classList.toggle("is-hidden", !$("wrongUseKb").checked);
  });
  $("btnWrongView").addEventListener("click", () => setWrongView("preview"));
  $("btnWrongRaw").addEventListener("click", () => setWrongView("raw"));
  $("btnWrongGo").addEventListener("click", () =>
    doWrongQuestions().catch((e) => {
      $("wrongMeta").textContent = e.message;
      toast(e.message, "bad");
    }),
  );
  $("btnWrongClear").addEventListener("click", clearWrongDraft);
  $("btnWrongCopy").addEventListener("click", () => copyMarkdown("wrongOut"));
  $("btnWrongDownload").addEventListener("click", () => {
    const md = $("wrongOut").textContent;
    const filename = `习题_${Date.now()}.md`;
    downloadMarkdown(md, filename);
  });
  $("btnNotesGo").addEventListener("click", () =>
    doMarkdownNotes().catch((e) => {
      $("notesMeta").textContent = e.message;
      toast(e.message, "bad");
    }),
  );
  $("btnNotesClear").addEventListener("click", clearNotesDraft);
  $("btnNotesCopy").addEventListener("click", () => copyMarkdown("notesOut"));
  $("btnNotesDownload").addEventListener("click", () => {
    const md = $("notesOut").textContent;
    const topic = $("notesTopic").value.trim() || "笔记";
    const filename = `${topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.md`;
    downloadMarkdown(md, filename);
  });
  $("btnNotesView").addEventListener("click", () => {
    $("notesPreview").hidden = false;
    $("notesOut").hidden = true;
    setActiveView("preview");
  });
  $("btnNotesRaw").addEventListener("click", () => {
    $("notesPreview").hidden = true;
    $("notesOut").hidden = false;
    setActiveView("raw");
  });
  $("btnAnalysisGo").addEventListener("click", () =>
    doAnalysis().catch((e) => {
      $("analysisMeta").textContent = e.message;
      toast(e.message, "bad");
    }),
  );
  $("btnAnalysisClear").addEventListener("click", clearAnalysisDraft);
  $("btnAnalysisView").addEventListener("click", () => setAnalysisView("preview"));
  $("btnAnalysisRaw").addEventListener("click", () => setAnalysisView("raw"));
  $("btnAnalysisCopy").addEventListener("click", () => copyMarkdown("analysisOut"));
  $("btnWrongCopy").addEventListener("click", () => copyMarkdown("wrongOut"));

  $("docsOut").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = e.target.closest(".docRow");
    if (!row) return;
    const id = row.getAttribute("data-docid");
    const action = btn.getAttribute("data-action");
    if (!id) return;
    const docId = Number(id);
    if (action === "delete") {
      if (window.confirm(`确认删除文档 #${docId}？`)) {
        deleteDoc(docId).catch((err) => toast(err.message, "bad"));
      }
    } else if (action === "view") {
      viewDoc(docId).catch((err) => toast(err.message, "bad"));
    } else if (action === "edit") {
      editDoc(docId).catch((err) => toast(err.message, "bad"));
    }
  });
}

async function handleDocxFile(file) {
  if (!file.name.toLowerCase().endsWith(".docx")) {
    toast("仅支持 .docx 文件", "bad");
    return;
  }
  $("createHint").textContent = "正在上传并由服务端解析 docx、写入索引…";
  try {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const doc = await apiForm("/documents/import-docx", fd);
    $("docTitle").value = "";
    $("docContent").value = "";
    $("createHint").textContent = `已导入文档 #${doc.id}：${doc.title}`;
    toast(`已导入文档 #${doc.id}`, "ok");
    await loadDocs({ silent: true });
  } catch (e) {
    $("createHint").textContent = e.message;
    toast(e.message, "bad");
  }
}

function init() {
  setApiBase(state.apiBase);
  bindEvents();
  syncQueryCharCount();
  renderNotesHistory();
  loadNotesDraft();
  loadDocs().catch(() => {});
}

document.addEventListener("DOMContentLoaded", init);

