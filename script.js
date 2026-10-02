const defaultNames=["Nguyễn Văn An","Trần Văn Bình","Lê Minh Châu","Phạm Đức Duy","Hoàng Gia Huy","Nguyễn Thị Lan","Vũ Minh Long","Đỗ Quang Nam","Trần Thông"];

const key="llcttt1_attendance_v5";

let data=JSON.parse(localStorage.getItem(key)||"null")||{
  members:[...defaultNames],
  sessions:[],
  current:-1,
  competition:{},
  memberInfo:{},
  lessons:[]
};

if(!Array.isArray(data.members))
  data.members=[...defaultNames];

if(!Array.isArray(data.sessions))
  data.sessions=[];

if(typeof data.current!=="number")
  data.current=-1;

if(!data.competition||typeof data.competition!=="object")
  data.competition={};

if(!data.memberInfo||typeof data.memberInfo!=="object")
  data.memberInfo={};

if(!Array.isArray(data.lessons))
  data.lessons=[];


/* =========================
   LƯU DỮ LIỆU
========================= */

function save(){
  try{
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );
  }catch(e){
    alert(
      "Không thể lưu dữ liệu. Bộ nhớ trình duyệt có thể đã đầy."
    );
  }
}


/* =========================
   HỖ TRỢ
========================= */

function esc(v){
  return String(v).replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );
}

function uid(){
  return (
    Date.now().toString(36)+
    Math.random().toString(36).slice(2)
  );
}

function memberInfo(name){

  const x=
    data.memberInfo[name]||{};

  if(typeof x.dob!=="string")
    x.dob="";

  if(typeof x.father!=="string")
    x.father="";

  if(typeof x.mother!=="string")
    x.mother="";

  if(typeof x.phone!=="string")
    x.phone="";

  if(typeof x.photo!=="string")
    x.photo="";

  data.memberInfo[name]=x;

  return x;
}

data.members.forEach(memberInfo);


/* =========================
   THANH THI ĐUA
========================= */

let competitionMonth=
  new Date().toISOString().slice(0,7);


/* =========================
   ĐIỂM DANH
========================= */

function currentSession(){
  return data.sessions[data.current]||null;
}


