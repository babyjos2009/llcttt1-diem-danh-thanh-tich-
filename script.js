import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, getDocs, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig={apiKey: "AIzaSyAnpIzNv-YkA_v6WKCGw71bFqIWccHm1IE",authDomain:"llcttt1-diem-danh.firebaseapp.com",projectId:"llcttt1-diem-danh",storageBucket:"llcttt1-diem-danh.firebasestorage.app",messagingSenderId:"1028180173731",appId:"1:1028180173731:web:c649731f9ccc20acb13016",measurementId:"G-XDNC5S21BN"};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

const ADMIN_UID="vBmdB1U85uZ5lhZq026Rnqk4WZP2";
const LS="llcttt1_rebuild_v1";

const oldNames=[
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

let data=JSON.parse(localStorage.getItem(LS)||"null")||{
  members:[],
  sessions:[],
  current:-1,
  scores:{},
  memberInfo:{},
  lessons:[]
};

if(!Array.isArray(data.members))data.members=[];
if(!Array.isArray(data.sessions))data.sessions=[];
if(typeof data.current!=="number")data.current=-1;
if(!data.scores||typeof data.scores!=="object")data.scores={};
if(!data.memberInfo||typeof data.memberInfo!=="object")data.memberInfo={};
if(!Array.isArray(data.lessons))data.lessons=[];

if(
  data.members.length===oldNames.length &&
  oldNames.every((n,i)=>data.members[i]===n)
){
  data.members=[];
  data.sessions=[];
  data.memberInfo={};
  data.scores={};
  save();
}

function save(){
  localStorage.setItem(
    LS,
    JSON.stringify(data)
  );
}

function esc(v){
  return String(v).replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "\"":"&quot;",
      "'":"&#039;"
    }[m])
  );
}

function id(){
  return Date.now().toString(36)+Math.random().toString(36).slice(2);
}

function current(){
  return data.current>=0
    ?data.sessions[data.current]||null
    :null;
}

function info(n){
  return data.memberInfo[n]||(
    data.memberInfo[n]={
      dob:"",
      father:"",
      mother:"",
      phone:"",
      photo:""
    }
  );
}

function msg(t,k="notice"){
  const x=document.getElementById("authMessage");
  if(x)x.innerHTML=t
    ?`<div class="notice ${k}">${t}</div>`
    :"";
}

function pending(show){
  document
    .getElementById("authForms")
    ?.classList
    .toggle("hidden",show);

  document
    .getElementById("pendingBox")
    ?.classList
    .toggle("hidden",!show);
}

function mode(reg){
  document
    .getElementById("loginTab")
    ?.classList
    .toggle("active",!reg);

  document
    .getElementById("registerTab")
    ?.classList
    .toggle("active",reg);

  document
    .getElementById("loginForm")
    ?.classList
    .toggle("hidden",reg);

  document
    .getElementById("registerForm")
    ?.classList
    .toggle("hidden",!reg);

  msg("");
}

document
  .getElementById("loginTab")
  ?.addEventListener(
    "click",
    ()=>mode(false)
  );

document
  .getElementById("registerTab")
  ?.addEventListener(
    "click",
    ()=>mode(true)
  );

function authErr(e){
  const c=e?.code||"";

  if(c.includes("invalid-credential"))
    return"Email hoặc mật khẩu không đúng.";

  if(c.includes("email-already-in-use"))
    return"Email này đã được đăng ký.";

  if(c.includes("weak-password"))
    return"Mật khẩu phải có ít nhất 6 ký tự.";

  if(c.includes("unauthorized-domain"))
    return"Tên miền chưa được Firebase cho phép.";

  if(c.includes("permission-denied"))
    return"Firestore Rules đang chặn thao tác.";

  return e?.message||"Có lỗi xảy ra.";
}

document
  .getElementById("loginForm")
  ?.addEventListener(
    "submit",
    async e=>{
      e.preventDefault();

      msg("Đang đăng nhập...");

      try{
        await signInWithEmailAndPassword(
          auth,
          document
            .getElementById("loginEmail")
            .value
            .trim(),
          document
            .getElementById("loginPassword")
            .value
        );

        msg("");

      }catch(x){
        msg(
          authErr(x),
          "error"
        );
      }
    }
  );

