/* =========================================================
   Trailhead — Student Career Roadmap & Placement Readiness
   Tracking System
   All data is persisted to the browser via localStorage.
   ========================================================= */

const STORAGE_KEY = "trailhead_state_v1";

const CATEGORIES = [
  {
    id: "aptitude",
    name: "Aptitude & Reasoning",
    seed: [
      ["Quantitative aptitude fundamentals", "High"],
      ["Logical reasoning practice set 1", "High"],
      ["Verbal ability & reading comprehension", "Medium"],
      ["Data interpretation practice", "Medium"],
      ["Timed mock aptitude test", "High"],
      ["Review mistakes from mock test", "Medium"],
    ],
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    seed: [
      ["Arrays & strings — core problems", "High"],
      ["Linked lists & stacks/queues", "High"],
      ["Trees & graphs fundamentals", "High"],
      ["Dynamic programming basics", "High"],
      ["Sorting & searching patterns", "Medium"],
      ["Solve 2 problems on a coding platform daily", "High"],
      ["Participate in one contest", "Medium"],
    ],
  },
  {
    id: "languages",
    name: "Programming Languages",
    seed: [
      ["Strengthen core language fundamentals", "High"],
      ["Object-oriented programming concepts", "Medium"],
      ["Database basics & SQL queries", "Medium"],
      ["Version control with Git & GitHub", "Medium"],
      ["Learn one framework relevant to target role", "Medium"],
    ],
  },
  {
    id: "projects",
    name: "Projects",
    seed: [
      ["Finalize a portfolio-worthy project idea", "High"],
      ["Build and deploy the project", "High"],
      ["Write clear project documentation / README", "Medium"],
      ["Add project to resume and portfolio", "Medium"],
      ["Prepare to explain project in interviews", "High"],
    ],
  },
  {
    id: "communication",
    name: "Communication Skills",
    seed: [
      ["Practice self-introduction (60 seconds)", "Medium"],
      ["Group discussion practice session", "Medium"],
      ["Record and review a mock presentation", "Low"],
      ["Work on structured answer techniques (STAR method)", "Medium"],
    ],
  },
  {
    id: "resume",
    name: "Resume & Profile",
    seed: [
      ["Draft first version of resume", "High"],
      ["Get resume reviewed by a mentor / senior", "High"],
      ["Update LinkedIn profile", "Medium"],
      ["Prepare a short elevator pitch", "Medium"],
    ],
  },
  {
    id: "interview",
    name: "Interview & Company Prep",
    seed: [
      ["Research target companies & roles", "Medium"],
      ["Prepare answers for common HR questions", "High"],
      ["Mock technical interview", "High"],
      ["Mock HR interview", "Medium"],
      ["Prepare questions to ask the interviewer", "Low"],
    ],
  },
];

const ACHIEVEMENT_DEFS = [
  { id: "first_step", title: "First Step", desc: "Complete your first task.", icon: "1" },
  { id: "ten_tasks", title: "10 Down", desc: "Complete 10 tasks.", icon: "10" },
  { id: "twentyfive_tasks", title: "Quarter Century", desc: "Complete 25 tasks.", icon: "25" },
  { id: "fifty_tasks", title: "Half Century", desc: "Complete 50 tasks.", icon: "50" },
  { id: "streak_3", title: "Consistent Learner", desc: "Maintain a 3-day streak.", icon: "3d" },
  { id: "streak_7", title: "Week Warrior", desc: "Maintain a 7-day streak.", icon: "7d" },
  { id: "streak_14", title: "Two-Week Trail", desc: "Maintain a 14-day streak.", icon: "14d" },
  { id: "category_done", title: "Category Champion", desc: "Fully complete one preparation category.", icon: "\u2713" },
  { id: "halfway", title: "Halfway There", desc: "Reach 50% overall preparation.", icon: "50%" },
  { id: "advanced", title: "Advanced Level", desc: "Reach the Advanced readiness level.", icon: "\u2191" },
  { id: "interview_ready", title: "Interview Ready", desc: "Reach the Interview-Ready readiness level.", icon: "\u2605" },
  { id: "resume_done", title: "Resume Ready", desc: "Complete the Resume & Profile category.", icon: "R" },
];

