// ============================================================
//  STUDENT MANAGER – APP.JS
//  Quản Lý Học Sinh THCS
// ============================================================

// ─── AUTH ────────────────────────────────────────────────────
const AUTH_KEY = 'quanlyhocsinh_accounts';
const SESSION_KEY = 'quanlyhocsinh_session';

// Default admin account
const DEFAULT_ACCOUNTS = [
  { username: 'admin', password: 'admin123', fullname: 'Quản Lý Học Sinh', role: 'admin' }
];

function getAccounts() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    // Migration: Check old key if existed
    const oldRaw = localStorage.getItem('loptruong_accounts');
    if (oldRaw) {
      try {
        const oldAccounts = JSON.parse(oldRaw);
        oldAccounts.forEach(a => {
          if (a.fullname === 'Lớp Trưởng') a.fullname = 'Quản Lý Học Sinh';
        });
        localStorage.setItem(AUTH_KEY, JSON.stringify(oldAccounts));
        return oldAccounts;
      } catch (e) {}
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  const parsed = JSON.parse(raw);
  // Ensure admin always exists
  const admin = parsed.find(a => a.username === 'admin');
  if (!admin) {
    parsed.unshift(DEFAULT_ACCOUNTS[0]);
    localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
  } else if (admin.fullname === 'Lớp Trưởng') {
    admin.fullname = 'Quản Lý Học Sinh';
    localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
  }
  return parsed;
}

function saveAccounts(accounts) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function isAdmin() {
  const s = getSession();
  return s && s.role === 'admin';
}

// ─── AUTH UI HELPERS ─────────────────────────────────────────
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('formLogin').classList.toggle('hidden', !isLogin);
  document.getElementById('formRegister').classList.toggle('hidden', isLogin);
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

function togglePwd(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  if (!username || !password) {
    errEl.textContent = '⚠️ Vui lòng nhập đầy đủ thông tin!';
    return;
  }

  const accounts = getAccounts();
  const user = accounts.find(a => a.username === username && a.password === password);

  if (!user) {
    errEl.textContent = '❌ Tên đăng nhập hoặc mật khẩu không đúng!';
    document.getElementById('loginPassword').value = '';
    return;
  }

  setSession(user);
  showApp(user);
}

function handleRegister() {
  const fullname  = document.getElementById('regFullname').value.trim();
  const username  = document.getElementById('regUsername').value.trim();
  const password  = document.getElementById('regPassword').value;
  const confirm   = document.getElementById('regConfirm').value;
  const errEl     = document.getElementById('registerError');
  errEl.textContent = '';

  if (!fullname || !username || !password || !confirm) {
    errEl.textContent = '⚠️ Vui lòng điền đầy đủ thông tin!';
    return;
  }
  if (/\s/.test(username) || /[àáảãạăắặẳẵằâấậẩẫầèéẻẽẹêếệểễềìíỉĩịòóỏõọôốộổỗồơớợởỡờùúủũụưứựửữừỳýỷỹỵđÀÁẢÃẠĂẮẶẲẴẰÂẤẬẨẪẦÈÉẺẼẸÊẾỆỂỄỀÌÍỈĨỊÒÓỎÕỌÔỐỘỔỖỒƠỚỢỞỠỜÙÚỦŨỤƯỨỰỬỮỪỲÝỶỸỴĐ]/.test(username)) {
    errEl.textContent = '⚠️ Tên đăng nhập không được có dấu hoặc khoảng trắng!';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = '⚠️ Mật khẩu phải có ít nhất 6 ký tự!';
    return;
  }
  if (password !== confirm) {
    errEl.textContent = '❌ Mật khẩu xác nhận không khớp!';
    return;
  }

  const accounts = getAccounts();
  if (accounts.find(a => a.username === username)) {
    errEl.textContent = '❌ Tên đăng nhập đã tồn tại!';
    return;
  }

  const newUser = { username, password, fullname, role: 'student' };
  accounts.push(newUser);
  saveAccounts(accounts);

  showToastAuth('✅ Tạo tài khoản thành công! Đang đăng nhập...');
  setTimeout(() => {
    setSession(newUser);
    showApp(newUser);
  }, 1000);
}

function showToastAuth(msg) {
  // Simple in-card notification before app loads
  const errEl = document.getElementById('registerError');
  errEl.style.color = '#34d399';
  errEl.textContent = msg;
}

function handleLogout() {
  clearSession();
  // Reset form fields
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
  switchAuthTab('login');
  // Show auth overlay
  document.getElementById('authOverlay').classList.remove('hidden');
  // Remove student mode
  document.body.classList.remove('student-mode');
}

function showApp(user) {
  // Hide auth overlay
  document.getElementById('authOverlay').classList.add('hidden');

  // Update sidebar user info
  const isAdminUser = user.role === 'admin';
  document.getElementById('sidebarAvatar').textContent = isAdminUser ? '👑' : '🎒';
  const displayName = (user.fullname === 'Lớp Trưởng') ? 'Quản Lý Học Sinh' : user.fullname;
  document.getElementById('sidebarName').textContent = displayName;
  document.getElementById('sidebarRole').textContent = isAdminUser ? 'Quản lý học sinh' : 'Học sinh';

  // Update topbar
  const badge = isAdminUser
    ? `<span class="role-badge-admin">👑 Admin</span>`
    : `<span class="role-badge-student">🎒 Học sinh</span>`;
  document.getElementById('topbarUser').innerHTML = badge + `<span>${displayName}</span>`;

  // Apply student-mode to body (hides admin-only nav & buttons)
  if (isAdminUser) {
    document.body.classList.remove('student-mode');
  } else {
    document.body.classList.add('student-mode');
    // Students land on dashboard - they can see scores, homework, submit, conduct
    navigate('dashboard');
  }
}


// ─── STATE ───────────────────────────────────────────────────
const SUBJECTS = ['Toán','Văn','Anh','Lý','Hóa','Sinh','Sử','Địa'];
const SUBJECT_COLORS = {
  'Toán': '#6c63ff', 'Văn': '#f472b6', 'Anh': '#38bdf8',
  'Lý': '#fb923c', 'Hóa': '#34d399', 'Sinh': '#a78bfa',
  'Sử': '#fbbf24', 'Địa': '#60a5fa', 'GDCD': '#e879f9',
  'Thể dục': '#22d3ee', 'Tin': '#4ade80', 'Nhạc': '#f472b6',
  'Mỹ thuật': '#fbbf24', 'Công nghệ': '#94a3b8'
};

const AVATARS_MALE   = ['👦','🧑','👨‍🎓'];
const AVATARS_FEMALE = ['👧','🧒','👩‍🎓'];

let state = {
  students: [],
  homeworks: [],
  submissions: [],
  pendingFiles: [],
  conduct: {},   // { studentId: { month: { attendance, attitude, discipline, activity, absent, note } } }
  timetable: {
    morning: [  // buổi sáng, 5 tiết
      ['Toán',     'Văn',     'Anh',    'Lý',     'Hóa',     'Sinh'],
      ['Văn',      'Toán',    'Lý',     'Anh',    'Sinh',    'Hóa'],
      ['Anh',      'Lý',      'Toán',   'Hóa',    'Văn',     'Thể dục'],
      ['Lý',       'Hóa',     'Sinh',   'Toán',   'Anh',     'GDCD'],
      ['Hóa',      'Sinh',    'Địa',    'Văn',    'Toán',    ''],
    ],
    afternoon: [ // buổi chiều, 4 tiết
      ['Sử',       'GDCD',    'Thể dục','Nhạc',   'Mỹ thuật',''],
      ['Địa',      'Sử',      'GDCD',   'Thể dục','Nhạc',    ''],
      ['Nhạc',     'Địa',     'Sử',     'GDCD',   '',        ''],
      ['Mỹ thuật', 'Nhạc',    'Địa',    '',       'Sử',      ''],
    ],
  },
};

