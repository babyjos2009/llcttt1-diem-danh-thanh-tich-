(() => {
  "use strict";

  // UID tai khoan quan tri
  const ADMIN_UID = "vBmdB1U85uZ5lhZq026Rnqk4WZP2";

  // Noi luu du lieu cua website
  const STORAGE_KEY = "llcttt1_attendance_v5";
  const COLLECTION = "appData";
  const DOCUMENT = "shared";

  let auth = null;
  let db = null;
  let sharedDoc = null;

  let unsubscribe = null;
  let cloudReady = false;
  let applyingRemote = false;
  let booting = false;
  let loginInProgress = false;
  let authStateKnown = false;
  let activeUid = null;
  let writeTimer = null;
  let lastCloudData = "";

  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message) {
    const node = byId("syncText");
    if (node) node.textContent = message;
  }

  function showError(message) {
    const node = byId("loginError");

    if (node) {
      node.textContent = message || "";
      node.style.display = message ? "block" : "none";
    }
  }

  function showLogin(message = "") {
    const loginPage = byId("loginPage");
    const appRoot = byId("appRoot");

    if (loginPage) loginPage.style.display = "block";
    if (appRoot) appRoot.style.display = "none";

    showError(message);
  }

  function showApp() {
    const loginPage = byId("loginPage");
    const appRoot = byId("appRoot");

    if (loginPage) loginPage.style.display = "none";
    if (appRoot) appRoot.style.display = "block";

    showError("");
  }

  function translateError(error) {
    const code = error && error.code ? error.code : "";

    if (
      code.includes("api-key-not-valid") ||
      code.includes("invalid-api-key")
    ) {
      return "API key Firebase không hợp lệ. Kiểm tra lại cấu hình Firebase.";
    }

    if (code.includes("operation-not-allowed")) {
      return "Chưa bật đăng nhập Email/Password. Hãy vào Firebase → Xác thực → Phương thức đăng nhập.";
    }

    if (
      code.includes("invalid-credential") ||
      code.includes("wrong-password") ||
      code.includes("user-not-found") ||
      code.includes("invalid-login-credentials")
    ) {
      return "Email hoặc mật khẩu không chính xác.";
    }

    if (code.includes("permission-denied")) {
      return "Firestore từ chối quyền truy cập. Kiểm tra Rules của appData/shared và UID quản trị.";
    }

    if (code.includes("network-request-failed")) {
      return "Không kết nối được Firebase. Kiểm tra Internet rồi thử lại.";
    }

    if (code.includes("unauthenticated")) {
      return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
    }

    return error && error.message
      ? error.message
      : "Có lỗi xảy ra. Mở Console để xem thông tin chi tiết.";
  }

  function emptyData() {
    return {
      members: [],
      sessions: [],
      current: -1,
      competition: {}
    };
  }

  function normalizeData(value) {
    if (!value || typeof value !== "object") {
      return emptyData();
    }

    const members = Array.isArray(value.members)
      ? value.members.map(name => String(name)).slice(0, 5000)
      : [];

    const sessions = Array.isArray(value.sessions)
      ? value.sessions
          .filter(item => item && typeof item === "object")
          .map(item => ({
            label: String(item.label || "Buổi học"),
            date:
              typeof item.date === "string"
                ? item.date
                : new Date().toISOString(),
            attendance: members.map((_, index) =>
              Boolean(
                Array.isArray(item.attendance)
                  ? item.attendance[index]
                  : false
              )
            )
          }))
          .slice(0, 2000)
      : [];

    let current = Number.isInteger(value.current)
      ? value.current
      : -1;

    if (current < -1 || current >= sessions.length) {
      current = sessions.length ? sessions.length - 1 : -1;
    }

    const competition =
      value.competition &&
      typeof value.competition === "object" &&
      !Array.isArray(value.competition)
        ? value.competition
        : {};

    return {
      members,
      sessions,
      current,
      competition
    };
  }

  function stableStringify(value) {
    if (Array.isArray(value)) {
      return "[" + value.map(stableStringify).join(",") + "]";
    }

    if (value && typeof value === "object") {
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map(
            key =>
              JSON.stringify(key) +
              ":" +
              stableStringify(value[key])
          )
          .join(",") +
        "}"
      );
    }

    return JSON.stringify(value);
  }

  function readLocalData() {
    try {
      const raw = originalGetItem.call(localStorage, STORAGE_KEY);

      if (!raw) return emptyData();

      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.error("Không đọc được dữ liệu cục bộ:", error);
      return emptyData();
    }
  }

  function writeLocalData(data) {
    applyingRemote = true;

    try {
      originalSetItem.call(
        localStorage,
        STORAGE_KEY,
        JSON.stringify(normalizeData(data))
      );
    } finally {
      applyingRemote = false;
    }
  }

  function setCloudStatus(message) {
    setStatus(message);
  }

  async function saveToCloud(rawValue) {
    if (!cloudReady || applyingRemote || !sharedDoc) return;

    let payload;

    try {
      payload = normalizeData(JSON.parse(rawValue));
    } catch (error) {
      console.error("Dữ liệu cần đồng bộ không hợp lệ:", error);
      return;
    }

    const signature = stableStringify(payload);

    if (signature === lastCloudData) return;

    setCloudStatus("Đang lưu dữ liệu lên Firebase…");

    try {
      await sharedDoc.set({
        payload,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      lastCloudData = signature;
      setCloudStatus("Đã đồng bộ với thiết bị khác ✓");
    } catch (error) {
      console.error("Lỗi lưu Firestore:", error);

      setCloudStatus("Chưa đồng bộ dữ liệu");
      showError(translateError(error));
    }
  }

  // Theo doi cac lan website luu du lieu.
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);

    if (key === STORAGE_KEY && !applyingRemote) {
      clearTimeout(writeTimer);

      writeTimer = setTimeout(() => {
        saveToCloud(value);
      }, 400);
    }
  };

  function loadOriginalAttendanceScript() {
    if (document.getElementById("attendanceAppScript")) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.id = "attendanceAppScript";
      script.src = "script%20(1).js?v=sync2";

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(
          new Error(
            "Không tải được script (1).js. Hãy kiểm tra tên file trong GitHub."
          )
        );
      };

      document.body.appendChild(script);
    });
  }

  async function startSync(user) {
    if (!user) return;

    if (booting) return;

    if (activeUid === user.uid && cloudReady) {
      showApp();
      return;
    }

    if (user.uid !== ADMIN_UID) {
      await auth.signOut();

      showLogin(
        "Tài khoản này không phải tài khoản quản trị được cấu hình."
      );

      setStatus("Không có quyền quản trị");
      return;
    }

    booting = true;
    cloudReady = false;

    setCloudStatus("Đang kết nối dữ liệu…");
    showError("");

    try {
      sharedDoc = db.collection(COLLECTION).doc(DOCUMENT);

      // Lay du lieu dang co tren Firestore.
      const snapshot = await sharedDoc.get();

      let payload;

      if (
        snapshot.exists &&
        snapshot.data() &&
        snapshot.data().payload
      ) {
        // Firestore da co du lieu: dung du lieu chung nay.
        payload = normalizeData(snapshot.data().payload);
      } else {
        // Chua co du lieu tren cloud: giu lai du lieu may hien tai.
        payload = readLocalData();

        await sharedDoc.set({
          payload,
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Cap nhat du lieu tren may truoc khi mo ung dung cu.
      writeLocalData(payload);
      lastCloudData = stableStringify(payload);

      // Tai script diem danh hien co.
      await loadOriginalAttendanceScript();

      activeUid = user.uid;
      cloudReady = true;

      // Hien thi trang chinh sau khi dong bo va tai script thanh cong.
      showApp();
      setCloudStatus("Đã đồng bộ với thiết bị khác ✓");

      // Lang nghe cap nhat tu PC/dien thoai khac.
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      unsubscribe = sharedDoc.onSnapshot(
        snapshotNow => {
          if (!cloudReady || !snapshotNow.exists) return;

          const doc = snapshotNow.data();

          if (!doc || !doc.payload) return;

          const incoming = normalizeData(doc.payload);
          const signature = stableStringify(incoming);

          if (signature === lastCloudData) {
            setCloudStatus("Đã đồng bộ với thiết bị khác ✓");
            return;
          }

          lastCloudData = signature;
          writeLocalData(incoming);

          setCloudStatus("Có dữ liệu mới — đang cập nhật…");

          // Script diem danh cu doc du lieu khi khoi dong.
          // Tai lai trang de hien thi du lieu moi nhat.
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        error => {
          console.error("Lỗi lắng nghe Firestore:", error);
          setCloudStatus("Lỗi kết nối Firestore");
          showError(translateError(error));
        }
      );
    } catch (error) {
      console.error("Không thể bắt đầu đồng bộ:", error);

      cloudReady = false;
      activeUid = null;

      setCloudStatus("Không thể đồng bộ");
      showLogin(translateError(error));
    } finally {
      booting = false;
    }
  }

  async function login() {
    if (loginInProgress) return;

    if (!authStateKnown) {
      showError("Firebase đang khởi tạo. Chờ vài giây rồi thử lại.");
      return;
    }

    const email = (byId("loginEmail")?.value || "").trim();
    const password = byId("loginPassword")?.value || "";

    if (!email || !password) {
      showError("Hãy nhập email và mật khẩu.");
      return;
    }

    loginInProgress = true;

    const button = byId("loginButton");

    if (button) {
      button.disabled = true;
      button.textContent = "Đang đăng nhập…";
    }

    showError("");
    setCloudStatus("Đang xác thực tài khoản…");

    try {
      const result = await auth.signInWithEmailAndPassword(
        email,
        password
      );

      if (result.user.uid !== ADMIN_UID) {
        await auth.signOut();

        throw new Error(
          "Tài khoản đã đăng nhập không phải tài khoản quản trị."
        );
      }

      // onAuthStateChanged se mo dong bo.
      setCloudStatus("Đăng nhập thành công — đang mở dữ liệu…");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      showLogin(
        error.message &&
        error.message.includes("không phải tài khoản quản trị")
          ? error.message
          : translateError(error)
      );

      setCloudStatus("Đăng nhập chưa hoàn tất");
    } finally {
      loginInProgress = false;

      if (button) {
        button.disabled = false;
        button.textContent = "Đăng nhập và đồng bộ";
      }

      // Neu Firebase da co user nhung callback da chay trong luc
      // loginInProgress, thu mo dong bo lai tai day.
      if (auth.currentUser && !cloudReady && !booting) {
        startSync(auth.currentUser);
      }
    }
  }

  async function logout() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    clearTimeout(writeTimer);

    cloudReady = false;
    booting = false;
    activeUid = null;
    sharedDoc = null;
    lastCloudData = "";

    if (auth) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Lỗi đăng xuất:", error);
      }
    }

    showLogin("");
    setCloudStatus("Đã đăng xuất");
  }

  window.login = login;
  window.logout = logout;

  // Kiem tra Firebase SDK va cau hinh tu index.html.
  if (!window.firebase || !window.firebaseConfig) {
    showLogin(
      "Không tải được Firebase SDK hoặc thiếu cấu hình firebaseConfig trong index.html."
    );

    setCloudStatus("Firebase chưa sẵn sàng");
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.firestore();

    auth.onAuthStateChanged(user => {
      authStateKnown = true;

      if (user) {
        if (!loginInProgress) {
          startSync(user);
        }

        return;
      }

      // Bo qua callback dang xuat ban dau trong khi dang dang nhap.
      if (loginInProgress) return;

      cloudReady = false;
      activeUid = null;

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      showLogin("");
      setCloudStatus("Chưa đăng nhập");
    });
  } catch (error) {
    console.error("Lỗi khởi tạo Firebase:", error);

    showLogin(translateError(error));
    setCloudStatus("Lỗi khởi tạo Firebase");
  }

  byId("loginPassword")?.addEventListener("keydown", event => {
    if (event.key === "Enter") login();
  });

  byId("loginEmail")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      byId("loginPassword")?.focus();
    }
  });
})();