function renderAttendance(){

  const s=currentSession();

  const title=
    document.getElementById(
      "sessionTitle"
    );

  const date=
    document.getElementById(
      "sessionDate"
    );

  const list=
    document.getElementById(
      "list"
    );

  if(!title||!date||!list)
    return;


  document.getElementById("total")
    .textContent=
    data.members.length;


  if(!s){

    title.textContent=
      "Chưa có buổi học";

    date.textContent=
      "Hãy bấm “＋ Tạo buổi học” để bắt đầu.";

    document.getElementById("present")
      .textContent=0;

    document.getElementById("absent")
      .textContent=
      data.members.length;

    list.innerHTML=`
      <div
        style="
          text-align:center;
          padding:25px 10px
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


  title.textContent=
    s.label||"Buổi học";

  date.textContent=
    new Date(
      s.date
    ).toLocaleDateString(
      "vi-VN"
    );


  const q=
    (
      document.getElementById(
        "search"
      )?.value||""
    ).toLowerCase();


  const shown=
    data.members
      .map(
        (name,index)=>({
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


  list.innerHTML=
    shown.length
      ? shown.map(
          x=>`
            <div class="row">

              <span
                class="member-name"
              >
                ${x.index+1}.
                ${esc(x.name)}
              </span>

              <button
                class="badge ${
                  s.attendance[x.index]
                    ?"present"
                    :"absent"
                }"
                onclick="toggle(${x.index})"
              >
                ${
                  s.attendance[x.index]
                    ?"✓ Có mặt"
                    :"✕ Vắng"
                }
              </button>

            </div>
          `
        ).join("")
      :
        "<p>Không tìm thấy thành viên.</p>";


  const p=
    s.attendance
      .filter(Boolean)
      .length;


  document.getElementById("present")
    .textContent=p;

  document.getElementById("absent")
    .textContent=
    data.members.length-p;
}


function createSession(){

  const label=
    prompt(
      "Nhập tên buổi học:",
      `Buổi học ${data.sessions.length+1}`
    );

  if(label===null)
    return;


  const name=
    label.trim();


  if(!name)
    return alert(
      "Tên buổi học không được để trống."
    );


  const raw=
    prompt(
      "Nhập ngày học theo dạng DD/MM/YYYY:",
      new Date()
        .toLocaleDateString("vi-VN")
    );


  if(raw===null)
    return;


  const a=
    raw
      .trim()
      .split(/[\/\-.]/);


  if(a.length!==3)
    return alert(
      "Vui lòng nhập ngày theo dạng DD/MM/YYYY."
    );


  const d=+a[0];
  const m=+a[1];
  const y=+a[2];


  const dt=
    new Date(
      y,
      m-1,
      d
    );


  if(
    Number.isNaN(
      dt.getTime()
    )||
    dt.getDate()!==d||
    dt.getMonth()!==m-1||
    dt.getFullYear()!==y
  ){

    return alert(
      "Ngày học không hợp lệ."
    );
  }


  data.sessions.push({

    date:
      dt.toISOString(),

    label:
      name,

    attendance:
      Array(
        data.members.length
      ).fill(false)

  });


  data.current=
    data.sessions.length-1;


  save();

  render();
}


function toggle(i){

  const s=
    currentSession();


  if(!s)
    return alert(
      "Bạn hãy tạo buổi học trước."
    );


  s.attendance[i]=
    !s.attendance[i];


  save();

  render();
}


/* =========================
   THỐNG KÊ
========================= */

function renderSessions(){

  const box=
    document.getElementById(
      "sessionList"
    );

  if(!box)
    return;


  document.getElementById(
    "sessionCount"
  ).textContent=
    data.sessions.length;


  document.getElementById(
    "memberCount"
  ).textContent=
    data.members.length;


  if(!data.sessions.length){

    box.innerHTML=
      '<p class="small">Chưa có buổi học nào.</p>';

    document.getElementById(
      "average"
    ).textContent="0%";

    return;
  }


  let tp=0;
  let tc=0;


  box.innerHTML=
    data.sessions.map(
      (s,i)=>{

        const att=
          Array.isArray(
            s.attendance
          )
            ?s.attendance
            :[];


        const p=
          att.filter(Boolean)
            .length;


        const n=
          att.length;


        const pct=
          n
            ?Math.round(
                p/n*100
              )
            :0;


        tp+=p;
        tc+=n;


        return `
          <div class="session">

            <b>
              ${esc(
                s.label||
                "Buổi học"
              )}
            </b>

            <div>
              ${new Date(
                s.date
              ).toLocaleDateString(
                "vi-VN"
              )}
            </div>

            <div>
              ${p}/${n}
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
      }
    ).join("");


  document.getElementById(
    "average"
  ).textContent=
    tc
      ?Math.round(
        tp/tc*100
      )+"%"
      :"0%";
}


function selectSession(i){

  data.current=i;

  save();

  showTab(
    "attendance"
  );
}


function deleteSession(i){

  const s=
    data.sessions[i];


  if(!s)
    return;


  if(!confirm(
    `Bạn có chắc muốn xóa "${s.label}" không?\n\nDữ liệu điểm danh của buổi này cũng sẽ bị xóa.`
  ))
    return;


  data.sessions.splice(
    i,
    1
  );


  if(!data.sessions.length){

    data.current=-1;

  }else if(
    data.current===i
  ){

    data.current=
      Math.min(
        i,
        data.sessions.length-1
      );

  }else if(
    data.current>i
  ){

    data.current--;
  }


  save();

  render();
}


/* =========================
   TAB
========================= */

function showTab(tab){

  document
    .querySelectorAll(
      ".tabs button"
    )
    .forEach(
      b =>
        b.classList.toggle(
          "active",
          b.dataset.tab===tab
        )
    );


  [
    "attendance",
    "sessions",
    "members",
    "competition",
    "lessons"
  ].forEach(
    id=>{

      const el=
        document.getElementById(
          id
        );

      if(el)
        el.style.display=
          id===tab
            ?"block"
            :"none";

    }
  );


  render();
}


document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(
    b =>
      b.onclick=
        ()=>showTab(
          b.dataset.tab
        )
  );