// ─── SAMPLE DATA ─────────────────────────────────────────────
function initSampleData() {
  const names = [
    ['Nguyễn Minh An', 'Nam'], ['Trần Thị Bình', 'Nữ'], ['Lê Văn Cường', 'Nam'],
    ['Phạm Thị Dung', 'Nữ'], ['Hoàng Văn Em', 'Nam'], ['Đỗ Thị Phương', 'Nữ'],
    ['Vũ Minh Giang', 'Nam'], ['Ngô Thị Hà', 'Nữ'], ['Bùi Văn Hùng', 'Nam'],
    ['Đặng Thị Lan', 'Nữ'], ['Lý Văn Khoa', 'Nam'], ['Phan Thị Mai', 'Nữ'],
    ['Trương Văn Nam', 'Nam'], ['Cao Thị Ngọc', 'Nữ'], ['Đinh Văn Oanh', 'Nam'],
    ['Hà Thị Phúc', 'Nữ'], ['Từ Văn Quang', 'Nam'], ['Lưu Thị Rồng', 'Nữ'],
    ['Tô Văn Sơn', 'Nam'], ['Châu Thị Tuyết', 'Nữ'],
  ];

  state.students = names.map(([name, gender], i) => ({
    id: i + 1,
    no: i + 1,
    name,
    gender,
    scores: genScores(),
  }));

  // Homeworks
  const today = new Date();
  const fmtDate = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

  state.homeworks = [
    {
      id: 1, name: 'Bài kiểm tra Toán – Chương 1', subject: 'Toán',
      deadline: fmtDate(addDays(today, 3)),
      desc: 'Ôn tập và kiểm tra kiến thức chương 1 đại số.',
      open: true,
      progress: {},
    },
    {
      id: 2, name: 'Bài tập Tiếng Anh – Unit 5', subject: 'Anh',
      deadline: fmtDate(addDays(today, 1)),
      desc: 'Làm bài tập ngữ pháp và từ vựng Unit 5 SGK.',
      open: true,
      progress: {},
    },
    {
      id: 3, name: 'Viết văn nghị luận xã hội', subject: 'Văn',
      deadline: fmtDate(addDays(today, -2)),
      desc: 'Bài tập viết văn nghị luận về chủ đề môi trường.',
      open: false,
      progress: {},
    },
    {
      id: 4, name: 'Thí nghiệm Vật Lý điện học', subject: 'Lý',
      deadline: fmtDate(addDays(today, 5)),
      desc: 'Báo cáo kết quả thí nghiệm đo điện trở.',
      open: true,
      progress: {},
    },
  ];

  // Random homework progress
  state.homeworks.forEach(hw => {
    state.students.forEach(s => {
      hw.progress[s.id] = Math.random() > 0.4;
    });
  });

  // Sample conduct data for current month
  const currentMonth = new Date().getMonth() + 1;
  state.students.forEach(s => {
    if (!state.conduct[s.id]) state.conduct[s.id] = {};
    const att = Math.floor(Math.random() * 2) + 4;   // 4-5
    const ati = Math.floor(Math.random() * 3) + 3;   // 3-5
    const dis = Math.floor(Math.random() * 2) + 4;   // 4-5
    const act = Math.floor(Math.random() * 3) + 3;   // 3-5
    state.conduct[s.id][currentMonth] = {
      attendance: att, attitude: ati, discipline: dis, activity: act,
      absent: Math.floor(Math.random() * 3),
      note: '',
    };
  });
}

function genScores() {
  const scores = {};
  SUBJECTS.forEach(sub => {
    scores[sub] = +(Math.random() * 3.5 + 6.5).toFixed(1); // 6.5 – 10
  });
  return scores;
}

function getAvg(scores) {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function getRank(avg) {
  if (avg >= 9) return { label: 'Xuất Sắc', cls: 'rank-excellent' };
  if (avg >= 8) return { label: 'Giỏi', cls: 'rank-good' };
  if (avg >= 6.5) return { label: 'Khá', cls: 'rank-average' };
  return { label: 'Trung Bình', cls: 'rank-poor' };
}

function getScoreClass(v) {
  if (v === null || v === undefined) return 'none';
  if (v >= 9)   return 'excellent';
  if (v >= 8)   return 'good';
  if (v >= 6.5) return 'average';
  return 'poor';
}

function getGradientForAvg(avg) {
  if (avg >= 9)   return 'linear-gradient(135deg,#34d399,#059669)';
  if (avg >= 8)   return 'linear-gradient(135deg,#38bdf8,#0284c7)';
  if (avg >= 6.5) return 'linear-gradient(135deg,#fbbf24,#d97706)';
  return 'linear-gradient(135deg,#f87171,#dc2626)';
}

function avatar(student) {
  const pool = student.gender === 'Nữ' ? AVATARS_FEMALE : AVATARS_MALE;
  return pool[student.id % pool.length];
}

// ─── NAVIGATION ──────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: '🏠 Tổng Quan',
  students:  '👥 Học Sinh',
  scores:    '📊 Bảng Điểm',
  homework:  '📝 Bài Tập',
  submit:    '📷 Nộp Bài',
  conduct:   '🌟 Hạnh Kiểm',
  timetable: '📅 Thời Khóa Biểu',
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page];

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }

  if (page === 'dashboard') renderDashboard();
  if (page === 'students')  renderStudents();
  if (page === 'scores')    renderScoresTable();
  if (page === 'homework')  renderHomework();
  if (page === 'submit')    renderSubmitPage();
  if (page === 'conduct')   renderConduct();
  if (page === 'timetable') renderTimetable();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const main = document.getElementById('main');
  if (window.innerWidth <= 900) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.classList.toggle('collapsed');
    main.classList.toggle('expanded');
  }
}

// ─── DATE ─────────────────────────────────────────────────────
function initDate() {
  const d = new Date();
  const opts = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
  document.getElementById('dateBadge').textContent = d.toLocaleDateString('vi-VN', opts);
}

