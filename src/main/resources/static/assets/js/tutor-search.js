UiUtils.renderHeader();

const tutorNameInput = document.getElementById("tutorNameInput");
const subjectSelect = document.getElementById("subjectSelect");
const gradeSelect = document.getElementById("gradeSelect");
const teachingModeSelect = document.getElementById("teachingModeSelect");
const provinceInput = document.getElementById("provinceInput");
const districtInput = document.getElementById("districtInput");
const searchButton = document.getElementById("searchButton");
const resultCount = document.getElementById("resultCount");
const loadingState = document.getElementById("loadingState");
const tutorResults = document.getElementById("tutorResults");
const noResults = document.getElementById("noResults");

let tutors = [];

function stars(n) {
  const full = Math.max(0, Math.min(5, Math.round(Number(n || 0))));
  return "&#9733;".repeat(full) + "&#9734;".repeat(5 - full);
}

function shortIntro(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Gia sư chưa cập nhật lời giới thiệu.";
  return raw.length > 190 ? raw.slice(0, 190).trimEnd() + "..." : raw;
}

function renderTutorCard(t) {
  const avatar = t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName || "Tutor")}&background=2563eb&color=fff`;
  const fee = t.hourlyRate ? `${new Intl.NumberFormat("vi-VN").format(t.hourlyRate)} đ/buổi` : "Thỏa thuận";
  const intro = shortIntro(t.description);
  const fullName = esc(t.fullName || "Gia sư");
  const subjects = (t.subjects || []).slice(0, 3).join(", ") || "Chưa cập nhật môn";
  const grades = (t.grades || []).slice(0, 3).join(", ") || "Chưa cập nhật khối";
  const area = [t.district, t.province].filter(Boolean).join(", ") || "Chưa cập nhật khu vực";
  const mode = t.teachingMode || "Linh hoat";

  return `
    <article class="tutor-card">
      <div class="tutor-card-body">
        <div class="tutor-header">
          <img class="tutor-avatar" src="${esc(avatar)}" alt="${fullName}">
          <div class="tutor-info">
            <h3>${fullName}</h3>
            <div class="tutor-meta tutor-rating-row"><span class="rating-stars">${stars(t.averageRating)}</span> (${esc(t.reviewCount || 0)})</div>
          </div>
        </div>
        <p class="tutor-meta">${esc(subjects)} · ${esc(grades)} · ${esc(area)}</p>
        <p class="tutor-price">${esc(fee)} · ${esc(mode)}</p>
        <p class="tutor-intro">${esc(intro)}</p>
      </div>
      <div class="tutor-card-footer">
        <a class="btn btn-primary full-btn" href="gia-su-profile.html?id=${encodeURIComponent(t.tutorId)}">Xem chi tiết</a>
      </div>
    </article>`;
}

function render() {
  loadingState.classList.add("hidden");
  resultCount.textContent = tutors.length;
  if (!tutors.length) {
    tutorResults.classList.add("hidden");
    noResults.classList.remove("hidden");
    return;
  }
  noResults.classList.add("hidden");
  tutorResults.classList.remove("hidden");
  DomUtils.setHtml(tutorResults, tutors.map(renderTutorCard).join(""));
}

function resolvePageItems(data) {
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

function appendOptions(selectEl, rows) {
  if (!selectEl || !Array.isArray(rows)) return;
  rows.forEach(item => {
    const id = Number(item && item.id);
    const name = String((item && item.name) || "").trim();
    if (!Number.isFinite(id) || !name) return;

    const option = document.createElement("option");
    option.value = String(id);
    option.textContent = name;
    selectEl.appendChild(option);
  });
}

function parseOptionalId(raw) {
  const value = Number(raw || 0);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function loadLookups() {
  try {
    const [subjects, grades] = await Promise.all([
      ApiClient.get("/api/lookups/subjects"),
      ApiClient.get("/api/lookups/grades")
    ]);
    appendOptions(subjectSelect, subjects);
    appendOptions(gradeSelect, grades);
  } catch (e) {
    console.error("Load lookups failed", e);
  }
}

async function run() {
  loadingState.classList.remove("hidden");
  tutorResults.classList.add("hidden");
  noResults.classList.add("hidden");
  try {
    const keyword = (tutorNameInput.value || "").trim();
    const data = await ApiClient.get("/api/tutors", {
      keyword: keyword || undefined,
      subjectId: parseOptionalId(subjectSelect.value),
      gradeId: parseOptionalId(gradeSelect.value),
      teachingMode: teachingModeSelect.value || undefined,
      province: (provinceInput.value || "").trim() || undefined,
      district: (districtInput.value || "").trim() || undefined,
      profileStatus: "APPROVED",
      page: 0,
      size: 30
    });
    tutors = resolvePageItems(data);
  } catch (e) {
    console.error(e);
    loadingState.classList.add("hidden");
    tutorResults.classList.add("hidden");
    noResults.classList.remove("hidden");
    const title = noResults.querySelector("h3");
    const msg = noResults.querySelector("p");
    if (title) title.textContent = "Lỗi tải dữ liệu gia sư.";
    if (msg) msg.textContent = (e && e.message) ? e.message : "Không thể tải danh sách gia sư.";
    resultCount.textContent = "0";
    return;
  }
  render();
}

searchButton.addEventListener("click", run);
tutorNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") run();
});
subjectSelect.addEventListener("change", run);
gradeSelect.addEventListener("change", run);
teachingModeSelect.addEventListener("change", run);
provinceInput.addEventListener("keydown", e => {
  if (e.key === "Enter") run();
});
districtInput.addEventListener("keydown", e => {
  if (e.key === "Enter") run();
});

run();
loadLookups();