document
  .getElementById("registerForm")
  ?.addEventListener(
    "submit",
    async e=>{
      e.preventDefault();

      const name=
        document
          .getElementById("registerName")
          .value
          .trim();

      const email=
        document
          .getElementById("registerEmail")
          .value
          .trim();

      const p=
        document
          .getElementById("registerPassword")
          .value;

      const p2=
        document
          .getElementById("registerPassword2")
          .value;

      if(!name)
        return msg(
          "Bạn chưa nhập họ tên.",
          "error"
        );

      if(p.length<6)
        return msg(
          "Mật khẩu phải có ít nhất 6 ký tự.",
          "error"
        );

      if(p!==p2)
        return msg(
          "Mật khẩu nhập lại không giống nhau.",
          "error"
        );

      msg("Đang tạo tài khoản...");

      try{
        const c=
          await createUserWithEmailAndPassword(
            auth,
            email,
            p
          );

        await setDoc(
          doc(
            db,
            "users",
            c.user.uid
          ),
          {
            name,
            email,
            status:"pending",
            role:"user",
            createdAt:serverTimestamp()
          },
          {
            merge:true
          }
        );

        pending(true);

        msg(
          "✅ Tài khoản đã tạo và đang chờ duyệt."
        );

      }catch(x){
        msg(
          authErr(x),
          "error"
        );
      }
    }
  );

let isAdmin=false;
let currentUser=null;
let userWatch=null;
let themeWatch=null;

async function profile(uid){
  const s=
    await getDoc(
      doc(
        db,
        "users",
        uid
      )
    );

  return s.exists()
    ?s.data()
    :null;
}

async function enter(){

  document
    .getElementById("authGate")
    ?.classList
    .add("hidden");

  document
    .getElementById("appRoot")
    ?.classList
    .remove("hidden");

  const userLabel=
    document.getElementById(
      "currentUser"
    );

  if(userLabel){
    userLabel.textContent=
      (isAdmin
        ?"👑 Admin • "
        :"👤 ")+
      (currentUser?.email||"");
  }

  document
    .getElementById("adminTab")
    ?.classList
    .toggle(
      "hidden",
      !isAdmin
    );

  document
    .getElementById("themeTab")
    ?.classList
    .toggle(
      "hidden",
      !isAdmin
    );

  loadTheme();
  renderAll();
}

async function access(u){

  currentUser=u;

  isAdmin=
    u.uid===ADMIN_UID;

  let p=
    await profile(
      u.uid
    );

  if(!isAdmin&&!p){

    await setDoc(
      doc(
        db,
        "users",
        u.uid
      ),
      {
        name:
          (u.email||"user")
            .split("@")[0],

        email:
          u.email||"",

        status:
          "pending",

        role:
          "user",

        createdAt:
          serverTimestamp()
      },
      {
        merge:true
      }
    );

    p=
      await profile(
        u.uid
      );
  }

  if(
    isAdmin ||
    p?.status==="approved"
  ){
    await enter();
    return;
  }

  pending(true);

  msg(
    p?.status==="rejected"
      ?"Tài khoản đã bị từ chối."
      :p?.status==="disabled"
      ?"Tài khoản đã bị khóa."
      :"Tài khoản đang chờ quản trị viên duyệt.",
    p?.status&&p.status!=="pending"
      ?"error"
      :"notice"
  );

  if(userWatch)
    userWatch();

  userWatch=
    onSnapshot(
      doc(
        db,
        "users",
        u.uid
      ),
      s=>{
        const d=s.data();

        if(
          d?.status==="approved"
        ){
          enter();
        }
      }
    );
}

onAuthStateChanged(
  auth,
  async u=>{

    if(!u){

      isAdmin=false;
      currentUser=null;

      if(userWatch)
        userWatch();

      document
        .getElementById("authGate")
        ?.classList
        .remove("hidden");

      document
        .getElementById("appRoot")
        ?.classList
        .add("hidden");

      pending(false);
      mode(false);

      return;
    }

    await access(u);
  }
);

document
  .getElementById("logoutBtn")
  ?.addEventListener(
    "click",
    ()=>signOut(auth)
  );

document
  .getElementById("logoutPending")
  ?.addEventListener(
    "click",
    ()=>signOut(auth)
  );

document
  .getElementById("checkApproval")
  ?.addEventListener(
    "click",
    ()=>auth.currentUser&&access(auth.currentUser)
  );

document
  .querySelectorAll(
    ".tabs button[data-tab]"
  )
  .forEach(
    b=>
      b.addEventListener(
        "click",
        ()=>showTab(
          b.dataset.tab
        )
      )
  );

