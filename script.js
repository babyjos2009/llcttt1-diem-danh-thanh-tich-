import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAnpIzNv-YkA_v6WKCGw71bFqIWcchHm1IE",
  authDomain: "llcttt1-diem-danh.firebaseapp.com",
  projectId: "llcttt1-diem-danh",
  storageBucket: "llcttt1-diem-danh.firebasestorage.app",
  messagingSenderId: "1028180173731",
  appId: "1:1028180173731:web:c649731f9ccc20acb13016",
  measurementId: "G-XDNC5S21BN"
};
const app =
  initializeApp(firebaseConfig);

const auth =
  getAuth(app);

const db =
  getFirestore(app);


/* =========================================================
   LOCAL DATA
========================================================= */

const key =
  "llcttt1_attendance_v5";

const oldDefaultNames = [
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


let data =
  JSON.parse(
    localStorage.getItem(key) || "null"
  ) || {

    members: [],

    sessions: [],

    current: -1,

    competition: {},

    memberInfo: {},

    lessons: []

  };


if (
  !Array.isArray(
    data.members
  )
) {

  data.members = [];

}


if (
  !Array.isArray(
    data.sessions
  )
) {

  data.sessions = [];

}


if (
  typeof data.current !==
  "number"
) {

  data.current = -1;

}


if (
  !data.competition ||
  typeof data.competition !==
    "object"
) {

  data.competition = {};

}


if (
  !data.memberInfo ||
  typeof data.memberInfo !==
    "object"
) {

  data.memberInfo = {};

}


if (
  !Array.isArray(
    data.lessons
  )
) {

  data.lessons = [];

}


/* XÓA 9 TÊN MẪU CŨ */
if (

  data.members.length ===
    oldDefaultNames.length &&

  oldDefaultNames.every(
    (
      name,
      index
    ) =>
      data.members[index] ===
      name
  )

) {

  data.members = [];

  data.sessions.forEach(
    session => {

      session.attendance = [];

    }
  );

  data.memberInfo = {};

}


function saveLocal() {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

  } catch (error) {

    console.error(error);

    alert(
      "Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt ảnh hoặc giáo án."
    );

  }

}


function esc(
  value
) {

  return String(
    value
  ).replace(
    /[&<>"']/g,
    m => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[m])
  );

}


function uid() {

  return (

    Date.now()
      .toString(36) +

    Math.random()
      .toString(36)
      .slice(2)

  );

}


function currentSession() {

  if (
    data.current < 0
  ) {

    return null;

  }

  return (
    data.sessions[
      data.current
    ] || null
  );

}


function memberInfo(
  name
) {

  if (
    !data.memberInfo[name]
  ) {

    data.memberInfo[name] = {

      dob: "",

      father: "",

      mother: "",

      phone: "",

      photo: ""

    };

  }

  return data.memberInfo[name];

}


/* =========================================================
   AUTH UI
========================================================= */

function showMsg(
  message,
  type = "notice"
) {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) {
    return;
  }

  box.innerHTML =
    message
      ? `
        <div class="notice ${type}">
          ${message}
        </div>
      `
      : "";

}


function setAuthMode(
  register
) {

  document
    .getElementById(
      "loginTab"
    )
    ?.classList
    .toggle(
      "active",
      !register
    );


  document
    .getElementById(
      "registerTab"
    )
    ?.classList
    .toggle(
      "active",
      register
    );


  document
    .getElementById(
      "loginForm"
    )
    ?.classList
    .toggle(
      "hidden",
      register
    );


  document
    .getElementById(
      "registerForm"
    )
    ?.classList
    .toggle(
      "hidden",
      !register
    );


  showMsg("");

}


function setPending(
  show
) {

  document
    .getElementById(
      "authForms"
    )
    ?.classList
    .toggle(
      "hidden",
      show
    );


  document
    .getElementById(
      "pendingBox"
    )
    ?.classList
    .toggle(
      "hidden",
      !show
    );

}


/* =========================================================
   AUTH EVENTS
========================================================= */

document
  .getElementById(
    "loginTab"
  )
  ?.addEventListener(
    "click",
    () =>
      setAuthMode(false)
  );


document
  .getElementById(
    "registerTab"
  )
  ?.addEventListener(
    "click",
    () =>
      setAuthMode(true)
  );


/* LOGIN */

document
  .getElementById(
    "loginForm"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document
          .getElementById(
            "loginEmail"
          )
          .value
          .trim();

      const password =
        document
          .getElementById(
            "loginPassword"
          )
          .value;


      showMsg(
        "Đang đăng nhập..."
      );


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        showMsg("");

      } catch (error) {

        console.error(error);

        showMsg(
          friendlyAuthError(
            error
          ),
          "error"
        );

      }

    }
  );


/* REGISTER */

document
  .getElementById(
    "registerForm"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const name =
        document
          .getElementById(
            "registerName"
          )
          .value
          .trim();


      const email =
        document
          .getElementById(
            "registerEmail"
          )
          .value
          .trim();


      const password =
        document
          .getElementById(
            "registerPassword"
          )
          .value;


      const password2 =
        document
          .getElementById(
            "registerPassword2"
          )
          .value;


      if (!name) {

        showMsg(
          "Bạn chưa nhập họ tên.",
          "error"
        );

        return;

      }


      if (
        password.length <
        6
      ) {

        showMsg(
          "Mật khẩu phải có ít nhất 6 ký tự.",
          "error"
        );

        return;

      }


      if (
        password !==
        password2
      ) {

        showMsg(
          "Hai mật khẩu không giống nhau.",
          "error"
        );

        return;

      }


      showMsg(
        "Đang tạo tài khoản..."
      );


      try {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        await setDoc(

          doc(
            db,
            "users",
            result.user.uid
          ),

          {

            name,

            email,

            status:
              "pending",

            role:
              "user",

            createdAt:
              serverTimestamp()

          }

        );


        setPending(true);

        showMsg("");


      } catch (error) {

        console.error(error);

        showMsg(
          friendlyAuthError(
            error
          ),
          "error"
        );

      }

    }
  );


