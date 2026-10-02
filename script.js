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

let data =
  JSON.parse(
    localStorage.getItem(key) || "null"
  ) || {
    members: [...defaultNames],
    sessions: [],
    current: -1,
    competition: {},
    memberInfo: {},
    lessons: []
  };

/* =========================
   KHỞI TẠO DỮ LIỆU
========================= */

if (!Array.isArray(data.members)) {
  data.members = [...defaultNames];
}

if (!Array.isArray(data.sessions)) {
  data.sessions = [];
}

if (typeof data.current !== "number") {
  data.current = -1;
}

if (
  !data.competition ||
  typeof data.competition !== "object"
) {
  data.competition = {};
}

if (
  !data.memberInfo ||
  typeof data.memberInfo !== "object"
) {
  data.memberInfo = {};
}

if (!Array.isArray(data.lessons)) {
  data.lessons = [];
}


/* =========================
   LƯU
========================= */

function save() {
  try {

    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

  } catch (error) {

    console.error(error);

    alert(
      "Không thể lưu dữ liệu. Có thể bộ nhớ trình duyệt đã đầy."
    );
  }
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    function (m) {

      return {
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[m];

    }
  );

}


/* =========================
   ID
========================= */

function uid() {

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


/* =========================
   THÔNG TIN THÀNH VIÊN
========================= */

function getMemberInfo(name) {

  if (!data.memberInfo[name]) {

    data.memberInfo[name] = {

      dob:"",
      father:"",
      mother:"",
      phone:"",
      photo:""

    };

  }

  const info =
    data.memberInfo[name];

  if (typeof info.dob !== "string") {
    info.dob = "";
  }

  if (typeof info.father !== "string") {
    info.father = "";
  }

  if (typeof info.mother !== "string") {
    info.mother = "";
  }

  if (typeof info.phone !== "string") {
    info.phone = "";
  }

  if (typeof info.photo !== "string") {
    info.photo = "";
  }

  return info;
}


data.members.forEach(
  getMemberInfo
);


/* =========================
   BUỔI HỌC HIỆN TẠI
========================= */

function getCurrentSession() {

  if (
    data.current < 0 ||
    !data.sessions[data.current]
  ) {

    return null;

  }

  return data.sessions[
    data.current
  ];
}


/* =========================
   RENDER TẤT CẢ
========================= */

function render() {

  renderAttendance();

  renderSessions();

  renderMembers();

  renderCompetition();

  renderLessons();

}


/* =========================
   ĐIỂM DANH
========================= */

function renderAttendance() {

  const session =
    getCurrentSession();

  const title =
    document.getElementById(
      "sessionTitle"
    );

  const date =
    document.getElementById(
      "sessionDate"
    );

  const list =
    document.getElementById(
      "list"
    );

  if (
    !title ||
    !date ||
    !list
  ) {
    return;
  }


  document.getElementById(
    "total"
  ).textContent =
    data.members.length;


  if (!session) {

    title.textContent =
      "Chưa có buổi học";

    date.textContent =
      "Hãy bấm “＋ Tạo buổi học” để bắt đầu.";

    document.getElementById(
      "present"
    ).textContent = "0";

    document.getElementById(
      "absent"
    ).textContent =
      data.members.length;

    list.innerHTML = `
      <div
        style="
          text-align:center;
          padding:25px 10px;
        "
      >

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

    return;
  }


  title.textContent =
    session.label;

  date.textContent =
    new Date(
      session.date
    ).toLocaleDateString(
      "vi-VN"
    );


  const search =
    (
      document.getElementById(
        "search"
      )?.value || ""
    ).toLowerCase();


  const members =
    data.members
      .map(
        (
          name,
          index
        ) => ({
          name,
          index
        })
      )
      .filter(
        item =>
          item.name
            .toLowerCase()
            .includes(search)
      );


  list.innerHTML =
    members.length

      ? members
          .map(
            item => {

              const present =
                !!session.attendance[
                  item.index
                ];

              return `
                <div class="row">

                  <span class="member-name">
                    ${item.index + 1}.
                    ${escapeHtml(
                      item.name
                    )}
                  </span>

                  <button
                    class="badge ${
                      present
                        ? "present"
                        : "absent"
                    }"
                    onclick="
                      toggleAttendance(
                        ${item.index}
                      )
                    "
                  >
                    ${
                      present
                        ? "✓ Có mặt"
                        : "✕ Vắng"
                    }
                  </button>

                </div>
              `;

            }
          )
          .join("")

      : "<p>Không tìm thấy thành viên.</p>";


  const presentCount =
    session.attendance.filter(
      Boolean
    ).length;


  document.getElementById(
    "present"
  ).textContent =
    presentCount;


  document.getElementById(
    "absent"
  ).textContent =
    data.members.length -
    presentCount;

}


/* =========================
   TẠO BUỔI HỌC
========================= */

function createSession() {

  const label =
    prompt(
      "Nhập tên buổi học:",
      `Buổi học ${
        data.sessions.length + 1
      }`
    );

  if (label === null) {
    return;
  }

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
      new Date()
        .toLocaleDateString(
          "vi-VN"
        )
    );

  if (dateInput === null) {
    return;
  }


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
    parseInt(
      parts[0],
      10
    );

  const m =
    parseInt(
      parts[1],
      10
    );

  const y =
    parseInt(
      parts[2],
      10
    );


  const date =
    new Date(
      y,
      m - 1,
      d
    );


  if (

    Number.isNaN(
      date.getTime()
    )

    ||

    date.getDate() !== d

    ||

    date.getMonth() !== m - 1

    ||

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

function toggleAttendance(index) {

  const session =
    getCurrentSession();

  if (!session) {

    alert(
      "Bạn hãy tạo buổi học trước."
    );

    return;
  }


  session.attendance[index] =
    !session.attendance[index];


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

  if (!box) {
    return;
  }


  const count =
    document.getElementById(
      "sessionCount"
    );

  const memberCount =
    document.getElementById(
      "memberCount"
    );

  const average =
    document.getElementById(
      "average"
    );


  if (count) {
    count.textContent =
      data.sessions.length;
  }

  if (memberCount) {
    memberCount.textContent =
      data.members.length;
  }


  if (!data.sessions.length) {

    box.innerHTML =
      '<p class="small">Chưa có buổi học nào.</p>';

    if (average) {
      average.textContent =
        "0%";
    }

    return;
  }


  let totalPresent = 0;

  let totalCount = 0;


  box.innerHTML =
    data.sessions
      .map(
        (
          session,
          index
        ) => {

          const present =
            session.attendance.filter(
              Boolean
            ).length;

          const total =
            session.attendance.length;

          const percent =
            total
              ? Math.round(
                  present /
                  total *
                  100
                )
              : 0;


          totalPresent +=
            present;

          totalCount +=
            total;


          return `
            <div class="session">

              <b>
                ${escapeHtml(
                  session.label
                )}
              </b>

              <div>
                ${new Date(
                  session.date
                ).toLocaleDateString(
                  "vi-VN"
                )}
              </div>

              <div>
                ${present}/${total}
                có mặt (${percent}%)
              </div>

              <div class="bar">

                <div
                  class="fill"
                  style="
                    width:${percent}%
                  "
                ></div>

              </div>

              <div
                class="actions"
                style="margin-top:9px"
              >

                <button
                  class="btn"
                  onclick="
                    selectSession(
                      ${index}
                    )
                  "
                >
                  Mở buổi này
                </button>

                <button
                  class="btn red"
                  onclick="
                    deleteSession(
                      ${index}
                    )
                  "
                >
                  🗑️ Xóa buổi
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  if (average) {

    average.textContent =
      totalCount
        ? Math.round(
            totalPresent /
            totalCount *
            100
          ) + "%"
        : "0%";

  }

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

  if (!session) {
    return;
  }


  if (
    !confirm(
      `Bạn có chắc muốn xóa "${session.label}" không?\n\n` +
      "Dữ liệu điểm danh của buổi này cũng sẽ bị xóa."
    )
  ) {
    return;
  }


  data.sessions.splice(
    index,
    1
  );


  if (
    data.sessions.length === 0
  ) {

    data.current = -1;

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
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.tab === tab
        );

      }
    );


  const sections = [
    "attendance",
    "sessions",
    "members",
    "competition",
    "lessons"
  ];


  sections.forEach(
    id => {

      const section =
        document.getElementById(
          id
        );

      if (section) {

        section.style.display =
          id === tab
            ? "block"
            : "none";

      }

    }
  );


  render();

}