/* =========================
   THÀNH VIÊN
========================= */

function renderMembers(){

  const box=
    document.getElementById(
      "memberList"
    );


  if(!box)
    return;


  if(!data.members.length){

    box.innerHTML=
      "<p>Chưa có thành viên.</p>";

    return;
  }


  box.innerHTML=
    data.members.map(
      (name,i)=>{

        const x=
          memberInfo(name);


        return `
          <div class="row">

            <div
              style="
                flex:1;
                min-width:280px
              "
            >

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:14px
                "
              >

                <div class="avatar">

                  ${
                    x.photo
                      ?`
                        <img
                          src="${x.photo}"
                          alt="Ảnh thành viên"
                        >
                      `
                      :`
                        <span
                          style="
                            font-size:30px
                          "
                        >
                          👤
                        </span>
                      `
                  }

                </div>


                <div>

                  <div class="member-name">
                    ${i+1}.
                    ${esc(name)}
                  </div>


                  <div
                    class="
                      small
                      member-info
                    "
                  >

                    🎂
                    ${esc(
                      x.dob||
                      "Chưa nhập ngày sinh"
                    )}

                    <br>

                    👨 Bố:
                    ${esc(
                      x.father||
                      "Chưa nhập"
                    )}

                    <br>

                    👩 Mẹ:
                    ${esc(
                      x.mother||
                      "Chưa nhập"
                    )}

                    <br>

                    📞
                    ${esc(
                      x.phone||
                      "Chưa nhập"
                    )}

                  </div>

                </div>

              </div>


              <div class="lesson-toolbar">

                <label
                  class="btn"
                  style="cursor:pointer"
                >

                  ${
                    x.photo
                      ?"📷 Đổi ảnh"
                      :"📷 Thêm ảnh"
                  }

                  <input
                    type="file"
                    accept="image/*"
                    style="display:none"
                    onchange="
                      uploadMemberPhoto(
                        ${i},
                        this
                      )
                    "
                  >

                </label>


                ${
                  x.photo
                    ?`
                      <button
                        class="btn red"
                        onclick="
                          removeMemberPhoto(
                            ${i}
                          )
                        "
                      >
                        🗑️ Xóa ảnh
                      </button>
                    `
                    :""
                }

              </div>

            </div>


            <div class="actions">

              <button
                class="btn"
                onclick="
                  editMemberInfo(${i})
                "
              >
                📝 Thông tin
              </button>

              <button
                class="btn gray"
                onclick="
                  renameMember(${i})
                "
              >
                ✏️ Đổi tên
              </button>

              <button
                class="btn red"
                onclick="
                  deleteMember(${i})
                "
              >
                🗑️ Xóa
              </button>

            </div>

          </div>
        `;
      }
    ).join("");
}


function editMemberInfo(i){

  const name=
    data.members[i];

  const x=
    memberInfo(name);


  const dob=
    prompt(
      "Ngày tháng năm sinh (DD/MM/YYYY):",
      x.dob
    );

  if(dob===null)
    return;


  const father=
    prompt(
      "Họ và tên bố:",
      x.father
    );

  if(father===null)
    return;


  const mother=
    prompt(
      "Họ và tên mẹ:",
      x.mother
    );

  if(mother===null)
    return;


  const phone=
    prompt(
      "Số điện thoại phụ huynh:",
      x.phone
    );

  if(phone===null)
    return;


  x.dob=
    dob.trim();

  x.father=
    father.trim();

  x.mother=
    mother.trim();

  x.phone=
    phone.trim();


  save();

  renderMembers();
}


function addMember(){

  const input=
    document.getElementById(
      "newMember"
    );


  const name=
    input.value.trim();


  if(!name)
    return alert(
      "Bạn chưa nhập tên."
    );


  if(
    data.members.some(
      n =>
        n.toLowerCase()===
        name.toLowerCase()
    )
  ){

    return alert(
      "Tên này đã có trong danh sách."
    );
  }


  data.members.push(
    name
  );


  data.memberInfo[name]={
    dob:"",
    father:"",
    mother:"",
    phone:"",
    photo:""
  };


  data.sessions.forEach(
    s=>
      s.attendance.push(false)
  );


  input.value="";


  save();

  render();
}