let state = null;

/* ---------------- Storage ---------------- */

function defaultState() {
  const tasks = [];
  CATEGORIES.forEach((cat) => {
    cat.seed.forEach(([title, priority]) => {
      tasks.push({
        id: uid(),
        title,
        category: cat.id,
        priority,
        status: "pending",
        notes: "",
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
    });
  });
  return {
    profile: null,
    tasks,
    activityLog: {},        // { 'YYYY-MM-DD': count }
    readinessHistory: [],   // [{date, score}]
    unlockedAchievements: {}, // { id: isoDate }
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read saved data, starting fresh.", e);
  }
  return defaultState();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().slice(0, 10);
}

/* ---------------- Derived data ---------------- */

function categoryStats(catId) {
  const items = state.tasks.filter((t) => t.category === catId);
  const completed = items.filter((t) => t.status === "completed").length;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;
  return { total: items.length, completed, pct, items };
}

function overallStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((t) => t.status === "completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}

function readinessScore() {
  // Weighted average across categories so no single large category dominates.
  const pcts = CATEGORIES.map((c) => categoryStats(c.id).pct);
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  let level = "Beginner";
  if (avg >= 81) level = "Interview-Ready";
  else if (avg >= 56) level = "Advanced";
  else if (avg >= 26) level = "Intermediate";
  return { score: avg, level };
}

function computeStreaks() {
  const days = Object.keys(state.activityLog).sort();
  if (!days.length) return { current: 0, longest: 0, activeDays: 0 };

  const daySet = new Set(days);
  let longest = 0, run = 0, prev = null;
  days.forEach((d) => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  });

  // current streak counting back from today
  let current = 0;
  let cursor = new Date();
  while (daySet.has(todayStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest, activeDays: days.length };
}

function logActivity() {
  const key = todayStr();
  state.activityLog[key] = (state.activityLog[key] || 0) + 1;
}

function recordReadinessSnapshot() {
  const { score } = readinessScore();
  const key = todayStr();
  const existing = state.readinessHistory.find((r) => r.date === key);
  if (existing) existing.score = score;
  else state.readinessHistory.push({ date: key, score });
}

/* ---------------- Achievements ---------------- */

function checkAchievements() {
  const newly = [];
  const completed = state.tasks.filter((t) => t.status === "completed").length;
  const { current } = computeStreaks();
  const { score, level } = readinessScore();

  const unlock = (id) => {
    if (!state.unlockedAchievements[id]) {
      state.unlockedAchievements[id] = new Date().toISOString();
      newly.push(id);
    }
  };

  if (completed >= 1) unlock("first_step");
  if (completed >= 10) unlock("ten_tasks");
  if (completed >= 25) unlock("twentyfive_tasks");
  if (completed >= 50) unlock("fifty_tasks");
  if (current >= 3) unlock("streak_3");
  if (current >= 7) unlock("streak_7");
  if (current >= 14) unlock("streak_14");
  if (score >= 50) unlock("halfway");
  if (level === "Advanced" || level === "Interview-Ready") unlock("advanced");
  if (level === "Interview-Ready") unlock("interview_ready");
  CATEGORIES.forEach((c) => {
    const st = categoryStats(c.id);
    if (st.total > 0 && st.completed === st.total) {
      unlock("category_done");
      if (c.id === "resume") unlock("resume_done");
    }
  });

  if (newly.length) {
    const def = ACHIEVEMENT_DEFS.find((a) => a.id === newly[0]);
    showToast(`Achievement unlocked: ${def.title}`);
  }
}

/* ---------------- Recommendations ---------------- */

function buildRecommendations() {
  const recs = [];
  const cats = CATEGORIES.map((c) => ({ ...c, ...categoryStats(c.id) }));
  const weakest = [...cats].sort((a, b) => a.pct - b.pct)[0];
  if (weakest && weakest.pct < 100) {
    recs.push(`Your weakest area is ${weakest.name} at ${weakest.pct}% — pick one task from it today.`);
  }
  const { current } = computeStreaks();
  if (current === 0) {
    recs.push("You don't have an active streak yet — complete one task today to start one.");
  } else if (current >= 1 && current < 3) {
    recs.push(`You're on a ${current}-day streak — one more day gets you to a 3-day streak badge.`);
  }
  const pending = state.tasks.filter((t) => t.status === "pending" && t.priority === "High").length;
  if (pending > 0) {
    recs.push(`You have ${pending} high-priority task${pending > 1 ? "s" : ""} pending — tackle those first.`);
  }
  const { score, level } = readinessScore();
  if (level === "Beginner") {
    recs.push("Focus on breadth right now: aim to touch every category at least once.");
  } else if (level === "Interview-Ready") {
    recs.push("You're interview-ready — keep sharpening with mock interviews and timed practice.");
  }
  if (state.profile && state.profile.targetDate) {
    const days = daysUntil(state.profile.targetDate);
    if (days !== null && days <= 14 && days >= 0) {
      recs.push(`Only ${days} day${days === 1 ? "" : "s"} left until your target date — prioritize weak, high-impact areas.`);
    }
  }
  if (!recs.length) recs.push("Great pace — keep completing tasks to keep your recommendations fresh.");
  return recs.slice(0, 4);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date(todayStr())) / 86400000);
  return diff;
}

/* ---------------- Rendering: shell / nav ---------------- */

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function renderSidebar() {
  document.getElementById("sidebar-name").textContent = state.profile.name;
  document.getElementById("sidebar-role").textContent = state.profile.targetRole;
  document.getElementById("sidebar-avatar").textContent = initials(state.profile.name);
}

function switchView(view) {
  document.querySelectorAll(".trail-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(`view-${view}`).classList.remove("hidden");
  const titles = {
    dashboard: "Dashboard", roadmap: "Roadmap", tasks: "Tasks", skills: "Skill Progress",
    analytics: "Analytics", achievements: "Achievements", history: "History",
  };
  document.getElementById("view-title").textContent = titles[view];
  renderView(view);
}

function renderView(view) {
  if (view === "dashboard") renderDashboard();
  if (view === "roadmap") renderRoadmap();
  if (view === "tasks") renderTasks();
  if (view === "skills") renderSkills();
  if (view === "analytics") renderAnalytics();
  if (view === "achievements") renderAchievements();
  if (view === "history") renderHistory();
}

/* ---------------- Dashboard ---------------- */

function renderDashboard() {
  const { score, level } = readinessScore();
  const overall = overallStats();
  const { current } = computeStreaks();

  document.getElementById("readiness-pct").textContent = `${score}%`;
  document.getElementById("readiness-level").textContent = level;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;
  const ring = document.getElementById("ring-fill");
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = offset;
  ring.style.stroke = level === "Interview-Ready" ? "var(--moss)" : level === "Advanced" ? "var(--teal)" : "var(--clay)";

  const copyMap = {
    "Beginner": "You're just getting started. Build consistency across all areas.",
    "Intermediate": "Solid foundation forming — keep closing gaps across categories.",
    "Advanced": "You're in strong shape. Focus on polish and mock interviews.",
    "Interview-Ready": "You're prepared for placement drives. Maintain momentum.",
  };
  document.getElementById("readiness-copy").textContent = copyMap[level];

  document.getElementById("stat-overall").textContent = `${overall.pct}%`;
  document.getElementById("stat-streak").textContent = current;
  document.getElementById("stat-completed").textContent = overall.completed;
  const days = state.profile.targetDate ? daysUntil(state.profile.targetDate) : null;
  document.getElementById("stat-days").textContent = days === null ? "—" : Math.max(days, 0);

  const catList = document.getElementById("category-progress-list");
  catList.innerHTML = CATEGORIES.map((c) => {
    const st = categoryStats(c.id);
    return `<div class="cat-row">
      <span class="cat-row-name">${c.name}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${st.pct}%"></span></span>
      <span class="cat-row-pct">${st.pct}%</span>
    </div>`;
  }).join("");

  const recent = state.tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 5);
  const recentEl = document.getElementById("recent-tasks-list");
  recentEl.innerHTML = recent.length
    ? recent.map((t) => `<li><span class="li-title">${escapeHtml(t.title)}</span><span class="li-meta">${formatDate(t.completedAt)}</span></li>`).join("")
    : `<li class="empty-note">Nothing completed yet — finish a task to see it here.</li>`;

  const upcoming = state.tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
    .slice(0, 5);
  const upcomingEl = document.getElementById("upcoming-list");
  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map((t) => `<li><span class="li-title">${escapeHtml(t.title)}</span><span class="li-meta">${categoryName(t.category)}</span></li>`).join("")
    : `<li class="empty-note">All caught up! Add more tasks in Roadmap or Tasks.</li>`;

  document.getElementById("recommendations-list").innerHTML =
    buildRecommendations().map((r) => `<li>${escapeHtml(r)}</li>`).join("");
}

function priorityRank(p) { return { High: 3, Medium: 2, Low: 1 }[p] || 0; }
function categoryName(id) { return (CATEGORIES.find((c) => c.id === id) || {}).name || id; }
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- Roadmap ---------------- */

function renderRoadmap() {
  const list = document.getElementById("roadmap-list");
  list.innerHTML = CATEGORIES.map((c, idx) => {
    const st = categoryStats(c.id);
    const rows = st.items.map((t) => `
      <div class="roadmap-task-row ${t.status === "completed" ? "completed" : ""}" data-task="${t.id}">
        <button class="chk ${t.status === "completed" ? "checked" : ""}" data-toggle="${t.id}" aria-label="Toggle complete">${t.status === "completed" ? "\u2713" : ""}</button>
        <span class="roadmap-task-title">${escapeHtml(t.title)}</span>
        <span class="tag tag-${t.priority}">${t.priority}</span>
      </div>`).join("");
    return `
      <div class="roadmap-cat ${idx === 0 ? "open" : ""}" data-cat="${c.id}">
        <div class="roadmap-cat-head" data-toggle-cat="${c.id}">
          <div class="roadmap-cat-title">
            <svg class="roadmap-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <strong>${c.name}</strong>
          </div>
          <div class="roadmap-cat-progress">
            <span class="roadmap-cat-count">${st.completed}/${st.total}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${st.pct}%"></span></span>
          </div>
        </div>
        <div class="roadmap-cat-body">${rows}</div>
      </div>`;
  }).join("");

  list.querySelectorAll("[data-toggle-cat]").forEach((el) => {
    el.addEventListener("click", () => el.closest(".roadmap-cat").classList.toggle("open"));
  });
  list.querySelectorAll("[data-toggle]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleTaskCompletion(el.dataset.toggle);
      renderRoadmap();
      renderDashboard();
    });
  });
}

