(() => {
  "use strict";

  const ADMIN_UID = "vBmdB1U85uZ5lhZq026Rnqk4WZP2";
  const STORAGE_KEY = "llcttt1_attendance_v5";
  const SHARED_DOC_PATH = ["appData", "shared"];
  const OLD_SAMPLE_NAMES = [
    "Nguyễn Văn An", "Trần Văn Bình", "Lê Minh Châu",
    "Phạm Đức Duy", "Hoàng Gia Huy", "Nguyễn Thị Lan",
    "Vũ Minh Long", "Đỗ Quang Nam", "Trần Thông"
  ];

  let auth = null;
  let db = null;
  let sharedDoc = null;
  let unsubscribe = null;
  let cloudReady = false;
  let applyingRemote = false;
  let booting = false;
  let activeUid = null;
  let writeTimer = null;
  let loginInProgress = false;

  const originalSetItem = Storage.prototype.setItem;

  function byId(id) { return document.getElementById(id); }

  function setStatus(message) {
    const node = byId("syncText");
    if (node) node.textContent = message;
  }

  function showLogin(message = "") {
    const loginPage = byId("loginPage");
    const appRoot = byId("appRoot");
    if (loginPage) loginPage.style.display = "block";
    if (appRoot) appRoot.style.display = "none";
    const error = byId("loginError");
    if (error) {
      error.textContent = message;
      error.style.display = message ? "block" : "none";
    }
  }

  function showApp() {
    const loginPage = byId("loginPage");
    const appRoot = byId("appRoot");
    if (loginPage) loginPage.style.display = "none";
    if (appRoot) appRoot.style.display = "block";
  }

  function translatedError(error) {
    const code = error && error.code ? error.code : "";
    if (code.includes("api-key-not-valid") || code.includes("invalid-api-key")) {
      return "Firebase từ chối API key. Cần kiểm tra lại Web API Key trong Cài đặt dự án Firebase; dữ liệu chưa được đồng bộ.";
    }
    if (code.includes("operation-not-allowed")) {
      return "Firebase Authentication chưa bật phương thức Email/Password. Vào Xác thực → Sign-in method và bật Email/Password.";
    }
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
      return "Email hoặc mật khẩu không đúng. Hãy dùng tài khoản quản trị đã tạo trong Firebase Authentication.";
    }
    if (code.includes("permission-denied")) {
      return "Firestore đang chặn quyền. Hãy thêm quy tắc /appData/{documentId} cho UID quản trị như hướng dẫn.";
    }
    if (code.includes("network-request-failed")) {
      return "Không kết nối được Firebase. Kiểm tra mạng Internet rồi thử lại.";
    }
    return (error && error.message) ? error.message : "Đã xảy ra lỗi không xác định.";
  }

  function emptyData() {
    return { members: [], sessions: [], current: -1, competition: {} };
  }

  function normalizeData(value) {
    if (!value || typeof value !== "object") return emptyData();
    const members = Array.isArray(value.members)
      ? value.members.map(name => String(name)).slice(0, 5000)
      : [];
    const sessions = Array.isArray(value.sessions)
      ? value.sessions.filter(item => item && typeof item === "object").map(item => ({
          label: String(item.label || "Buổi học"),
          date: typeof item.date === "string" ? item.date : new Date().toISOString(),
          attendance: Array.isArray(item.attendance)
            ? members.map((_, index) => Boolean(item.attendance[index]))
            : members.map(() => false)
        })).slice(0, 2000)
      : [];
    let current = Number.isInteger(value.current) ? value.current : -1;
    if (current < -1 || current >= sessions.length) current = sessions.length ? sessions.length - 1 : -1;
    const competition = value.competition && typeof value.competition === "object" && !Array.isArray(value.competition)
      ? value.competition
      : {};
    return { members, sessions, current, competition };
  }

  function cleanLegacySampleNames(data) {
    const sameNames = data.members.length === OLD_SAMPLE_NAMES.length &&
      data.members.every((name, index) => name === OLD_SAMPLE_NAMES[index]);
    const noSessions = data.sessions.length === 0;
    const noScores = !Object.values(data.competition).some(month =>
      month && typeof month === "object" && Object.values(month).some(score => Number(score) !== 0)
    );
    if (sameNames && noSessions && noScores) data.members = [];
    return data;
  }

  function parseLocalData() {
    try {
      const raw = originalLocalGetItem(STORAGE_KEY);
      if (!raw) return emptyData();
      return cleanLegacySampleNames(normalizeData(JSON.parse(raw)));
    } catch (_) {
      return emptyData();
    }
  }

  function originalLocalGetItem(key) {
    return Storage.prototype.getItem.call(localStorage, key);
  }

  function storeLocalData(data) {
    applyingRemote = true;
    try {
      originalSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(normalizeData(data)));
    } finally {
      applyingRemote = false;
    }
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    if (value && typeof value === "object") {
      return "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + stableStringify(value[key])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function hasUsefulData(data) {
    if (data.members.length || data.sessions.length) return true;
    return Object.values(data.competition).some(month =>
      month && typeof month === "object" && Object.values(month).some(score => Number(score) !== 0)
    );
  }

  function serverStamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  function queueCloudWrite(rawValue) {
    if (!cloudReady || applyingRemote || !sharedDoc) return;
    let outgoing;
    try { outgoing = normalizeData(JSON.parse(rawValue)); }
    catch (_) { return; }
    clearTimeout(writeTimer);
    setStatus("Đang lưu lên đám mây…");
    writeTimer = setTimeout(async () => {
      try {
        await sharedDoc.set({ payload: outgoing, updatedAt: serverStamp() });
        setStatus("Đã đồng bộ với thiết bị khác ✓");
      } catch (error) {
        console.error("Firestore save failed:", error);
        setStatus("Chưa đồng bộ — kiểm tra quyền Firestore");
        showLogin(translatedError(error));
      }
    }, 350);
  }

  // Keep the original app's existing save() function. Its localStorage writes
  // are also sent to Firestore after sign-in.
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (key === STORAGE_KEY && !applyingRemote) queueCloudWrite(value);
  };

  async function startSync(user) {
    if (!user || booting || activeUid === user.uid && cloudReady) return;
    if (user.uid !== ADMIN_UID) {
      setStatus("Tài khoản không có quyền quản trị");
      await auth.signOut();
      showLogin("Tài khoản này không phải tài khoản quản trị của ứng dụng.");
      return;
    }

    booting = true;
    setStatus("Đang kết nối Firestore…");
    try {
      sharedDoc = db.collection(SHARED_DOC_PATH[0]).doc(SHARED_DOC_PATH[1]);
      const localData = parseLocalData();
      const snapshot = await sharedDoc.get();
      let chosenData;

      if (snapshot.exists && snapshot.data() && snapshot.data().payload) {
        const remoteData = cleanLegacySampleNames(normalizeData(snapshot.data().payload));
        // Protect an existing local class list if the cloud document is empty.
        if (!hasUsefulData(remoteData) && hasUsefulData(localData)) {
          chosenData = localData;
          await sharedDoc.set({ payload: chosenData, updatedAt: serverStamp() });
        } else {
          chosenData = remoteData;
        }
      } else {
        chosenData = localData;
        await sharedDoc.set({ payload: chosenData, updatedAt: serverStamp() });
      }

      storeLocalData(chosenData);
      cloudReady = true;
      activeUid = user.uid;
      if (unsubscribe) unsubscribe();
      unsubscribe = sharedDoc.onSnapshot(snapshotNow => {
        if (!cloudReady || !snapshotNow.exists) return;
        const doc = snapshotNow.data();
        if (!doc || !doc.payload) return;
        const incoming = cleanLegacySampleNames(normalizeData(doc.payload));
        const local = parseLocalData();
        if (stableStringify(incoming) !== stableStringify(local)) {
          storeLocalData(incoming);
          setStatus("Có dữ liệu mới từ thiết bị khác — đang cập nhật…");
          // The original application keeps data in memory, so reload after
          // a remote change to make all its existing views redraw safely.
          setTimeout(() => window.location.reload(), 450);
        } else {
          setStatus("Đã đồng bộ với thiết bị khác ✓");
        }
      }, error => {
        console.error("Firestore listener failed:", error);
        cloudReady = false;
        setStatus("Lỗi đồng bộ Firestore");
        showLogin(translatedError(error));
      });

      showApp();
      loadExistingAppScript();
      setStatus("Đã kết nối — đang đồng bộ ✓");
    } catch (error) {
      console.error("Could not start sync:", error);
      cloudReady = false;
      showLogin(translatedError(error));
      setStatus("Không thể đồng bộ");
    } finally {
      booting = false;
    }
  }

  function loadExistingAppScript() {
    if (document.getElementById("attendanceAppScript")) return;
    const script = document.createElement("script");
    script.id = "attendanceAppScript";
    script.src = "script%20(1).js?v=sync1";
    script.onload = () => setStatus("Đã đồng bộ với thiết bị khác ✓");
    script.onerror = () => showLogin("Không tải được file script (1).js. Kiểm tra file này còn trong thư mục gốc GitHub hay không.");
    document.body.appendChild(script);
  }

  async function login() {
    if (loginInProgress) return;
    const email = (byId("loginEmail")?.value || "").trim();
    const password = byId("loginPassword")?.value || "";
    if (!email || !password) {
      showLogin("Nhập email và mật khẩu của tài khoản quản trị trước nhé.");
      return;
    }
    loginInProgress = true;
    const button = byId("loginButton");
    if (button) { button.disabled = true; button.textContent = "Đang đăng nhập…"; }
    showLogin("");
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      if (result.user.uid !== ADMIN_UID) {
        await auth.signOut();
        throw new Error("Tài khoản đã đăng nhập không phải tài khoản quản trị được cấu hình.");
      }
      await startSync(result.user);
    } catch (error) {
      console.error("Login failed:", error);
      showLogin(error.message && error.message.includes("không phải tài khoản quản trị") ? error.message : translatedError(error));
    } finally {
      loginInProgress = false;
      if (button) { button.disabled = false; button.textContent = "Đăng nhập và đồng bộ"; }
    }
  }

  async function logout() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    clearTimeout(writeTimer);
    cloudReady = false;
    activeUid = null;
    sharedDoc = null;
    if (auth) {
      try { await auth.signOut(); } catch (error) { console.error(error); }
    }
    showLogin("");
    setStatus("Đã đăng xuất");
  }

  window.login = login;
  window.logout = logout;

  if (!window.firebase || !window.firebaseConfig) {
    showLogin("Không tải được Firebase SDK. Kiểm tra kết nối Internet hoặc trình duyệt.");
    setStatus("Firebase chưa tải được");
    return;
  }

  try {
    firebase.initializeApp(window.firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.onAuthStateChanged(user => {
      if (user) {
        startSync(user);
      } else {
        cloudReady = false;
        activeUid = null;
        showLogin("");
        setStatus("Chưa đăng nhập");
      }
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    showLogin(translatedError(error));
    setStatus("Lỗi khởi tạo Firebase");
  }

  byId("loginPassword")?.addEventListener("keydown", event => {
    if (event.key === "Enter") login();
  });
  byId("loginEmail")?.addEventListener("keydown", event => {
    if (event.key === "Enter") byId("loginPassword")?.focus();
  });
})();