function renameMember(i){

  const old=
    data.members[i];


  const name=
    prompt(
      "Đổi tên thành viên:",
      old
    );


  if(name===null)
    return;


  const clean=
    name.trim();


  if(!clean)
    return alert(
      "Tên không được để trống."
    );


  if(
    data.members.some(
      (n,j)=>
        j!==i &&
        n.toLowerCase()===
        clean.toLowerCase()
    )
  ){

    return alert(
      "Tên này đã có trong danh sách."
    );
  }


  data.members[i]=
    clean;


  if(
    data.memberInfo[old]
  ){

    data.memberInfo[clean]=
      data.memberInfo[old];

    delete data.memberInfo[
      old
    ];
  }


  save();

  render();
}


function deleteMember(i){

  const name=
    data.members[i];


  if(
    !confirm(
      `Xóa "${name}" khỏi danh sách?`
    )
  )
    return;


  delete data.memberInfo[
    name
  ];


  data.members.splice(
    i,
    1
  );


  data.sessions.forEach(
    s =>
      s.attendance.splice(
        i,
        1
      )
  );


  save();

  render();
}


/* =========================
   ẢNH THÀNH VIÊN
========================= */

function compressPhoto(file){

  return new Promise(
    (resolve,reject)=>{

      if(
        !file ||
        !file.type.startsWith(
          "image/"
        )
      ){

        return reject(
          new Error(
            "Vui lòng chọn file ảnh."
          )
        );
      }


      const reader=
        new FileReader();


      reader.onload=
        e=>{

          const img=
            new Image();


          img.onload=
            ()=>{

              const max=
                240;

              let w=
                img.width;

              let h=
                img.height;


              if(
                w>h &&
                w>max
              ){

                h=
                  Math.round(
                    h*max/w
                  );

                w=
                  max;

              }else if(
                h>=w &&
                h>max
              ){

                w=
                  Math.round(
                    w*max/h
                  );

                h=
                  max;
              }


              const c=
                document.createElement(
                  "canvas"
                );


              c.width=w;
              c.height=h;


              c.getContext(
                "2d"
              ).drawImage(
                img,
                0,
                0,
                w,
                h
              );


              resolve(
                c.toDataURL(
                  "image/jpeg",
                  .72
                )
              );

            };


          img.onerror=
            ()=>reject(
              new Error(
                "Không đọc được ảnh."
              )
            );


          img.src=
            e.target.result;

        };


      reader.onerror=
        ()=>reject(
          new Error(
            "Không đọc được file."
          )
        );


      reader.readAsDataURL(
        file
      );

    }
  );
}


async function uploadMemberPhoto(
  i,
  input
){

  if(
    !input.files[0]
  )
    return;


  try{

    if(
      input.files[0].size>
      8*1024*1024
    ){

      throw new Error(
        "Ảnh quá lớn. Vui lòng chọn ảnh dưới 8 MB."
      );
    }


    memberInfo(
      data.members[i]
    ).photo=
      await compressPhoto(
        input.files[0]
      );


    save();

    renderMembers();

  }catch(e){

    alert(
      e.message
    );
  }
}


function removeMemberPhoto(i){

  const name=
    data.members[i];


  const x=
    memberInfo(name);


  if(
    !x.photo ||
    !confirm(
      `Xóa ảnh của "${name}"?`
    )
  )
    return;


  x.photo="";


  save();

  renderMembers();
}


/* =========================
   THANH THI ĐUA
========================= */

function compMonthText(k){

  const [
    a,
    b
  ]=
    k.split("-");


  return `THÁNG ${+b}/${a}`;
}


function scores(k){

  if(!data.competition[k])
    data.competition[k]={};


  data.members.forEach(
    n=>{

      if(
        typeof data.competition[k][n]!=="number"
      ){

        data.competition[k][n]=
          0;
      }

    }
  );


  return data.competition[k];
}


function changeCompetitionMonth(
  delta
){

  const [
    a,
    b
  ]=
    competitionMonth
      .split("-")
      .map(Number);


  const d=
    new Date(
      a,
      b-1+delta,
      1
    );


  competitionMonth=
    d.getFullYear()+
    "-" +
    String(
      d.getMonth()+1
    ).padStart(
      2,
      "0"
    );


  renderCompetition();
}