function toggleTaskCompletion(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  if (task.status === "completed") {
    task.status = "pending";
    task.completedAt = null;
  } else {
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    logActivity();
  }
  recordReadinessSnapshot();
  checkAchievements();
  save();
}

/* ---------------- Tasks ---------------- */

function populateCategorySelects() {
  const filterSel = document.getElementById("filter-category");
  const formSel = document.getElementById("task-form-category");
  const options = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  formSel.innerHTML = options;
  filterSel.innerHTML = `<option value="">All categories</option>${options}`;
}

function renderTasks() {
  const search = document.getElementById("task-search").value.trim().toLowerCase();
  const fCat = document.getElementById("filter-category").value;
  const fStatus = document.getElementById("filter-status").value;
  const fPriority = document.getElementById("filter-priority").value;

  let items = [...state.tasks];
  if (search) items = items.filter((t) => t.title.toLowerCase().includes(search) || (t.notes || "").toLowerCase().includes(search));
  if (fCat) items = items.filter((t) => t.category === fCat);
  if (fStatus) items = items.filter((t) => t.status === fStatus);
  if (fPriority) items = items.filter((t) => t.priority === fPriority);

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const container = document.getElementById("tasks-table");
  if (!items.length) {
    container.innerHTML = `<p class="empty-note">No tasks match your filters.</p>`;
    return;
  }
  container.innerHTML = items.map((t) => `
    <div class="task-card ${t.status === "completed" ? "completed" : ""}" data-task="${t.id}">
      <button class="chk ${t.status === "completed" ? "checked" : ""}" data-toggle="${t.id}" aria-label="Toggle complete">${t.status === "completed" ? "\u2713" : ""}</button>
      <div class="task-card-main">
        <div class="task-card-title ${t.status === "completed" ? "done" : ""}">${escapeHtml(t.title)}</div>
        <div class="task-card-meta">
          <span class="tag tag-Medium" style="background:#EFEDE5;color:var(--ink-soft);">${categoryName(t.category)}</span>
          <span class="tag tag-${t.priority}">${t.priority}</span>
          <span class="tag tag-${t.status}">${t.status}</span>
        </div>
        ${t.notes ? `<div class="task-card-notes">${escapeHtml(t.notes)}</div>` : ""}
      </div>
      <div class="task-card-actions">
        <button class="btn btn-ghost btn-sm" data-edit="${t.id}">Edit</button>
        <button class="btn-icon-danger" data-delete="${t.id}" aria-label="Delete task">Delete</button>
      </div>
    </div>`).join("");

  container.querySelectorAll("[data-toggle]").forEach((el) =>
    el.addEventListener("click", () => { toggleTaskCompletion(el.dataset.toggle); renderTasks(); renderDashboard(); }));
  container.querySelectorAll("[data-edit]").forEach((el) =>
    el.addEventListener("click", () => openTaskModal(el.dataset.edit)));
  container.querySelectorAll("[data-delete]").forEach((el) =>
    el.addEventListener("click", () => {
      if (confirm("Delete this task? This cannot be undone.")) {
        state.tasks = state.tasks.filter((t) => t.id !== el.dataset.delete);
        save();
        renderTasks();
        renderDashboard();
      }
    }));
}