function friendlyAuthError(
  error
) {

  const code =
    error?.code || "";


  if (
    code.includes(
      "invalid-credential"
    )
  ) {

    return (
      "Email hoặc mật khẩu không đúng."
    );

  }


  if (
    code.includes(
      "email-already-in-use"
    )
  ) {

    return (
      "Email này đã được đăng ký."
    );

  }


  if (
    code.includes(
      "weak-password"
    )
  ) {

    return (
      "Mật khẩu cần ít nhất 6 ký tự."
    );

  }


  if (
    code.includes(
      "invalid-email"
    )
  ) {

    return (
      "Email không hợp lệ."
    );

  }


  if (
    code.includes(
      "unauthorized-domain"
    )
  ) {

    return (
      "Tên miền website chưa được Firebase cho phép."
    );

  }


  return (
    error?.message ||
    "Có lỗi xảy ra."
  );

}


/* =========================================================
   AUTH ACCESS
========================================================= */

let isAdmin =
  false;

let currentUser =
  null;

let userWatcher =
  null;

let themeWatcher =
  null;


async function checkAdmin(
  uid
) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "admins",
          uid
        )
      );

    return snapshot.exists();

  } catch (error) {

    console.error(
      "checkAdmin",
      error
    );

    return false;

  }

}


async function getProfile(
  uid
) {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );


    return snapshot.exists()
      ? snapshot.data()
      : null;

  } catch (error) {

    console.error(
      "getProfile",
      error
    );

    return null;

  }

}


async function checkAccess(
  user
) {

  if (!user) {
    return;
  }


  currentUser =
    user;


  isAdmin =
    await checkAdmin(
      user.uid
    );


  const profile =
    await getProfile(
      user.uid
    );


  /* ADMIN */

  if (isAdmin) {

    await enterApp();

    return;

  }


  /* APPROVED */

  if (
    profile?.status ===
    "approved"
  ) {

    await enterApp();

    return;

  }


  /* PENDING / REJECTED / DISABLED */

  setPending(true);


  if (
    profile?.status ===
    "rejected"
  ) {

    showMsg(
      "Tài khoản đã bị từ chối. Vui lòng liên hệ quản trị viên.",
      "error"
    );

  } else if (
    profile?.status ===
    "disabled"
  ) {

    showMsg(
      "Tài khoản đang bị khóa.",
      "error"
    );

  } else {

    showMsg(
      "Tài khoản đang chờ quản trị viên duyệt.",
      "notice"
    );

  }


  if (
    userWatcher
  ) {

    userWatcher();

  }


  userWatcher =
    onSnapshot(

      doc(
        db,
        "users",
        user.uid
      ),

      async snapshot => {

        if (
          !snapshot.exists()
        ) {
          return;
        }


        const profile =
          snapshot.data();


        if (
          profile.status ===
          "approved"
        ) {

          await enterApp();

        }

      },

      error => {

        console.error(
          "user watcher",
          error
        );

      }

    );

}


async function enterApp() {

  if (
    userWatcher
  ) {

    userWatcher();

    userWatcher =
      null;

  }


  document
    .getElementById(
      "authGate"
    )
    ?.classList
    .add(
      "hidden"
    );


  document
    .getElementById(
      "appRoot"
    )
    ?.classList
    .remove(
      "hidden"
    );


  const label =
    document.getElementById(
      "currentUserLabel"
    );


  if (label) {

    label.textContent =
      (
        isAdmin
          ? "👑 Admin • "
          : "👤 "
      ) +
      (
        currentUser?.email ||
        ""
      );

  }


  document
    .getElementById(
      "adminTab"
    )
    ?.classList
    .toggle(
      "hidden",
      !isAdmin
    );


  document
    .getElementById(
      "themeTab"
    )
    ?.classList
    .toggle(
      "hidden",
      !isAdmin
    );


  loadTheme();

  renderAll();

}


/* =========================================================
   LOGOUT
========================================================= */

document
  .getElementById(
    "logoutBtn"
  )
  ?.addEventListener(
    "click",
    () =>
      signOut(auth)
  );


document
  .getElementById(
    "logoutPending"
  )
  ?.addEventListener(
    "click",
    () =>
      signOut(auth)
  );


document
  .getElementById(
    "checkApproval"
  )
  ?.addEventListener(
    "click",
    () =>
      checkAccess(
        auth.currentUser
      )
  );


/* =========================================================
   TABS
========================================================= */

const allTabs = [
  "attendance",
  "sessions",
  "members",
  "competition",
  "lessons",
  "admin",
  "theme"
];


document
  .querySelectorAll(
    ".tabs button[data-tab]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () =>
          showTab(
            button.dataset.tab
          )
      );

    }
  );


function showTab(
  tab
) {

  document
    .querySelectorAll(
      ".tabs button[data-tab]"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.tab ===
          tab
        );

      }
    );


  allTabs.forEach(
    id => {

      document
        .getElementById(
          id
        )
        ?.classList
        .toggle(
          "hidden",
          id !== tab
        );

    }
  );


  if (
    tab === "admin"
  ) {

    renderAdminUsers();

  }


  if (
    tab === "theme"
  ) {

    loadThemeForm();

  }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderAttendance();

  renderSessions();

  renderMembers();

  renderCompetition();

  renderLessons();

}


