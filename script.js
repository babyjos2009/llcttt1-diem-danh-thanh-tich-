const defaultNames = [
  "Nguyễn Văn An",
  "Trần Văn Bình",
  "Lê Minh Châu",
  "Phạm Đức Duy",
  "Hoàng Gia Huy",
  "Nguyễn Thị Lan",
  "Vũ Minh Long",
  "Đỗ Quang Nam",
  "Trần Thông"
];

const key = "llcttt1_attendance_v5";
let data = JSON.parse(localStorage.getItem(key) || "null");

if (!data || !Array.isArray(data.members)) {
  data = {
    members: [...defaultNames],
    sessions: [],
    current: -1,
    competition: {},
    memberInfo: {}
  };
}

if (!Array.isArray(data.sessions)) data.sessions = [];
if (typeof data.current !== "number") data.current = -1;
if (!data.competition || typeof data.competition !== "object") data.competition = {};
if (!data.memberInfo || typeof data.memberInfo !== "object") data.memberInfo = {};

function normalizeMemberInfo(name) {
  if (!data.memberInfo[name] || typeof data.memberInfo[name] !== "object") {
    data.memberInfo[name] = {};
  }

  const info = data.memberInfo[name];

  if (typeof info.dob !== "string") info.dob = "";
  if (typeof info.father !== "string") info.father = "";
  if (typeof info.mother !== "string") info.mother = "";
  if (typeof info.phone !== "string") info.phone = "";
  if (typeof info.photo !== "string") info.photo = "";

  return info;
}

data.members.forEach(normalizeMemberInfo);

const now = new Date();

let competitionMonth =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0");


function save() {
  localStorage.setItem(key, JSON.stringify(data));
}


function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


function getCurrentSession() {
  return data.current >= 0 && data.sessions[data.current]
    ? data.sessions[data.current]
    : null;
}


/* =========================
   HIỂN THỊ CHUNG
========================= */

function render() {
  renderAttendance();
  renderSessions();
  renderMembers();
  renderCompetition();
}


function renderAttendance() {
  const s = getCurrentSession();

  const title =
    document.getElementById("sessionTitle");

  const date =
    document.getElementById("sessionDate");

  const list =
    document.getElementById("list");

  const total =
    document.getElementById("total");

  const presentBox =
    document.getElementById("present");

  const absentBox =
    document.getElementById("absent");

  if (!title || !date || !list) return;

  total.textContent =
    data.members.length;

  if (!s) {

    title.textContent =
      "Chưa có buổi học";

    date.textContent =
      "Hãy bấm “＋ Tạo buổi học” để bắt đầu.";

    list.innerHTML = `
      <div style="text-align:center;padding:25px 10px">

        <div style="font-size:42px">
          📅
        </div>

        <h3>
          Chưa có buổi học nào
        </h3>

        <p class="small">
          Website sẽ không tự tạo buổi học.
        </p>

        <button
          class="btn"
          onclick="createSession()"
        >
          ＋ Tạo buổi học
        </button>

      </div>
    `;

    presentBox.textContent =
      0;

    absentBox.textContent =
      data.members.length;

    return;
  }


  title.textContent =
    s.label;

  date.textContent =
    new Date(
      s.date
    ).toLocaleDateString("vi-VN");


  const q =
    (
      document.getElementById("search")?.value ||
      ""
    ).toLowerCase();


  const shown =
    data.members
      .map(
        (name, index) => ({
          name,
          index
        })
      )
      .filter(
        item =>
          item.name
            .toLowerCase()
            .includes(q)
      );


  list.innerHTML =
    shown.length
      ? shown
          .map(
            item => `
              <div class="row">

                <span class="member-name">
                  ${item.index + 1}.
                  ${escapeHtml(item.name)}
                </span>

                <button
                  class="badge ${
                    s.attendance[item.index]
                      ? "present"
                      : "absent"
                  }"
                  onclick="toggle(${item.index})"
                >
                  ${
                    s.attendance[item.index]
                      ? "✓ Có mặt"
                      : "✕ Vắng"
                  }
                </button>

              </div>
            `
          )
          .join("")
      : "<p>Không tìm thấy thành viên.</p>";


  const count =
    s.attendance.filter(Boolean).length;


  presentBox.textContent =
    count;

  absentBox.textContent =
    data.members.length - count;
}


/* =========================
   BUỔI HỌC
========================= */