function openTaskModal(taskId) {
  const modal = document.getElementById("task-modal");
  const form = document.getElementById("task-form");
  form.reset();
  if (taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    document.getElementById("task-modal-title").textContent = "Edit task";
    form.id.value = t.id;
    form.title.value = t.title;
    form.category.value = t.category;
    form.priority.value = t.priority;
    form.notes.value = t.notes || "";
  } else {
    document.getElementById("task-modal-title").textContent = "Add task";
    form.id.value = "";
  }
  modal.classList.remove("hidden");
}

/* ---------------- Skills ---------------- */

function renderSkills() {
  const breakdown = document.getElementById("skill-breakdown");
  breakdown.innerHTML = CATEGORIES.map((c) => {
    const items = state.tasks.filter((t) => t.category === c.id);
    const completed = items.filter((t) => t.status === "completed").length;
    const ongoing = items.filter((t) => t.status === "ongoing").length;
    const pending = items.filter((t) => t.status === "pending").length;
    const pct = items.length ? Math.round((completed / items.length) * 100) : 0;
    return `<div>
      <div class="skill-row-head"><span>${c.name}</span><span>${pct}%</span></div>
      <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
      <div class="skill-substats">
        <span><span class="dot dot-done"></span>${completed} completed</span>
        <span><span class="dot dot-ongoing"></span>${ongoing} ongoing</span>
        <span><span class="dot dot-pending"></span>${pending} pending</span>
      </div>
    </div>`;
  }).join("");

  const gaps = CATEGORIES.map((c) => ({ ...c, ...categoryStats(c.id) })).filter((c) => c.pct < 40);
  const gapList = document.getElementById("skill-gap-list");
  gapList.innerHTML = gaps.length
    ? gaps.sort((a, b) => a.pct - b.pct).map((c) => `<li><span class="li-title">${c.name}</span><span class="li-meta">${c.pct}% complete</span></li>`).join("")
    : `<li class="empty-note">No major skill gaps right now — nice work.</li>`;
}

