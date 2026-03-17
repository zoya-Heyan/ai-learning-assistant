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

async function loadDocs() {
  const res = await api("/documents/");
  const list = res?.data ?? res;
  state.docs = Array.isArray(list) ? list : [];
  renderDocs();
  toast(`加载文档：${state.docs.length} 条`, "ok");
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

async function doSearch() {
  const query = $("queryInput").value.trim();
  if (!query) throw new Error("请输入问题");
  $("answerOut").textContent = "检索中…";
  $("resultsOut").innerHTML = `<div class="muted">检索中…</div>`;
  const use_llm = $("useLlm").checked;
  const payload = await api("/search/", { method: "POST", body: { query, use_llm } });
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
  $("docFilter").addEventListener("input", (e) => {
    state.docFilter = e.target.value;
    renderDocs();
  });
  $("btnSearch").addEventListener("click", () => doSearch().catch((e) => toast(e.message, "bad")));

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

function init() {
  setApiBase(state.apiBase);
  bindEvents();
  loadDocs().catch(() => {});
}

document.addEventListener("DOMContentLoaded", init);