function createSession() {

  const label =
    prompt(
      "Nhập tên buổi học:",
      `Buổi học ${data.sessions.length + 1}`
    );

  if (label === null) return;

  const cleanLabel =
    label.trim();

  if (!cleanLabel) {
    alert(
      "Tên buổi học không được để trống."
    );
    return;
  }


  const dateInput =
    prompt(
      "Nhập ngày học theo dạng DD/MM/YYYY:",
      new Date().toLocaleDateString("vi-VN")
    );

  if (dateInput === null) return;


  const parts =
    dateInput
      .trim()
      .split(/[\/\-.]/);


  if (parts.length !== 3) {
    alert(
      "Vui lòng nhập ngày theo dạng DD/MM/YYYY."
    );
    return;
  }


  const d =
    parseInt(parts[0], 10);

  const m =
    parseInt(parts[1], 10);

  const y =
    parseInt(parts[2], 10);


  const date =
    new Date(
      y,
      m - 1,
      d
    );


  if (
    !Number.isFinite(
      date.getTime()
    ) ||
    date.getDate() !== d ||
    date.getMonth() !== m - 1 ||
    date.getFullYear() !== y
  ) {
    alert(
      "Ngày học không hợp lệ."
    );
    return;
  }


  data.sessions.push({

    date:
      date.toISOString(),

    label:
      cleanLabel,

    attendance:
      Array(
        data.members.length
      ).fill(false)

  });


  data.current =
    data.sessions.length - 1;


  save();

  render();
}


/* =========================
   ĐIỂM DANH
========================= */

function toggle(index) {

  const s =
    getCurrentSession();

  if (!s) {

    alert(
      "Bạn hãy tạo buổi học trước."
    );

    return;
  }


  s.attendance[index] =
    !s.attendance[index];


  save();

  render();
}


/* =========================
   THỐNG KÊ
========================= */

function renderSessions() {

  const box =
    document.getElementById(
      "sessionList"
    );

  const countBox =
    document.getElementById(
      "sessionCount"
    );

  const memberCountBox =
    document.getElementById(
      "memberCount"
    );

  const averageBox =
    document.getElementById(
      "average"
    );


  if (!box) return;


  countBox.textContent =
    data.sessions.length;


  memberCountBox.textContent =
    data.members.length;


  if (!data.sessions.length) {

    box.innerHTML =
      '<p class="small">Chưa có buổi học nào.</p>';

    averageBox.textContent =
      "0%";

    return;
  }


  let totalPresent =
    0;

  let totalCount =
    0;


  box.innerHTML =
    data.sessions
      .map((s, i) => {

        const present =
          s.attendance
            .filter(Boolean)
            .length;


        const count =
          s.attendance.length;


        const pct =
          count
            ? Math.round(
                present /
                count *
                100
              )
            : 0;


        totalPresent +=
          present;


        totalCount +=
          count;


        return `
          <div class="session">

            <b>
              ${escapeHtml(s.label)}
            </b>

            <div>
              ${new Date(s.date)
                .toLocaleDateString("vi-VN")}
            </div>

            <div>
              ${present}/${count}
              có mặt (${pct}%)
            </div>

            <div class="bar">

              <div
                class="fill"
                style="width:${pct}%"
              ></div>

            </div>

            <div
              class="actions"
              style="margin-top:9px"
            >

              <button
                class="btn"
                onclick="selectSession(${i})"
              >
                Mở buổi này
              </button>

              <button
                class="btn red"
                onclick="deleteSession(${i})"
              >
                🗑️ Xóa buổi
              </button>

            </div>

          </div>
        `;

      })
      .join("");


  averageBox.textContent =
    totalCount
      ? Math.round(
          totalPresent /
          totalCount *
          100
        ) + "%"
      : "0%";
}


function selectSession(index) {

  data.current =
    index;

  save();

  showTab(
    "attendance"
  );
}


function deleteSession(index) {

  const session =
    data.sessions[index];

  if (!session) return;


  const ok =
    confirm(
      `Bạn có chắc muốn xóa "${session.label}" không?\n\n` +
      `Dữ liệu điểm danh của buổi này cũng sẽ bị xóa.`
    );


  if (!ok) return;


  data.sessions.splice(
    index,
    1
  );


  if (!data.sessions.length) {

    data.current =
      -1;

  } else if (
    data.current === index
  ) {

    data.current =
      Math.min(
        index,
        data.sessions.length - 1
      );

  } else if (
    data.current > index
  ) {

    data.current--;
  }


  save();

  render();
}


/* =========================
   TAB
========================= */

function showTab(tab) {

  document
    .querySelectorAll(
      ".tabs button"
    )
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

    const el =
      document.getElementById(id);

    if (el) {

      el.style.display =
        id === tab
          ? "block"
          : "none";
    }

  });


  render();
}