/* ---------------- Analytics ---------------- */

function renderAnalytics() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(todayStr(d));
  }
  const counts = days.map((d) => state.activityLog[d] || 0);
  const max = Math.max(1, ...counts);
  const chart = document.getElementById("activity-chart");
  chart.innerHTML = days.map((d, i) => {
    const h = Math.round((counts[i] / max) * 120) + (counts[i] > 0 ? 4 : 0);
    const label = new Date(d).toLocaleDateString(undefined, { day: "numeric" });
    return `<div class="activity-bar-wrap" title="${d}: ${counts[i]} task(s)">
      <div class="activity-bar" style="height:${h}px"></div>
      <span class="activity-bar-label">${label}</span>
    </div>`;
  }).join("");

  const { current, longest, activeDays } = computeStreaks();
  document.getElementById("an-current-streak").textContent = current;
  document.getElementById("an-longest-streak").textContent = longest;
  document.getElementById("an-active-days").textContent = activeDays;
  const totalLogged = Object.values(state.activityLog).reduce((a, b) => a + b, 0);
  document.getElementById("an-avg-day").textContent = activeDays ? (totalLogged / activeDays).toFixed(1) : "0";

  const catChart = document.getElementById("category-bar-chart");
  catChart.innerHTML = CATEGORIES.map((c) => {
    const st = categoryStats(c.id);
    return `<div class="cat-row">
      <span class="cat-row-name">${c.name}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${st.pct}%"></span></span>
      <span class="cat-row-pct">${st.pct}%</span>
    </div>`;
  }).join("");
}