function showTab(t){

  document
    .querySelectorAll(
      ".tabs button[data-tab]"
    )
    .forEach(
      b=>
        b.classList.toggle(
          "active",
          b.dataset.tab===t
        )
    );

  [
    "attendance",
    "stats",
    "members",
    "competition",
    "lessons",
    "admin",
    "theme"
  ]
  .forEach(
    id=>
      document
        .getElementById(id)
        ?.classList
        .toggle(
          "hidden",
          id!==t
        )
  );

  if(t==="admin")
    renderUsers();

  if(t==="theme")
    loadThemeForm();
}

function renderAll(){
  renderAttendance();
  renderStats();
  renderMembers();
  renderScores();
  renderLessons();
}

function renderAttendance(){

  const s=
    current();

  const list=
    document.getElementById(
      "attendanceList"
    );

  if(!list)
    return;

  document
    .getElementById("countTotal")
    .textContent=
    data.members.length;

  if(!s){

    document
      .getElementById("sessionTitle")
      .textContent=
      "Chưa có buổi học";

    document
      .getElementById("sessionDate")
      .textContent=
      "Hãy tạo buổi học để bắt đầu.";

    document
      .getElementById("countPresent")
      .textContent=
      0;

    document
      .getElementById("countAbsent")
      .textContent=
      data.members.length;

    list.innerHTML=
      `<div class="empty">📅<h3>Chưa có buổi học</h3></div>`;

    return;
  }

  document
    .getElementById("sessionTitle")
    .textContent=
    s.name;

  document
    .getElementById("sessionDate")
    .textContent=
    new Date(
      s.date
    ).toLocaleDateString(
      "vi-VN"
    );

  const q=
    (
      document
        .getElementById("memberSearch")
        .value||""
    )
    .toLowerCase();

  list.innerHTML=
    data.members
      .map(
        (n,i)=>({
          n,
          i
        })
      )
      .filter(
        x=>
          x.n
            .toLowerCase()
            .includes(q)
      )
      .map(
        x=>`
          <div class="row">

            <b>
              ${x.i+1}.
              ${esc(x.n)}
            </b>

            <button
              class="
                badge
                ${
                  s.attendance[x.i]
                    ?"present"
                    :"absent"
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
                  ?"✓ Có mặt"
                  :"✕ Vắng"
              }
            </button>

          </div>
        `
      )
      .join("")||
      "<div class='empty'>Không có kết quả.</div>";

  const p=
    s.attendance
      .filter(Boolean)
      .length;

  document
    .getElementById("countPresent")
    .textContent=
    p;

  document
    .getElementById("countAbsent")
    .textContent=
    data.members.length-p;
}

window.toggleAttendance=
i=>{
  const s=current();

  if(!s)
    return;

  s.attendance[i]=
    !s.attendance[i];

  save();
  renderAll();
};

document
  .getElementById("memberSearch")
  ?.addEventListener(
    "input",
    renderAttendance
  );

document
  .getElementById("newSession")
  ?.addEventListener(
    "click",
    ()=>{
      const name=
        prompt(
          "Tên buổi học:",
          `Buổi ${data.sessions.length+1}`
        );

      if(!name?.trim())
        return;

      const ds=
        prompt(
          "Ngày DD/MM/YYYY:",
          new Date().toLocaleDateString(
            "vi-VN"
          )
        );

      if(ds===null)
        return;

      const a=
        ds
          .split(/[\/\-.]/)
          .map(Number);

      if(a.length!==3){
        alert(
          "Ngày không hợp lệ"
        );
        return;
      }

      const d=
        new Date(
          a[2],
          a[1]-1,
          a[0]
        );

      if(
        Number.isNaN(
          d.getTime()
        )
      ){
        alert(
          "Ngày không hợp lệ"
        );
        return;
      }

      data.sessions.push({
        name:
          name.trim(),

        date:
          d.toISOString(),

        attendance:
          Array(
            data.members.length
          ).fill(false)
      });

      data.current=
        data.sessions.length-1;

      save();
      renderAll();
    }
  );

