let allIssues = [];
let filteredIssues = [];
let currentView = 'list';

document.addEventListener("DOMContentLoaded", () => {
  let stored = localStorage.getItem("issues");
  if (!stored) {
    const baseIssue = {
      code: "ISS-001",
      title: "Login button not working on mobile",
      status: "To Do",
      priority: "High",
      severity: "Major",
      createdBy: "John Doe",
      assignedTo: "Jane Smith",
      createdDate: "2025-09-28",
      dueDate: "2025-10-15",
      module: "Authentication",
      environment: "Production",
      description: "Users are unable to click the login button on mobile devices. The button appears unresponsive.",
      steps: "1. Open app on mobile\n2. Go to login\n3. Tap login button",
      expectedResult: "Login button should respond to touch",
      actualResult: "Button is unresponsive",
      category: "Bug"
    };
    allIssues = Array.from({length: 6}, (_, i) => ({ ...baseIssue, code: `ISS-00${i+1}` }));
    localStorage.setItem("issues", JSON.stringify(allIssues));
  } else {
    allIssues = JSON.parse(stored);
  }
  filteredIssues = [...allIssues];
  setupEventListeners();
  if (document.getElementById("issueList")) {
    loadIssueList();
    updateDashboardStats();
  } else if (document.getElementById("issueForm")) {
    loadIssuePage();
  }
});

function setupEventListeners() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleView(btn.getAttribute('data-view'));
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  const openFilterBtn = document.getElementById("openFilter");
  const closeFilterBtn = document.getElementById("closeFilter");
  const filterOverlay = document.querySelector(".filter-overlay");
  const filterPanel = document.querySelector(".modern-filter-panel");
  if (openFilterBtn && filterPanel) openFilterBtn.addEventListener("click", () => { filterPanel.classList.add("open"); if (filterOverlay) filterOverlay.classList.add("active"); });
  if (closeFilterBtn && filterPanel) closeFilterBtn.addEventListener("click", () => { filterPanel.classList.remove("open"); if (filterOverlay) filterOverlay.classList.remove("active"); });
  if (filterOverlay && filterPanel) filterOverlay.addEventListener("click", () => { filterPanel.classList.remove("open"); filterOverlay.classList.remove("active"); });
  const issueForm = document.getElementById("issueForm");
  if (issueForm) issueForm.addEventListener("submit", handleFormSubmit);
  const globalSearch = document.getElementById("globalSearch");
  const searchInput = document.getElementById("searchInput");
  if (globalSearch) globalSearch.addEventListener("input", (e) => performSearch(e.target.value));
  if (searchInput) searchInput.addEventListener("input", (e) => performSearch(e.target.value));
}

function performSearch(searchTerm) {
  filteredIssues = !searchTerm.trim() ? [...allIssues] : allIssues.filter(issue => Object.values(issue).some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase())));
  if (currentView === 'list') loadIssueList();
  else if (currentView === 'kanban') loadKanbanBoard();
  updateDashboardStats();
  const globalSearch = document.getElementById("globalSearch");
  const searchInput = document.getElementById("searchInput");
  if (globalSearch && globalSearch.value !== searchTerm) globalSearch.value = searchTerm;
  if (searchInput && searchInput.value !== searchTerm) searchInput.value = searchTerm;
}

function toggleView(view) {
  currentView = view;
  const listView = document.getElementById("ListView");
  const kanbanView = document.getElementById("kanbanView");
  if (view === 'list') {
    if (listView) listView.classList.remove('hidden');
    if (kanbanView) kanbanView.classList.add('hidden');
    loadIssueList();
  } else if (view === 'kanban') {
    if (listView) listView.classList.add('hidden');
    if (kanbanView) kanbanView.classList.remove('hidden');
    loadKanbanBoard();
  }
}

function updateDashboardStats() {
  const todoCount = filteredIssues.filter(i => i.status === 'To Do').length;
  const progressCount = filteredIssues.filter(i => i.status === 'In Progress').length;
  const doneCount = filteredIssues.filter(i => i.status === 'Done').length;
  const qaCount = filteredIssues.filter(i => i.status === 'QA').length;
  const totalCount = filteredIssues.length;
  [['todoCount', todoCount], ['inProgressCount', progressCount], ['doneCount', doneCount], ['qaCount', qaCount], ['totalCount', totalCount]].forEach(([id, count]) => { const el = document.getElementById(id); if (el) el.textContent = count; });
}

function loadKanbanBoard() {
  const columns = { "To Do": document.getElementById("todoColumn"), "In Progress": document.getElementById("progressColumn"), "Done": document.getElementById("doneColumn"), "QA": document.getElementById("qaColumn") };
  Object.values(columns).forEach(column => { if (column) { const placeholder = column.querySelector(".column-placeholder"); column.innerHTML = ""; if (placeholder) column.appendChild(placeholder); } });
  filteredIssues.forEach((issue, index) => { const column = columns[issue.status]; if (column) { const placeholder = column.querySelector(".column-placeholder"); if (placeholder) placeholder.style.display = "none"; column.appendChild(createIssueCard(issue, index)); } });
}