// ─── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  // Stats
  const totalSubs = state.submissions.length;
  const allAvgs = state.students.map(s => getAvg(s.scores));
  const classAvg = state.students.length ? +(allAvgs.reduce((a,b)=>a+b,0)/allAvgs.length).toFixed(1) : 0;
  const openHW = state.homeworks.filter(h => h.open).length;

  document.getElementById('stat-total').textContent = state.students.length;
  document.getElementById('stat-submitted').textContent = totalSubs;
  document.getElementById('stat-avg').textContent = classAvg;
  document.getElementById('stat-hw').textContent = openHW;

  // Top students
  const sorted = [...state.students].sort((a,b)=>getAvg(b.scores)-getAvg(a.scores)).slice(0,5);
  document.getElementById('topStudentsList').innerHTML = sorted.map((s, i) => {
    const avg = getAvg(s.scores);
    const rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
    return `<div class="top-student-item">
      <div class="rank-badge ${rankClass}">${i+1}</div>
      <div style="font-size:20px">${avatar(s)}</div>
      <div class="top-student-name">${s.name}</div>
      <div class="top-student-avg">${avg}</div>
    </div>`;
  }).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';

  // Recent submissions
  const recents = [...state.submissions].reverse().slice(0,6);
  document.getElementById('recentSubmissions').innerHTML = recents.length
    ? recents.map(sub => {
        const student = state.students.find(s => s.id === sub.studentId);
        const hw = state.homeworks.find(h => h.id === sub.hwId);
        const imgSrc = sub.images && sub.images[0];
        return `<div class="recent-item" onclick="viewSubmission(${sub.id})">
          <div class="recent-thumb">
            ${imgSrc ? `<img src="${imgSrc}" />` : '📄'}
          </div>
          <div class="recent-info">
            <div class="recent-name">${student ? student.name : 'HS'}</div>
            <div class="recent-meta">${hw ? hw.name : 'Bài nộp'} • ${sub.images.length} ảnh</div>
          </div>
        </div>`;
      }).join('')
    : '<div class="empty-state">Chưa có bài nộp nào</div>';

  // Homework progress overview
  const hwOverview = document.getElementById('hwProgressOverview');
  hwOverview.innerHTML = state.homeworks.map(hw => {
    const total = state.students.length;
    const done = total ? Object.values(hw.progress).filter(v=>v).length : 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const color = hw.subject ? SUBJECT_COLORS[hw.subject] || '#6c63ff' : '#6c63ff';
    return `<div class="hw-progress-item">
      <div class="hw-progress-header">
        <div class="hw-progress-name">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>
          ${hw.name}
        </div>
        <div class="hw-progress-pct">${done}/${total} (${pct}%)</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
      </div>
    </div>`;
  }).join('') || '<div class="empty-state">Chưa có bài tập</div>';

  // Conduct summary for dashboard
  const currentMonth = new Date().getMonth() + 1;
  const conductSel = document.getElementById('conductSummary');
  const counts = { 'Tốt': 0, 'Khá': 0, 'Trung Bình': 0, 'Yếu': 0 };
  state.students.forEach(s => {
    const rec = state.conduct[s.id] && state.conduct[s.id][currentMonth];
    const rank = rec ? getConductRank(rec) : null;
    if (rank) counts[rank.label]++;
  });
  conductSel.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div class="conduct-stat-card" style="border-color:rgba(52,211,153,.3)">
        <div class="conduct-stat-val" style="color:#34d399">${counts['Tốt']}</div>
        <div class="conduct-stat-label">🌟 Tốt</div>
      </div>
      <div class="conduct-stat-card" style="border-color:rgba(56,189,248,.3)">
        <div class="conduct-stat-val" style="color:#38bdf8">${counts['Khá']}</div>
        <div class="conduct-stat-label">👍 Khá</div>
      </div>
      <div class="conduct-stat-card" style="border-color:rgba(251,191,36,.3)">
        <div class="conduct-stat-val" style="color:#fbbf24">${counts['Trung Bình']}</div>
        <div class="conduct-stat-label">📊 Trung Bình</div>
      </div>
      <div class="conduct-stat-card" style="border-color:rgba(248,113,113,.3)">
        <div class="conduct-stat-val" style="color:#f87171">${counts['Yếu']}</div>
        <div class="conduct-stat-label">⚠️ Yếu</div>
      </div>
    </div>
    <div style="margin-top:12px;text-align:center;">
      <span style="font-size:12px;color:var(--text-muted);">Tháng ${currentMonth} • ${state.students.filter(s => state.conduct[s.id] && state.conduct[s.id][currentMonth]).length}/${state.students.length} đã đánh giá</span>
    </div>
  `;
}

// ─── STUDENTS ─────────────────────────────────────────────────
function renderStudents(filter = '') {
  const q = filter.toLowerCase();
  const list = state.students.filter(s => s.name.toLowerCase().includes(q));
  const grid = document.getElementById('studentsGrid');
  grid.innerHTML = list.map(s => {
    const avg = getAvg(s.scores);
    const rank = getRank(avg);
    const grad = getGradientForAvg(avg);
    return `<div class="student-card" onclick="openStudentDetail(${s.id})">
      <div class="student-no">#${s.no}</div>
      <div class="student-avatar">${avatar(s)}</div>
      <div class="student-name">${s.name}</div>
      <div class="student-gender">${s.gender}</div>
      <div class="student-avg-badge" style="background:${grad}20;color:${avg>=8?'#34d399':avg>=6.5?'#fbbf24':'#f87171'};">
        ⭐ TB: ${avg}
        <span class="rank-badge-table ${rank.cls}" style="margin-left:6px;">${rank.label}</span>
      </div>
    </div>`;
  }).join('') || '<div class="empty-state" style="grid-column:1/-1">Không tìm thấy học sinh</div>';
}

function filterStudents() {
  renderStudents(document.getElementById('studentSearch').value);
}

function openAddStudent() {
  document.getElementById('newStudentName').value = '';
  document.getElementById('newStudentNo').value = state.students.length + 1;
  openModal('modalAddStudent');
}

function addStudent() {
  const name = document.getElementById('newStudentName').value.trim();
  const gender = document.getElementById('newStudentGender').value;
  const no = parseInt(document.getElementById('newStudentNo').value) || state.students.length + 1;
  if (!name) { showToast('Vui lòng nhập họ tên học sinh!', 'error'); return; }
  const id = Date.now();
  state.students.push({ id, no, name, gender, scores: {} });
  state.homeworks.forEach(hw => hw.progress[id] = false);
  closeModal();
  renderStudents();
  showToast(`Đã thêm học sinh ${name}`, 'success');
  updateStats();
}

// ─── STUDENT DETAIL ───────────────────────────────────────────
function openStudentDetail(id) {
  const s = state.students.find(x => x.id === id);
  if (!s) return;
  const avg = getAvg(s.scores);
  const rank = getRank(avg);

  document.getElementById('modalStudentName').textContent = `${avatar(s)} ${s.name}`;

  const scoreItems = SUBJECTS.map(sub => {
    const v = s.scores[sub];
    const cls = getScoreClass(v);
    return `<div class="detail-score-item">
      <div class="detail-score-subject">${sub}</div>
      <div class="detail-score-val score-cell ${cls}">${v !== undefined ? v : '–'}</div>
    </div>`;
  }).join('');

  const hwItems = state.homeworks.map(hw => {
    const done = hw.progress[id];
    return `<div class="detail-hw-item">
      <span style="font-size:13px;">${hw.name}</span>
      <span class="${done ? 'check-done' : 'check-miss'}">${done ? '✅ Đã nộp' : '❌ Chưa nộp'}</span>
    </div>`;
  }).join('');

  const subItems = state.submissions.filter(x => x.studentId === id);

  document.getElementById('modalStudentBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:20px;padding:16px;background:var(--bg-panel);border-radius:12px;border:1px solid var(--border);">
      <div style="font-size:48px;">${avatar(s)}</div>
      <div>
        <div style="font-size:18px;font-weight:800;">${s.name}</div>
        <div style="font-size:13px;color:var(--text-muted);">${s.gender} · Số thứ tự: ${s.no}</div>
        <div style="margin-top:8px;">
          <span class="rank-badge-table ${rank.cls}" style="font-size:13px;padding:4px 12px;">${rank.label} · TB: ${avg}</span>
        </div>
      </div>
    </div>

    <h4 style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;letter-spacing:.5px;">📊 Điểm Trung Bình Các Môn</h4>
    <div class="detail-scores-grid">${scoreItems}</div>

    <h4 style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;letter-spacing:.5px;">📝 Tiến Độ Bài Tập</h4>
    <div class="detail-hw-list">${hwItems || '<div class="empty-state">Chưa có bài tập</div>'}</div>

    ${subItems.length ? `
      <h4 style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:16px 0 10px;letter-spacing:.5px;">📷 Bài Đã Nộp (${subItems.length})</h4>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${subItems.map(sub => {
          const hw = state.homeworks.find(h=>h.id===sub.hwId);
          return `<div class="submission-item" onclick="viewSubmission(${sub.id})">
            <div class="sub-thumb">${sub.images[0] ? `<img src="${sub.images[0]}" />` : '📄'}</div>
            <div class="sub-info">
              <div class="sub-name">${hw ? hw.name : 'Bài nộp'}</div>
              <div class="sub-hw">${sub.images.length} ảnh · ${sub.note || 'Không có ghi chú'}</div>
              <div class="sub-time">${sub.time}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    ` : ''}

    ${(() => {
      const currentMonth = new Date().getMonth() + 1;
      const rec = state.conduct[id] && state.conduct[id][currentMonth];
      const rank = rec ? getConductRank(rec) : null;
      return `
        <h4 style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin:16px 0 10px;letter-spacing:.5px;">🌟 Hạnh Kiểm Tháng ${currentMonth}</h4>
        <div style="padding:14px;background:var(--bg-panel);border-radius:10px;border:1px solid var(--border);">
          ${rec ? `
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px;">
              <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">⏰ Chuyên Cần</div><div style="font-size:16px;">${starsHtml(rec.attendance)}</div></div>
              <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">😊 Thái Độ</div><div style="font-size:16px;">${starsHtml(rec.attitude)}</div></div>
              <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">📏 Kỷ Luật</div><div style="font-size:16px;">${starsHtml(rec.discipline)}</div></div>
              <div><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">🙋 Hoạt Động</div><div style="font-size:16px;">${starsHtml(rec.activity)}</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span class="conduct-badge ${rank ? rank.cls : ''}">${rank ? rank.icon + ' ' + rank.label : '–'}</span>
              <span style="font-size:12px;color:var(--text-muted);">Vắng: ${rec.absent} buổi</span>
              ${rec.note ? `<span style="font-size:12px;color:var(--text-secondary);">📝 ${rec.note}</span>` : ''}
            </div>
          ` : `<div style="color:var(--text-muted);font-size:13px;">Chưa có đánh giá hạnh kiểm tháng này</div>`}
        </div>
      `;
    })()}

    <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:10px;">
      <button class="btn btn-danger" onclick="deleteStudent(${id})">🗑 Xoá học sinh</button>
      <button class="btn btn-secondary" onclick="closeModal();navigate('conduct');setTimeout(()=>openConductEdit(${id},${new Date().getMonth()+1}),100)">🌟 Đánh giá HK</button>
      <button class="btn btn-primary" onclick="openEditScores(${id})">✏️ Cập nhật điểm</button>
    </div>
  `;

  openModal('modalStudentDetail');
}

function deleteStudent(id) {
  if (!confirm('Bạn có chắc muốn xoá học sinh này?')) return;
  state.students = state.students.filter(s => s.id !== id);
  closeModal();
  renderStudents();
  showToast('Đã xoá học sinh', 'info');
}

function openEditScores(studentId) {
  closeModal();
  const s = state.students.find(x => x.id === studentId);
  if (!s) return;
  populateScoreModal(studentId);
  openModal('modalAddScore');
}

// ─── SCORES ───────────────────────────────────────────────────
function renderScoresTable() {
  const tbody = document.getElementById('scoresBody');
  const sorted = [...state.students].sort((a, b) => getAvg(b.scores) - getAvg(a.scores));

  tbody.innerHTML = sorted.map((s, i) => {
    const avg = getAvg(s.scores);
    const rank = getRank(avg);
    const cells = SUBJECTS.map(sub => {
      const v = s.scores[sub];
      const cls = getScoreClass(v);
      return `<td class="score-cell ${cls}">${v !== undefined ? v : '–'}</td>`;
    }).join('');

    return `<tr>
      <td style="color:var(--text-muted);font-size:12px;">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <span>${avatar(s)}</span>
          <span style="font-weight:600;">${s.name}</span>
        </div>
      </td>
      ${cells}
      <td class="score-cell ${getScoreClass(avg)}" style="font-size:15px;">${avg}</td>
      <td><span class="rank-badge-table ${rank.cls}">${rank.label}</span></td>
    </tr>`;
  }).join('');
}

function openAddScore() {
  populateScoreModal(null);
  openModal('modalAddScore');
}

function populateScoreModal(defaultStudentId) {
  const sel = document.getElementById('scoreStudent');
  sel.innerHTML = state.students.map(s =>
    `<option value="${s.id}" ${s.id === defaultStudentId ? 'selected' : ''}>${s.name}</option>`
  ).join('');
}

function addScore() {
  const studentId = parseInt(document.getElementById('scoreStudent').value);
  const subject = document.getElementById('scoreSubject').value;
  const value = parseFloat(document.getElementById('scoreValue').value);
  if (isNaN(value) || value < 0 || value > 10) { showToast('Điểm phải từ 0 đến 10!', 'error'); return; }
  const s = state.students.find(x => x.id === studentId);
  if (!s) return;
  s.scores[subject] = value;
  closeModal();
  renderScoresTable();
  renderDashboardIfActive();
  showToast(`Đã lưu điểm ${subject} của ${s.name}: ${value}`, 'success');
}

// ─── HOMEWORK ─────────────────────────────────────────────────
function renderHomework() {
  const filter = document.getElementById('hwFilter').value;
  const list = state.homeworks.filter(hw => {
    if (filter === 'open') return hw.open;
    if (filter === 'closed') return !hw.open;
    return true;
  });

  document.getElementById('homeworkList').innerHTML = list.map(hw => {
    const total = state.students.length;
    const done = total ? Object.values(hw.progress).filter(v=>v).length : 0;
    const pct = total ? Math.round((done/total)*100) : 0;
    const color = SUBJECT_COLORS[hw.subject] || '#6c63ff';

    const studentRows = state.students.map(s => `
      <div class="hw-student-row">
        <div class="hw-student-name-sm">${avatar(s)} ${s.name}</div>
        <div class="hw-check ${hw.progress[s.id] ? 'done' : ''}" ${isAdmin() ? `onclick="toggleProgress(${hw.id},${s.id},this)"` : ''}>
          ${hw.progress[s.id] ? '✓' : ''}
        </div>
      </div>
    `).join('');

    return `<div class="hw-card">
      <div class="hw-card-header">
        <div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <span class="hw-subject-tag" style="background:${color}22;color:${color};">${hw.subject}</span>
            <span class="hw-status-tag ${hw.open ? 'hw-open' : 'hw-closed'}">${hw.open ? '🟢 Đang mở' : '🔴 Đã đóng'}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          ${isAdmin() ? `
          <button class="btn btn-secondary" style="padding:5px 10px;font-size:11px;" onclick="toggleHwStatus(${hw.id})">
            ${hw.open ? '🔒 Đóng' : '🔓 Mở'}
          </button>
          <button class="btn btn-danger" style="padding:5px 10px;font-size:11px;" onclick="deleteHomework(${hw.id})">🗑</button>
          ` : ''}
        </div>
      </div>
      <div class="hw-card-body">
        <div class="hw-title">${hw.name}</div>
        <div class="hw-desc">${hw.desc || 'Không có mô tả'}</div>
        <div class="hw-deadline">📅 Hạn nộp: ${formatDate(hw.deadline)}</div>
      </div>
      <div class="hw-card-progress">
        <div class="hw-progress-header">
          <span style="font-size:13px;font-weight:600;">Tiến độ: ${done}/${total} học sinh</span>
          <span style="font-size:13px;font-weight:800;color:${color};">${pct}%</span>
        </div>
        <div class="progress-bar" style="margin:8px 0 14px;">
          <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <details style="font-size:13px;">
          <summary style="cursor:pointer;color:var(--text-secondary);margin-bottom:8px;">Xem danh sách</summary>
          <div class="hw-student-list">${studentRows}</div>
        </details>
      </div>
    </div>`;
  }).join('') || '<div class="empty-state" style="grid-column:1/-1">Không có bài tập</div>';
}

function toggleProgress(hwId, studentId, el) {
  const hw = state.homeworks.find(h => h.id === hwId);
  if (!hw) return;
  hw.progress[studentId] = !hw.progress[studentId];
  el.classList.toggle('done');
  el.textContent = hw.progress[studentId] ? '✓' : '';
  renderDashboardIfActive();
}

function toggleHwStatus(hwId) {
  const hw = state.homeworks.find(h => h.id === hwId);
  if (!hw) return;
  hw.open = !hw.open;
  renderHomework();
  showToast(`Bài tập đã ${hw.open ? 'mở' : 'đóng'}`, 'info');
}

function deleteHomework(hwId) {
  if (!confirm('Xoá bài tập này?')) return;
  state.homeworks = state.homeworks.filter(h => h.id !== hwId);
  renderHomework();
  showToast('Đã xoá bài tập', 'info');
}

function openAddHomework() {
  document.getElementById('hwName').value = '';
  document.getElementById('hwDesc').value = '';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 3);
  document.getElementById('hwDeadline').value = tomorrow.toISOString().split('T')[0];
  openModal('modalAddHomework');
}

function addHomework() {
  const name = document.getElementById('hwName').value.trim();
  const subject = document.getElementById('hwSubject').value;
  const deadline = document.getElementById('hwDeadline').value;
  const desc = document.getElementById('hwDesc').value.trim();
  if (!name) { showToast('Vui lòng nhập tên bài tập!', 'error'); return; }
  const hw = { id: Date.now(), name, subject, deadline, desc, open: true, progress: {} };
  state.students.forEach(s => hw.progress[s.id] = false);
  state.homeworks.push(hw);
  closeModal();
  renderHomework();
  showToast(`Đã thêm bài tập: ${name}`, 'success');
}

// ─── SUBMIT PAGE ──────────────────────────────────────────────
function renderSubmitPage() {
  // Populate student select
  const sel = document.getElementById('submitStudent');
  sel.innerHTML = '<option value="">-- Chọn học sinh --</option>' +
    state.students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  // Populate homework select
  const hwSel = document.getElementById('submitHomework');
  hwSel.innerHTML = '<option value="">-- Chọn bài --</option>' +
    state.homeworks.map(h => `<option value="${h.id}">${h.name}</option>`).join('');

  renderSubmissions();
}

let pendingFiles = [];

function triggerUpload() {
  document.getElementById('fileInput').click();
}

function onDragOver(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag-over');
  handleFiles(Array.from(e.dataTransfer.files));
}

function handleFileSelect(e) {
  handleFiles(Array.from(e.target.files));
}

function handleFiles(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingFiles.push({ name: file.name, dataUrl: e.target.result });
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreview() {
  const grid = document.getElementById('previewGrid');
  grid.innerHTML = pendingFiles.map((f, i) => `
    <div class="preview-item">
      <img src="${f.dataUrl}" alt="${f.name}" />
      <div class="preview-remove" onclick="removePreview(${i})">✕</div>
    </div>
  `).join('');
}

function removePreview(i) {
  pendingFiles.splice(i, 1);
  renderPreview();
}

function submitHomework() {
  const studentId = parseInt(document.getElementById('submitStudent').value);
  const hwId = parseInt(document.getElementById('submitHomework').value);
  const note = document.getElementById('submitNote').value.trim();

  if (!studentId) { showToast('Vui lòng chọn học sinh!', 'error'); return; }
  if (!hwId) { showToast('Vui lòng chọn bài kiểm tra!', 'error'); return; }
  if (!pendingFiles.length) { showToast('Vui lòng tải lên ít nhất 1 ảnh!', 'error'); return; }

  const sub = {
    id: Date.now(),
    studentId,
    hwId,
    note,
    images: pendingFiles.map(f => f.dataUrl),
    time: new Date().toLocaleString('vi-VN'),
    score: null,       // Admin chấm điểm
    feedback: '',      // Admin nhận xét
    questions: [],     // Câu hỏi của học sinh: [{ id, text, time, reply, replyTime }]
  };

  state.submissions.push(sub);

  // Mark homework as done for student
  const hw = state.homeworks.find(h => h.id === hwId);
  if (hw) hw.progress[studentId] = true;

  // Reset
  pendingFiles = [];
  renderPreview();
  document.getElementById('submitNote').value = '';
  document.getElementById('fileInput').value = '';

  renderSubmissions();
  showToast('✅ Nộp bài thành công!', 'success');
  renderDashboardIfActive();
}

function renderSubmissions(filter = '') {
  const q = filter.toLowerCase();
  const list = [...state.submissions].reverse().filter(sub => {
    const s = state.students.find(x => x.id === sub.studentId);
    const hw = state.homeworks.find(h => h.id === sub.hwId);
    const name = s ? s.name.toLowerCase() : '';
    const hwName = hw ? hw.name.toLowerCase() : '';
    return name.includes(q) || hwName.includes(q);
  });

  const container = document.getElementById('submissionsList');
  container.innerHTML = list.length
    ? list.map(sub => {
        const s = state.students.find(x => x.id === sub.studentId);
        const hw = state.homeworks.find(h => h.id === sub.hwId);
        const scored = sub.score !== null && sub.score !== undefined;
        return `<div class="submission-item" onclick="viewSubmission(${sub.id})">
          <div class="sub-thumb">
            ${sub.images[0] ? `<img src="${sub.images[0]}" />` : '📄'}
          </div>
          <div class="sub-info">
            <div class="sub-name">${s ? `${avatar(s)} ${s.name}` : 'HS'}</div>
            <div class="sub-hw">${hw ? hw.name : 'Bài nộp'}</div>
            <div class="sub-time">${sub.time} · ${sub.images.length} ảnh</div>
          </div>
          <div class="sub-score-badge ${scored ? 'scored' : 'unscored'}">
            ${scored ? `<span>🏅 ${sub.score}đ</span>` : '<span>⏳ Chờ chấm</span>'}
            ${(sub.questions||[]).filter(q=>!q.reply).length > 0 ? `<span class="sub-q-dot" title="Có câu hỏi chưa trả lời">❓</span>` : ''}
          </div>
        </div>`;
      }).join('')
    : '<div class="empty-state">Chưa có bài nộp</div>';
}

function filterSubmissions() {
  renderSubmissions(document.getElementById('submissionSearch').value);
}

function viewSubmission(subId) {
  const sub = state.submissions.find(s => s.id === subId);
  if (!sub) return;
  const student = state.students.find(s => s.id === sub.studentId);
  const hw      = state.homeworks.find(h => h.id === sub.hwId);
  const admin   = isAdmin();

  // Đảm bảo các field mới luôn tồn tại (backward compat)
  if (sub.score === undefined) sub.score = null;
  if (!sub.feedback) sub.feedback = '';
  if (!sub.questions) sub.questions = [];

  document.getElementById('modalSubmissionTitle').textContent =
    '📷 Bài nộp – ' + (student ? student.name : 'HS');

  // ── Build: Điểm & Nhận xét ──
  const hasScore = (sub.score !== null && sub.score !== undefined && sub.score !== '');
  let feedbackHtml = '';
  if (admin) {
    feedbackHtml = '<div class="grade-box">'
      + '<h4>✏️ Chấm điểm &amp; Nhận xét</h4>'
      + '<div class="grade-row"><label>Điểm (0–10)</label>'
      + '<input type="number" id="gradeScore" min="0" max="10" step="0.5" class="grade-input"'
      + ' value="' + (hasScore ? sub.score : '') + '" placeholder="Nhập điểm..." /></div>'
      + '<div class="grade-row"><label>Nhận xét của admin</label>'
      + '<textarea id="gradeFeedback" class="grade-textarea" placeholder="Nhập nhận xét...">'
      + (sub.feedback || '') + '</textarea></div>'
      + '<button class="btn btn-primary" onclick="saveGrade(' + subId + ')">💾 Lưu điểm &amp; Nhận xét</button>'
      + '</div>';
  } else {
    if (hasScore) {
      feedbackHtml = '<div class="grade-result-box">'
        + '<div class="grade-score-display">🏅 Điểm: <strong>' + sub.score + '/10</strong></div>'
        + '<div class="grade-feedback-display">'
        + (sub.feedback
            ? '💬 Nhận xét: ' + sub.feedback
            : '<em style="color:var(--text-muted)">Chưa có nhận xét.</em>')
        + '</div></div>';
    } else {
      feedbackHtml = '<div class="grade-result-box unscored">'
        + '<div style="color:var(--text-muted);text-align:center;">⏳ Bài chưa được chấm điểm.</div>'
        + '</div>';
    }
  }

  // ── Build: Hỏi & Đáp ──
  let questionsHtml = '';
  if (sub.questions.length === 0) {
    questionsHtml = '<div class="empty-state" style="font-size:13px;">Chưa có câu hỏi nào.</div>';
  } else {
    sub.questions.forEach(function(q) {
      questionsHtml += '<div class="question-item">'
        + '<div class="q-text">❓ <strong>' + (q.studentName || 'Học sinh') + ':</strong> ' + q.text + '</div>'
        + '<div class="q-time">' + q.time + '</div>';
      if (q.reply) {
        questionsHtml += '<div class="q-reply">👑 <strong>Admin:</strong> ' + q.reply
          + '<div class="q-time">' + (q.replyTime || '') + '</div></div>';
      } else if (admin) {
        questionsHtml += '<div class="q-reply-form">'
          + '<textarea id="replyInput_' + q.id + '" class="grade-textarea" placeholder="Nhập câu trả lời..."></textarea>'
          + '<button class="btn btn-sm btn-primary" onclick="saveReply(' + subId + ',' + q.id + ')">↩️ Trả lời</button>'
          + '</div>';
      } else {
        questionsHtml += '<div class="q-reply pending">⌛ Chưa có trả lời từ admin.</div>';
      }
      questionsHtml += '</div>';
    });
  }

  let questionFormHtml = '';
  if (!admin) {
    questionFormHtml = '<div class="question-form" style="margin-top:10px;">'
      + '<textarea id="newQuestionInput" class="grade-textarea" placeholder="Nhập câu hỏi của bạn..."></textarea>'
      + '<button class="btn btn-primary" style="margin-top:8px;" onclick="submitQuestion(' + subId + ')">🙋 Hỏi Admin</button>'
      + '</div>';
  }

  let deleteBtn = '';
  if (admin) {
    deleteBtn = '<div style="margin-top:16px;display:flex;justify-content:flex-end;">'
      + '<button class="btn btn-danger" onclick="deleteSubmission(' + subId + ')">🗑 Xoá bài nộp</button>'
      + '</div>';
  }

  // ── Ghép lại ──
  let imagesHtml = '';
  sub.images.forEach(function(img) {
    imagesHtml += '<div class="sub-img-item" onclick="window.open(\'' + img + '\')">'
      + '<img src="' + img + '" alt="Ảnh bài nộp" loading="lazy" /></div>';
  });

  document.getElementById('modalSubmissionBody').innerHTML =
    '<div class="sub-meta-box">'
      + '<div style="font-weight:700;margin-bottom:4px;">' + (hw ? hw.name : 'Bài nộp') + '</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">Học sinh: ' + (student ? student.name : '–') + '</div>'
      + '<div style="font-size:13px;color:var(--text-muted);">Thời gian: ' + sub.time + '</div>'
      + (sub.note ? '<div style="margin-top:8px;font-size:13px;color:var(--text-secondary);">📝 ' + sub.note + '</div>' : '')
    + '</div>'
    + '<div class="sub-images-grid">' + imagesHtml + '</div>'
    + feedbackHtml
    + '<div class="question-section">'
      + '<h4>🙋 Hỏi &amp; Đáp</h4>'
      + '<div class="questions-list">' + questionsHtml + '</div>'
      + questionFormHtml
    + '</div>'
    + deleteBtn;

  openModal('modalSubmissionViewer');
}

function saveGrade(subId) {
  const sub = state.submissions.find(s => s.id === subId);
  if (!sub) return;
  const scoreVal = document.getElementById('gradeScore').value;
  const feedbackVal = document.getElementById('gradeFeedback').value.trim();
  if (scoreVal === '') { showToast('Vui lòng nhập điểm!', 'error'); return; }
  const score = parseFloat(scoreVal);
  if (isNaN(score) || score < 0 || score > 10) { showToast('Điểm phải từ 0 đến 10!', 'error'); return; }
  sub.score = score;
  sub.feedback = feedbackVal;
  renderSubmissions();
  viewSubmission(subId);
  showToast('✅ Đã lưu điểm & nhận xét!', 'success');
}

function submitQuestion(subId) {
  const sub = state.submissions.find(s => s.id === subId);
  if (!sub) return;
  const input = document.getElementById('newQuestionInput');
  const text = input ? input.value.trim() : '';
  if (!text) { showToast('Vui lòng nhập câu hỏi!', 'error'); return; }
  const session = getSession();
  if (!sub.questions) sub.questions = [];
  sub.questions.push({
    id: Date.now(),
    studentName: session ? session.fullname : 'Học sinh',
    text,
    time: new Date().toLocaleString('vi-VN'),
    reply: '',
    replyTime: '',
  });
  viewSubmission(subId);
  renderSubmissions();
  showToast('🙋 Đã gửi câu hỏi!', 'success');
}

function saveReply(subId, qId) {
  const sub = state.submissions.find(s => s.id === subId);
  if (!sub) return;
  const q = (sub.questions || []).find(q => q.id === qId);
  if (!q) return;
  const input = document.getElementById(`replyInput_${qId}`);
  const text = input ? input.value.trim() : '';
  if (!text) { showToast('Vui lòng nhập câu trả lời!', 'error'); return; }
  q.reply = text;
  q.replyTime = new Date().toLocaleString('vi-VN');
  viewSubmission(subId);
  renderSubmissions();
  showToast('↩️ Đã trả lời!', 'success');
}

function deleteSubmission(subId) {
  if (!confirm('Xoá bài nộp này?')) return;
  state.submissions = state.submissions.filter(s => s.id !== subId);
  closeModal();
  renderSubmissions();
  renderDashboardIfActive();
  showToast('Đã xoá bài nộp', 'info');
}

// ─── CONDUCT ──────────────────────────────────────────────────
function getConductRank(rec) {
  if (!rec) return null;
  const avg = (rec.attendance + rec.attitude + rec.discipline + rec.activity) / 4;
  const absentPenalty = rec.absent >= 5 ? 1 : rec.absent >= 3 ? 0.5 : 0;
  const effective = avg - absentPenalty;
  if (effective >= 4.5) return { label: 'Tốt',       cls: 'conduct-tot', icon: '🌟' };
  if (effective >= 3.5) return { label: 'Khá',       cls: 'conduct-kha', icon: '👍' };
  if (effective >= 2.5) return { label: 'Trung Bình', cls: 'conduct-tb',  icon: '📊' };
  return                       { label: 'Yếu',       cls: 'conduct-yeu', icon: '⚠️' };
}

function starsHtml(val, max = 5) {
  let s = '';
  for (let i = 1; i <= max; i++) s += i <= val ? '⭐' : '☆';
  return s;
}

function renderConduct() {
  const month = parseInt(document.getElementById('conductMonth').value);
  const q = (document.getElementById('conductSearch').value || '').toLowerCase();

  const list = state.students.filter(s => s.name.toLowerCase().includes(q));

  // Stats
  const counts = { 'Tốt': 0, 'Khá': 0, 'Trung Bình': 0, 'Yếu': 0, undef: 0 };
  list.forEach(s => {
    const rec = state.conduct[s.id] && state.conduct[s.id][month];
    if (rec) { const r = getConductRank(rec); if (r) counts[r.label]++; }
    else counts.undef++;
  });

  const statColors = { 'Tốt': '#34d399', 'Khá': '#38bdf8', 'Trung Bình': '#fbbf24', 'Yếu': '#f87171' };
  document.getElementById('conductStats').innerHTML = [
    { label: '🌟 Tốt',        val: counts['Tốt'],        col: '#34d399' },
    { label: '👍 Khá',        val: counts['Khá'],        col: '#38bdf8' },
    { label: '📊 Trung Bình', val: counts['Trung Bình'], col: '#fbbf24' },
    { label: '⚠️ Yếu',        val: counts['Yếu'],        col: '#f87171' },
    { label: '❓ Chưa đánh giá', val: counts.undef,      col: '#64748b' },
  ].map(x => `
    <div class="conduct-stat-card">
      <div class="conduct-stat-val" style="color:${x.col};">${x.val}</div>
      <div class="conduct-stat-label">${x.label}</div>
    </div>
  `).join('');

  // Table
  document.getElementById('conductBody').innerHTML = list.map((s, i) => {
    const rec = state.conduct[s.id] && state.conduct[s.id][month];
    const rank = rec ? getConductRank(rec) : null;
    const noteHtml = rec && rec.note
      ? `<div class="conduct-note-cell">${rec.note.replace(/\n/g, '<br>')}</div>`
      : '<span style="color:var(--text-muted);font-size:12px;">–</span>';
    return `<tr>
      <td style="color:var(--text-muted);font-size:12px;">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <span>${avatar(s)}</span>
          <span style="font-weight:600;">${s.name}</span>
        </div>
      </td>
      <td class="score-cell"><span class="stars-display">${rec ? starsHtml(rec.attendance) : '–'}</span></td>
      <td class="score-cell"><span class="stars-display">${rec ? starsHtml(rec.attitude)   : '–'}</span></td>
      <td class="score-cell"><span class="stars-display">${rec ? starsHtml(rec.discipline) : '–'}</span></td>
      <td class="score-cell"><span class="stars-display">${rec ? starsHtml(rec.activity)   : '–'}</span></td>
      <td class="conduct-note-col">${noteHtml}</td>
      <td><span class="conduct-badge ${rank ? rank.cls : 'conduct-tb'}">${rank ? rank.icon + ' ' + rank.label : '–'}</span></td>
      <td>
        ${isAdmin() ? `<button class="btn btn-secondary" style="padding:5px 12px;font-size:12px;" onclick="openConductEdit(${s.id},${month})">✏️ Đánh giá</button>` : ''}
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px;">Không có học sinh</td></tr>';
}

