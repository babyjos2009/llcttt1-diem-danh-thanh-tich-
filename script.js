/* =====================================
   LỚN LÊN TRONG CHÚA THÁNH THẦN 1
   BẢN KHÔI PHỤC GIAO DIỆN CŨ
   ===================================== */

"use strict";

const key = "llcttt1_attendance_v5";

function loadData() {
  try {
    const raw = localStorage.getItem(key);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Không đọc được dữ liệu cũ:", error);
  }

  return {
    members: [],
    sessions: [],
    current: -1,
    competition: {}
  };
}

let data = loadData();

if (!Array.isArray(data.members)) {
  data.members = [];
}

if (!Array.isArray(data.sessions)) {
  data.sessions = [];
}

if (typeof data.current !== "number") {
  data.current = -1;
}

if (
  !data.competition ||
  typeof data.competition !== "object" ||
  Array.isArray(data.competition)
) {
  data.competition = {};
}

/*
  PHỤC HỒI TÊN THÀNH VIÊN TỪ THANH THI ĐUA.

  Nếu danh sách thành viên đang trống nhưng dữ liệu
  điểm theo tháng vẫn còn, lấy lại tên từ dữ liệu đó.
*/

if (data.members.length === 0) {
  const recoveredNames = new Set();

  Object.values(data.competition).forEach(monthData => {
    if (
      monthData &&
      typeof monthData === "object" &&
      !Array.isArray(monthData)
    ) {
      Object.keys(monthData).forEach(name => {
        if (name && name.trim()) {
          recoveredNames.add(name);
        }
      });
    }
  });

  if (recoveredNames.size > 0) {
    data.members = Array.from(recoveredNames).sort(
      (a, b) => a.localeCompare(b, "vi")
    );
  }
}

/*
  Đảm bảo dữ liệu điểm danh hợp lệ.
*/

data.sessions = data.sessions.map(session => {
  const attendance = Array.isArray(session.attendance)
    ? session.attendance
    : [];

  while (attendance.length < data.members.length) {
    attendance.push(false);
  }

  return {
    date: session.date || new Date().toISOString(),
    label: session.label || "Buổi học",
    attendance: attendance.slice(0, data.members.length)
  };
});

if (
  data.current < -1 ||
  data.current >= data.sessions.length
) {
  data.current = data.sessions.length - 1;
}

if (data.sessions.length === 0) {
  data.current = -1;
}

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Không lưu được dữ liệu:", error);
    alert("Không thể lưu dữ liệu trên trình duyệt này.");
  }
}

const now = new Date();

let competitionMonth =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0");

/* =====================================
   HÀM HỖ TRỢ
   ===================================== */

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];
  });
}

function getCurrentSession() {
  if (
    data.current < 0 ||
    !data.sessions[data.current]
  ) {
    return null;
  }

  return data.sessions[data.current];
}

/* =====================================
   HIỂN THỊ ĐIỂM DANH
   ===================================== */

function render() {
  const session = getCurrentSession();

  const createButton =
    document.querySelector("#attendance .top .btn");

  if (createButton) {
    createButton.textContent = "＋ Tạo buổi học";
    createButton.onclick = createSession;
  }

  if (!session) {
    document.getElementById("sessionTitle").textContent =
      "Chưa có buổi học";

    document.getElementById("sessionDate").textContent =
      "Hãy bấm “＋ Tạo buổi học” để bắt đầu.";

    document.getElementById("list").innerHTML = `
      <div style="text-align:center;padding:25px 10px">
        <div style="font-size:42px">📅</div>
        <h3>Chưa có buổi học nào</h3>
        <p class="small">Hãy tạo buổi học để bắt đầu điểm danh.</p>
        <button class="btn" onclick="createSession()">
          ＋ Tạo buổi học
        </button>
      </div>
    `;

    document.getElementById("total").textContent =
      data.members.length;

    document.getElementById("present").textContent = "0";

    document.getElementById("absent").textContent =
      data.members.length;

    renderSessions();
    renderMembers();
    renderCompetition();

    return;
  }

  document.getElementById("sessionTitle").textContent =
    session.label;

  document.getElementById("sessionDate").textContent =
    new Date(session.date).toLocaleDateString("vi-VN");

  const query = (
    document.getElementById("search")?.value || ""
  ).toLowerCase();

  const shown = data.members
    .map((name, index) => ({ name, index }))
    .filter(item =>
      item.name.toLowerCase().includes(query)
    );

  document.getElementById("list").innerHTML =
    shown.length
      ? shown.map(item => `
        <div class="row">
          <span class="member-name">
            ${item.index + 1}. ${escapeHtml(item.name)}
          </span>

          <button
            class="badge ${
              session.attendance[item.index]
                ? "present"
                : "absent"
            }"
            onclick="toggle(${item.index})"
          >
            ${
              session.attendance[item.index]
                ? "✓ Có mặt"
                : "✕ Vắng"
            }
          </button>
        </div>
      `).join("")
      : "<p>Không tìm thấy thành viên.</p>";

  const presentCount =
    session.attendance.filter(Boolean).length;

  document.getElementById("total").textContent =
    data.members.length;

  document.getElementById("present").textContent =
    presentCount;

  document.getElementById("absent").textContent =
    data.members.length - presentCount;

  renderSessions();
  renderMembers();
  renderCompetition();
}