document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(button => {

    button.onclick = () =>
      showTab(
        button.dataset.tab
      );

  });


/* =========================
   THÀNH VIÊN
========================= */

function getMemberInfo(name) {

  return normalizeMemberInfo(
    name
  );
}


function renderMembers() {

  const box =
    document.getElementById(
      "memberList"
    );

  if (!box) return;


  if (!data.members.length) {

    box.innerHTML =
      "<p>Chưa có thành viên.</p>";

    return;
  }


  box.innerHTML =
    data.members
      .map((name, index) => {

        const info =
          getMemberInfo(
            name
          );


        return `
          <div class="row">

            <div
              style="
                flex:1;
                min-width:260px
              "
            >

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:14px;
                  flex-wrap:wrap
                "
              >

                <div
                  style="
                    width:72px;
                    height:72px;
                    border-radius:50%;
                    overflow:hidden;
                    background:#eef5f2;
                    border:2px solid #dcebe6;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex:0 0 72px;
                  "
                >

                  ${
                    info.photo
                      ? `
                        <img
                          src="${info.photo}"
                          alt="Ảnh thành viên"
                          style="
                            width:100%;
                            height:100%;
                            object-fit:cover
                          "
                        >
                      `
                      : `
                        <span
                          style="font-size:30px"
                        >
                          👤
                        </span>
                      `
                  }

                </div>


                <div
                  style="
                    flex:1;
                    min-width:220px
                  "
                >

                  <div
                    class="member-name"
                  >
                    ${index + 1}.
                    ${escapeHtml(name)}
                  </div>


                  <div
                    class="small"
                    style="
                      margin-top:8px;
                      line-height:1.8
                    "
                  >

                    🎂 Ngày sinh:
                    ${escapeHtml(
                      info.dob ||
                      "Chưa nhập"
                    )}

                    <br>

                    👨 Bố:
                    ${escapeHtml(
                      info.father ||
                      "Chưa nhập"
                    )}

                    <br>

                    👩 Mẹ:
                    ${escapeHtml(
                      info.mother ||
                      "Chưa nhập"
                    )}

                    <br>

                    📞 SĐT:
                    ${escapeHtml(
                      info.phone ||
                      "Chưa nhập"
                    )}

                  </div>

                </div>

              </div>


              <div
                style="
                  margin-top:10px;
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap
                "
              >

                <label
                  class="btn"
                  style="
                    display:inline-block;
                    cursor:pointer
                  "
                >

                  ${
                    info.photo
                      ? "📷 Đổi ảnh"
                      : "📷 Thêm ảnh"
                  }


                  <input
                    type="file"
                    accept="image/*"
                    style="display:none"
                    onchange="uploadMemberPhoto(${index}, this)"
                  >

                </label>


                ${
                  info.photo
                    ? `
                      <button
                        class="btn red"
                        onclick="removeMemberPhoto(${index})"
                      >
                        🗑️ Xóa ảnh
                      </button>
                    `
                    : ""
                }

              </div>

            </div>


            <div
              class="actions"
            >

              <button
                class="btn"
                onclick="editMemberInfo(${index})"
              >
                📝 Thông tin
              </button>


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
        `;

      })
      .join("");
}


function editMemberInfo(index) {

  const name =
    data.members[index];

  if (!name) return;


  const info =
    getMemberInfo(name);


  const dob =
    prompt(
      "Ngày tháng năm sinh (DD/MM/YYYY):",
      info.dob
    );

  if (dob === null) return;


  const father =
    prompt(
      "Họ và tên bố:",
      info.father
    );

  if (father === null) return;


  const mother =
    prompt(
      "Họ và tên mẹ:",
      info.mother
    );

  if (mother === null) return;


  const phone =
    prompt(
      "Số điện thoại phụ huynh:",
      info.phone
    );

  if (phone === null) return;


  info.dob =
    dob.trim();

  info.father =
    father.trim();

  info.mother =
    mother.trim();

  info.phone =
    phone.trim();


  save();

  renderMembers();
}


/* =========================
   XỬ LÝ ẢNH THÀNH VIÊN
========================= */