document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {
          showTab(
            button.dataset.tab
          );
        }
      );

    }
  );


/* =========================
   THÀNH VIÊN
========================= */

function renderMembers() {

  const box =
    document.getElementById(
      "memberList"
    );

  if (!box) {
    return;
  }


  if (!data.members.length) {

    box.innerHTML =
      "<p>Chưa có thành viên.</p>";

    return;
  }


  box.innerHTML =
    data.members
      .map(
        (
          name,
          index
        ) => {

          const info =
            getMemberInfo(
              name
            );


          const avatar =
            info.photo

              ? `
                <img
                  class="avatar"
                  src="${info.photo}"
                  alt=""
                >
              `

              : `
                <div
                  class="
                    avatar
                    avatar-empty
                  "
                >
                  👤
                </div>
              `;


          return `
            <div class="member-card">

              ${avatar}

              <div class="member-content">

                <div class="member-name">
                  ${index + 1}.
                  ${escapeHtml(
                    name
                  )}
                </div>

                <div class="small">
                  ${
                    info.dob
                      ? `🎂 ${escapeHtml(
                          info.dob
                        )}`
                      : "🎂 Chưa có ngày sinh"
                  }
                </div>

                <div class="small">
                  ${
                    info.phone
                      ? `📞 ${escapeHtml(
                          info.phone
                        )}`
                      : "📞 Chưa có SĐT"
                  }
                </div>

                <div
                  class="
                    member-actions
                  "
                  style="margin-top:8px"
                >

                  <button
                    class="btn gray"
                    onclick="
                      editMemberInfo(
                        ${index}
                      )
                    "
                  >
                    📝 Thông tin
                  </button>

                  <button
                    class="btn gray"
                    onclick="
                      uploadMemberPhoto(
                        ${index}
                      )
                    "
                  >
                    🖼️ Ảnh
                  </button>

                  <button
                    class="btn gray"
                    onclick="
                      renameMember(
                        ${index}
                      )
                    "
                  >
                    ✏️ Đổi tên
                  </button>

                  <button
                    class="btn red"
                    onclick="
                      deleteMember(
                        ${index}
                      )
                    "
                  >
                    🗑️ Xóa
                  </button>

                  ${
                    info.photo
                      ? `
                        <button
                          class="btn red"
                          onclick="
                            removeMemberPhoto(
                              ${index}
                            )
                          "
                        >
                          🗑️ Xóa ảnh
                        </button>
                      `
                      : ""
                  }

                </div>

              </div>

            </div>
          `;

        }
      )
      .join("");

}