/* =====================================
   TẠO BUỔI HỌC
   ===================================== */

function createSession() {
  const label = prompt(
    "Nhập tên buổi học:",
    `Buổi học ${data.sessions.length + 1}`
  );

  if (label === null) return;

  const cleanLabel = label.trim();

  if (!cleanLabel) {
    alert("Tên buổi học không được để trống.");
    return;
  }

  const dateInput = prompt(
    "Nhập ngày học theo dạng DD/MM/YYYY:",
    new Date().toLocaleDateString("vi-VN")
  );

  if (dateInput === null) return;

  const parts = dateInput.trim().split(/[\/\-.]/);

  if (parts.length !== 3) {
    alert("Vui lòng nhập ngày theo dạng DD/MM/YYYY.");
    return;
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month - 1, day);

  if (
    isNaN(date.getTime()) ||
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    alert("Ngày học không hợp lệ.");
    return;
  }

  data.sessions.push({
    date: date.toISOString(),
    label: cleanLabel,
    attendance: Array(data.members.length).fill(false)
  });

  data.current = data.sessions.length - 1;

  save();
  render();
}

/* =====================================
   ĐIỂM DANH
   ===================================== */

function toggle(index) {
  const session = getCurrentSession();

  if (!session) {
    alert("Bạn hãy tạo buổi học trước.");
    return;
  }

  session.attendance[index] =
    !session.attendance[index];

  save();
  render();
}

/* =====================================
   THỐNG KÊ
   ===================================== */

function renderSessions() {
  const box = document.getElementById("sessionList");

  if (!box) return;

  if (!data.sessions.length) {
    box.innerHTML =
      '<p class="small">Chưa có buổi học nào.</p>';
  } else {
    let totalPresent = 0;
    let totalCount = 0;

    box.innerHTML = data.sessions
      .map((session, index) => {
        const presentCount =
          session.attendance.filter(Boolean).length;

        totalPresent += presentCount;
        totalCount += session.attendance.length;

        const percentage =
          session.attendance.length
            ? Math.round(
                presentCount /
                session.attendance.length *
                100
              )
            : 0;

        return `
          <div class="session">
            <b>${escapeHtml(session.label)}</b>

            <div>
              ${new Date(session.date).toLocaleDateString("vi-VN")}
            </div>

            <div>
              ${presentCount}/${session.attendance.length}
              có mặt (${percentage}%)
            </div>

            <div class="bar">
              <div
                class="fill"
                style="width:${percentage}%"
              ></div>
            </div>

            <div class="actions" style="margin-top:9px">
              <button
                class="btn"
                onclick="selectSession(${index})"
              >
                Mở buổi này
              </button>

              <button
                class="btn red"
                onclick="deleteSession(${index})"
              >
                🗑️ Xóa buổi
              </button>
            </div>
          </div>
        `;
      }).join("");

    document.getElementById("average").textContent =
      totalCount
        ? Math.round(totalPresent / totalCount * 100) + "%"
        : "0%";
  }

  document.getElementById("sessionCount").textContent =
    data.sessions.length;

  document.getElementById("memberCount").textContent =
    data.members.length;

  if (!data.sessions.length) {
    document.getElementById("average").textContent = "0%";
  }
}