/* ---------------- Achievements ---------------- */

function renderAchievements() {
  const grid = document.getElementById("achievements-grid");
  grid.innerHTML = ACHIEVEMENT_DEFS.map((a) => {
    const unlocked = state.unlockedAchievements[a.id];
    return `<div class="badge-card ${unlocked ? "" : "locked"}">
      <span class="badge-icon">${a.icon}</span>
      <div>
        <div class="badge-title">${a.title}</div>
        <p class="badge-desc">${a.desc}</p>
        ${unlocked ? `<div class="badge-date">Unlocked ${formatDate(unlocked)}</div>` : ""}
      </div>
    </div>`;
  }).join("");
}

/* ---------------- History ---------------- */

function renderHistory() {
  const points = [...state.readinessHistory].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
  const chart = document.getElementById("readiness-history-chart");
  if (!points.length) {
    chart.innerHTML = `<p class="empty-note">No readiness snapshots yet — complete tasks to build history.</p>`;
  } else {
    const max = 100;
    chart.innerHTML = points.map((p) => {
      const h = Math.round((p.score / max) * 120) + 4;
      const label = new Date(p.date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return `<div class="activity-bar-wrap" title="${p.date}: ${p.score}%">
        <div class="activity-bar" style="height:${h}px; background:var(--clay);"></div>
        <span class="activity-bar-label">${label}</span>
      </div>`;
    }).join("");
  }

  const completed = state.tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const list = document.getElementById("history-list");
  list.innerHTML = completed.length
    ? completed.map((t) => `<li><span class="li-title">${escapeHtml(t.title)}</span><span class="li-meta">${categoryName(t.category)} · completed ${formatDate(t.completedAt)}</span></li>`).join("")
    : `<li class="empty-note">Your completed activity log will build up here.</li>`;
}

/* ---------------- Toast ---------------- */

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3600);
}

/* ---------------- Export ---------------- */