function adjustScoreByIndex(
  i,
  amount
){

  if(
    i<0 ||
    i>=data.members.length
  )
    return;


  const s=
    scores(
      competitionMonth
    );


  const n=
    data.members[i];


  s[n]=
    Math.max(
      0,
      (s[n]||0)+amount
    );


  save();

  renderCompetition();
}


function resetCompetitionMonth(){

  if(
    !confirm(
      `Đặt lại toàn bộ điểm của ${compMonthText(
        competitionMonth
      )} về 0?`
    )
  )
    return;


  const s=
    scores(
      competitionMonth
    );


  data.members.forEach(
    n=>
      s[n]=0
  );


  save();

  renderCompetition();
}


function prize(r,t){

  if(r===1)
    return "🏆 Giải Nhất";

  if(r===2)
    return "🥈 Giải Nhì";

  if(r===3)
    return "🥉 Giải Ba";


  return
    t>=4 &&
    r<=Math.max(
      4,
      Math.ceil(t/3)
    )
      ?"🏅 Khuyến khích"
      :"";
}


function renderCompetition(){

  const title=
    document.getElementById(
      "competitionMonth"
    );

  const box=
    document.getElementById(
      "competitionList"
    );


  if(!title||!box)
    return;


  title.textContent=
    compMonthText(
      competitionMonth
    );


  const s=
    scores(
      competitionMonth
    );


  const ranked=
    data.members
      .map(
        n=>({
          name:n,
          score:s[n]||0
        })
      )
      .sort(
        (a,b)=>
          b.score-a.score||
          a.name.localeCompare(
            b.name,
            "vi"
          )
      );


  if(!ranked.length){

    box.innerHTML=
      "<p>Chưa có thành viên.</p>";

    return;
  }


  const max=
    Math.max(
      10,
      ...ranked.map(
        x=>x.score
      )
    );


  box.innerHTML=
    ranked
      .map(
        (x,i)=>{

          const r=i+1;

          const w=
            Math.min(
              100,
              Math.max(
                0,
                x.score/max*100
              )
            );


          const p=
            prize(
              r,
              ranked.length
            );


          const mi=
            data.members.indexOf(
              x.name
            );


          const med=
            r===1
              ?"🥇"
              :r===2
              ?"🥈"
              :r===3
              ?"🥉"
              :`#${r}`;


          return `
            <div
              class="rank-card"
            >

              <div
                class="rank-head"
              >

                <div>

                  <span
                    class="rank-medal"
                  >
                    ${med}
                  </span>

                  <span
                    class="rank-name"
                  >
                    ${esc(x.name)}
                  </span>

                  ${
                    p
                      ?`
                        <div class="prize">
                          ${p}
                        </div>
                      `
                      :""
                  }

                </div>


                <div
                  class="rank-score"
                >
                  ${x.score}
                  điểm
                </div>

              </div>


              <div
                class="rank-bar"
              >

                <div
                  class="rank-fill"
                  style="width:${w}%"
                ></div>

              </div>


              <div
                class="score-actions"
              >

                <button
                  class="score-btn minus"
                  onclick="
                    adjustScoreByIndex(
                      ${mi},
                      -10
                    )
                  "
                >
                  −10
                </button>


                <button
                  class="score-btn minus"
                  onclick="
                    adjustScoreByIndex(
                      ${mi},
                      -5
                    )
                  "
                >
                  −5
                </button>


                <button
                  class="score-btn plus"
                  onclick="
                    adjustScoreByIndex(
                      ${mi},
                      5
                    )
                  "
                >
                  +5
                </button>


                <button
                  class="score-btn plus"
                  onclick="
                    adjustScoreByIndex(
                      ${mi},
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

function normalizeLesson(x){

  if(
    !x ||
    typeof x!=="object"
  )
    return null;


  if(
    typeof x.id!=="string"
  )
    x.id=uid();


  if(
    typeof x.title!=="string"
  )
    x.title="Giáo án";


  if(
    typeof x.filename!=="string"
  )
    x.filename=
      x.title+".docx";


  if(
    typeof x.html!=="string"
  )
    x.html=
      "<p>Chưa có nội dung.</p>";


  if(
    typeof x.createdAt!=="string"
  )
    x.createdAt=
      new Date()
        .toISOString();


  return x;
}


data.lessons=
  data.lessons
    .map(
      normalizeLesson
    )
    .filter(Boolean);


function renderLessons(){

  const box=
    document.getElementById(
      "lessonList"
    );


  if(!box)
    return;


  const q=
    (
      document.getElementById(
        "lessonSearch"
      )?.value||""
    )
      .trim()
      .toLowerCase();


  const arr=
    data.lessons
      .filter(
        x =>
          x.title
            .toLowerCase()
            .includes(q)||
          x.filename
            .toLowerCase()
            .includes(q)
      )
      .sort(
        (a,b)=>
          new Date(
            b.createdAt
          )-
          new Date(
            a.createdAt
          )
      );


  if(!arr.length){

    box.innerHTML=`
      <div class="lesson-empty">

        <div style="font-size:42px">
          📚
        </div>

        <h3>
          Chưa có giáo án
        </h3>

        <p class="small">
          Hãy tải file Word hoặc ZIP ở phía trên.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML=
    arr.map(
      x=>`

        <div
          class="lesson-card"
        >

          <div
            class="lesson-head"
          >

            <div>

              <div
                class="lesson-title"
              >
                📖
                ${esc(x.title)}
              </div>

              <div
                class="small"
                style="margin-top:5px"
              >
                📄
                ${esc(x.filename)}

                <br>

                🕒
                ${new Date(
                  x.createdAt
                ).toLocaleDateString(
                  "vi-VN"
                )}

              </div>

            </div>


            <div
              class="lesson-toolbar"
            >

              <button
                class="btn"
                onclick="
                  viewLesson(
                    '${x.id}'
                  )
                "
              >
                👁️ Xem
              </button>

              <button
                class="btn gray"
                onclick="
                  renameLesson(
                    '${x.id}'
                  )
                "
              >
                ✏️ Đổi tên
              </button>

              <button
                class="btn red"
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

        </div>
      `
    ).join("");
}


function viewLesson(id){

  const x=
    data.lessons.find(
      a=>a.id===id
    );


  const box=
    document.getElementById(
      "lessonViewer"
    );


  if(!x||!box)
    return;


  box.innerHTML=`

    <div
      class="lesson-head"
    >

      <div>

        <h2
          style="margin:0"
        >
          📚
          ${esc(x.title)}
        </h2>

        <div
          class="small"
          style="margin-top:5px"
        >
          📄
          ${esc(x.filename)}
        </div>

      </div>


      <div
        class="lesson-toolbar"
      >

        <button
          class="btn gray"
          onclick="
            renameLesson(
              '${x.id}'
            )
          "
        >
          ✏️ Đổi tên
        </button>

        <button
          class="btn red"
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


    <div
      class="lesson-content"
    >
      ${x.html}
    </div>

  `;


  box.scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
}


function renameLesson(id){

  const x=
    data.lessons.find(
      a=>a.id===id
    );


  if(!x)
    return;


  const n=
    prompt(
      "Tên bài học:",
      x.title
    );


  if(n===null)
    return;


  const clean=
    n.trim();


  if(!clean)
    return alert(
      "Tên bài học không được để trống."
    );


  x.title=
    clean;


  save();

  renderLessons();

  viewLesson(id);
}


function deleteLesson(id){

  const x=
    data.lessons.find(
      a=>a.id===id
    );


  if(!x)
    return;


  if(
    !confirm(
      `Xóa giáo án "${x.title}"?`
    )
  )
    return;


  data.lessons=
    data.lessons.filter(
      a=>a.id!==id
    );


  const v=
    document.getElementById(
      "lessonViewer"
    );


  if(v)
    v.innerHTML="";


  save();

  renderLessons();
}


function progress(msg){

  const b=
    document.getElementById(
      "lessonProgress"
    );


  if(!b)
    return;


  b.innerHTML=
    msg
      ?`
        <div class="loading">
          ${msg}
        </div>
      `
      :"";
}


/* =========================
   DOCX → GIÁO ÁN
========================= */

async function docxToLesson(
  buf,
  filename
){

  if(
    typeof mammoth===
    "undefined"
  ){

    throw new Error(
      "Thư viện đọc Word chưa tải xong. Hãy tải lại trang."
    );
  }


  const r=
    await mammoth.convertToHtml(
      {
        arrayBuffer:
          buf
      },
      {
        convertImage:
          mammoth.images.imgElement(
            img=>
              img.read(
                "base64"
              ).then(
                b=>({
                  src:
                    `data:${img.contentType};base64,${b}`
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
        .trim()||
      "Giáo án",

    filename:
      filename,

    html:
      r.value||
      "<p>File Word không có nội dung đọc được.</p>",

    createdAt:
      new Date().toISOString()

  };
}


async function importDocx(
  file
){

  progress(
    `⏳ Đang đọc Word: ${esc(file.name)}`
  );


  const x=
    await docxToLesson(
      await file.arrayBuffer(),
      file.name
    );


  data.lessons.push(
    x
  );


  save();

  renderLessons();

  viewLesson(
    x.id
  );
}


/* =========================
   ZIP → NHIỀU GIÁO ÁN
========================= */

async function importZip(
  file
){

  if(
    typeof JSZip===
    "undefined"
  ){

    throw new Error(
      "Thư viện đọc ZIP chưa tải xong. Hãy tải lại trang."
    );
  }


  const zip=
    await JSZip.loadAsync(
      await file.arrayBuffer()
    );


  const files=
    Object.values(
      zip.files
    ).filter(
      f=>
        !f.dir &&
        /\.docx$/i.test(
          f.name
        )
    );


  if(!files.length){

    throw new Error(
      "File ZIP không chứa file Word .docx."
    );
  }


  for(
    let i=0;
    i<files.length;
    i++
  ){

    const name=
      files[i].name
        .split("/")
        .pop();


    progress(
      `⏳ Đang chuyển ${i+1}/${files.length}: ${esc(name)}`
    );


    data.lessons.push(
      await docxToLesson(
        await files[i].async(
          "arraybuffer"
        ),
        name
      )
    );


    save();
  }


  renderLessons();


  if(
    data.lessons.length
  ){

    viewLesson(
      data.lessons[
        data.lessons.length-1
      ].id
    );
  }


  progress(
    `✅ Đã chuyển ${files.length} giáo án từ ZIP thành công.`
  );
}


/* =========================
   NHẬP FILE
========================= */

async function importLessonFiles(
  files
){

  if(
    !files?.length
  )
    return;


  try{

    for(
      const f of
      Array.from(files)
    ){

      if(
        /\.zip$/i.test(
          f.name
        )||
        f.type===
          "application/zip"
      ){

        await importZip(
          f
        );

      }else if(
        /\.docx$/i.test(
          f.name
        )
      ){

        await importDocx(
          f
        );

      }else{

        alert(
          `Bỏ qua "${f.name}" vì không phải .docx hoặc .zip.`
        );
      }
    }

  }catch(e){

    console.error(e);

    alert(
      e.message||
      "Không thể đọc file."
    );

  }finally{

    const input=
      document.getElementById(
        "lessonFile"
      );

    if(input)
      input.value="";


    setTimeout(
      ()=>progress(""),
      3000
    );
  }
}


/* =========================
   KÉO THẢ
========================= */

function setupDrop(){

  const z=
    document.getElementById(
      "lessonUploadZone"
    );


  if(!z)
    return;


  [
    "dragenter",
    "dragover"
  ].forEach(
    ev=>
      z.addEventListener(
        ev,
        e=>{

          e.preventDefault();

          z.classList.add(
            "dragover"
          );

        }
      )
  );


  [
    "dragleave",
    "drop"
  ].forEach(
    ev=>
      z.addEventListener(
        ev,
        e=>{

          e.preventDefault();

          z.classList.remove(
            "dragover"
          );

        }
      )
  );


  z.addEventListener(
    "drop",
    e=>
      importLessonFiles(
        e.dataTransfer.files
      )
  );
}


/* =========================
   KHỞI ĐỘNG
========================= */

setupDrop();

save();

render();