function selectSession(index) {
  data.current = index;
  save();
  showTab("attendance");
}

function deleteSession(index) {
  const session = data.sessions[index];

  if (!session) return;

  const confirmed = confirm(
    `Bạn có chắc muốn xóa "${session.label}" không?\n\n` +
    "Dữ liệu điểm danh của buổi này cũng sẽ bị xóa."
  );

  if (!confirmed) return;

  data.sessions.splice(index, 1);

  if (data.sessions.length === 0) {
    data.current = -1;
  } else if (data.current === index) {
    data.current = Math.min(
      index,
      data.sessions.length - 1
    );
  } else if (data.current > index) {
    data.current--;
  }

  save();
  render();
}

/* =====================================
   CHUYỂN TAB
   ===================================== */

function showTab(tab) {
  document.querySelectorAll(".tabs button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.tab === tab
      );
    });

  [
    "attendance",
    "sessions",
    "members",
    "competition"
  ].forEach(id => {
    document.getElementById(id).style.display =
      id === tab ? "block" : "none";
  });

  render();
}

document.querySelectorAll(".tabs button")
  .forEach(button => {
    button.onclick = () => {
      showTab(button.dataset.tab);
    };
  });

/* =====================================
   QUẢN LÝ THÀNH VIÊN
   ===================================== */

function renderMembers() {
  const box = document.getElementById("memberList");

  if (!box) return;

  box.innerHTML = data.members.length
    ? data.members.map((name, index) => `
      <div class="row">
        <span class="member-name">
          ${index + 1}. ${escapeHtml(name)}
        </span>

        <div class="actions">
          <button
            class="btn gray"
            onclick="renameMember(${index})"
          >
            ✏️ Đổi tên
          </button>

          <button
            class="btn red"
            onclick="deleteMember(${index})"
          >
            🗑️ Xóa
          </button>
        </div>
      </div>
    `).join("")
    : "<p>Chưa có thành viên.</p>";
}

function addMember() {
  const input = document.getElementById("newMember");
  const name = input.value.trim();

  if (!name) {
    alert("Bạn chưa nhập tên.");
    return;
  }

  if (
    data.members.some(
      existing =>
        existing.toLowerCase() === name.toLowerCase()
    )
  ) {
    alert("Tên này đã có trong danh sách.");
    return;
  }

  data.members.push(name);

  data.sessions.forEach(session => {
    session.attendance.push(false);
  });

  input.value = "";

  save();
  render();
}

function renameMember(index) {
  const oldName = data.members[index];

  const name = prompt(
    "Đổi tên thành viên:",
    oldName
  );

  if (name === null) return;

  const cleanName = name.trim();

  if (!cleanName) {
    alert("Tên không được để trống.");
    return;
  }

  if (
    data.members.some(
      (existing, i) =>
        i !== index &&
        existing.toLowerCase() === cleanName.toLowerCase()
    )
  ) {
    alert("Tên này đã có trong danh sách.");
    return;
  }

  data.members[index] = cleanName;

  // Đổi tên trong toàn bộ dữ liệu thi đua.
  Object.values(data.competition).forEach(monthData => {
    if (
      monthData &&
      Object.prototype.hasOwnProperty.call(
        monthData,
        oldName
      )
    ) {
      monthData[cleanName] = monthData[oldName];
      delete monthData[oldName];
    }
  });

  save();
  render();
}

function deleteMember(index) {
  const name = data.members[index];

  const confirmed = confirm(
    `Xóa "${name}" khỏi danh sách?`
  );

  if (!confirmed) return;

  data.members.splice(index, 1);

  data.sessions.forEach(session => {
    session.attendance.splice(index, 1);
  });

  save();
  render();
}

/* =====================================
   THANH THI ĐUA
   ===================================== */

function formatCompetitionMonth(monthKey) {
  const [year, month] =
    monthKey.split("-").map(Number);

  return `THÁNG ${month}/${year}`;
}