function exportData() {
  const summary = {
    profile: state.profile,
    exportedAt: new Date().toISOString(),
    overall: overallStats(),
    readiness: readinessScore(),
    categories: CATEGORIES.map((c) => ({ name: c.name, ...categoryStats(c.id) })),
    tasks: state.tasks,
    achievements: Object.keys(state.unlockedAchievements),
  };
  downloadFile(`trailhead-progress-${todayStr()}.json`, JSON.stringify(summary, null, 2), "application/json");

  const csvRows = [["Title", "Category", "Priority", "Status", "Created", "Completed"]];
  state.tasks.forEach((t) => csvRows.push([t.title, categoryName(t.category), t.priority, t.status, t.createdAt, t.completedAt || ""]));
  const csv = csvRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile(`trailhead-tasks-${todayStr()}.csv`, csv, "text/csv");

  showToast("Progress report exported.");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- Init & events ---------------- */

function bootstrap() {
  state = load();
  populateCategorySelects();

  if (!state.profile) {
    document.getElementById("onboarding").classList.remove("hidden");
    document.getElementById("app").classList.add("hidden");
  } else {
    startApp();
  }

  document.getElementById("onboarding-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.profile = {
      name: fd.get("name").trim(),
      college: fd.get("college").trim(),
      branch: fd.get("branch").trim(),
      gradYear: fd.get("gradYear"),
      targetRole: fd.get("targetRole").trim(),
      targetCompany: fd.get("targetCompany").trim(),
      targetDate: fd.get("targetDate"),
    };
    save();
    document.getElementById("onboarding").classList.add("hidden");
    startApp();
  });

  document.querySelectorAll(".trail-item").forEach((btn) =>
    btn.addEventListener("click", () => switchView(btn.dataset.view)));

  document.getElementById("add-task-btn").addEventListener("click", () => openTaskModal(null));
  document.getElementById("task-modal-cancel").addEventListener("click", () => document.getElementById("task-modal").classList.add("hidden"));
  document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("id");
    if (id) {
      const t = state.tasks.find((x) => x.id === id);
      t.title = fd.get("title").trim();
      t.category = fd.get("category");
      t.priority = fd.get("priority");
      t.notes = fd.get("notes").trim();
    } else {
      state.tasks.push({
        id: uid(),
        title: fd.get("title").trim(),
        category: fd.get("category"),
        priority: fd.get("priority"),
        notes: fd.get("notes").trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: null,
      });
    }
    save();
    document.getElementById("task-modal").classList.add("hidden");
    renderTasks();
    renderDashboard();
  });

  ["task-search", "filter-category", "filter-status", "filter-priority"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", renderTasks);
    el.addEventListener("change", renderTasks);
  });

  document.getElementById("open-profile").addEventListener("click", openProfileModal);
  document.getElementById("profile-modal-cancel").addEventListener("click", () => document.getElementById("profile-modal").classList.add("hidden"));
  document.getElementById("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.profile = {
      name: fd.get("name").trim(),
      college: fd.get("college").trim(),
      branch: fd.get("branch").trim(),
      gradYear: fd.get("gradYear"),
      targetRole: fd.get("targetRole").trim(),
      targetCompany: fd.get("targetCompany").trim(),
      targetDate: fd.get("targetDate"),
    };
    save();
    document.getElementById("profile-modal").classList.add("hidden");
    renderSidebar();
    renderDashboard();
  });

  document.getElementById("export-btn").addEventListener("click", exportData);
}

function openProfileModal() {
  const form = document.getElementById("profile-form");
  const p = state.profile;
  form.name.value = p.name;
  form.college.value = p.college;
  form.branch.value = p.branch;
  form.gradYear.value = p.gradYear;
  form.targetRole.value = p.targetRole;
  form.targetCompany.value = p.targetCompany || "";
  form.targetDate.value = p.targetDate || "";
  document.getElementById("profile-modal").classList.remove("hidden");
}

function startApp() {
  document.getElementById("app").classList.remove("hidden");
  renderSidebar();
  recordReadinessSnapshot();
  checkAchievements();
  save();
  switchView("dashboard");
}

document.addEventListener("DOMContentLoaded", bootstrap);