let _conductEditStudentId = null;
let _conductEditMonth = null;
let _conductTempRatings = { attendance: 0, attitude: 0, discipline: 0, activity: 0 };

function openConductEdit(studentId, month) {
  const s = state.students.find(x => x.id === studentId);
  if (!s) return;
  _conductEditStudentId = studentId;
  _conductEditMonth = month;

  if (!state.conduct[studentId]) state.conduct[studentId] = {};
  const rec = state.conduct[studentId][month] || { attendance: 3, attitude: 3, discipline: 3, activity: 3, absent: 0, note: '' };
  _conductTempRatings = { attendance: rec.attendance, attitude: rec.attitude, discipline: rec.discipline, activity: rec.activity };

  document.getElementById('conductEditTitle').textContent = `🌟 Hạnh Kiểm – ${s.name} (Tháng ${month})`;
  document.getElementById('conductAbsent').value = rec.absent || 0;
  document.getElementById('conductNote').value = rec.note || '';

  // Render star widgets
  renderStarWidget('starAttendance', 'attendance', _conductTempRatings.attendance);
  renderStarWidget('starAttitude',   'attitude',   _conductTempRatings.attitude);
  renderStarWidget('starDiscipline', 'discipline', _conductTempRatings.discipline);
  renderStarWidget('starActivity',   'activity',   _conductTempRatings.activity);

  updateConductPreview();
  openModal('modalConductEdit');
}

