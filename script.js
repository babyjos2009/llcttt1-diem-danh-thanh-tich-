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
  apiKey: "AIzaSyAnIpzNv-YkA_v6WKC_G_W7IbFqIWchHm1IE",
  authDomain: "llcttt1-diem-danh.firebaseapp.com",
  projectId: "llcttt1-diem-danh",
  storageBucket: "llcttt1-diem-danh.firebasestorage.app",
  messagingSenderId: "1028180173731",
  appId: "1:1028180173731:web:c649731f9ccc20acb13016",
  measurementId: "G-XDNC5S21BN"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   THÀNH VIÊN MẶC ĐỊNH
   ĐÃ BỎ HẾT TÊN HỌC SINH
========================================================= */

const defaultNames = [];


/* =========================================================
   KEY LOCAL STORAGE
========================================================= */

const key =
  "llcttt1_attendance_v5";


/* =========================================================
   GIAO DIỆN MẶC ĐỊNH
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


/* =========================================================
   DỮ LIỆU
========================================================= */

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


if (!Array.isArray(data.members)) {

  data.members =
    [...defaultNames];

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


/* =========================================================
   XÓA 9 TÊN MẪU CŨ NẾU TRÌNH DUYỆT ĐANG LƯU CHÚNG
========================================================= */

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


if (

  data.members.length ===
  oldDefaultNames.length

  &&

  oldDefaultNames.every(
    (name, i) =>
      data.members[i] === name
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


/* =========================================================
   LƯU LOCAL
========================================================= */

function saveLocal() {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

  } catch (error) {

    console.error(error);

    alert(
      "Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt giáo án hoặc ảnh rồi thử lại."
    );

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {

  return String(value).replace(
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


/* =========================================================
   ID
========================================================= */

function uid() {

  return (

    Date.now().toString(36) +

    Math.random()
      .toString(36)
      .slice(2)

  );

}


/* =========================================================
   SESSION HIỆN TẠI
========================================================= */

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


/* =========================================================
   THÔNG TIN THÀNH VIÊN
========================================================= */

function info(name) {

  if (!data.memberInfo[name]) {

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
   AUTH MESSAGE
========================================================= */

function showMsg(
  msg,
  kind = "notice"
) {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) return;

  box.innerHTML =
    msg

      ? `
        <div class="notice ${kind}">
          ${msg}
        </div>
      `

      : "";

}


/* =========================================================
   LOGIN / REGISTER
========================================================= */

function setAuthMode(
  register = false
) {

  const loginTab =
    document.getElementById(
      "loginTab"
    );

  const registerTab =
    document.getElementById(
      "registerTab"
    );

  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const registerForm =
    document.getElementById(
      "registerForm"
    );


  if (loginTab) {

    loginTab.classList.toggle(
      "active",
      !register
    );

  }


  if (registerTab) {

    registerTab.classList.toggle(
      "active",
      register
    );

  }


  if (loginForm) {

    loginForm.classList.toggle(
      "hidden",
      register
    );

  }


  if (registerForm) {

    registerForm.classList.toggle(
      "hidden",
      !register
    );

  }


  showMsg("");

}


function setPending(
  show = true
) {

  const forms =
    document.getElementById(
      "authForms"
    );

  const pending =
    document.getElementById(
      "pendingBox"
    );


  if (forms) {

    forms.classList.toggle(
      "hidden",
      show
    );

  }


  if (pending) {

    pending.classList.toggle(
      "hidden",
      !show
    );

  }

}


/* =========================================================
   ĐỔI TAB LOGIN / REGISTER
========================================================= */

const loginTab =
  document.getElementById(
    "loginTab"
  );

const registerTab =
  document.getElementById(
    "registerTab"
  );


if (loginTab) {

  loginTab.onclick = () =>
    setAuthMode(false);

}


if (registerTab) {

  registerTab.onclick = () =>
    setAuthMode(true);

}


/* =========================================================
   ĐĂNG NHẬP
========================================================= */

const loginForm =
  document.getElementById(
    "loginForm"
  );


if (loginForm) {

  loginForm.onsubmit =
    async event => {

      event.preventDefault();

      showMsg(
        "Đang đăng nhập..."
      );


      try {

        const email =
          document
            .getElementById(
              "loginEmail"
            )
            ?.value
            .trim();

        const password =
          document
            .getElementById(
              "loginPassword"
            )
            ?.value || "";


        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


        showMsg("");

      } catch (error) {

        console.error(error);

        showMsg(
          "Đăng nhập không thành công: " +
          friendlyAuthError(error),
          "error"
        );

      }

    };

}


/* =========================================================
   ĐĂNG KÝ
========================================================= */

const registerForm =
  document.getElementById(
    "registerForm"
  );


if (registerForm) {

  registerForm.onsubmit =
    async event => {

      event.preventDefault();


      const name =
        document
          .getElementById(
            "registerName"
          )
          ?.value
          .trim() || "";


      const email =
        document
          .getElementById(
            "registerEmail"
          )
          ?.value
          .trim() || "";


      const password =
        document
          .getElementById(
            "registerPassword"
          )
          ?.value || "";


      const password2 =
        document
          .getElementById(
            "registerPassword2"
          )
          ?.value || "";


      if (!name) {

        showMsg(
          "Bạn chưa nhập họ tên.",
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

        const cred =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        await setDoc(
          doc(
            db,
            "users",
            cred.user.uid
          ),
          {

            name:
              name,

            email:
              email,

            status:
              "pending",

            createdAt:
              serverTimestamp()

          }
        );


        setPending(true);

        showMsg("");


      } catch (error) {

        console.error(error);

        showMsg(
          "Không thể đăng ký: " +
          friendlyAuthError(error),
          "error"
        );

      }

    };

}


/* =========================================================
   ĐĂNG XUẤT
========================================================= */

const logoutPending =
  document.getElementById(
    "logoutPending"
  );

if (logoutPending) {

  logoutPending.onclick = () =>
    signOut(auth);

}


const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

if (logoutBtn) {

  logoutBtn.onclick = () =>
    signOut(auth);

}


const checkApproval =
  document.getElementById(
    "checkApproval"
  );

if (checkApproval) {

  checkApproval.onclick = () =>
    checkAccess(
      auth.currentUser,
      true
    );

}


/* =========================================================
   LỖI FIREBASE
========================================================= */

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
      "Tên miền website chưa được thêm vào Authorized domains của Firebase."
    );

  }


  return (
    error?.message ||
    "Lỗi không xác định."
  );

}


/* =========================================================
   BIẾN AUTH
========================================================= */

let isAdmin =
  false;

let userUnsub =
  null;

let themeUnsub =
  null;

let currentUser =
  null;


/* =========================================================
   KIỂM TRA ADMIN
========================================================= */

async function checkAdmin(
  uid
) {

  try {

    const snap =
      await getDoc(
        doc(
          db,
          "admins",
          uid
        )
      );

    return snap.exists();

  } catch (error) {

    console.error(
      "checkAdmin:",
      error
    );

    return false;

  }

}


/* =========================================================
   LẤY PROFILE
========================================================= */

async function getProfile(
  uid
) {

  try {

    const snap =
      await getDoc(
        doc(
          db,
          "users",
          uid
        )
      );


    return snap.exists()
      ? snap.data()
      : null;

  } catch (error) {

    console.error(
      "getProfile:",
      error
    );

    return null;

  }

}


/* =========================================================
   KIỂM TRA QUYỀN TRUY CẬP
========================================================= */

async function checkAccess(
  user,
  showPending = false
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


  /* ĐÃ ĐƯỢC DUYỆT */

  if (
    profile?.status ===
    "approved"
  ) {

    await enterApp();

    return;

  }


  /* CHỜ / TỪ CHỐI / KHÓA */

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
      "Tài khoản đã đăng ký và đang chờ quản trị viên duyệt.",
      "notice"
    );

  }


  if (userUnsub) {

    userUnsub();

    userUnsub =
      null;

  }


  userUnsub =
    onSnapshot(

      doc(
        db,
        "users",
        user.uid
      ),

      async snap => {

        if (!snap.exists()) {
          return;
        }


        const profile =
          snap.data();


        if (
          profile.status ===
          "approved"
        ) {

          await enterApp();

        }

      }

    );

}


/* =========================================================
   VÀO APP
========================================================= */

async function enterApp() {

  if (userUnsub) {

    userUnsub();

    userUnsub =
      null;

  }


  document
    .getElementById(
      "authGate"
    )
    ?.classList
    .add("hidden");


  document
    .getElementById(
      "appRoot"
    )
    ?.classList
    .remove("hidden");


  const userLabel =
    document.getElementById(
      "currentUserLabel"
    );


  if (userLabel) {

    userLabel.textContent =

      (isAdmin
        ? "👑 Admin • "
        : "") +

      (
        currentUser
          ?.email || ""
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


  applyTheme(
    defaultTheme
  );


  loadTheme();


  renderAll();

}


/* =========================================================
   TAB
========================================================= */

document
  .querySelectorAll(
    ".tabs button[data-tab]"
  )
  .forEach(
    button => {

      button.onclick = () =>
        showTab(
          button.dataset.tab
        );

    }
  );


function showTab(tab) {

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


  [

    "attendance",

    "sessions",

    "members",

    "competition",

    "lessons",

    "admin",

    "theme"

  ].forEach(
    id => {

      const section =
        document.getElementById(
          id
        );


      if (section) {

        section.classList.toggle(
          "hidden",
          id !== tab
        );

      }

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


  renderAll();

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
   ĐIỂM DANH
========================================================= */

const searchInput =
  document.getElementById(
    "search"
  );

if (searchInput) {

  searchInput.oninput =
    renderAttendance;

}


const createSessionBtn =
  document.getElementById(
    "createSessionBtn"
  );


if (createSessionBtn) {

  createSessionBtn.onclick =
    () => {

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


      const d =
        prompt(
          "Ngày học DD/MM/YYYY:",
          new Date()
            .toLocaleDateString(
              "vi-VN"
            )
        );


      if (d === null) {
        return;
      }


      const a =
        d
          .trim()
          .split(
            /[\/\-.]/
          )
          .map(Number);


      if (
        a.length !== 3
      ) {

        alert(
          "Ngày không hợp lệ."
        );

        return;

      }


      const date =
        new Date(
          a[2],
          a[1] - 1,
          a[0]
        );


      if (

        Number.isNaN(
          date.getTime()
        )

        ||

        date.getDate() !==
          a[0]

        ||

        date.getMonth() !==
          a[1] - 1

        ||

        date.getFullYear() !==
          a[2]

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
        data.sessions.length - 1;


      saveLocal();

      renderAll();

    };

}


function renderAttendance() {

  const s =
    currentSession();


  const list =
    document.getElementById(
      "list"
    );


  if (!list) {
    return;
  }


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


  if (total) {

    total.textContent =
      data.members.length;

  }


  if (!s) {

    const title =
      document.getElementById(
        "sessionTitle"
      );

    const date =
      document.getElementById(
        "sessionDate"
      );


    if (title) {

      title.textContent =
        "Chưa có buổi học";

    }


    if (date) {

      date.textContent =
        "Hãy bấm “＋ Tạo buổi học” để bắt đầu.";

    }


    if (present) {

      present.textContent =
        "0";

    }


    if (absent) {

      absent.textContent =
        data.members.length;

    }


    list.innerHTML = `

      <div
        class="lesson-empty"
      >

        <div
          style="
            font-size:42px
          "
        >
          📅
        </div>

        <h3>
          Chưa có buổi học nào
        </h3>

        <p class="small">
          Bạn hãy tạo buổi học trước.
        </p>

        <button
          class="primary"
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


  const title =
    document.getElementById(
      "sessionTitle"
    );

  const date =
    document.getElementById(
      "sessionDate"
    );


  if (title) {

    title.textContent =
      s.label;

  }


  if (date) {

    date.textContent =
      new Date(
        s.date
      )
      .toLocaleDateString(
        "vi-VN"
      );

  }


  const q =
    (
      document.getElementById(
        "search"
      )?.value ||
      ""
    )
    .toLowerCase();


  list.innerHTML =
    data.members

      .map(
        (
          name,
          i
        ) => ({
          name,
          i
        })
      )

      .filter(
        x =>
          x.name
            .toLowerCase()
            .includes(q)
      )

      .map(
        x => `

          <div
            class="row"
          >

            <span>

              <b>
                ${x.i + 1}.
                ${esc(x.name)}
              </b>

            </span>


            <button
              class="
                badge
                ${
                  s.attendance[x.i]
                    ? "present"
                    : "absent"
                }
              "
              onclick="
                toggleAttendance(
                  ${x.i}
                )
              "
            >
              ${
                s.attendance[x.i]
                  ? "✓ Có mặt"
                  : "✕ Vắng"
              }
            </button>

          </div>

        `
      )

      .join("");


  if (!list.innerHTML) {

    list.innerHTML =
      "<p>Không tìm thấy thành viên.</p>";

  }


  const p =
    s.attendance.filter(
      Boolean
    ).length;


  if (present) {

    present.textContent =
      p;

  }


  if (absent) {

    absent.textContent =
      data.members.length -
      p;

  }

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
   THỐNG KÊ
========================================================= */

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
      `
        <p class="small">
          Chưa có buổi học nào.
        </p>
      `;


    if (average) {

      average.textContent =
        "0%";

    }


    return;

  }


  let tp = 0;

  let tc = 0;


  box.innerHTML =
    data.sessions

      .map(
        (
          s,
          i
        ) => {

          const p =
            s.attendance.filter(
              Boolean
            ).length;


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


          tp += p;

          tc += t;


          return `

            <div
              class="session"
            >

              <b>
                ${esc(s.label)}
              </b>

              <div>
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
                có mặt (${pct}%)
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
                  class="primary"
                  onclick="
                    selectSession(
                      ${i}
                    )
                  "
                >
                  Mở buổi này
                </button>

                <button
                  class="danger"
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


  if (average) {

    average.textContent =
      tc
        ? Math.round(
            tp /
            tc *
            100
          ) + "%"

        : "0%";

  }

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


    if (
      data.sessions.length
    ) {

      data.current =
        Math.min(
          index,
          data.sessions.length -
            1
        );

    } else {

      data.current =
        -1;

    }


    saveLocal();

    renderAll();

  };


/* =========================================================
   THÀNH VIÊN
========================================================= */

const addMemberBtn =
  document.getElementById(
    "addMemberBtn"
  );


if (addMemberBtn) {

  addMemberBtn.onclick =
    () => {

      const input =
        document.getElementById(
          "newMember"
        );


      if (!input) {
        return;
      }


      const n =
        input.value.trim();


      if (!n) {

        alert(
          "Bạn chưa nhập tên."
        );

        return;

      }


      if (
        data.members.some(
          x =>
            x.toLowerCase() ===
            n.toLowerCase()
        )
      ) {

        alert(
          "Tên này đã có."
        );

        return;

      }


      data.members.push(
        n
      );


      data.sessions.forEach(
        s =>
          s.attendance.push(
            false
          )
      );


      info(n);


      input.value =
        "";


      saveLocal();

      renderAll();

    };

}


function renderMembers() {

  const box =
    document.getElementById(
      "memberList"
    );


  if (!box) {
    return;
  }


  if (!data.members.length) {

    box.innerHTML = `

      <div
        class="
          lesson-empty
        "
        style="
          padding:35px 15px
        "
      >

        <div
          style="
            font-size:45px
          "
        >
          👥
        </div>

        <h3>
          Chưa có thành viên
        </h3>

        <p>
          Nhập tên ở phía trên rồi bấm
          <b>＋ Thêm</b>.
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
          i
        ) => {

          const x =
            info(name);


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

                <div>

                  <b>
                    ${i + 1}.
                    ${esc(name)}
                  </b>

                </div>


                <div
                  class="small"
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
                  class="
                    member-actions
                  "
                  style="
                    margin-top:8px
                  "
                >

                  <button
                    class="secondary"
                    onclick="
                      editMemberInfo(
                        ${i}
                      )
                    "
                  >
                    📝 Thông tin
                  </button>

                  <button
                    class="secondary"
                    onclick="
                      uploadPhoto(
                        ${i}
                      )
                    "
                  >
                    🖼️ Ảnh
                  </button>

                  <button
                    class="secondary"
                    onclick="
                      renameMember(
                        ${i}
                      )
                    "
                  >
                    ✏️ Đổi tên
                  </button>

                  <button
                    class="danger"
                    onclick="
                      deleteMember(
                        ${i}
                      )
                    "
                  >
                    🗑️ Xóa
                  </button>

                  ${
                    x.photo

                      ? `

                        <button
                          class="danger"
                          onclick="
                            removePhoto(
                              ${i}
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

    const old =
      data.members[index];


    const n =
      prompt(
        "Đổi tên:",
        old
      );


    if (
      n === null ||
      !n.trim()
    ) {

      return;

    }


    const clean =
      n.trim();


    if (
      data.members.some(
        (
          x,
          j
        ) =>

          j !== index &&
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
      data.memberInfo[old]
    ) {

      data.memberInfo[
        clean
      ] =
        data.memberInfo[
          old
        ];

      delete data.memberInfo[
        old
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
      s =>
        s.attendance.splice(
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
      info(name);


    const dob =
      prompt(
        "Ngày sinh:",
        x.dob
      );


    if (dob === null) {
      return;
    }


    const father =
      prompt(
        "Tên bố:",
        x.father
      );


    if (father === null) {
      return;
    }


    const mother =
      prompt(
        "Tên mẹ:",
        x.mother
      );


    if (mother === null) {
      return;
    }


    const phone =
      prompt(
        "SĐT phụ huynh:",
        x.phone
      );


    if (phone === null) {
      return;
    }


    Object.assign(
      x,
      {

        dob:
          dob.trim(),

        father:
          father.trim(),

        mother:
          mother.trim(),

        phone:
          phone.trim()

      }
    );


    saveLocal();

    renderMembers();

  };


window.removePhoto =
  index => {

    info(
      data.members[index]
    ).photo =
      "";


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

        const f =
          input.files?.[0];


        if (!f) {
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

                const c =
                  document.createElement(
                    "canvas"
                  );


                const mx =
                  240;


                const scale =
                  Math.min(
                    1,
                    mx /
                    Math.max(
                      img.width,
                      img.height
                    )
                  );


                c.width =
                  Math.round(
                    img.width *
                    scale
                  );


                c.height =
                  Math.round(
                    img.height *
                    scale
                  );


                c
                  .getContext(
                    "2d"
                  )
                  .drawImage(
                    img,
                    0,
                    0,
                    c.width,
                    c.height
                  );


                info(
                  data.members[index]
                ).photo =
                  c.toDataURL(
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
          f
        );

      };


    input.click();

  };


/* =========================================================
   THANH THI ĐUA
========================================================= */

let compMonth =
  new Date()
    .toISOString()
    .slice(
      0,
      7
    );


function scores(
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
    n => {

      if (
        typeof
          data.competition[
            month
          ][n] !==
        "number"
      ) {

        data.competition[
          month
        ][n] = 0;

      }

    }
  );


  return data.competition[
    month
  ];

}


const prevMonth =
  document.getElementById(
    "prevMonth"
  );


if (prevMonth) {

  prevMonth.onclick =
    () => {

      const [
        y,
        m
      ] =
        compMonth
          .split("-")
          .map(Number);


      const d =
        new Date(
          y,
          m - 2,
          1
        );


      compMonth =
        d
          .toISOString()
          .slice(
            0,
            7
          );


      renderCompetition();

    };

}


const nextMonth =
  document.getElementById(
    "nextMonth"
  );


if (nextMonth) {

  nextMonth.onclick =
    () => {

      const [
        y,
        m
      ] =
        compMonth
          .split("-")
          .map(Number);


      const d =
        new Date(
          y,
          m,
          1
        );


      compMonth =
        d
          .toISOString()
          .slice(
            0,
            7
          );


      renderCompetition();

    };

}


const resetCompetition =
  document.getElementById(
    "resetCompetition"
  );


if (resetCompetition) {

  resetCompetition.onclick =
    () => {

      if (
        !confirm(
          "Đặt lại điểm tháng này?"
        )
      ) {

        return;

      }


      const s =
        scores(
          compMonth
        );


      data.members.forEach(
        n =>
          s[n] = 0
      );


      saveLocal();

      renderCompetition();

    };

}


window.adjustScore =
  (
    index,
    amount
  ) => {

    const n =
      data.members[index];


    if (!n) {
      return;
    }


    const s =
      scores(
        compMonth
      );


    s[n] =
      Math.max(
        0,
        (s[n] || 0) +
          amount
      );


    saveLocal();

    renderCompetition();

  };


function renderCompetition() {

  const monthTitle =
    document.getElementById(
      "competitionMonth"
    );


  const box =
    document.getElementById(
      "competitionList"
    );


  if (
    !monthTitle ||
    !box
  ) {
    return;
  }


  const [
    y,
    m
  ] =
    compMonth
      .split("-")
      .map(Number);


  monthTitle.textContent =
    `THÁNG ${m}/${y}`;


  const s =
    scores(
      compMonth
    );


  const ranked =
    data.members

      .map(
        (
          n,
          i
        ) => ({

          n,
          i,

          score:
            s[n] || 0

        })
      )

      .sort(
        (
          a,
          b
        ) =>

          b.score -
            a.score

          ||

          a.n.localeCompare(
            b.n,
            "vi"
          )
      );


  if (!ranked.length) {

    box.innerHTML = `

      <div
        class="
          lesson-empty
        "
      >

        <div
          style="
            font-size:45px
          "
        >
          🏆
        </div>

        <h3>
          Chưa có thành viên
        </h3>

        <p>
          Hãy thêm thành viên ở mục
          <b>👥 Thành viên</b>.
        </p>

      </div>

    `;

    return;

  }


  const max =
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
          x,
          k
        ) => `

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
                  ${
                    k === 0
                      ? "🥇"
                      : k === 1
                      ? "🥈"
                      : k === 2
                      ? "🥉"
                      : "#" +
                        (
                          k + 1
                        )
                  }
                </span>


                <span
                  class="
                    rank-name
                  "
                >
                  ${esc(x.n)}
                </span>


                ${
                  k < 3

                    ? `

                      <div
                        class="
                          prize
                        "
                      >
                        ${
                          k === 0
                            ? "🏆 Giải Nhất"
                            : k === 1
                            ? "🥈 Giải Nhì"
                            : "🥉 Giải Ba"
                        }
                      </div>

                    `

                    : ""

                }

              </div>


              <div
                class="
                  rank-score
                "
              >

                ${x.score}
                điểm

              </div>

            </div>


            <div
              class="
                rank-bar
              "
            >

              <div
                class="
                  rank-fill
                "
                style="
                  width:${Math.min(
                    100,
                    x.score /
                      max *
                      100
                  )}%
                "
              ></div>

            </div>


            <div
              class="
                score-actions
              "
            >

              <button
                class="
                  score-btn
                  minus
                "
                onclick="
                  adjustScore(
                    ${x.i},
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
                    ${x.i},
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
                    ${x.i},
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
                    ${x.i},
                    10
                  )
                "
              >
                +10
              </button>

            </div>

          </div>

        `
      )

      .join("");

}


/* =========================================================
   GIÁO ÁN
========================================================= */

const lessonUploadZone =
  document.getElementById(
    "lessonUploadZone"
  );


const lessonFile =
  document.getElementById(
    "lessonFile"
  );


if (
  lessonUploadZone &&
  lessonFile
) {

  lessonUploadZone.onclick =
    () =>
      lessonFile.click();


  lessonFile.onchange =
    () =>
      importLessonFiles(
        lessonFile.files
      );


  [
    "dragenter",
    "dragover"
  ].forEach(
    ev => {

      lessonUploadZone.addEventListener(
        ev,
        e => {

          e.preventDefault();

          lessonUploadZone
            .classList
            .add(
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
    ev => {

      lessonUploadZone.addEventListener(
        ev,
        e => {

          e.preventDefault();

          lessonUploadZone
            .classList
            .remove(
              "dragover"
            );

        }
      );

    }
  );


  lessonUploadZone.addEventListener(
    "drop",
    e =>
      importLessonFiles(
        e
          .dataTransfer
          .files
      )
  );

}


const lessonSearch =
  document.getElementById(
    "lessonSearch"
  );


if (lessonSearch) {

  lessonSearch.oninput =
    renderLessons;

}


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


  const r =
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

        .trim()

        ||

      "Giáo án",


    filename,

    html:
      r.value ||

      "<p>Không có nội dung.</p>"

  };

}


async function importLessonFiles(
  files
) {

  if (
    !files?.length
  ) {
    return;
  }


  const progress =
    document.getElementById(
      "lessonProgress"
    );


  try {

    for (
      const f of
      Array.from(files)
    ) {


      /* ZIP */

      if (
        /\.zip$/i.test(
          f.name
        )
      ) {

        if (
          !window.JSZip
        ) {

          throw new Error(
            "Thư viện ZIP chưa tải."
          );

        }


        const z =
          await window.JSZip
            .loadAsync(
              await f.arrayBuffer()
            );


        const items =
          Object
            .values(
              z.files
            )
            .filter(
              x =>
                !x.dir &&
                /\.docx$/i.test(
                  x.name
                )
            );


        if (
          !items.length
        ) {

          throw new Error(
            "ZIP không có file .docx."
          );

        }


        for (
          const item
          of items
        ) {

          if (progress) {

            progress.innerHTML =
              `
                <div class="progress">
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


      /* WORD */

      else if (
        /\.docx$/i.test(
          f.name
        )
      ) {

        if (progress) {

          progress.innerHTML =
            `
              <div class="progress">
                ⏳ Đang đọc:
                ${esc(f.name)}
              </div>
            `;

        }


        data.lessons.push(

          await docxToLesson(
            await f.arrayBuffer(),
            f.name
          )

        );


        saveLocal();

      }


      /* FILE KHÁC */

      else {

        alert(
          `Bỏ qua ${f.name} vì không phải .docx hoặc .zip.`
        );

      }

    }


    renderLessons();


    if (progress) {

      progress.innerHTML =
        `
          <div class="progress">
            ✅ Đã nhập giáo án thành công.
          </div>
        `;

    }

  } catch (error) {

    console.error(error);


    if (progress) {

      progress.innerHTML =
        `
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

    alert(
      error.message ||
      "Không thể đọc file."
    );

  } finally {

    if (lessonFile) {

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
      lessonSearch?.value ||
      ""
    )
      .toLowerCase();


  const a =
    data.lessons.filter(
      x =>
        x.title
          .toLowerCase()
          .includes(q)
    );


  if (!a.length) {

    list.innerHTML = `

      <div
        class="
          lesson-empty
        "
        style="
          padding:30px 15px
        "
      >

        <div
          style="
            font-size:40px
          "
        >
          📚
        </div>

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
    a
      .map(
        x => `

          <div
            class="
              lesson-item
            "
          >

            <div
              class="
                lesson-item-title
              "
            >
              📖
              ${esc(x.title)}
            </div>


            <div
              class="
                lesson-item-small
              "
            >
              ${esc(
                x.filename ||
                ""
              )}
            </div>


            <div
              class="
                actions
              "
              style="
                margin-top:7px
              "
            >

              <button
                class="primary"
                onclick="
                  viewLesson(
                    '${x.id}'
                  )
                "
              >
                📖 Mở
              </button>


              <button
                class="
                  secondary
                "
                onclick="
                  renameLesson(
                    '${x.id}'
                  )
                "
              >
                ✏️ Đổi tên
              </button>


              <button
                class="danger"
                onclick="
                  deleteLesson(
                    '${x.id}'
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

    const x =
      data.lessons.find(
        v =>
          v.id === id
      );


    if (!x) {
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
          class="
            lesson-close
          "
        >

          <h2
            style="
              margin:0
            "
          >
            📖
            ${esc(
              x.title
            )}
          </h2>


          <button
            class="danger"
            onclick="
              closeLesson()
            "
          >
            ✖ Đóng
          </button>

        </div>


        <div
          class="small"
          style="
            margin:
              8px 0 15px
          "
        >
          File:
          ${esc(
            x.filename ||
            ""
          )}
        </div>


        <hr>


        <div
          class="
            lesson-content
          "
        >
          ${
            x.html ||
            "<p>Không có nội dung.</p>"
          }
        </div>


        <div
          style="
            margin-top:22px
          "
        >

          <button
            class="danger"
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
          Hãy chọn một giáo án ở danh sách bên trái.
        </p>

      </div>

    `;

  };


window.renameLesson =
  id => {

    const x =
      data.lessons.find(
        v =>
          v.id === id
      );


    if (!x) {
      return;
    }


    const n =
      prompt(
        "Tên giáo án:",
        x.title
      );


    if (
      n === null ||
      !n.trim()
    ) {

      return;

    }


    x.title =
      n.trim();


    saveLocal();

    renderLessons();

    viewLesson(id);

  };


window.deleteLesson =
  id => {

    const x =
      data.lessons.find(
        v =>
          v.id === id
      );


    if (
      !x ||
      !confirm(
        `Xóa giáo án ${x.title}?`
      )
    ) {

      return;

    }


    data.lessons =
      data.lessons.filter(
        v =>
          v.id !== id
      );


    saveLocal();

    renderLessons();

    closeLesson();

  };


/* =========================================================
   ADMIN
========================================================= */

const refreshUsers =
  document.getElementById(
    "refreshUsers"
  );


if (refreshUsers) {

  refreshUsers.onclick =
    renderAdminUsers;

}


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
    "Đang tải...";


  try {

    const snap =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    const rows =
      snap.docs

        .map(
          d => ({

            id:
              d.id,

            ...d.data()

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
            )
            .localeCompare(
              String(
                b.email ||
                ""
              )
            )
        );


    box.innerHTML =
      rows.length

        ? rows

            .map(
              u => {

                const st =
                  u.status ||
                  "pending";


                return `

                  <div
                    class="
                      user-admin-card
                    "
                  >

                    <div>

                      <b>
                        ${esc(
                          u.name ||
                          "Chưa có tên"
                        )}
                      </b>

                    </div>


                    <div
                      class="small"
                    >
                      ${esc(
                        u.email ||
                        ""
                      )}
                    </div>


                    <div
                      style="
                        margin:8px 0
                      "
                    >

                      <span
                        class="
                          status
                          ${st}
                        "
                      >
                        ${esc(st)}
                      </span>


                      ${
                        u.role ===
                        "admin"

                          ? " 👑 admin"

                          : ""
                      }

                    </div>


                    <div
                      class="
                        actions
                      "
                    >

                      ${
                        st !==
                        "approved"

                          ? `

                            <button
                              class="
                                primary
                              "
                              onclick="
                                setUserStatus(
                                  '${u.id}',
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
                        st !==
                        "rejected"

                          ? `

                            <button
                              class="
                                danger
                              "
                              onclick="
                                setUserStatus(
                                  '${u.id}',
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
                        st !==
                        "disabled"

                          ? `

                            <button
                              class="
                                secondary
                              "
                              onclick="
                                setUserStatus(
                                  '${u.id}',
                                  'disabled'
                                )
                              "
                            >
                              🚫 Khóa
                            </button>

                          `

                          : `

                            <button
                              class="
                                primary
                              "
                              onclick="
                                setUserStatus(
                                  '${u.id}',
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

            .join("")


        : "<p>Chưa có tài khoản nào.</p>";


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


    if (
      !confirm(
        `Đặt trạng thái tài khoản thành ${status}?`
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

      console.error(error);

      alert(
        "Không cập nhật được tài khoản: " +
        error.message
      );

    }

  };


/* =========================================================
   GIAO DIỆN
========================================================= */

function applyTheme(
  theme
) {

  const x =
    {
      ...defaultTheme,
      ...theme
    };


  document.documentElement
    .style
    .setProperty(
      "--primary",
      x.primary
    );


  document.documentElement
    .style
    .setProperty(
      "--secondary",
      x.secondary
    );


  document.documentElement
    .style
    .setProperty(
      "--bg1",
      x.bg1
    );


  document.documentElement
    .style
    .setProperty(
      "--bg2",
      x.bg2
    );


  document.documentElement
    .style
    .setProperty(
      "--card",
      x.card
    );


  document.documentElement
    .style
    .setProperty(
      "--text",
      x.text
    );


  document.documentElement
    .style
    .setProperty(
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


  let s =
    document.getElementById(
      "customThemeStyle"
    );


  if (!s) {

    s =
      document.createElement(
        "style"
      );

    s.id =
      "customThemeStyle";

    document.head.appendChild(
      s
    );

  }


  s.textContent =
    x.customCss ||
    "";

}


/* =========================================================
   LOAD THEME
========================================================= */

async function loadTheme() {

  if (themeUnsub) {

    themeUnsub();

  }


  themeUnsub =
    onSnapshot(

      doc(
        db,
        "settings",
        "site"
      ),

      snap => {

        applyTheme(

          snap.exists()
            ? snap.data()
            : defaultTheme

        );

      },

      error => {

        console.error(
          "loadTheme:",
          error
        );

        applyTheme(
          defaultTheme
        );

      }

    );

}


/* =========================================================
   FORM THEME
========================================================= */

async function loadThemeForm() {

  try {

    const snap =
      await getDoc(
        doc(
          db,
          "settings",
          "site"
        )
      );


    const t =
      {

        ...defaultTheme,

        ...(

          snap.exists()
            ? snap.data()
            : {}

        )

      };


    const fields = {

      themeTitle:
        t.title,

      themeSubtitle:
        t.subtitle,

      themePrimary:
        t.primary,

      themeSecondary:
        t.secondary,

      themeBg1:
        t.bg1,

      themeBg2:
        t.bg2,

      themeCard:
        t.card,

      themeText:
        t.text,

      themeRadius:
        t.radius,

      themeCustomCss:
        t.customCss ||
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

        const el =
          document.getElementById(
            id
          );


        if (el) {

          el.value =
            value;

        }

      }
    );


    const radiusValue =
      document.getElementById(
        "themeRadiusValue"
      );


    if (radiusValue) {

      radiusValue.textContent =
        t.radius;

    }


    updatePreview(t);


  } catch (error) {

    console.error(
      "loadThemeForm:",
      error
    );

  }

}


/* =========================================================
   THEME OBJECT
========================================================= */

function formTheme() {

  const get =
    id =>
      document.getElementById(
        id
      )?.value;


  return {

    title:
      (
        get("themeTitle") ||
        defaultTheme.title
      ).trim(),


    subtitle:
      (
        get(
          "themeSubtitle"
        ) ||
        defaultTheme.subtitle
      ).trim(),


    primary:
      get("themePrimary") ||
      defaultTheme.primary,


    secondary:
      get("themeSecondary") ||
      defaultTheme.secondary,


    bg1:
      get("themeBg1") ||
      defaultTheme.bg1,


    bg2:
      get("themeBg2") ||
      defaultTheme.bg2,


    card:
      get("themeCard") ||
      defaultTheme.card,


    text:
      get("themeText") ||
      defaultTheme.text,


    radius:
      Number(
        get("themeRadius") ||
        defaultTheme.radius
      ),


    customCss:
      get(
        "themeCustomCss"
      ) || ""

  };

}


/* =========================================================
   PREVIEW
========================================================= */

function updatePreview(
  theme
) {

  const x =
    {
      ...defaultTheme,
      ...theme
    };


  const title =
    document.getElementById(
      "previewTitle"
    );


  const subtitle =
    document.getElementById(
      "previewSubtitle"
    );


  if (title) {

    title.textContent =
      x.title;

  }


  if (subtitle) {

    subtitle.textContent =
      x.subtitle;

  }

}


/* =========================================================
   LIVE THEME EDIT
========================================================= */

const themeRadius =
  document.getElementById(
    "themeRadius"
  );


if (themeRadius) {

  themeRadius.oninput =
    () => {

      const value =
        document.getElementById(
          "themeRadiusValue"
        );


      if (value) {

        value.textContent =
          themeRadius.value;

      }

    };

}


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

    const el =
      document.getElementById(
        id
      );


    if (el) {

      el.addEventListener(
        "input",
        () => {

          const t =
            formTheme();

          applyTheme(t);

          updatePreview(t);

        }
      );

    }

  }
);


/* =========================================================
   THEME BUTTONS
========================================================= */

const previewTheme =
  document.getElementById(
    "previewTheme"
  );


if (previewTheme) {

  previewTheme.onclick =
    () => {

      applyTheme(
        formTheme()
      );

    };

}


const saveTheme =
  document.getElementById(
    "saveTheme"
  );


if (saveTheme) {

  saveTheme.onclick =
    async () => {

      try {

        await setDoc(

          doc(
            db,
            "settings",
            "site"
          ),

          formTheme(),

          {
            merge:
              true
          }

        );


        alert(
          "✅ Đã lưu giao diện cho toàn bộ website."
        );


      } catch (error) {

        console.error(
          error
        );

        alert(
          "Không lưu được giao diện: " +
          error.message
        );

      }

    };

}


const resetTheme =
  document.getElementById(
    "resetTheme"
  );


if (resetTheme) {

  resetTheme.onclick =
    () => {

      if (
        !confirm(
          "Đưa giao diện về mặc định?"
        )
      ) {

        return;

      }


      applyTheme(
        defaultTheme
      );


      loadThemeForm();

    };

}


/* =========================================================
   THEME MẶC ĐỊNH
========================================================= */

applyTheme(
  defaultTheme
);


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      currentUser =
        null;

      isAdmin =
        false;


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
   LƯU + RENDER
========================================================= */

saveLocal();

renderAll();
