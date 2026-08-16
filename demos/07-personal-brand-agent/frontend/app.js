const STAGE_LABELS = {
  positioning: "① 定位分析师",
  content_strategy: "② 内容策略师",
  copywriting: "③ 文案专家",
  report: "④ 整合编辑",
};

const form = document.getElementById("profileForm");
const submitBtn = document.getElementById("submitBtn");
const progressBox = document.getElementById("progressBox");
const progressList = document.getElementById("progressList");
const emptyState = document.getElementById("emptyState");
const reportBox = document.getElementById("reportBox");
const errorBox = document.getElementById("errorBox");
const downloadBtn = document.getElementById("downloadBtn");

let lastMarkdown = "";
let lastName = "report";

function resetProgressUI() {
  progressList.innerHTML = "";
  progressBox.hidden = false;
  Object.entries(STAGE_LABELS).forEach(([stage, label]) => {
    const li = document.createElement("li");
    li.id = `progress-${stage}`;
    li.innerHTML = `<span class="dot"></span><span>${label}</span><span class="msg" style="margin-left:auto;color:#9aa0c0;font-size:12px;"></span>`;
    progressList.appendChild(li);
  });
}

function updateProgress(stage, status, message) {
  const li = document.getElementById(`progress-${stage}`);
  if (!li) return;
  li.classList.remove("running", "done", "error");
  li.classList.add(status);
  const msgEl = li.querySelector(".msg");
  if (msgEl) msgEl.textContent = message || "";
}

function fillList(ulId, items) {
  const ul = document.getElementById(ulId);
  ul.innerHTML = "";
  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function renderReport(report) {
  lastMarkdown = report.markdown;
  lastName = report.profile?.name || "report";

  document.getElementById("reportTitle").textContent = `${report.profile.name} 的个人品牌定位报告`;
  document.getElementById("editorSummary").textContent = report.editor_summary;

  const p = report.positioning;
  document.getElementById("oneLiner").textContent = p.one_liner;
  fillList("differentiators", p.differentiators);
  fillList("personaHooks", p.persona_hooks);
  const riskEl = document.getElementById("riskWarning");
  if (p.risk_warning) {
    riskEl.hidden = false;
    riskEl.textContent = `⚠️ 风险提示：${p.risk_warning}`;
  } else {
    riskEl.hidden = true;
  }

  const strategy = report.content_strategy;
  const pillarsEl = document.getElementById("pillars");
  pillarsEl.innerHTML = "";
  (strategy.pillars || []).forEach((pillar) => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    div.innerHTML = `<strong>${pillar.name}</strong><p style="margin:4px 0;color:#4b5065;font-size:13px;">${pillar.description}</p>` +
      (pillar.example_topics?.length ? `<p style="margin:0;font-size:12px;color:#8a8fb0;">示例选题：${pillar.example_topics.join("、")}</p>` : "");
    pillarsEl.appendChild(div);
  });

  const tbody = document.querySelector("#calendarTable tbody");
  tbody.innerHTML = "";
  (strategy.first_month_calendar || []).forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.week}</td><td>${item.topic}</td><td>${item.channel}</td>`;
    tbody.appendChild(tr);
  });

  const tacticsEl = document.getElementById("channelTactics");
  tacticsEl.innerHTML = "";
  Object.entries(strategy.channel_tactics || {}).forEach(([channel, tactic]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${channel}</strong>：${tactic}`;
    tacticsEl.appendChild(li);
  });

  const c = report.copywriting;
  document.getElementById("bioShort").textContent = c.bio_short;
  document.getElementById("bioLong").textContent = c.bio_long;
  document.getElementById("socialPost").textContent = c.social_post_draft;
  document.getElementById("websiteHero").textContent = c.website_hero;

  emptyState.hidden = true;
  errorBox.hidden = true;
  reportBox.hidden = false;
}

function showError(message) {
  errorBox.hidden = false;
  errorBox.textContent = `生成失败：${message}`;
  reportBox.hidden = true;
}

async function submitForm(profile) {
  resetProgressUI();
  emptyState.hidden = true;
  reportBox.hidden = true;
  errorBox.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "生成中，请稍候...";

  try {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });

    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => "");
      throw new Error(errText || `请求失败（HTTP ${resp.status}）`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const eventMatch = chunk.match(/event:\s*(\w+)/);
        const dataMatch = chunk.match(/data:\s*(.*)/s);
        if (!eventMatch || !dataMatch) continue;
        const eventName = eventMatch[1];
        const payload = JSON.parse(dataMatch[1]);

        if (eventName === "progress") {
          updateProgress(payload.stage, payload.status, payload.message);
        } else if (eventName === "done") {
          renderReport(payload.report);
        } else if (eventName === "error") {
          showError(payload.message);
        }
      }
    }
  } catch (err) {
    showError(err.message || String(err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "开始生成定位报告 →";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const skillsRaw = (fd.get("skills") || "").toString();
  const profile = {
    name: fd.get("name"),
    background: fd.get("background"),
    skills: skillsRaw.split(",").map((s) => s.trim()).filter(Boolean),
    target_audience: fd.get("target_audience"),
    direction: fd.get("direction") || null,
    existing_content: fd.get("existing_content") || null,
  };
  submitForm(profile);
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([lastMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lastName}-个人品牌定位报告.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