function getScores(monthKey) {
  if (
    !data.competition[monthKey] ||
    typeof data.competition[monthKey] !== "object"
  ) {
    data.competition[monthKey] = {};
  }

  data.members.forEach(name => {
    if (
      typeof data.competition[monthKey][name] !== "number"
    ) {
      data.competition[monthKey][name] = 0;
    }
  });

  return data.competition[monthKey];
}

function changeCompetitionMonth(delta) {
  const [year, month] =
    competitionMonth.split("-").map(Number);

  const date = new Date(
    year,
    month - 1 + delta,
    1
  );

  competitionMonth =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0");

  renderCompetition();
}

function adjustScoreByIndex(index, amount) {
  if (
    index < 0 ||
    index >= data.members.length
  ) {
    return;
  }

  const name = data.members[index];
  const scores = getScores(competitionMonth);

  scores[name] = Math.max(
    0,
    (scores[name] || 0) + amount
  );

  save();
  renderCompetition();
}

function resetCompetitionMonth() {
  const confirmed = confirm(
    `Đặt lại toàn bộ điểm của ${formatCompetitionMonth(
      competitionMonth
    )} về 0?`
  );

  if (!confirmed) return;

  const scores = getScores(competitionMonth);

  data.members.forEach(name => {
    scores[name] = 0;
  });

  save();
  renderCompetition();
}

function getPrize(rank, total) {
  if (rank === 1) return "🏆 Giải Nhất";
  if (rank === 2) return "🥈 Giải Nhì";
  if (rank === 3) return "🥉 Giải Ba";

  if (
    total >= 4 &&
    rank <= Math.max(4, Math.ceil(total / 3))
  ) {
    return "🏅 Khuyến khích";
  }

  return "";
}

function renderCompetition() {
  const title =
    document.getElementById("competitionMonth");

  const box =
    document.getElementById("competitionList");

  if (!title || !box) return;

  title.textContent =
    formatCompetitionMonth(competitionMonth);

  const scores = getScores(competitionMonth);

  const ranked = data.members
    .map(name => ({
      name,
      score: scores[name] || 0
    }))
    .sort((a, b) => {
      return (
        b.score - a.score ||
        a.name.localeCompare(b.name, "vi")
      );
    });

  const maxScore = Math.max(
    10,
    ...ranked.map(item => item.score)
  );

  if (!ranked.length) {
    box.innerHTML = "<p>Chưa có thành viên.</p>";
    return;
  }

  box.innerHTML = ranked.map((item, index) => {
    const rank = index + 1;

    const width = Math.min(
      100,
      Math.max(0, item.score / maxScore * 100)
    );

    const prize = getPrize(rank, ranked.length);

    let medal;

    if (rank === 1) {
      medal = "🥇";
    } else if (rank === 2) {
      medal = "🥈";
    } else if (rank === 3) {
      medal = "🥉";
    } else {
      medal = `#${rank}`;
    }

    const memberIndex =
      data.members.indexOf(item.name);

    return `
      <div class="rank-card">
        <div class="rank-head">
          <div>
            <span class="rank-medal">${medal}</span>
            <span class="rank-name">
              ${escapeHtml(item.name)}
            </span>

            ${
              prize
                ? `<div class="prize">${prize}</div>`
                : ""
            }
          </div>

          <div class="rank-score">
            ${item.score} điểm
          </div>
        </div>

        <div class="rank-bar">
          <div
            class="rank-fill"
            style="width:${width}%"
          ></div>
        </div>

        <div class="score-actions">
          <button
            class="score-btn minus"
            onclick="adjustScoreByIndex(${memberIndex}, -10)"
          >
            −10
          </button>

          <button
            class="score-btn minus"
            onclick="adjustScoreByIndex(${memberIndex}, -5)"
          >
            −5
          </button>

          <button
            class="score-btn plus"
            onclick="adjustScoreByIndex(${memberIndex}, 5)"
          >
            +5
          </button>

          <button
            class="score-btn plus"
            onclick="adjustScoreByIndex(${memberIndex}, 10)"
          >
            +10
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* =====================================
   CHẠY WEBSITE
   ===================================== */

save();
render();