/* =========================================================
   ATTENDANCE
========================================================= */

document
  .getElementById(
    "search"
  )
  ?.addEventListener(
    "input",
    renderAttendance
  );


document
  .getElementById(
    "createSessionBtn"
  )
  ?.addEventListener(
    "click",
    createSession
  );


function createSession() {

  const label =
    prompt(
      "Tên buổi học:",
      `Buổi học ${
        data.sessions.length + 1
      }`
    );


  if (
    label === null ||
    !label.trim()
  ) {

    return;

  }


  const dateText =
    prompt(
      "Ngày học DD/MM/YYYY:",
      new Date()
        .toLocaleDateString(
          "vi-VN"
        )
    );


  if (
    dateText === null
  ) {
    return;
  }


  const parts =
    dateText
      .trim()
      .split(
        /[\/\-.]/
      )
      .map(Number);


  if (
    parts.length !== 3
  ) {

    alert(
      "Ngày không hợp lệ."
    );

    return;

  }


  const date =
    new Date(
      parts[2],
      parts[1] - 1,
      parts[0]
    );


  if (

    Number.isNaN(
      date.getTime()
    )

    ||

    date.getDate() !==
      parts[0]

    ||

    date.getMonth() !==
      parts[1] - 1

    ||

    date.getFullYear() !==
      parts[2]

  ) {

    alert(
      "Ngày không hợp lệ."
    );

    return;

  }


  data.sessions.push({

    date:
      date.toISOString(),

    label:
      label.trim(),

    attendance:
      Array(
        data.members.length
      ).fill(false)

  });


  data.current =
    data.sessions.length -
    1;


  saveLocal();

  renderAll();

}


function renderAttendance() {

  const list =
    document.getElementById(
      "list"
    );


  if (!list) {
    return;
  }


  const s =
    currentSession();


  const total =
    document.getElementById(
      "total"
    );

  const present =
    document.getElementById(
      "present"
    );

  const absent =
    document.getElementById(
      "absent"
    );


  total.textContent =
    data.members.length;


  if (!s) {

    document.getElementById(
      "sessionTitle"
    ).textContent =
      "Chưa có buổi học";


    document.getElementById(
      "sessionDate"
    ).textContent =
      "Hãy tạo buổi học để bắt đầu.";


    present.textContent =
      "0";


    absent.textContent =
      data.members.length;


    list.innerHTML = `

      <div class="lesson-empty">

        <div
          style="font-size:42px"
        >
          📅
        </div>

        <h3>
          Chưa có buổi học nào
        </h3>

        <button
          class="btn"
          onclick="
            document
              .getElementById(
                'createSessionBtn'
              )
              ?.click()
          "
        >
          ＋ Tạo buổi học
        </button>

      </div>

    `;

    return;

  }


  document.getElementById(
    "sessionTitle"
  ).textContent =
    s.label;


  document.getElementById(
    "sessionDate"
  ).textContent =
    new Date(
      s.date
    ).toLocaleDateString(
      "vi-VN"
    );


  const q =
    (
      document.getElementById(
        "search"
      )?.value ||
      ""
    )
      .toLowerCase();


  const rows =
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
        x =>
          x.name
            .toLowerCase()
            .includes(q)
      );


  list.innerHTML =
    rows.length

      ? rows
          .map(
            x => {

              const isPresent =
                !!s.attendance[
                  x.index
                ];


              return `

                <div
                  class="row"
                >

                  <span>

                    <b>
                      ${
                        x.index + 1
                      }.
                      ${esc(
                        x.name
                      )}
                    </b>

                  </span>


                  <button
                    class="
                      badge
                      ${
                        isPresent
                          ? "present"
                          : "absent"
                      }
                    "
                    onclick="
                      toggleAttendance(
                        ${x.index}
                      )
                    "
                  >

                    ${
                      isPresent
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


  const p =
    s.attendance
      .filter(Boolean)
      .length;


  present.textContent =
    p;


  absent.textContent =
    data.members.length -
    p;

}


window.toggleAttendance =
  index => {

    const s =
      currentSession();


    if (!s) {
      return;
    }


    s.attendance[index] =
      !s.attendance[index];


    saveLocal();

    renderAll();

  };


/* =========================================================
   SESSIONS
========================================================= */

function renderSessions() {

  const box =
    document.getElementById(
      "sessionList"
    );


  if (!box) {
    return;
  }


  document.getElementById(
    "sessionCount"
  ).textContent =
    data.sessions.length;


  document.getElementById(
    "memberCount"
  ).textContent =
    data.members.length;


  if (
    !data.sessions.length
  ) {

    box.innerHTML =
      `
        <p class="small">
          Chưa có buổi học nào.
        </p>
      `;


    document.getElementById(
      "average"
    ).textContent =
      "0%";


    return;

  }


  let totalPresent =
    0;

  let totalCount =
    0;


  box.innerHTML =
    data.sessions
      .map(
        (
          s,
          i
        ) => {

          const p =
            s.attendance
              .filter(Boolean)
              .length;


          const t =
            s.attendance.length;


          const pct =
            t
              ? Math.round(
                  p /
                  t *
                  100
                )
              : 0;


          totalPresent +=
            p;


          totalCount +=
            t;


          return `

            <div
              class="session"
            >

              <b>
                ${esc(
                  s.label
                )}
              </b>

              <div
                class="small"
              >
                ${
                  new Date(
                    s.date
                  )
                    .toLocaleDateString(
                      "vi-VN"
                    )
                }
              </div>

              <div>
                ${p}/${t}
                có mặt
                (${pct}%)
              </div>


              <div
                class="bar"
              >

                <div
                  class="fill"
                  style="
                    width:${pct}%
                  "
                ></div>

              </div>


              <div
                class="actions"
                style="
                  margin-top:8px
                "
              >

                <button
                  class="btn"
                  onclick="
                    selectSession(
                      ${i}
                    )
                  "
                >
                  Mở buổi này
                </button>


                <button
                  class="btn red"
                  onclick="
                    deleteSession(
                      ${i}
                    )
                  "
                >
                  🗑️ Xóa
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");


  document.getElementById(
    "average"
  ).textContent =
    totalCount

      ? Math.round(
          totalPresent /
          totalCount *
          100
        ) + "%"

      : "0%";

}


window.selectSession =
  index => {

    data.current =
      index;

    saveLocal();

    showTab(
      "attendance"
    );

  };


window.deleteSession =
  index => {

    if (
      !confirm(
        "Xóa buổi học này?"
      )
    ) {

      return;

    }


    data.sessions.splice(
      index,
      1
    );


    data.current =
      data.sessions.length
        ? Math.min(
            index,
            data.sessions.length -
              1
          )
        : -1;


    saveLocal();

    renderAll();

  };


/* =========================================================
   MEMBERS
========================================================= */

document
  .getElementById(
    "addMemberBtn"
  )
  ?.addEventListener(
    "click",
    addMember
  );


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
      x =>
        x.toLowerCase() ===
        name.toLowerCase()
    )
  ) {

    alert(
      "Tên này đã có."
    );

    return;

  }


  data.members.push(
    name
  );


  data.sessions.forEach(
    session =>
      session.attendance.push(
        false
      )
  );


  memberInfo(name);


  input.value =
    "";


  saveLocal();

  renderAll();

}