function renderStarWidget(containerId, field, currentVal) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= currentVal ? ' active' : '');
    star.textContent = '⭐';
    star.dataset.val = i;
    star.onclick = () => {
      _conductTempRatings[field] = i;
      renderStarWidget(containerId, field, i);
      updateConductPreview();
    };
    el.appendChild(star);
  }
}

function updateConductPreview() {
  const absent = parseInt(document.getElementById('conductAbsent').value) || 0;
  const rec = { ..._conductTempRatings, absent };
  const rank = getConductRank(rec);
  const el = document.getElementById('conductPreviewRank');
  if (rank) {
    el.innerHTML = `<span class="conduct-badge ${rank.cls}" style="font-size:14px;padding:6px 16px;">${rank.icon} ${rank.label}</span>`;
  }
}

// listen to absent input change for live preview
document.addEventListener('DOMContentLoaded', () => {
  const absentInput = document.getElementById('conductAbsent');
  if (absentInput) absentInput.addEventListener('input', updateConductPreview);

  // ─── Counter ký tự nhận xét hạnh kiểm ───
  const noteInput = document.getElementById('conductNote');
  const noteCount = document.getElementById('conductNoteCount');
  if (noteInput && noteCount) {
    noteInput.addEventListener('input', () => {
      noteCount.textContent = `${noteInput.value.length} / 500 ký tự`;
    });
  }
});