function renderStats(){

  document
    .getElementById("statSessions")
    .textContent=
    data.sessions.length;

  document
    .getElementById("statMembers")
    .textContent=
    data.members.length;

  let p=0;
  let t=0;

  const box=
    document.getElementById(
      "sessionList"
    );

  data.sessions.forEach(
    s=>{
      const a=s.attendance||[];
      const pc=
        a.filter(Boolean).length;

      p+=pc;
      t+=a.length;
    }
  );

  document
    .getElementById("statAverage")
    .textContent=
    t
      ?Math.round(
        p/t*100
      )+"%"
      :"0%";

  box.innerHTML=
    data.sessions
      .map(
        (s,i)=>{

          const a=
            s.attendance||[];

          const pc=
            a.filter(Boolean)
              .length;

          const pct=
            a.length
              ?Math.round(
                pc/a.length*100
              )
              :0;

          return `
            <div class="session">

              <b>
                ${esc(s.name)}
              </b>

              <div class="small">
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
                ${pc}/${a.length}
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
                    openSession(
                      ${i}
                    )
                  "
                >
                  Mở
                </button>

                <button
                  class="btn red"
                  onclick="
                    deleteSession(
                      ${i}
                    )
                  "
                >
                  Xóa
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");
}

window.openSession=
i=>{
  data.current=i;
  save();
  showTab(
    "attendance"
  );
};

window.deleteSession=
i=>{
  if(
    !confirm(
      "Xóa buổi học?"
    )
  )
    return;

  data.sessions.splice(
    i,
    1
  );

  data.current=
    data.sessions.length
      ?Math.min(
        i,
        data.sessions.length-1
      )
      :-1;

  save();
  renderAll();
};

document
  .getElementById("addMember")
  ?.addEventListener(
    "click",
    ()=>{
      const input=
        document.getElementById(
          "newMember"
        );

      const n=
        input.value.trim();

      if(!n)
        return alert(
          "Nhập tên trước."
        );

      if(
        data.members.some(
          x=>
            x.toLowerCase()===
            n.toLowerCase()
        )
      )
        return alert(
          "Tên đã có."
        );

      data.members.push(
        n
      );

      data.sessions.forEach(
        s=>
          s.attendance.push(
            false
          )
      );

      info(n);

      input.value="";

      save();
      renderAll();
    }
  );

function renderMembers(){

  const box=
    document.getElementById(
      "memberList"
    );

  if(!data.members.length){

    box.innerHTML=
      `
        <div class="empty">
          👥
          <h3>
            Chưa có thành viên
          </h3>
          <p>
            Nhập tên ở phía trên để thêm.
          </p>
        </div>
      `;

    return;
  }

  box.innerHTML=
    data.members
      .map(
        (n,i)=>{
          const x=
            info(n);

          return `
            <div
              class="member"
            >

              ${
                x.photo
                  ?`
                    <img
                      class="avatar"
                      src="${x.photo}"
                    >
                  `
                  :`
                    <div
                      class="avatar"
                    >
                      👤
                    </div>
                  `
              }

              <div
                class="member-main"
              >

                <b>
                  ${i+1}.
                  ${esc(n)}
                </b>

                <div
                  class="small"
                >
                  🎂
                  ${esc(
                    x.dob||
                    "Chưa có"
                  )}
                  ·
                  📞
                  ${esc(
                    x.phone||
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
                      editInfo(
                        ${i}
                      )
                    "
                  >
                    📝 Thông tin
                  </button>

                  <button
                    class="btn gray"
                    onclick="
                      pickMemberPhoto(
                        ${i}
                      )
                    "
                  >
                    🖼️ Ảnh
                  </button>

                  <button
                    class="btn gray"
                    onclick="
                      renameMember(
                        ${i}
                      )
                    "
                  >
                    ✏️ Đổi tên
                  </button>

                  <button
                    class="btn red"
                    onclick="
                      deleteMember(
                        ${i}
                      )
                    "
                  >
                    🗑️ Xóa
                  </button>

                </div>

              </div>

            </div>
          `;
        }
      )
      .join("");
}

window.renameMember=
i=>{
  const old=
    data.members[i];

  const n=
    prompt(
      "Đổi tên:",
      old
    );

  if(!n?.trim())
    return;

  data.members[i]=
    n.trim();

  if(
    data.memberInfo[old]
  ){
    data.memberInfo[
      n.trim()
    ]=
      data.memberInfo[
        old
      ];

    delete data.memberInfo[
      old
    ];
  }

  save();
  renderAll();
};

window.deleteMember=
i=>{
  if(
    !confirm(
      "Xóa thành viên này?"
    )
  )
    return;

  const n=
    data.members[i];

  data.members.splice(
    i,
    1
  );

  data.sessions.forEach(
    s=>
      s.attendance.splice(
        i,
        1
      )
  );

  delete data.memberInfo[n];

  save();
  renderAll();
};

window.editInfo=
i=>{
  const n=
    data.members[i];

  const x=
    info(n);

  const dob=
    prompt(
      "Ngày sinh",
      x.dob
    );

  if(dob===null)
    return;

  const father=
    prompt(
      "Tên bố",
      x.father
    );

  if(father===null)
    return;

  const mother=
    prompt(
      "Tên mẹ",
      x.mother
    );

  if(mother===null)
    return;

  const phone=
    prompt(
      "SĐT phụ huynh",
      x.phone
    );

  if(phone===null)
    return;

  Object.assign(
    x,
    {
      dob,
      father,
      mother,
      phone
    }
  );

  save();
  renderMembers();
};

window.pickMemberPhoto=
i=>{
  const inp=
    document.createElement(
      "input"
    );

  inp.type=
    "file";

  inp.accept=
    "image/*";

  inp.onchange=()=>{
    const f=
      inp.files?.[0];

    if(!f)
      return;

    compress(
      f,
      240,
      .82,
      src=>{
        info(
          data.members[i]
        ).photo=
          src;

        save();
        renderMembers();
      }
    );
  };

  inp.click();
};

let month=
  new Date()
    .toISOString()
    .slice(
      0,
      7
    );

function scoreMap(){

  if(
    !data.scores[month]
  )
    data.scores[month]={};

  data.members.forEach(
    n=>{
      if(
        typeof
        data.scores[month][n]!=="number"
      )
        data.scores[month][n]=0;
    }
  );

  return data.scores[month];
}

document
  .getElementById("prevMonth")
  ?.addEventListener(
    "click",
    ()=>{
      const [
        y,
        m
      ]=
        month
          .split("-")
          .map(Number);

      month=
        new Date(
          y,
          m-2,
          1
        )
        .toISOString()
        .slice(
          0,
          7
        );

      renderScores();
    }
  );

document
  .getElementById("nextMonth")
  ?.addEventListener(
    "click",
    ()=>{
      const [
        y,
        m
      ]=
        month
          .split("-")
          .map(Number);

      month=
        new Date(
          y,
          m,
          1
        )
        .toISOString()
        .slice(
          0,
          7
        );

      renderScores();
    }
  );

document
  .getElementById("resetScores")
  ?.addEventListener(
    "click",
    ()=>{
      if(
        confirm(
          "Đặt lại điểm tháng này?"
        )
      ){
        const s=
          scoreMap();

        data.members.forEach(
          n=>
            s[n]=0
        );

        save();
        renderScores();
      }
    }
  );

window.adjustScore=
(i,a)=>{
  const n=
    data.members[i];

  const s=
    scoreMap();

  s[n]=
    Math.max(
      0,
      (s[n]||0)+a
    );

  save();
  renderScores();
};

function renderScores(){

  const s=
    scoreMap();

  const arr=
    data.members
      .map(
        (n,i)=>({
          n,
          i,
          v:s[n]||0
        })
      )
      .sort(
        (a,b)=>
          b.v-a.v||
          a.n.localeCompare(
            b.n,
            "vi"
          )
      );

  document
    .getElementById(
      "monthTitle"
    )
    .textContent=
    `THÁNG ${month.slice(5)}/${month.slice(0,4)}`;

  const max=
    Math.max(
      10,
      ...arr.map(
        x=>x.v
      )
    );

  document
    .getElementById(
      "competitionList"
    )
    .innerHTML=
    arr.length
      ?arr
        .map(
          (x,k)=>`
            <div
              class="rank"
            >

              <div
                class="rank-head"
              >

                <b>
                  ${
                    k<3
                      ?[
                        "🥇",
                        "🥈",
                        "🥉"
                      ][k]
                      :"#"+(k+1)
                  }
                  ${esc(x.n)}
                </b>

                <b>
                  ${x.v}
                  điểm
                </b>

              </div>

              <div
                class="rankbar"
              >

                <div
                  class="rankfill"
                  style="
                    width:${Math.min(
                      100,
                      x.v/max*100
                    )}%
                  "
                ></div>

              </div>

              <div
                class="actions"
              >

                <button
                  class="btn red"
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
                  class="btn red"
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
                  class="btn"
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
                  class="btn"
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
        .join("")
      :"<div class='empty'>Chưa có thành viên.</div>";
}

function compress(
  file,
  max,
  q,
  cb
){
  const fr=
    new FileReader();

  fr.onload=()=>{
    const img=
      new Image();

    img.onload=()=>{
      const scale=
        Math.min(
          1,
          max/
          Math.max(
            img.width,
            img.height
          )
        );

      const c=
        document.createElement(
          "canvas"
        );

      c.width=
        Math.max(
          1,
          Math.round(
            img.width*
            scale
          )
        );

      c.height=
        Math.max(
          1,
          Math.round(
            img.height*
            scale
          )
        );

      c.getContext(
        "2d"
      ).drawImage(
        img,
        0,
        0,
        c.width,
        c.height
      );

      cb(
        c.toDataURL(
          "image/jpeg",
          q
        )
      );
    };

    img.src=
      fr.result;
  };

  fr.readAsDataURL(
    file
  );
}

const lessonInput=
  document.getElementById(
    "lessonInput"
  );

document
  .getElementById(
    "chooseLesson"
  )
  ?.addEventListener(
    "click",
    ()=>lessonInput.click()
  );

lessonInput?.addEventListener(
  "change",
  ()=>importLessons(
    lessonInput.files
  )
);

document
  .getElementById(
    "lessonUpload"
  )
  ?.addEventListener(
    "dragover",
    e=>{
      e.preventDefault();

      e.currentTarget.classList.add(
        "drag"
      );
    }
  );

document
  .getElementById(
    "lessonUpload"
  )
  ?.addEventListener(
    "dragleave",
    e=>
      e.currentTarget.classList.remove(
        "drag"
      )
  );

document
  .getElementById(
    "lessonUpload"
  )
  ?.addEventListener(
    "drop",
    e=>{
      e.preventDefault();

      e.currentTarget.classList.remove(
        "drag"
      );

      importLessons(
        e.dataTransfer.files
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

async function convertDocx(
  buf,
  name
){
  if(!window.mammoth)
    throw new Error(
      "Mammoth chưa tải"
    );

  const r=
    await window.mammoth
      .convertToHtml(
        {
          arrayBuffer:
            buf
        },
        {
          convertImage:
            window
              .mammoth
              .images
              .imgElement(
                img=>
                  img
                    .read("base64")
                    .then(
                      b=>({
                        src:
                          `data:${img.contentType};base64,${b}`
                      })
                    )
              )
        }
      );

  return{
    id:id(),
    title:
      name
        .replace(
          /\.docx$/i,
          ""
        )
        .replace(
          /[_-]+/g,
          " "
        )
        .trim()||
      "Giáo án",
    file:name,
    html:r.value
  };
}

async function importLessons(
  files
){
  for(
    const f of
    Array.from(
      files||[]
    )
  ){

    if(
      /\.docx$/i.test(
        f.name
      )
    ){

      data.lessons.push(
        await convertDocx(
          await f.arrayBuffer(),
          f.name
        )
      );

    }else if(
      /\.zip$/i.test(
        f.name
      )
    ){

      const z=
        await JSZip.loadAsync(
          await f.arrayBuffer()
        );

      for(
        const it of
        Object.values(
          z.files
        ).filter(
          x=>
            !x.dir&&
            /\.docx$/i.test(
              x.name
            )
        )
      ){

        const name=
          it.name
            .split("/")
            .pop();

        data.lessons.push(
          await convertDocx(
            await it.async(
              "arraybuffer"
            ),
            name
          )
        );
      }

    }else{

      alert(
        `Bỏ qua ${f.name}`
      );
    }
  }

  save();
  renderLessons();

  document
    .getElementById(
      "lessonStatus"
    )
    .innerHTML=
    "<div class='notice'>✅ Đã nhập giáo án.</div>";

  lessonInput.value="";
}

function renderLessons(){

  const q=
    (
      document
        .getElementById(
          "lessonSearch"
        )
        .value||
      ""
    )
      .toLowerCase();

  const items=
    data.lessons.filter(
      x=>
        x.title
          .toLowerCase()
          .includes(q)
    );

  document
    .getElementById(
      "lessonList"
    )
    .innerHTML=
    items.length

      ?items
        .map(
          x=>`
            <div
              class="lesson-item"
            >

              <b>
                📖
                ${esc(x.title)}
              </b>

              <div
                class="small"
              >
                ${esc(
                  x.file||
                  ""
                )}
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
                    openLesson(
                      '${x.id}'
                    )
                  "
                >
                  Mở
                </button>

                <button
                  class="btn gray"
                  onclick="
                    renameLesson(
                      '${x.id}'
                    )
                  "
                >
                  Đổi tên
                </button>

                <button
                  class="btn red"
                  onclick="
                    deleteLesson(
                      '${x.id}'
                    )
                  "
                >
                  Xóa
                </button>

              </div>

            </div>
          `
        )
        .join("")

      :"<div class='empty'>Chưa có giáo án.</div>";
}

window.openLesson=
i=>{
  const x=
    data.lessons.find(
      v=>v.id===i
    );

  if(x)
    document
      .getElementById(
        "lessonView"
      )
      .innerHTML=
      `
        <h2>
          ${esc(x.title)}
        </h2>

        <div
          class="small"
        >
          ${esc(x.file||"")}
        </div>

        <hr>

        <div>
          ${x.html}
        </div>
      `;
};

window.renameLesson=
i=>{
  const x=
    data.lessons.find(
      v=>v.id===i
    );

  if(!x)
    return;

  const n=
    prompt(
      "Tên giáo án",
      x.title
    );

  if(n?.trim()){
    x.title=
      n.trim();

    save();
    renderLessons();
  }
};

window.deleteLesson=
i=>{
  if(
    !confirm(
      "Xóa giáo án?"
    )
  )
    return;

  data.lessons=
    data.lessons.filter(
      v=>v.id!==i
    );

  save();
  renderLessons();

  document
    .getElementById(
      "lessonView"
    )
    .innerHTML=
    "<div class='empty'>Chưa chọn giáo án.</div>";
};

async function renderUsers(){

  if(!isAdmin)
    return;

  const box=
    document.getElementById(
      "userList"
    );

  box.innerHTML=
    "Đang tải...";

  try{

    const snap=
      await getDocs(
        collection(
          db,
          "users"
        )
      );

    box.innerHTML=
      snap.docs.length

        ?snap.docs
          .map(
            d=>{
              const u=d.data();
              const st=
                u.status||
                "pending";

              return `
                <div
                  class="user"
                >

                  <b>
                    ${esc(
                      u.name||
                      "Chưa có tên"
                    )}
                  </b>

                  <div
                    class="small"
                  >
                    ${esc(
                      u.email||
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

                  </div>

                  <div
                    class="actions"
                  >

                    ${
                      st!=="approved"
                        ?`
                          <button
                            class="btn"
                            onclick="
                              setStatus(
                                '${d.id}',
                                'approved'
                              )
                            "
                          >
                            ✅ Duyệt
                          </button>
                        `
                        :""
                    }

                    ${
                      st!=="rejected"
                        ?`
                          <button
                            class="btn red"
                            onclick="
                              setStatus(
                                '${d.id}',
                                'rejected'
                              )
                            "
                          >
                            ❌ Từ chối
                          </button>
                        `
                        :""
                    }

                    ${
                      st!=="disabled"
                        ?`
                          <button
                            class="btn gray"
                            onclick="
                              setStatus(
                                '${d.id}',
                                'disabled'
                              )
                            "
                          >
                            🚫 Khóa
                          </button>
                        `
                        :`
                          <button
                            class="btn"
                            onclick="
                              setStatus(
                                '${d.id}',
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

        :"<div class='empty'>Chưa có tài khoản.</div>";

  }catch(e){

    box.innerHTML=
      `
        <div
          class="
            notice
            error
          "
        >
          ${esc(
            e.message
          )}
        </div>
      `;
  }
}

window.setStatus=
async(
  uid,
  status
)=>{
  try{

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

    renderUsers();

  }catch(e){

    alert(
      "Không cập nhật được: "+
      e.message
    );
  }
};

document
  .getElementById(
    "refreshUsers"
  )
  ?.addEventListener(
    "click",
    renderUsers
  );

const themeDefault={
  title:
    "✝ LỚN LÊN TRONG CHÚA THÁNH THẦN 1",

  subtitle:
    "“Xin Chúa Thánh Thần hướng dẫn chúng con”",

  bgImage:"",
  bannerImage:"",
  logoImage:"",
  css:""
};

function applyTheme(t){

  const x=
    {
      ...themeDefault,
      ...t
    };

  document
    .getElementById(
      "siteTitle"
    )
    .textContent=
    x.title;

  document
    .getElementById(
      "siteSubtitle"
    )
    .textContent=
    x.subtitle;

  document
    .getElementById(
      "previewTitle"
    )
    .textContent=
    x.title;

  document
    .getElementById(
      "previewSubtitle"
    )
    .textContent=
    x.subtitle;

  if(x.bgImage)
    document.body.style.background=
      `url(${x.bgImage}) center/cover fixed`;

  else
    document.body.style.background=
      "linear-gradient(135deg,var(--bg),#eef4ff)";

  document
    .documentElement
    ?.style
    ?.setProperty(
      "--banner",
      x.bannerImage
        ?`url(${x.bannerImage})`
        :"none"
    );

  const logo=
    document.getElementById(
      "siteLogo"
    );

  const prev=
    document.getElementById(
      "previewLogo"
    );

  if(x.logoImage){

    logo.src=
      x.logoImage;

    logo.classList.add(
      "has"
    );

    prev.src=
      x.logoImage;

    prev.classList.remove(
      "hidden"
    );

  }else{

    logo.classList.remove(
      "has"
    );

    prev.classList.add(
      "hidden"
    );
  }

  let st=
    document.getElementById(
      "themeCustom"
    );

  if(!st){

    st=
      document.createElement(
        "style"
      );

    st.id=
      "themeCustom";

    document.head.appendChild(
      st
    );
  }

  st.textContent=
    x.css||"";
}

async function loadTheme(){

  if(themeWatch)
    themeWatch();

  themeWatch=
    onSnapshot(
      doc(
        db,
        "settings",
        "theme"
      ),
      s=>
        applyTheme(
          s.exists()
            ?s.data()
            :themeDefault
        )
    );
}

async function loadThemeForm(){

  const s=
    await getDoc(
      doc(
        db,
        "settings",
        "theme"
      )
    );

  const t=
    s.exists()
      ?{
          ...themeDefault,
          ...s.data()
        }
      :themeDefault;

  document
    .getElementById(
      "themeTitle"
    )
    .value=
    t.title;

  document
    .getElementById(
      "themeSubtitle"
    )
    .value=
    t.subtitle;

  document
    .getElementById(
      "themeCss"
    )
    .value=
    t.css||"";
}

async function readImage(
  file,
  max=900,
  q=.68
){

  return new Promise(
    (res,rej)=>{

      if(!file)
        return res("");

      const fr=
        new FileReader();

      fr.onload=()=>{

        const img=
          new Image();

        img.onload=()=>{

          const sc=
            Math.min(
              1,
              max/
              Math.max(
                img.width,
                img.height
              )
            );

          const c=
            document.createElement(
              "canvas"
            );

          c.width=
            Math.max(
              1,
              Math.round(
                img.width*sc
              )
            );

          c.height=
            Math.max(
              1,
              Math.round(
                img.height*sc
              )
            );

          c
            .getContext("2d")
            .drawImage(
              img,
              0,
              0,
              c.width,
              c.height
            );

          res(
            c.toDataURL(
              "image/jpeg",
              q
            )
          );
        };

        img.onerror=
          rej;

        img.src=
          fr.result;
      };

      fr.onerror=
        rej;

      fr.readAsDataURL(
        file
      );
    }
  );
}

document
  .getElementById(
    "saveTheme"
  )
  ?.addEventListener(
    "click",
    async()=>{
      try{

        const cur=
          (
            await getDoc(
              doc(
                db,
                "settings",
                "theme"
              )
            )
          ).data()||{};

        const bg=
          document
            .getElementById(
              "bgImage"
            )
            .files[0];

        const banner=
          document
            .getElementById(
              "bannerImage"
            )
            .files[0];

        const logo=
          document
            .getElementById(
              "logoImage"
            )
            .files[0];

        const next={
          title:
            document
              .getElementById(
                "themeTitle"
              )
              .value
              .trim()||
            themeDefault.title,

          subtitle:
            document
              .getElementById(
                "themeSubtitle"
              )
              .value
              .trim()||
            themeDefault.subtitle,

          bgImage:
            bg
              ?await readImage(
                bg,
                900,
                .62
              )
              :(cur.bgImage||""),

          bannerImage:
            banner
              ?await readImage(
                banner,
                1000,
                .62
              )
              :(cur.bannerImage||""),

          logoImage:
            logo
              ?await readImage(
                logo,
                500,
                .72
              )
              :(cur.logoImage||""),

          css:
            document
              .getElementById(
                "themeCss"
              )
              .value||""
        };

        await setDoc(
          doc(
            db,
            "settings",
            "theme"
          ),
          next,
          {
            merge:true
          }
        );

        applyTheme(next);

        alert(
          "✅ Đã lưu giao diện."
        );

      }catch(e){

        alert(
          "Không lưu được: "+
          e.message
        );
      }
    }
  );

document
  .getElementById(
    "resetTheme"
  )
  ?.addEventListener(
    "click",
    async()=>{
      if(
        !confirm(
          "Đặt giao diện về mặc định?"
        )
      )
        return;

      await setDoc(
        doc(
          db,
          "settings",
          "theme"
        ),
        themeDefault,
        {
          merge:true
        }
      );

      applyTheme(
        themeDefault
      );

      loadThemeForm();
    }
  );

applyTheme(
  themeDefault
);

save();
renderAll();