function renderMembers() {

  const box =
    document.getElementById(
      "memberList"
    );


  if (!box) {
    return;
  }


  if (
    !data.members.length
  ) {

    box.innerHTML = `

      <div
        class="lesson-empty"
      >

        <div
          style="font-size:46px"
        >
          👥
        </div>

        <h3>
          Chưa có thành viên
        </h3>

        <p>
          Thêm tên ở phía trên.
        </p>

      </div>

    `;

    return;

  }


  box.innerHTML =
    data.members
      .map(
        (
          name,
          index
        ) => {

          const x =
            memberInfo(
              name
            );


          return `

            <div
              class="member-card"
            >

              ${
                x.photo

                  ? `
                    <img
                      class="avatar"
                      src="${x.photo}"
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
                  `
              }


              <div
                class="
                  member-content
                "
              >

                <b>
                  ${index + 1}.
                  ${esc(name)}
                </b>


                <div
                  class="small"
                  style="
                    margin-top:5px
                  "
                >

                  🎂
                  ${esc(
                    x.dob ||
                    "Chưa có"
                  )}

                  ·

                  📞
                  ${esc(
                    x.phone ||
                    "Chưa có"
                  )}

                </div>


                <div
                  class="actions"
                  style="
                    margin-top:8px
                  "
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
                      uploadPhoto(
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
                    x.photo
                      ? `
                        <button
                          class="btn red"
                          onclick="
                            removePhoto(
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


window.renameMember =
  index => {

    const oldName =
      data.members[index];


    const newName =
      prompt(
        "Đổi tên:",
        oldName
      );


    if (
      newName === null ||
      !newName.trim()
    ) {

      return;

    }


    const clean =
      newName.trim();


    if (
      data.members.some(
        (
          x,
          i
        ) =>

          i !== index &&

          x.toLowerCase() ===
            clean.toLowerCase()

      )
    ) {

      alert(
        "Tên đã tồn tại."
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


    saveLocal();

    renderAll();

  };


window.deleteMember =
  index => {

    const name =
      data.members[index];


    if (
      !confirm(
        `Xóa ${name}?`
      )
    ) {

      return;

    }


    data.members.splice(
      index,
      1
    );


    data.sessions.forEach(
      session =>
        session.attendance.splice(
          index,
          1
        )
    );


    delete data.memberInfo[
      name
    ];


    saveLocal();

    renderAll();

  };


window.editMemberInfo =
  index => {

    const name =
      data.members[index];


    const x =
      memberInfo(name);


    const dob =
      prompt(
        "Ngày sinh:",
        x.dob
      );


    if (
      dob === null
    ) {
      return;
    }


    const father =
      prompt(
        "Tên bố:",
        x.father
      );


    if (
      father === null
    ) {
      return;
    }


    const mother =
      prompt(
        "Tên mẹ:",
        x.mother
      );


    if (
      mother === null
    ) {
      return;
    }


    const phone =
      prompt(
        "SĐT phụ huynh:",
        x.phone
      );


    if (
      phone === null
    ) {
      return;
    }


    x.dob =
      dob.trim();


    x.father =
      father.trim();


    x.mother =
      mother.trim();


    x.phone =
      phone.trim();


    saveLocal();

    renderMembers();

  };


window.uploadPhoto =
  index => {

    const input =
      document.createElement(
        "input"
      );


    input.type =
      "file";


    input.accept =
      "image/*";


    input.onchange =
      () => {

        const file =
          input.files?.[0];


        if (!file) {
          return;
        }


        const reader =
          new FileReader();


        reader.onload =
          () => {

            const img =
              new Image();


            img.onload =
              () => {

                const max =
                  240;


                const scale =
                  Math.min(
                    1,
                    max /
                      Math.max(
                        img.width,
                        img.height
                      )
                  );


                const canvas =
                  document
                    .createElement(
                      "canvas"
                    );


                canvas.width =
                  Math.round(
                    img.width *
                    scale
                  );


                canvas.height =
                  Math.round(
                    img.height *
                    scale
                  );


                canvas
                  .getContext(
                    "2d"
                  )
                  .drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                  );


                memberInfo(
                  data.members[
                    index
                  ]
                ).photo =
                  canvas.toDataURL(
                    "image/jpeg",
                    .82
                  );


                saveLocal();

                renderMembers();

              };


            img.src =
              reader.result;

          };


        reader.readAsDataURL(
          file
        );

      };


    input.click();

  };


window.removePhoto =
  index => {

    memberInfo(
      data.members[index]
    ).photo = "";


    saveLocal();

    renderMembers();

  };


/* =========================================================
   COMPETITION
========================================================= */

let competitionMonth =
  new Date()
    .toISOString()
    .slice(
      0,
      7
    );


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
        typeof
          data.competition[
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


document
  .getElementById(
    "prevMonth"
  )
  ?.addEventListener(
    "click",
    () => {

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
          month - 2,
          1
        );


      competitionMonth =
        date
          .toISOString()
          .slice(
            0,
            7
          );


      renderCompetition();

    }
  );


document
  .getElementById(
    "nextMonth"
  )
  ?.addEventListener(
    "click",
    () => {

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
          month,
          1
        );


      competitionMonth =
        date
          .toISOString()
          .slice(
            0,
            7
          );


      renderCompetition();

    }
  );


document
  .getElementById(
    "resetCompetition"
  )
  ?.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Đặt lại điểm tháng này?"
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


      saveLocal();

      renderCompetition();

    }
  );


window.adjustScore =
  (
    index,
    amount
  ) => {

    const name =
      data.members[index];


    if (!name) {
      return;
    }


    const scores =
      getScores(
        competitionMonth
      );


    scores[name] =
      Math.max(
        0,
        (
          scores[name] ||
          0
        ) +
        amount
      );


    saveLocal();

    renderCompetition();

  };


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


  const [
    year,
    month
  ] =
    competitionMonth
      .split("-")
      .map(Number);


  title.textContent =
    `THÁNG ${month}/${year}`;


  const scores =
    getScores(
      competitionMonth
    );


  const ranked =
    data.members
      .map(
        (
          name,
          index
        ) => ({

          name,

          index,

          score:
            scores[name] ||
            0

        })
      )
      .sort(
        (
          a,
          b
        ) =>

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

    box.innerHTML = `

      <div
        class="lesson-empty"
      >

        <div
          style="font-size:45px"
        >
          🏆
        </div>

        <h3>
          Chưa có thành viên
        </h3>

      </div>

    `;

    return;

  }


  const maxScore =
    Math.max(
      10,
      ...ranked.map(
        x =>
          x.score
      )
    );


  box.innerHTML =
    ranked
      .map(
        (
          item,
          rankIndex
        ) => {

          const rank =
            rankIndex + 1;


          const width =
            Math.min(
              100,
              item.score /
                maxScore *
                100
            );


          let medal;


          if (
            rank === 1
          ) {

            medal =
              "🥇";

          } else if (
            rank === 2
          ) {

            medal =
              "🥈";

          } else if (
            rank === 3
          ) {

            medal =
              "🥉";

          } else {

            medal =
              "#" +
              rank;

          }


          return `

            <div
              class="rank-card"
            >

              <div
                class="rank-head"
              >

                <div>

                  <span
                    style="
                      font-size:22px
                    "
                  >
                    ${medal}
                  </span>

                  <span
                    class="rank-name"
                  >
                    ${esc(
                      item.name
                    )}
                  </span>


                  ${
                    rank <= 3

                      ? `
                        <div
                          class="prize"
                        >
                          ${
                            rank === 1
                              ? "🏆 Giải Nhất"
                              : rank === 2
                              ? "🥈 Giải Nhì"
                              : "🥉 Giải Ba"
                          }
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
                  class="
                    score-btn
                    minus
                  "
                  onclick="
                    adjustScore(
                      ${item.index},
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
                    adjustScore(
                      ${item.index},
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
                    adjustScore(
                      ${item.index},
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
                    adjustScore(
                      ${item.index},
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


/* =========================================================
   LESSON
========================================================= */

const lessonFile =
  document.getElementById(
    "lessonFile"
  );


document
  .getElementById(
    "chooseLessonBtn"
  )
  ?.addEventListener(
    "click",
    () =>
      lessonFile?.click()
  );


lessonFile?.addEventListener(
  "change",
  () =>
    importLessonFiles(
      lessonFile.files
    )
);


const lessonZone =
  document.getElementById(
    "lessonUploadZone"
  );


lessonZone?.addEventListener(
  "dragover",
  event => {

    event.preventDefault();

    lessonZone.classList.add(
      "dragover"
    );

  }
);


lessonZone?.addEventListener(
  "dragleave",
  () => {

    lessonZone.classList.remove(
      "dragover"
    );

  }
);


lessonZone?.addEventListener(
  "drop",
  event => {

    event.preventDefault();

    lessonZone.classList.remove(
      "dragover"
    );

    importLessonFiles(
      event
        .dataTransfer
        .files
    );

  }
);


document
  .getElementById(
    "lessonSearch"
  )
  ?.addEventListener(
    "input",
    renderLessons
  );


async function docxToLesson(
  buffer,
  filename
) {

  if (
    !window.mammoth
  ) {

    throw new Error(
      "Thư viện Word chưa tải."
    );

  }


  const result =
    await window.mammoth
      .convertToHtml(

        {
          arrayBuffer:
            buffer
        },

        {

          convertImage:
            window
              .mammoth
              .images
              .imgElement(

                image =>

                  image
                    .read(
                      "base64"
                    )
                    .then(
                      base64 => ({

                        src:
                          `data:${image.contentType};base64,${base64}`

                      })
                    )

              )

        }

      );


  return {

    id:
      uid(),

    title:
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
      "Giáo án",

    filename,

    html:
      result.value ||
      "<p>Không có nội dung.</p>"

  };

}


async function importLessonFiles(
  files
) {

  if (
    !files ||
    !files.length
  ) {
    return;
  }


  const progress =
    document.getElementById(
      "lessonProgress"
    );


  try {

    for (
      const file of
      Array.from(files)
    ) {

      /* ZIP */

      if (
        /\.zip$/i.test(
          file.name
        )
      ) {

        if (
          !window.JSZip
        ) {

          throw new Error(
            "Thư viện ZIP chưa tải."
          );

        }


        const zip =
          await window.JSZip
            .loadAsync(
              await file.arrayBuffer()
            );


        const items =
          Object
            .values(
              zip.files
            )
            .filter(
              item =>
                !item.dir &&
                /\.docx$/i.test(
                  item.name
                )
            );


        if (
          !items.length
        ) {

          throw new Error(
            "File ZIP không có .docx."
          );

        }


        for (
          const item of
          items
        ) {

          if (progress) {

            progress.innerHTML = `

              <div
                class="notice"
              >
                ⏳ Đang chuyển:
                ${esc(
                  item.name
                )}
              </div>

            `;

          }


          const filename =
            item.name
              .split("/")
              .pop();


          const lesson =
            await docxToLesson(

              await item.async(
                "arraybuffer"
              ),

              filename

            );


          data.lessons.push(
            lesson
          );


          saveLocal();

        }

      }

      /* DOCX */

      else if (
        /\.docx$/i.test(
          file.name
        )
      ) {

        if (progress) {

          progress.innerHTML = `

            <div class="notice">

              ⏳ Đang đọc:
              ${esc(
                file.name
              )}

            </div>

          `;

        }


        const lesson =
          await docxToLesson(

            await file.arrayBuffer(),

            file.name

          );


        data.lessons.push(
          lesson
        );


        saveLocal();

      }

      else {

        alert(
          `Bỏ qua ${file.name}.`
        );

      }

    }


    renderLessons();


    if (progress) {

      progress.innerHTML = `

        <div class="notice">

          ✅ Đã nhập giáo án thành công.

        </div>

      `;

    }

  } catch (error) {

    console.error(error);


    if (progress) {

      progress.innerHTML = `

        <div
          class="
            notice
            error
          "
        >

          ${esc(
            error.message ||
            "Không thể đọc file."
          )}

        </div>

      `;

    }

  } finally {

    if (
      lessonFile
    ) {

      lessonFile.value =
        "";

    }

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


  const q =
    (
      document.getElementById(
        "lessonSearch"
      )?.value ||
      ""
    )
      .toLowerCase();


  const filtered =
    data.lessons.filter(
      lesson =>
        lesson.title
          .toLowerCase()
          .includes(q)
    );


  if (!filtered.length) {

    list.innerHTML = `

      <div
        class="lesson-empty"
        style="
          padding:35px 15px
        "
      >

        ${
          data.lessons.length

            ? "Không tìm thấy giáo án."

            : "Chưa có giáo án nào."

        }

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
          >

            <div
              class="
                lesson-item-title
              "
            >
              📖
              ${esc(
                lesson.title
              )}
            </div>


            <div
              class="
                lesson-item-small
              "
            >
              ${esc(
                lesson.filename ||
                ""
              )}
            </div>


            <div
              class="
                actions
              "
              style="
                margin-top:8px
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


window.viewLesson =
  id => {

    const lesson =
      data.lessons.find(
        x =>
          x.id ===
          id
      );


    if (!lesson) {
      return;
    }


    const viewer =
      document.getElementById(
        "lessonViewer"
      );


    if (!viewer) {
      return;
    }


    viewer.innerHTML = `

      <div>

        <div
          class="lesson-close"
        >

          <h2
            style="margin:0"
          >
            📖
            ${esc(
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
          class="small"
        >
          File:
          ${esc(
            lesson.filename ||
            ""
          )}
        </div>


        <hr
          style="
            margin:15px 0
          "
        >


        <div
          class="
            lesson-content
          "
        >
          ${
            lesson.html ||
            "<p>Không có nội dung.</p>"
          }
        </div>


        <div
          style="
            margin-top:20px
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

  };


window.closeLesson =
  () => {

    const viewer =
      document.getElementById(
        "lessonViewer"
      );


    if (!viewer) {
      return;
    }


    viewer.innerHTML = `

      <div
        class="
          lesson-empty
        "
      >

        <div
          style="
            font-size:48px
          "
        >
          📖
        </div>

        <h3>
          Chưa chọn giáo án
        </h3>

        <p>
          Hãy chọn một giáo án.
        </p>

      </div>

    `;

  };


window.renameLesson =
  id => {

    const lesson =
      data.lessons.find(
        x =>
          x.id ===
          id
      );


    if (!lesson) {
      return;
    }


    const name =
      prompt(
        "Tên giáo án:",
        lesson.title
      );


    if (
      name === null ||
      !name.trim()
    ) {

      return;

    }


    lesson.title =
      name.trim();


    saveLocal();

    renderLessons();

    viewLesson(id);

  };


window.deleteLesson =
  id => {

    const lesson =
      data.lessons.find(
        x =>
          x.id ===
          id
      );


    if (
      !lesson
    ) {

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
          x.id !==
          id
      );


    saveLocal();

    renderLessons();

    closeLesson();

  };


/* =========================================================
   ADMIN
========================================================= */

document
  .getElementById(
    "refreshUsers"
  )
  ?.addEventListener(
    "click",
    renderAdminUsers
  );


async function renderAdminUsers() {

  if (!isAdmin) {
    return;
  }


  const box =
    document.getElementById(
      "usersAdminList"
    );


  if (!box) {
    return;
  }


  box.innerHTML =
    "⏳ Đang tải...";


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    const users =
      snapshot.docs
        .map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        )
        .sort(
          (
            a,
            b
          ) =>
            String(
              a.email ||
              ""
            ).localeCompare(
              String(
                b.email ||
                ""
              )
            )
        );


    if (!users.length) {

      box.innerHTML =
        `
          <p class="small">
            Chưa có tài khoản nào đăng ký.
          </p>
        `;

      return;

    }


    box.innerHTML =
      users
        .map(
          user => {

            const status =
              user.status ||
              "pending";


            return `

              <div
                class="
                  user-admin-card
                "
              >

                <b>
                  ${esc(
                    user.name ||
                    "Chưa có tên"
                  )}
                </b>


                <div
                  class="small"
                >
                  ${esc(
                    user.email ||
                    ""
                  )}
                </div>


                <div
                  style="
                    margin:
                      8px 0
                  "
                >

                  <span
                    class="
                      status
                      ${status}
                    "
                  >
                    ${esc(
                      status
                    )}
                  </span>

                </div>


                <div
                  class="actions"
                >

                  ${
                    status !==
                    "approved"

                      ? `

                        <button
                          class="btn"
                          onclick="
                            setUserStatus(
                              '${user.id}',
                              'approved'
                            )
                          "
                        >
                          ✅ Duyệt
                        </button>

                      `

                      : ""

                  }


                  ${
                    status !==
                    "rejected"

                      ? `

                        <button
                          class="btn red"
                          onclick="
                            setUserStatus(
                              '${user.id}',
                              'rejected'
                            )
                          "
                        >
                          ❌ Từ chối
                        </button>

                      `

                      : ""

                  }


                  ${
                    status !==
                    "disabled"

                      ? `

                        <button
                          class="btn gray"
                          onclick="
                            setUserStatus(
                              '${user.id}',
                              'disabled'
                            )
                          "
                        >
                          🚫 Khóa
                        </button>

                      `

                      : `

                        <button
                          class="btn"
                          onclick="
                            setUserStatus(
                              '${user.id}',
                              'approved'
                            )
                          "
                        >
                          🔓 Mở khóa
                        </button>

                      `

                  }

                </div>

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(error);


    box.innerHTML =
      `

        <div
          class="
            notice
            error
          "
        >
          ${esc(
            error.message
          )}
        </div>

      `;

  }

}


window.setUserStatus =
  async (
    uid,
    status
  ) => {

    if (!isAdmin) {
      return;
    }


    const labels = {

      approved:
        "duyệt",

      rejected:
        "từ chối",

      disabled:
        "khóa"

    };


    if (
      !confirm(
        `Bạn có chắc muốn ${labels[status] || status} tài khoản này?`
      )
    ) {

      return;

    }


    try {

      await updateDoc(

        doc(
          db,
          "users",
          uid
        ),

        {
          status
        }

      );


      renderAdminUsers();


    } catch (error) {

      console.error(
        error
      );


      alert(
        "Không thể cập nhật tài khoản: " +
        error.message
      );

    }

  };


/* =========================================================
   THEME
========================================================= */

const defaultTheme = {

  title:
    "✝ LỚN LÊN TRONG CHÚA THÁNH THẦN 1",

  subtitle:
    "“Xin Chúa Thánh Thần hướng dẫn chúng con”",

  primary:
    "#168a70",

  secondary:
    "#2d91c7",

  bg1:
    "#eafaf3",

  bg2:
    "#eaf3ff",

  card:
    "#ffffff",

  text:
    "#173b35",

  radius:
    18,

  customCss:
    ""

};


function applyTheme(
  theme
) {

  const x =
    {
      ...defaultTheme,
      ...theme
    };


  const root =
    document.documentElement;


  root.style.setProperty(
    "--primary",
    x.primary
  );


  root.style.setProperty(
    "--secondary",
    x.secondary
  );


  root.style.setProperty(
    "--bg1",
    x.bg1
  );


  root.style.setProperty(
    "--bg2",
    x.bg2
  );


  root.style.setProperty(
    "--card",
    x.card
  );


  root.style.setProperty(
    "--text",
    x.text
  );


  root.style.setProperty(
    "--radius",
    `${x.radius}px`
  );


  const title =
    document.getElementById(
      "siteTitle"
    );


  if (title) {

    title.textContent =
      x.title;

  }


  const subtitle =
    document.getElementById(
      "siteSubtitle"
    );


  if (subtitle) {

    subtitle.textContent =
      x.subtitle;

  }


  const previewTitle =
    document.getElementById(
      "previewTitle"
    );


  if (previewTitle) {

    previewTitle.textContent =
      x.title;

  }


  const previewSubtitle =
    document.getElementById(
      "previewSubtitle"
    );


  if (previewSubtitle) {

    previewSubtitle.textContent =
      x.subtitle;

  }


  let customStyle =
    document.getElementById(
      "customThemeStyle"
    );


  if (!customStyle) {

    customStyle =
      document.createElement(
        "style"
      );


    customStyle.id =
      "customThemeStyle";


    document.head.appendChild(
      customStyle
    );

  }


  customStyle.textContent =
    x.customCss ||
    "";

}


async function loadTheme() {

  if (
    themeWatcher
  ) {

    themeWatcher();

    themeWatcher =
      null;

  }


  themeWatcher =
    onSnapshot(

      doc(
        db,
        "settings",
        "site"
      ),

      snapshot => {

        applyTheme(

          snapshot.exists()
            ? snapshot.data()
            : defaultTheme

        );

      },

      error => {

        console.error(
          "Theme listener:",
          error
        );

        applyTheme(
          defaultTheme
        );

      }

    );

}


async function loadThemeForm() {

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "settings",
          "site"
        )
      );


    const theme =
      {

        ...defaultTheme,

        ...(

          snapshot.exists()
            ? snapshot.data()
            : {}

        )

      };


    const fields = {

      themeTitle:
        theme.title,

      themeSubtitle:
        theme.subtitle,

      themePrimary:
        theme.primary,

      themeSecondary:
        theme.secondary,

      themeBg1:
        theme.bg1,

      themeBg2:
        theme.bg2,

      themeCard:
        theme.card,

      themeText:
        theme.text,

      themeRadius:
        theme.radius,

      themeCustomCss:
        theme.customCss ||
        ""

    };


    Object.entries(
      fields
    ).forEach(
      (
        [
          id,
          value
        ]
      ) => {

        const element =
          document.getElementById(
            id
          );


        if (
          element
        ) {

          element.value =
            value;

        }

      }
    );


    const radiusValue =
      document.getElementById(
        "themeRadiusValue"
      );


    if (
      radiusValue
    ) {

      radiusValue.textContent =
        theme.radius;

    }


    applyTheme(
      theme
    );


  } catch (error) {

    console.error(
      error
    );

  }

}


function formTheme() {

  const value =
    id =>
      document
        .getElementById(
          id
        )?.value;


  return {

    title:
      (
        value(
          "themeTitle"
        ) ||
        defaultTheme.title
      ).trim(),

    subtitle:
      (
        value(
          "themeSubtitle"
        ) ||
        defaultTheme.subtitle
      ).trim(),

    primary:
      value(
        "themePrimary"
      ) ||
      defaultTheme.primary,

    secondary:
      value(
        "themeSecondary"
      ) ||
      defaultTheme.secondary,

    bg1:
      value(
        "themeBg1"
      ) ||
      defaultTheme.bg1,

    bg2:
      value(
        "themeBg2"
      ) ||
      defaultTheme.bg2,

    card:
      value(
        "themeCard"
      ) ||
      defaultTheme.card,

    text:
      value(
        "themeText"
      ) ||
      defaultTheme.text,

    radius:
      Number(
        value(
          "themeRadius"
        ) ||
        defaultTheme.radius
      ),

    customCss:
      value(
        "themeCustomCss"
      ) || ""

  };

}


/* LIVE PREVIEW */

[
  "themeTitle",

  "themeSubtitle",

  "themePrimary",

  "themeSecondary",

  "themeBg1",

  "themeBg2",

  "themeCard",

  "themeText",

  "themeRadius",

  "themeCustomCss"

].forEach(
  id => {

    document
      .getElementById(
        id
      )
      ?.addEventListener(
        "input",
        () => {

          const theme =
            formTheme();

          applyTheme(
            theme
          );

        }
      );

  }
);


document
  .getElementById(
    "themeRadius"
  )
  ?.addEventListener(
    "input",
    event => {

      document
        .getElementById(
          "themeRadiusValue"
        ).textContent =
          event.target.value;

    }
  );


/* SAVE THEME */

document
  .getElementById(
    "saveTheme"
  )
  ?.addEventListener(
    "click",
    async () => {

      try {

        const theme =
          formTheme();


        await setDoc(

          doc(
            db,
            "settings",
            "site"
          ),

          theme,

          {
            merge:
              true
          }

        );


        alert(
          "✅ Đã lưu giao diện."
        );


      } catch (error) {

        console.error(
          error
        );


        alert(
          "Không thể lưu giao diện: " +
          error.message
        );

      }

    }
  );


/* RESET */

document
  .getElementById(
    "resetTheme"
  )
  ?.addEventListener(
    "click",
    async () => {

      if (
        !confirm(
          "Đưa giao diện về mặc định?"
        )
      ) {

        return;

      }


      try {

        await setDoc(

          doc(
            db,
            "settings",
            "site"
          ),

          defaultTheme,

          {
            merge:
              true
          }

        );


        applyTheme(
          defaultTheme
        );


        await loadThemeForm();


      } catch (error) {

        alert(
          "Không thể đặt lại giao diện: " +
          error.message
        );

      }

    }
  );


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      currentUser =
        null;

      isAdmin =
        false;


      if (
        userWatcher
      ) {

        userWatcher();

        userWatcher =
          null;

      }


      document
        .getElementById(
          "authGate"
        )
        ?.classList
        .remove(
          "hidden"
        );


      document
        .getElementById(
          "appRoot"
        )
        ?.classList
        .add(
          "hidden"
        );


      document
        .getElementById(
          "authForms"
        )
        ?.classList
        .remove(
          "hidden"
        );


      document
        .getElementById(
          "pendingBox"
        )
        ?.classList
        .add(
          "hidden"
        );


      setAuthMode(
        false
      );


      return;

    }


    await checkAccess(
      user
    );

  }
);


/* =========================================================
   START
========================================================= */

applyTheme(
  defaultTheme
);

saveLocal();

renderAll();