function createIssueCard(issue, index) {
  const card = document.createElement("div");
  card.className = "issue-card";
  card.dataset.issueIndex = index;
  const priorityClass = `priority-${issue.priority?.toLowerCase() || "medium"}`;
  const assigneeInitials = getInitials(issue.assignedTo || "Unassigned");
  card.innerHTML = `<div class="card-header"><span class="issue-code">${issue.code}</span><span class="priority-badge ${priorityClass}">${issue.priority || "Medium"}</span></div><div class="card-content"><h4 class="card-title">${issue.title}</h4><p class="card-description">${issue.description.substring(0, 100)}${issue.description && issue.description.length > 100 ? "..." : ""}</p></div><div class="card-footer"><div class="card-meta"><span class="module-tag">${issue.module || "General"}</span></div><div class="assignee-avatar" title="${issue.assignedTo || "Unassigned"}">${assigneeInitials}</div></div>`;
  card.addEventListener("click", () => editIssue(issue.code));
  return card;
}

function createInitialAvatar(name, color = '#344FD2') {
  const initial = name && name !== 'Unassigned' && name !== 'Current User' ? name.trim()[0].toUpperCase() : 'U';
  return `<span class="initial-avatar" style="background:${color};">${initial}</span>`;
}

function loadIssueList() {
  const tbody = document.querySelector(".issues-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  filteredIssues.forEach((issue) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="sticky-col col-code"><span class="issue-code">${issue.code}</span></td><td class="col-title"><span class="issue-title">${issue.title}</span></td><td class="col-priority"><span class="priority-badge priority-${issue.priority?.toLowerCase() || "medium"}">${issue.priority || "Medium"}</span></td><td class="col-status"><span class="status-badge status-${issue.status?.toLowerCase().replace(" ", "") || "todo"}">${issue.status || "To Do"}</span></td><td class="col-creator">${createInitialAvatar(issue.createdBy || "Current User", '#A33820')}<span class="creator-name">${issue.createdBy || "Current User"}</span></td><td class="col-assignee">${createInitialAvatar(issue.assignedTo || "Unassigned")}<span class="assignee-name">${issue.assignedTo || "Unassigned"}</span></td><td class="col-created">${issue.createdDate || "-"}</td><td class="col-actions"><div class="action-buttons"><button class="action-btn-sm primary" onclick="editIssue('${issue.code}')"><img src="icons/edit.png" alt="Edit" style="width:14px;height:14px;" /></button><button class="action-btn-sm danger" onclick="deleteIssue('${issue.code}')"><img src="icons/delete.png" alt="Delete" style="width:14px;height:14px;" /></button></div></td><td class="col-module">${issue.module || "-"}</td><td class="col-severity">${issue.severity || "-"}</td><td class="col-environment">${issue.environment || "-"}</td><td class="col-due">${issue.dueDate || "-"}</td>`;
    row.addEventListener("click", (e) => { if (!e.target.closest(".action-buttons")) { editIssue(issue.code); } });
    tbody.appendChild(row);
  });
}

function loadIssuePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const issueCode = urlParams.get("code");
  if (issueCode) {
    const stored = localStorage.getItem("issues");
    if (stored) {
      const issues = JSON.parse(stored);
      const issue = issues.find((i) => i.code === issueCode);
      if (issue) populateForm(issue);
    }
  }
}

function populateForm(issue) {
  ["title","category","status","priority","severity","assignedTo","module","environment","dueDate","description","steps","expectedResult","actualResult"].forEach((field) => { const el = document.getElementById(field); if (el && issue[field]) el.value = issue[field]; });
  const issueCodeHeader = document.getElementById("issueCodeHeader");
  if (issueCodeHeader) issueCodeHeader.textContent = "Issue Details - " + issue.code;
  const submitBtn = document.getElementById("submitBtnText");
  if (submitBtn) submitBtn.textContent = "Update Issue";
}

function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const issue = Object.fromEntries(formData);
  let issues = JSON.parse(localStorage.getItem("issues")) || [];
  if (!issue.code) {
    const maxNum = Math.max(0, ...issues.map((i) => parseInt(i.code.split("-")[1]) || 0));
    issue.code = `ISS-${String(maxNum + 1).padStart(3, "0")}`;
    issue.createdDate = new Date().toISOString().split("T")[0];
    issue.createdBy = "Current User";
  }
  const existingIndex = issues.findIndex((i) => i.code === issue.code);
  if (existingIndex >= 0) issues[existingIndex] = issue;
  else issues.push(issue);
  localStorage.setItem("issues", JSON.stringify(issues));
  window.location.href = "index.html";
}

function getInitials(name) {
  if (!name || name === "Unassigned") return "U";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function editIssue(code) {
  window.location.href = `issue.html?code=${code}`;
}

function deleteIssue(code) {
  if (confirm("Are you sure you want to delete this issue?")) {
    const stored = localStorage.getItem("issues");
    if (stored) {
      let issues = JSON.parse(stored);
      issues = issues.filter((i) => i.code !== code);
      localStorage.setItem("issues", JSON.stringify(issues));
      location.reload();
    }
  }
}