function saveConductEdit() {
  if (!_conductEditStudentId || !_conductEditMonth) return;
  const absent = parseInt(document.getElementById('conductAbsent').value) || 0;
  const note = document.getElementById('conductNote').value.trim();
  if (!state.conduct[_conductEditStudentId]) state.conduct[_conductEditStudentId] = {};
  state.conduct[_conductEditStudentId][_conductEditMonth] = {
    ..._conductTempRatings,
    absent,
    note,
  };
  closeModal();
  renderConduct();
  renderDashboardIfActive();
  const s = state.students.find(x => x.id === _conductEditStudentId);
  showToast(`✅ Đã lưu hạnh kiểm tháng ${_conductEditMonth} cho ${s ? s.name : 'học sinh'}`, 'success');
}

// ─── MODAL HELPERS ────────────────────────────────────────────
function openModal(id) {
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById(id).classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── UTILS ────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderDashboardIfActive() {
  if (document.getElementById('page-dashboard').classList.contains('active')) {
    renderDashboard();
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = state.students.length;
}

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  initSampleData();
  initDate();
  // Set conduct month dropdown to current month
  const monthSel = document.getElementById('conductMonth');
  if (monthSel) monthSel.value = new Date().getMonth() + 1;
  renderDashboard();
  renderStudents();
  renderScoresTable();

  // ── Auth check on load ──
  const session = getSession();
  if (session) {
    showApp(session);
  }
  // Otherwise auth overlay stays visible (already shown by default)

  // ── Enter key for login/register forms ──
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('loginUsername').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('regConfirm').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleRegister();
  });
}