function addMember() {

  const input =
    document.getElementById(
      "newMember"
    );

  if (!input) {
    return;
  }


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


  data.sessions.forEach(
    session => {

      session.attendance.push(
        false
      );

    }
  );


  getMemberInfo(
    name
  );


  input.value = "";


  save();

  render();

}


function renameMember(index) {

  const oldName =
    data.members[index];

  if (!oldName) {
    return;
  }


  const newName =
    prompt(
      "Đổi tên thành viên:",
      oldName
    );


  if (newName === null) {
    return;
  }


  const clean =
    newName.trim();


  if (!clean) {

    alert(
      "Tên không được để trống."
    );

    return;
  }


  if (
    data.members.some(
      (
        n,
        i
      ) =>
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


  if (
    data.memberInfo[
      oldName
    ]
  ) {

    data.memberInfo[
      clean
    ] =
      data.memberInfo[
        oldName
      ];

    delete data.memberInfo[
      oldName
    ];

  }


  data.members[index] =
    clean;


  save();

  render();

}


function deleteMember(index) {

  const name =
    data.members[index];

  if (!name) {
    return;
  }


  if (
    !confirm(
      `Xóa "${name}" khỏi danh sách?`
    )
  ) {
    return;
  }


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


  delete data.memberInfo[
    name
  ];


  save();

  render();

}


function editMemberInfo(index) {

  const name =
    data.members[index];

  if (!name) {
    return;
  }


  const info =
    getMemberInfo(
      name
    );


  const dob =
    prompt(
      `Ngày sinh của ${name}:`,
      info.dob
    );

  if (dob === null) {
    return;
  }


  const father =
    prompt(
      "Tên bố:",
      info.father
    );

  if (father === null) {
    return;
  }


  const mother =
    prompt(
      "Tên mẹ:",
      info.mother
    );

  if (mother === null) {
    return;
  }


  const phone =
    prompt(
      "Số điện thoại phụ huynh:",
      info.phone
    );

  if (phone === null) {
    return;
  }


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
   ẢNH THÀNH VIÊN
========================= */

function uploadMemberPhoto(index) {

  const input =
    document.createElement(
      "input"
    );

  input.type =
    "file";

  input.accept =
    "image/*";


  input.onchange =
    async () => {

      const file =
        input.files?.[0];

      if (!file) {
        return;
      }


      try {

        if (
          file.size >
          8 * 1024 * 1024
        ) {

          throw new Error(
            "Ảnh quá lớn. Vui lòng chọn ảnh dưới 8 MB."
          );

        }


        const photo =
          await compressPhoto(
            file
          );


        getMemberInfo(
          data.members[index]
        ).photo =
          photo;


        save();

        renderMembers();


      } catch (error) {

        alert(
          error.message ||
          "Không thể tải ảnh."
        );

      }

    };


  input.click();

}


function compressPhoto(file) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const img =
        new Image();

      const reader =
        new FileReader();


      reader.onload =
        () => {

          img.onload =
            () => {

              const maxSize =
                240;


              let width =
                img.width;

              let height =
                img.height;


              if (
                width >
                height
              ) {

                if (
                  width >
                  maxSize
                ) {

                  height =
                    Math.round(
                      height *
                      maxSize /
                      width
                    );

                  width =
                    maxSize;

                }

              } else {

                if (
                  height >
                  maxSize
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
                  0.82
                )
              );

            };


          img.onerror =
            reject;

          img.src =
            reader.result;

        };


      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );

    }
  );

}