function compressMemberPhoto(file) {

  return new Promise(
    (resolve, reject) => {

      if (
        !file ||
        !file.type.startsWith(
          "image/"
        )
      ) {

        reject(
          new Error(
            "Vui lòng chọn một file ảnh."
          )
        );

        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        event => {

          const img =
            new Image();


          img.onload =
            () => {

              const maxSize =
                240;


              let width =
                img.width;

              let height =
                img.height;


              if (
                width > height &&
                width > maxSize
              ) {

                height =
                  Math.round(
                    height *
                    maxSize /
                    width
                  );

                width =
                  maxSize;

              } else if (
                height >= width &&
                height > maxSize
              ) {

                width =
                  Math.round(
                    width *
                    maxSize /
                    height
                  );

                height =
                  maxSize;
              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;

              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );


              resolve(
                canvas.toDataURL(
                  "image/jpeg",
                  0.72
                )
              );

            };


          img.onerror =
            () =>
              reject(
                new Error(
                  "Không đọc được ảnh."
                )
              );


          img.src =
            event.target.result;

        };


      reader.onerror =
        () =>
          reject(
            new Error(
              "Không đọc được file ảnh."
            )
          );


      reader.readAsDataURL(
        file
      );

    }
  );
}


async function uploadMemberPhoto(
  index,
  input
) {

  const name =
    data.members[index];


  if (
    !name ||
    !input?.files?.[0]
  ) {
    return;
  }


  try {

    const file =
      input.files[0];


    if (
      file.size >
      8 * 1024 * 1024
    ) {

      alert(
        "Ảnh quá lớn. Vui lòng chọn ảnh dưới 8 MB."
      );

      input.value =
        "";

      return;
    }


    const info =
      getMemberInfo(
        name
      );


    info.photo =
      await compressMemberPhoto(
        file
      );


    save();

    renderMembers();


  } catch (
    error
  ) {

    alert(
      error.message ||
      "Không thể lưu ảnh."
    );

    input.value =
      "";
  }
}


function removeMemberPhoto(
  index
) {

  const name =
    data.members[index];

  if (!name) return;


  const info =
    getMemberInfo(
      name
    );


  if (!info.photo) return;


  if (
    !confirm(
      `Xóa ảnh của "${name}"?`
    )
  ) {
    return;
  }


  info.photo =
    "";


  save();

  renderMembers();
}


/* =========================
   THÊM THÀNH VIÊN
========================= */

function addMember() {

  const input =
    document.getElementById(
      "newMember"
    );


  const name =
    input.value.trim();


  if (!name) {

    alert(
      "Bạn chưa nhập tên."
    );

    return;
  }


  if (
    data.members.some(
      n =>
        n.toLowerCase() ===
        name.toLowerCase()
    )
  ) {

    alert(
      "Tên này đã có trong danh sách."
    );

    return;
  }


  data.members.push(
    name
  );


  data.memberInfo[name] = {

    dob: "",

    father: "",

    mother: "",

    phone: "",

    photo: ""

  };


  data.sessions.forEach(
    session => {

      session.attendance.push(
        false
      );

    }
  );


  input.value =
    "";


  save();

  render();
}


/* =========================
   ĐỔI TÊN
========================= */

function renameMember(index) {

  const oldName =
    data.members[index];


  const name =
    prompt(
      "Đổi tên thành viên:",
      oldName
    );


  if (name === null) {
    return;
  }


  const clean =
    name.trim();


  if (!clean) {

    alert(
      "Tên không được để trống."
    );

    return;
  }


  if (
    data.members.some(
      (n, i) =>
        i !== index &&
        n.toLowerCase() ===
        clean.toLowerCase()
    )
  ) {

    alert(
      "Tên này đã có trong danh sách."
    );

    return;
  }


  data.members[index] =
    clean;


  if (
    data.memberInfo[oldName]
  ) {

    data.memberInfo[clean] =
      data.memberInfo[oldName];


    delete data.memberInfo[
      oldName
    ];
  }


  save();

  render();
}


/* =========================
   XÓA THÀNH VIÊN
========================= */

function deleteMember(index) {

  const name =
    data.members[index];


  if (
    !confirm(
      `Xóa "${name}" khỏi danh sách?`
    )
  ) {
    return;
  }


  delete data.memberInfo[
    name
  ];


  data.members.splice(
    index,
    1
  );


  data.sessions.forEach(
    session => {

      session.attendance.splice(
        index,
        1
      );

    }
  );


  save();

  render();
}


/* =========================
   THANH THI ĐUA
========================= */

function formatCompetitionMonth(
  key
) {

  const [
    year,
    month
  ] =
    key
      .split("-")
      .map(Number);


  return `THÁNG ${month}/${year}`;
}


function getScores(key) {

  if (
    !data.competition[key]
  ) {

    data.competition[key] =
      {};
  }


  data.members.forEach(
    name => {

      if (
        typeof data.competition[
          key
        ][name] !== "number"
      ) {

        data.competition[
          key
        ][name] = 0;
      }

    }
  );


  return data.competition[
    key
  ];
}


function changeCompetitionMonth(
  delta
) {

  const [
    year,
    month
  ] =
    competitionMonth
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1 + delta,
      1
    );


  competitionMonth =
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  renderCompetition();
}