document.addEventListener('DOMContentLoaded', init);

// ─── TIMETABLE ────────────────────────────────────────────────
const DAYS    = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const PERIODS_MORNING   = ['Tiết 1', 'Tiết 2', 'Tiết 3', 'Tiết 4', 'Tiết 5'];
const PERIODS_AFTERNOON = ['Tiết 6', 'Tiết 7', 'Tiết 8', 'Tiết 9'];

function getSubjectColor(name) {
  if (!name) return 'transparent';
  return SUBJECT_COLORS[name] || '#64748b';
}

function buildTimetableSection(label, emoji, periods, ttData, todayCol) {
  return `
    <div class="timetable-section-label">${emoji} ${label}</div>
    <div class="table-wrapper" style="margin-bottom:24px;">
      <table class="scores-table timetable-table">
        <thead>
          <tr>
            <th style="min-width:72px;">Tiết</th>
            ${DAYS.map((d, i) => `
              <th class="${i === todayCol ? 'tt-today-col' : ''}">${d}${i === todayCol ? ' 📍' : ''}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${periods.map((p, pi) => `
            <tr>
              <td class="tt-period-label">${p}</td>
              ${DAYS.map((d, di) => {
                const sub = (ttData[pi] && ttData[pi][di]) ? ttData[pi][di] : '';
                const col = getSubjectColor(sub);
                const isToday = di === todayCol;
                return `<td style="text-align:center;padding:8px 6px;">
                  ${sub
                    ? `<span class="tt-subject-pill${isToday ? ' tt-subject-today' : ''}" style="background:${col}20;color:${col};border-color:${col}50;">${sub}</span>`
                    : `<span style="color:var(--text-muted);font-size:12px;">–</span>`
                  }
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTimetable() {
  const adminBar = document.getElementById('timetableAdminBar');
  if (adminBar) adminBar.style.display = isAdmin() ? 'flex' : 'none';

  const today    = new Date().getDay(); // 0=CN,1=T2,...,6=T7
  const todayCol = (today >= 2 && today <= 7) ? today - 2 : -1;

  const tt = state.timetable;

  let html = buildTimetableSection('Buổi Sáng', '☀️', PERIODS_MORNING,   tt.morning,   todayCol);
  html    += buildTimetableSection('Buổi Chiều', '🌙', PERIODS_AFTERNOON, tt.afternoon, todayCol);

  // Legend màu môn
  html += `<div class="tt-legend">
    ${Object.entries(SUBJECT_COLORS).map(([name, col]) => `
      <span class="tt-legend-pill" style="background:${col}20;color:${col};border-color:${col}44;">${name}</span>
    `).join('')}
  </div>`;

  document.getElementById('timetableView').innerHTML = html;
}

function buildEditSection(label, emoji, periodLabels, prefix, ttData) {
  const rows = periodLabels.map((p, pi) => `
    <tr>
      <td class="tt-period-label">${p}</td>
      ${DAYS.map((d, di) => `
        <td>
          <input type="text"
            class="input-field tt-edit-input"
            id="${prefix}_${pi}_${di}"
            value="${(ttData[pi] && ttData[pi][di]) ? ttData[pi][di] : ''}"
            placeholder="–"
            list="subjectList"
          />
        </td>
      `).join('')}
    </tr>
  `).join('');

  return `
    <div class="timetable-section-label" style="margin-top:16px;">${emoji} ${label}</div>
    <div class="table-wrapper" style="margin-bottom:20px;">
      <table class="scores-table timetable-table">
        <thead>
          <tr>
            <th style="min-width:72px;">Tiết</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function openTimetableEdit() {
  if (!isAdmin()) return;
  const tt = state.timetable;

  let html = '';
  html += buildEditSection('Buổi Sáng',  '☀️', PERIODS_MORNING,   'ttm', tt.morning);
  html += buildEditSection('Buổi Chiều', '🌙', PERIODS_AFTERNOON, 'tta', tt.afternoon);

  document.getElementById('timetableEditBody').innerHTML = html;

  if (!document.getElementById('subjectList')) {
    const dl = document.createElement('datalist');
    dl.id = 'subjectList';
    [...Object.keys(SUBJECT_COLORS), 'Tin', 'Mỹ thuật', 'Công nghệ'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      dl.appendChild(opt);
    });
    document.body.appendChild(dl);
  }

  openModal('modalTimetableEdit');
}

function saveTimetable() {
  const readSection = (prefix, periods) => periods.map((p, pi) =>
    DAYS.map((d, di) => {
      const el = document.getElementById(`${prefix}_${pi}_${di}`);
      return el ? el.value.trim() : '';
    })
  );
  state.timetable = {
    morning:   readSection('ttm', PERIODS_MORNING),
    afternoon: readSection('tta', PERIODS_AFTERNOON),
  };
  closeModal();
  renderTimetable();
  showToast('✅ Đã lưu thời khóa biểu!', 'success');
}