function removeMemberPhoto(index) {

  const name =
    data.members[index];

  const info =
    getMemberInfo(
      name
    );


  if (!info.photo) {
    return;
  }


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
   THANH THI ĐUA
========================= */

let competitionMonth =
  new Date().getFullYear() +
  "-" +
  String(
    new Date().getMonth() + 1
  ).padStart(
    2,
    "0"
  );


function formatCompetitionMonth(
  value
) {

  const [
    year,
    month
  ] =
    value
      .split("-")
      .map(
        Number
      );


  return `THÁNG ${month}/${year}`;

}


function getScores(
  month
) {

  if (
    !data.competition[
      month
    ]
  ) {

    data.competition[
      month
    ] = {};

  }


  data.members.forEach(
    name => {

      if (
        typeof data.competition[
          month
        ][name] !==
        "number"
      ) {

        data.competition[
          month
        ][name] = 0;

      }

    }
  );


  return data.competition[
    month
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
        (a,b) => {

          return (
            b.score -
            a.score
          ) ||
          a.name.localeCompare(
            b.name,
            "vi"
          );

        }
      );


  if (!ranked.length) {

    box.innerHTML =
      "<p>Chưa có thành viên.</p>";

    return;
  }


  const maxScore =
    Math.max(
      10,
      ...ranked.map(
        x => x.score
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


          let medal;

          if (
            rank === 1
          ) {

            medal = "🥇";

          } else if (
            rank === 2
          ) {

            medal = "🥈";

          } else if (
            rank === 3
          ) {

            medal = "🥉";

          } else {

            medal =
              `#${rank}`;

          }


          const memberIndex =
            data.members.indexOf(
              item.name
            );


          return `
            <div class="rank-card">

              <div class="rank-head">

                <div>

                  <span
                    style="
                      font-size:22px;
                    "
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
                        <div
                          class="prize"
                        >
                          ${prize}
                        </div>
                      `
                      : ""
                  }

                </div>


                <div
                  class="rank-score"
                >
                  ${
                    item.score
                  } điểm
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
                  class="
                    score-btn
                    minus
                  "
                  onclick="
                    adjustScoreByIndex(
                      ${memberIndex},
                      -10
                    )
                  "
                >
                  −10
                </button>

                <button
                  class="
                    score-btn
                    minus
                  "
                  onclick="
                    adjustScoreByIndex(
                      ${memberIndex},
                      -5
                    )
                  "
                >
                  −5
                </button>

                <button
                  class="
                    score-btn
                    plus
                  "
                  onclick="
                    adjustScoreByIndex(
                      ${memberIndex},
                      5
                    )
                  "
                >
                  +5
                </button>

                <button
                  class="
                    score-btn
                    plus
                  "
                  onclick="
                    adjustScoreByIndex(
                      ${memberIndex},
                      10
                    )
                  "
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
   GIÁO ÁN
========================= */

function openLessonFilePicker() {

  const input =
    document.getElementById(
      "lessonFile"
    );

  if (input) {
    input.click();
  }

}


function renderLessons() {

  const list =
    document.getElementById(
      "lessonList"
    );


  if (!list) {
    return;
  }


  if (
    !Array.isArray(
      data.lessons
    )
  ) {

    data.lessons = [];

  }


  const search =
    (
      document.getElementById(
        "lessonSearch"
      )?.value || ""
    ).toLowerCase();


  const filtered =
    data.lessons.filter(
      lesson =>
        lesson.title
          .toLowerCase()
          .includes(search)
    );


  if (!filtered.length) {

    list.innerHTML = `

      <div
        class="lesson-empty"
        style="
          padding:30px 15px;
        "
      >

        <div
          style="
            font-size:40px;
          "
        >
          📚
        </div>

        <div>
          ${
            data.lessons.length
              ? "Không tìm thấy giáo án."
              : "Chưa có giáo án nào."
          }
        </div>

      </div>

    `;

    return;
  }


  list.innerHTML =
    filtered
      .map(
        lesson => `

          <div
            class="lesson-item"
            onclick="
              viewLesson(
                '${lesson.id}'
              )
            "
          >

            <div
              class="lesson-item-title"
            >
              📖
              ${escapeHtml(
                lesson.title
              )}
            </div>

            <div
              class="lesson-item-small"
            >
              ${escapeHtml(
                lesson.filename ||
                ""
              )}
            </div>


            <div
              class="lesson-actions"
              onclick="
                event.stopPropagation()
              "
            >

              <button
                class="btn"
                onclick="
                  viewLesson(
                    '${lesson.id}'
                  )
                "
              >
                📖 Mở
              </button>

              <button
                class="btn gray"
                onclick="
                  renameLesson(
                    '${lesson.id}'
                  )
                "
              >
                ✏️ Đổi tên
              </button>

              <button
                class="btn red"
                onclick="
                  deleteLesson(
                    '${lesson.id}'
                  )
                "
              >
                🗑️ Xóa
              </button>

            </div>

          </div>

        `
      )
      .join("");

}


function viewLesson(id) {

  const lesson =
    data.lessons.find(
      x =>
        x.id === id
    );


  const viewer =
    document.getElementById(
      "lessonViewer"
    );


  if (!viewer) {
    return;
  }


  if (!lesson) {

    viewer.innerHTML = `

      <div
        class="lesson-empty"
      >

        <div
          style="
            font-size:48px;
          "
        >
          📖
        </div>

        <h3>
          Chưa chọn giáo án
        </h3>

      </div>

    `;

    return;
  }


  viewer.innerHTML = `

    <div>

      <div
        class="
          lesson-close-bar
        "
      >

        <h2>
          📖
          ${escapeHtml(
            lesson.title
          )}
        </h2>


        <button
          class="btn red"
          onclick="
            closeLesson()
          "
        >
          ✖ Đóng
        </button>

      </div>


      <div
        class="
          lesson-file-info
        "
      >
        File:
        ${escapeHtml(
          lesson.filename ||
          ""
        )}
      </div>


      <hr
        style="
          margin:18px 0;
          border:0;
          border-top:1px solid #eee;
        "
      >


      <div
        class="lesson-content"
      >
        ${
          lesson.html ||
          "<p>Không có nội dung.</p>"
        }
      </div>


      <div
        style="
          margin-top:25px;
          padding-top:15px;
          border-top:1px solid #eee;
        "
      >

        <button
          class="btn red"
          onclick="
            closeLesson()
          "
        >
          ✖ Đóng giáo án
        </button>

      </div>

    </div>

  `;

}


/* =========================
   ĐÓNG GIÁO ÁN
========================= */

function closeLesson() {

  const viewer =
    document.getElementById(
      "lessonViewer"
    );


  if (!viewer) {
    return;
  }


  viewer.innerHTML = `

    <div
      class="lesson-empty"
    >

      <div
        style="
          font-size:48px;
        "
      >
        📖
      </div>

      <h3>
        Chưa chọn giáo án
      </h3>

      <p>
        Hãy chọn một giáo án ở danh sách bên trái.
      </p>

    </div>

  `;

}


/* =========================
   ĐỔI TÊN GIÁO ÁN
========================= */

function renameLesson(id) {

  const lesson =
    data.lessons.find(
      x =>
        x.id === id
    );


  if (!lesson) {
    return;
  }


  const name =
    prompt(
      "Tên giáo án:",
      lesson.title
    );


  if (name === null) {
    return;
  }


  const clean =
    name.trim();


  if (!clean) {

    alert(
      "Tên giáo án không được để trống."
    );

    return;
  }


  lesson.title =
    clean;


  save();

  renderLessons();

  viewLesson(id);

}


/* =========================
   XÓA GIÁO ÁN
========================= */

function deleteLesson(id) {

  const lesson =
    data.lessons.find(
      x =>
        x.id === id
    );


  if (!lesson) {
    return;
  }


  if (
    !confirm(
      `Xóa giáo án "${lesson.title}"?`
    )
  ) {
    return;
  }


  data.lessons =
    data.lessons.filter(
      x =>
        x.id !== id
    );


  save();


  closeLesson();

  renderLessons();

}


/* =========================
   TIẾN TRÌNH
========================= */

function setLessonProgress(
  message
) {

  const box =
    document.getElementById(
      "lessonProgress"
    );


  if (!box) {
    return;
  }


  box.innerHTML =
    message

      ? `
        <div
          class="loading"
        >
          ${message}
        </div>
      `

      : "";

}


/* =========================
   WORD → HTML
========================= */

async function docxToLesson(
  arrayBuffer,
  filename
) {

  if (
    typeof mammoth ===
    "undefined"
  ) {

    throw new Error(
      "Thư viện đọc Word chưa tải xong. Hãy tải lại trang."
    );

  }


  const result =
    await mammoth.convertToHtml(
      {
        arrayBuffer
      },
      {

        convertImage:
          mammoth.images.imgElement(
            image =>
              image
                .read("base64")
                .then(
                  base64 => ({
                    src:
                      `data:${image.contentType};base64,${base64}`
                  })
                )
          )

      }
    );


  const title =
    filename
      .replace(
        /\.docx$/i,
        ""
      )
      .replace(
        /[_-]+/g,
        " "
      )
      .trim() ||
    "Giáo án";


  return {

    id:
      uid(),

    title:
      title,

    filename:
      filename,

    html:
      result.value ||
      "<p>File Word không có nội dung đọc được.</p>",

    createdAt:
      new Date().toISOString()

  };

}


/* =========================
   IMPORT WORD
========================= */

async function importDocx(
  file
) {

  setLessonProgress(
    `⏳ Đang đọc Word: ${escapeHtml(
      file.name
    )}`
  );


  const buffer =
    await file.arrayBuffer();


  const lesson =
    await docxToLesson(
      buffer,
      file.name
    );


  data.lessons.push(
    lesson
  );


  save();

  renderLessons();

  viewLesson(
    lesson.id
  );


  setLessonProgress(
    `✅ Đã thêm giáo án "${escapeHtml(
      lesson.title
    )}".`
  );

}


/* =========================
   IMPORT ZIP
========================= */

async function importZip(
  file
) {

  if (
    typeof JSZip ===
    "undefined"
  ) {

    throw new Error(
      "Thư viện đọc ZIP chưa tải xong. Hãy tải lại trang."
    );

  }


  setLessonProgress(
    "⏳ Đang mở file ZIP..."
  );


  const zip =
    await JSZip.loadAsync(
      await file.arrayBuffer()
    );


  const files =
    Object.values(
      zip.files
    ).filter(
      item =>
        !item.dir &&
        /\.docx$/i.test(
          item.name
        )
    );


  if (!files.length) {

    throw new Error(
      "File ZIP không chứa file Word .docx."
    );

  }


  let firstLessonId =
    null;


  for (
    let i = 0;
    i < files.length;
    i++
  ) {

    const item =
      files[i];


    const filename =
      item.name
        .split("/")
        .pop();


    setLessonProgress(
      `⏳ Đang chuyển ${i + 1}/${files.length}: ${escapeHtml(
        filename
      )}`
    );


    const buffer =
      await item.async(
        "arraybuffer"
      );


    const lesson =
      await docxToLesson(
        buffer,
        filename
      );


    data.lessons.push(
      lesson
    );


    if (
      firstLessonId === null
    ) {

      firstLessonId =
        lesson.id;

    }


    save();

  }


  renderLessons();


  if (
    firstLessonId
  ) {

    viewLesson(
      firstLessonId
    );

  }


  setLessonProgress(
    `✅ Đã chuyển ${files.length} giáo án từ ZIP thành công.`
  );

}


/* =========================
   CHỌN FILE
========================= */

async function importLessonFiles(
  files
) {

  if (
    !files ||
    !files.length
  ) {
    return;
  }


  try {

    for (
      const file of
      Array.from(files)
    ) {

      if (
        /\.zip$/i.test(
          file.name
        ) ||
        file.type ===
          "application/zip"
      ) {

        await importZip(
          file
        );

      } else if (
        /\.docx$/i.test(
          file.name
        )
      ) {

        await importDocx(
          file
        );

      } else {

        alert(
          `Bỏ qua "${file.name}" vì không phải .docx hoặc .zip.`
        );

      }

    }

  } catch (error) {

    console.error(
      error
    );

    alert(
      error.message ||
      "Không thể đọc file."
    );

  } finally {

    const input =
      document.getElementById(
        "lessonFile"
      );


    if (input) {
      input.value = "";
    }

  }

}


/* =========================
   KÉO THẢ
========================= */

function setupLessonUpload() {

  const zone =
    document.getElementById(
      "lessonUploadZone"
    );


  const input =
    document.getElementById(
      "lessonFile"
    );


  if (
    !zone ||
    !input
  ) {
    return;
  }


  input.addEventListener(
    "change",
    () => {

      importLessonFiles(
        input.files
      );

    }
  );


  [
    "dragenter",
    "dragover"
  ].forEach(
    eventName => {

      zone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          event.stopPropagation();

          zone.classList.add(
            "dragover"
          );

        }
      );

    }
  );


  [
    "dragleave",
    "drop"
  ].forEach(
    eventName => {

      zone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          event.stopPropagation();

          zone.classList.remove(
            "dragover"
          );

        }
      );

    }
  );


  zone.addEventListener(
    "drop",
    event => {

      importLessonFiles(
        event.dataTransfer.files
      );

    }
  );

}


/* =========================
   KHỞI ĐỘNG
========================= */

setupLessonUpload();

save();

render();