function adjustScoreByIndex(
  index,
  amount
) {

  if (
    index < 0 ||
    index >= data.members.length
  ) {
    return;
  }


  const name =
    data.members[index];


  const scores =
    getScores(
      competitionMonth
    );


  scores[name] =
    Math.max(
      0,
      (scores[name] || 0) +
        amount
    );


  save();

  renderCompetition();
}


function resetCompetitionMonth() {

  if (
    !confirm(
      `Đặt lại toàn bộ điểm của ${formatCompetitionMonth(
        competitionMonth
      )} về 0?`
    )
  ) {

    return;
  }


  const scores =
    getScores(
      competitionMonth
    );


  data.members.forEach(
    name => {

      scores[name] =
        0;

    }
  );


  save();

  renderCompetition();
}


function getPrize(
  rank,
  total
) {

  if (
    rank === 1
  ) {
    return "🏆 Giải Nhất";
  }

  if (
    rank === 2
  ) {
    return "🥈 Giải Nhì";
  }

  if (
    rank === 3
  ) {
    return "🥉 Giải Ba";
  }


  if (
    total >= 4 &&
    rank <=
      Math.max(
        4,
        Math.ceil(
          total / 3
        )
      )
  ) {

    return "🏅 Khuyến khích";
  }


  return "";
}


function renderCompetition() {

  const title =
    document.getElementById(
      "competitionMonth"
    );


  const box =
    document.getElementById(
      "competitionList"
    );


  if (
    !title ||
    !box
  ) {
    return;
  }


  title.textContent =
    formatCompetitionMonth(
      competitionMonth
    );


  const scores =
    getScores(
      competitionMonth
    );


  const ranked =
    data.members

      .map(
        name => ({
          name,
          score:
            scores[name] || 0
        })
      )

      .sort(
        (a, b) =>
          b.score -
            a.score ||
          a.name.localeCompare(
            b.name,
            "vi"
          )
      );


  if (
    !ranked.length
  ) {

    box.innerHTML =
      "<p>Chưa có thành viên.</p>";

    return;
  }


  const maxScore =
    Math.max(
      10,
      ...ranked.map(
        item =>
          item.score
      )
    );


  box.innerHTML =
    ranked
      .map(
        (
          item,
          index
        ) => {

          const rank =
            index + 1;


          const width =
            Math.min(
              100,
              Math.max(
                0,
                item.score /
                  maxScore *
                  100
              )
            );


          const prize =
            getPrize(
              rank,
              ranked.length
            );


          const medal =
            rank === 1
              ? "🥇"
              : rank === 2
              ? "🥈"
              : rank === 3
              ? "🥉"
              : `#${rank}`;


          const memberIndex =
            data.members.indexOf(
              item.name
            );


          return `
            <div class="rank-card">

              <div class="rank-head">

                <div>

                  <span
                    class="rank-medal"
                  >
                    ${medal}
                  </span>

                  <span
                    class="rank-name"
                  >
                    ${escapeHtml(
                      item.name
                    )}
                  </span>

                  ${
                    prize
                      ? `
                        <div class="prize">
                          ${prize}
                        </div>
                      `
                      : ""
                  }

                </div>


                <div
                  class="rank-score"
                >
                  ${item.score}
                  điểm
                </div>

              </div>


              <div
                class="rank-bar"
              >

                <div
                  class="rank-fill"
                  style="
                    width:${width}%
                  "
                ></div>

              </div>


              <div
                class="score-actions"
              >

                <button
                  class="score-btn minus"
                  onclick="adjustScoreByIndex(
                    ${memberIndex},
                    -10
                  )"
                >
                  −10
                </button>


                <button
                  class="score-btn minus"
                  onclick="adjustScoreByIndex(
                    ${memberIndex},
                    -5
                  )"
                >
                  −5
                </button>


                <button
                  class="score-btn plus"
                  onclick="adjustScoreByIndex(
                    ${memberIndex},
                    5
                  )"
                >
                  +5
                </button>


                <button
                  class="score-btn plus"
                  onclick="adjustScoreByIndex(
                    ${memberIndex},
                    10
                  )"
                >
                  +10
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");
}


/* =========================
   KHỞI ĐỘNG
========================= */

save();
render();
