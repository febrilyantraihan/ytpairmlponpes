/**
 * YTPAI RAUDLATUL MUTA'ALLIMIN LAMONGAN - ADMIN BACKOFFICE CMS
 * Full CRUD operations, status management, Excel export, backup & restore
 */

const initialHashTab = (window.location.hash ? window.location.hash.replace(/^#/, '') : '');
let currentTab = initialHashTab || 'dashboard';
let activeEditTarget = null; // { type, id }

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSidebar();
  loadCurrentTab();
});

/* 1. AUTHENTICATION, RBAC, BRUTE-FORCE SHIELD & 15-MINUTE INACTIVITY AUTO LOGOUT */
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Menit Tidak Ada Interaksi
const MAX_LOGIN_ATTEMPTS = 5; // Batas maksimal percobaan salah berturut-turut
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 Menit penguncian sementara jika terdeteksi brute force
let lastActivityTimestamp = Date.now();
let inactivityCheckInterval = null;
let lockoutCountdownInterval = null;

function getLoginAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem('ytpai_login_attempts') || '{}');
    return {
      count: Number(data.count) || 0,
      lockedUntil: Number(data.lockedUntil) || 0
    };
  } catch (e) {
    return { count: 0, lockedUntil: 0 };
  }
}

function recordFailedLoginAttempt(username) {
  const attempts = getLoginAttempts();
  attempts.count = (attempts.count || 0) + 1;
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    logSecurityEvent('BRUTE_FORCE_LOCKOUT', username, `Akses login dikunci sementara 5 menit karena ${attempts.count}x percobaan salah berturut-turut.`);
  } else {
    logSecurityEvent('LOGIN_FAILED', username, `Percobaan login gagal (${attempts.count}/${MAX_LOGIN_ATTEMPTS})`);
  }
  localStorage.setItem('ytpai_login_attempts', JSON.stringify(attempts));
  return attempts;
}

function resetLoginAttempts(username) {
  localStorage.removeItem('ytpai_login_attempts');
  if (lockoutCountdownInterval) {
    clearInterval(lockoutCountdownInterval);
    lockoutCountdownInterval = null;
  }
  logSecurityEvent('LOGIN_SUCCESS', username, 'Autentikasi kredensial berhasil diverifikasi.');
}

function checkLockoutStatus() {
  const attempts = getLoginAttempts();
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return {
      locked: true,
      remainingSec: Math.ceil((attempts.lockedUntil - Date.now()) / 1000)
    };
  }
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    localStorage.removeItem('ytpai_login_attempts');
  }
  return { locked: false, remainingSec: 0 };
}

function updateLockoutUI() {
  const status = checkLockoutStatus();
  const submitBtn = document.getElementById('loginSubmitBtn');
  const submitText = document.getElementById('loginSubmitText');
  const alertBox = document.getElementById('loginAlert');
  const userInput = document.getElementById('adminUser');
  const pinInput = document.getElementById('adminPin');

  if (status.locked) {
    if (submitBtn) submitBtn.disabled = true;
    if (userInput) userInput.disabled = true;
    if (pinInput) pinInput.disabled = true;
    if (submitText) submitText.textContent = `Terkunci (${status.remainingSec}s)`;
    if (alertBox) {
      alertBox.className = 'login-alert-banner alert-danger';
      alertBox.innerHTML = `🔒 <strong>Akses Terkunci Sementara:</strong> Terdeteksi ${MAX_LOGIN_ATTEMPTS}x percobaan login salah. Demi keamanan data madrasah, silakan tunggu <strong><span id="lockoutSec">${status.remainingSec}</span> detik</strong> sebelum mencoba kembali.`;
      alertBox.style.display = 'block';
    }

    if (!lockoutCountdownInterval) {
      lockoutCountdownInterval = setInterval(() => {
        const curStatus = checkLockoutStatus();
        const secSpan = document.getElementById('lockoutSec');
        if (secSpan) secSpan.textContent = curStatus.remainingSec;
        if (submitText) submitText.textContent = `Terkunci (${curStatus.remainingSec}s)`;

        if (!curStatus.locked) {
          clearInterval(lockoutCountdownInterval);
          lockoutCountdownInterval = null;
          if (submitBtn) submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'Buka Panel Admin';
          if (userInput) userInput.disabled = false;
          if (pinInput) {
            pinInput.disabled = false;
            pinInput.focus();
          }
          if (alertBox) {
            alertBox.className = 'login-alert-banner alert-success';
            alertBox.innerHTML = '🔓 <strong>Kunci Berakhir:</strong> Silakan masukkan nama akun dan kata sandi yang valid.';
            alertBox.style.display = 'block';
          }
        }
      }, 1000);
    }
    return true;
  } else {
    if (lockoutCountdownInterval) {
      clearInterval(lockoutCountdownInterval);
      lockoutCountdownInterval = null;
    }
    if (submitBtn && submitBtn.disabled && submitText && submitText.textContent.startsWith('Terkunci')) {
      submitBtn.disabled = false;
      submitText.textContent = 'Buka Panel Admin';
      if (userInput) userInput.disabled = false;
      if (pinInput) pinInput.disabled = false;
      if (alertBox) alertBox.style.display = 'none';
    }
    return false;
  }
}

function logSecurityEvent(type, targetUser, details) {
  try {
    const logs = JSON.parse(localStorage.getItem('ytpai_security_logs') || '[]');
    logs.unshift({
      id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleString('id-ID'),
      type: type,
      user: targetUser || 'anonymous',
      details: details,
      userAgent: (navigator.userAgent || '').substring(0, 80)
    });
    if (logs.length > 80) logs.length = 80;
    localStorage.setItem('ytpai_security_logs', JSON.stringify(logs));
  } catch (e) {}
}

function generateSessionToken(user) {
  let entropy = '';
  try {
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    entropy = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    entropy = Math.random().toString(36).substr(2, 10) + Date.now().toString(36);
  }
  return `ytp_${(user && user.id) || 'usr'}_${Date.now()}_${entropy}`;
}

function recordUserActivity() {
  lastActivityTimestamp = Date.now();
  try {
    localStorage.setItem('ytpai_last_activity', lastActivityTimestamp.toString());
  } catch (e) {}
}

let activityThrottleTimer = null;
function throttledRecordActivity() {
  if (!activityThrottleTimer) {
    recordUserActivity();
    activityThrottleTimer = setTimeout(() => {
      activityThrottleTimer = null;
    }, 2000);
  }
}

function startInactivityMonitor() {
  recordUserActivity();
  
  // Tangkap seluruh bentuk interaksi pengguna di layar (mouse, ketikan, sentuhan hp, scroll)
  const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];
  activityEvents.forEach(evt => {
    window.addEventListener(evt, throttledRecordActivity, { passive: true });
  });

  // Periksa setiap 5 detik
  if (inactivityCheckInterval) clearInterval(inactivityCheckInterval);
  inactivityCheckInterval = setInterval(() => {
    const isLogged = localStorage.getItem('ytpai_admin_auth') === 'true' || sessionStorage.getItem('ytpai_admin_auth') === 'true';
    if (!isLogged) return;

    // Validasi token sesi aktif
    const activeUser = getActiveAdminUser();
    const storedToken = localStorage.getItem('ytpai_session_token') || sessionStorage.getItem('ytpai_session_token');
    if (!activeUser || !storedToken || activeUser.sessionToken !== storedToken) {
      console.warn('[Keamanan Backoffice] Token sesi tidak valid atau sesi ganda terdeteksi. Melakukan logout otomatis.');
      triggerAutoLogoutDueToInactivity();
      return;
    }

    let lastTime = lastActivityTimestamp;
    try {
      const storedTime = parseInt(localStorage.getItem('ytpai_last_activity') || '0', 10);
      if (storedTime > lastTime) lastTime = storedTime;
    } catch (e) {}

    const idleTime = Date.now() - lastTime;
    if (idleTime >= INACTIVITY_TIMEOUT_MS) {
      console.warn(`[Keamanan Backoffice] Sesi kadaluarsa setelah ${Math.round(idleTime / 1000)} detik tanpa aktivitas. Melakukan auto logout.`);
      triggerAutoLogoutDueToInactivity();
    }
  }, 5000);
}

function triggerAutoLogoutDueToInactivity() {
  localStorage.removeItem('ytpai_admin_auth');
  localStorage.removeItem('ytpai_admin_session');
  localStorage.removeItem('ytpai_session_token');
  sessionStorage.removeItem('ytpai_admin_auth');
  sessionStorage.removeItem('ytpai_admin_session');
  sessionStorage.removeItem('ytpai_session_token');
  localStorage.removeItem('ytpai_last_activity');

  const loginOverlay = document.getElementById('loginOverlay');
  if (loginOverlay) loginOverlay.style.display = 'flex';

  const alertBox = document.getElementById('loginAlert');
  if (alertBox) {
    alertBox.className = 'login-alert-banner alert-danger';
    alertBox.innerHTML = '🔒 <strong>Sesi Berakhir Otomatis:</strong> Demi keamanan akun pengelola, sistem telah logout otomatis karena tidak ada aktivitas selama 15 menit. Silakan login kembali.';
    alertBox.style.display = 'block';
  }

  const loginCard = document.getElementById('loginCard');
  if (loginCard) {
    loginCard.classList.remove('shake-animation');
    void loginCard.offsetWidth;
    loginCard.classList.add('shake-animation');
  }

  const pinInput = document.getElementById('adminPin');
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }
  updateLockoutUI();
}

function getActiveAdminUser() {
  const sessionStr = localStorage.getItem('ytpai_admin_session') || sessionStorage.getItem('ytpai_admin_session');
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

function initAuth() {
  startInactivityMonitor();
  updateLockoutUI();

  const isLogged = localStorage.getItem('ytpai_admin_auth') === 'true' || sessionStorage.getItem('ytpai_admin_auth') === 'true';
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');

  if (isLogged) {
    const user = getActiveAdminUser();
    const storedToken = localStorage.getItem('ytpai_session_token') || sessionStorage.getItem('ytpai_session_token');
    if (user && storedToken && user.sessionToken === storedToken) {
      applyRolePermissions(user);
      if (loginOverlay) loginOverlay.style.display = 'none';
    } else {
      triggerAutoLogoutDueToInactivity();
    }
  } else {
    if (loginOverlay) loginOverlay.style.display = 'flex';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Cegah submit jika dalam status lockout
      if (updateLockoutUI()) {
        return;
      }

      const userInput = document.getElementById('adminUser');
      const pinInput = document.getElementById('adminPin');
      const alertBox = document.getElementById('loginAlert');
      const submitBtn = document.getElementById('loginSubmitBtn');
      const submitText = document.getElementById('loginSubmitText');
      const loginCard = document.getElementById('loginCard');
      const rememberCheckbox = document.getElementById('adminRememberMe');
      
      const username = (userInput ? userInput.value.trim() : '').toLowerCase();
      const pin = pinInput ? pinInput.value.trim() : '';

      if (!username || !pin) {
        if (alertBox) {
          alertBox.className = 'login-alert-banner alert-danger';
          alertBox.innerHTML = '⚠️ <strong>Data Belum Lengkap:</strong> Harap masukkan nama akun dan kata sandi Anda.';
          alertBox.style.display = 'block';
        }
        return;
      }

      const db = getDB();
      const users = db.adminUsers || [];
      
      // Strict matching: Kata sandi wajib persis sesuai database akun masing-masing
      let matchedUser = users.find(u => (u.username || '').toLowerCase() === username && u.password === pin);
      
      // Fallback darurat HANYA untuk Super Admin pertama kali jika database kosong
      if (!matchedUser && (!users || users.length === 0) && (username === 'admin' || username === 'superadmin') && pin === 'admin123') {
        matchedUser = {
          id: 'usr-superadmin',
          username: 'admin',
          name: 'Pimpinan Yayasan (Super Admin)',
          role: 'superadmin',
          roleName: 'Super Admin (Penuh)',
          status: 'active',
          avatar: '👑'
        };
      }

      if (matchedUser) {
        if (matchedUser.status === 'inactive') {
          logSecurityEvent('LOGIN_BLOCKED_INACTIVE', username, 'Upaya login ditolak karena status akun dinonaktifkan.');
          if (alertBox) {
            alertBox.className = 'login-alert-banner alert-danger';
            alertBox.innerHTML = '⚠️ <strong>Akun Dinonaktifkan:</strong> Akun ini telah dibekukan. Hubungi Super Admin Yayasan untuk verifikasi ulang.';
            alertBox.style.display = 'block';
          }
          return;
        }

        // Reset kegagalan login karena berhasil
        resetLoginAttempts(username);

        if (alertBox) {
          alertBox.className = 'login-alert-banner alert-success';
          alertBox.innerHTML = `✅ <strong>Login Berhasil!</strong> Selamat datang, <strong>${matchedUser.name}</strong> (${matchedUser.roleName || matchedUser.role}). Mengamankan sesi...`;
          alertBox.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          if (submitText) submitText.textContent = 'Membuka Dasbor...';
        }

        setTimeout(() => {
          const sessionToken = generateSessionToken(matchedUser);
          const userSession = {
            id: matchedUser.id,
            username: matchedUser.username,
            name: matchedUser.name,
            role: matchedUser.role,
            roleName: matchedUser.roleName || matchedUser.role,
            status: matchedUser.status || 'active',
            avatar: matchedUser.avatar || '👤',
            unitId: matchedUser.unitId || null,
            email: matchedUser.email || '',
            sessionToken: sessionToken,
            loginAt: Date.now()
          };

          if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('ytpai_admin_auth', 'true');
            localStorage.setItem('ytpai_admin_session', JSON.stringify(userSession));
            localStorage.setItem('ytpai_session_token', sessionToken);
          } else {
            sessionStorage.setItem('ytpai_admin_auth', 'true');
            sessionStorage.setItem('ytpai_admin_session', JSON.stringify(userSession));
            sessionStorage.setItem('ytpai_session_token', sessionToken);
          }

          recordUserActivity();
          applyRolePermissions(userSession);
          if (loginOverlay) loginOverlay.style.display = 'none';

          // Arahkan otomatis ke tab yang sesuai dengan perannya
          if (userSession.role === 'kbihu') {
            window.switchToTab('kbihu');
          } else if (userSession.role === 'lbb') {
            window.switchToTab('lbb');
          } else if (userSession.role.startsWith('unit_')) {
            window.switchToTab('units');
          } else {
            window.switchToTab('dashboard');
          }

          if (alertBox) alertBox.style.display = 'none';
          if (submitBtn) {
            submitBtn.disabled = false;
            if (submitText) submitText.textContent = 'Buka Panel Admin';
          }
        }, 380);
      } else {
        // Catat kegagalan login dan periksa batasan brute force
        const attempts = recordFailedLoginAttempt(username);
        
        if (loginCard) {
          loginCard.classList.remove('shake-animation');
          void loginCard.offsetWidth; // trigger reflow
          loginCard.classList.add('shake-animation');
        }

        if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
          updateLockoutUI();
        } else {
          const sisaPercobaan = MAX_LOGIN_ATTEMPTS - attempts.count;
          if (alertBox) {
            alertBox.className = 'login-alert-banner alert-danger';
            alertBox.innerHTML = `⚠️ <strong>Kredensial Tidak Cocok!</strong> Username atau kata sandi salah.<br><small style="font-size:0.75rem; opacity:0.9;">Tersisa <strong>${sisaPercobaan}x percobaan lagi</strong> sebelum akun terkunci 5 menit.</small>`;
            alertBox.style.display = 'block';
          }
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
        }
      }
    });
  }
}

window.applyRolePermissions = function(user) {
  if (!user) user = { username: 'admin', name: 'Super Admin', role: 'superadmin', roleName: 'Super Admin (Penuh)', avatar: '👑' };

  // Update Header User Profile Badge
  const nameEl = document.getElementById('adminUserName');
  const roleEl = document.getElementById('adminUserRoleBadge');
  const avatarEl = document.getElementById('adminUserAvatar');
  if (nameEl) nameEl.textContent = user.name || user.username;
  if (roleEl) roleEl.textContent = user.roleName || user.role;
  if (avatarEl) avatarEl.textContent = user.avatar || '👤';

  const userRole = user.role || 'superadmin';
  const userUnitId = (user.unitId || '').toLowerCase();

  // 1. Reset visibilitas semua elemen tree
  document.querySelectorAll('.tree-item, .tree-subitem, .tree-folder').forEach(el => {
    el.style.display = '';
  });

  // 2. Filter folder dan sub-item bilah samping sesuai hak akses
  const folders = document.querySelectorAll('.tree-folder');

  if (userRole === 'superadmin') {
    folders.forEach(folder => {
      folder.style.display = '';
    });
  } else if (userRole === 'kbihu') {
    folders.forEach(folder => {
      const fKey = folder.getAttribute('data-folder');
      if (fKey === 'kbihu') {
        folder.style.display = '';
        folder.classList.add('open');
      } else if (fKey === 'santri') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'messages') item.style.display = 'none';
        });
      } else if (fKey === 'publikasi') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'news') item.style.display = 'none';
        });
      } else {
        folder.style.display = 'none';
      }
    });
  } else if (userRole === 'lbb') {
    folders.forEach(folder => {
      const fKey = folder.getAttribute('data-folder');
      if (fKey === 'lbb') {
        folder.style.display = '';
        folder.classList.add('open');
      } else if (fKey === 'santri') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'messages') item.style.display = 'none';
        });
      } else if (fKey === 'publikasi') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'news') item.style.display = 'none';
        });
      } else {
        folder.style.display = 'none';
      }
    });
  } else if (userRole === 'unit_ponpes') {
    folders.forEach(folder => {
      const fKey = folder.getAttribute('data-folder');
      if (fKey === 'pesantren') {
        folder.style.display = '';
        folder.classList.add('open');
      } else if (fKey === 'santri') {
        folder.style.display = '';
        folder.classList.add('open');
      } else if (fKey === 'publikasi') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'news') item.style.display = 'none';
        });
      } else {
        folder.style.display = 'none';
      }
    });
  } else if (userRole === 'unit_madin' || userRole === 'unit_lpba') {
    folders.forEach(folder => {
      const fKey = folder.getAttribute('data-folder');
      if (fKey === 'nonformal') {
        folder.style.display = '';
        folder.classList.add('open');
      } else if (fKey === 'publikasi') {
        folder.style.display = '';
        folder.classList.add('open');
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'news') item.style.display = 'none';
        });
      } else {
        folder.style.display = 'none';
      }
    });
  } else if (userRole.startsWith('unit_')) {
    folders.forEach(folder => {
      const fKey = folder.getAttribute('data-folder');
      if (fKey === 'units') {
        folder.style.display = '';
        folder.classList.add('open');
        // Sembunyikan item induk "Semua Satuan Formal"
        const allUnitsItem = folder.querySelector('.tree-item[data-tab="units"]');
        if (allUnitsItem) allUnitsItem.style.display = 'none';
        // Dalam grup subitems, hanya tampilkan unit yang dikelola oleh admin ini
        folder.querySelectorAll('.tree-subitem').forEach(sub => {
          const onclickAttr = sub.getAttribute('onclick') || '';
          if (userUnitId && onclickAttr.includes(`'${userUnitId}'`)) {
            sub.style.display = '';
            sub.classList.add('active');
          } else {
            sub.style.display = 'none';
          }
        });
      } else if (fKey === 'santri') {
        folder.style.display = '';
        folder.classList.add('open');
        // Hanya tampilkan modul Pendaftar PPDB Online & Kotak Pesan
        folder.querySelectorAll('.tree-item').forEach(item => {
          const tabKey = item.getAttribute('data-tab');
          if (tabKey !== 'leads' && tabKey !== 'messages') item.style.display = 'none';
        });
      } else if (fKey === 'publikasi') {
        folder.style.display = '';
        folder.classList.add('open');
        // Hanya tampilkan Warta & Berita
        folder.querySelectorAll('.tree-item').forEach(item => {
          if (item.getAttribute('data-tab') !== 'news') item.style.display = 'none';
        });
      } else {
        folder.style.display = 'none';
      }
    });
  }

  // 3. Filter juga tombol modern nav-item-btn di sidebar baru
  const navBtns = document.querySelectorAll('.nav-item-btn');
  let allowedTabs = null;
  if (userRole === 'lbb') {
    allowedTabs = ['dashboard', 'lbb', 'messages', 'news', 'testimonials'];
  } else if (userRole === 'kbihu') {
    allowedTabs = ['dashboard', 'kbihu', 'messages', 'news'];
  } else if (userRole === 'unit_ponpes') {
    allowedTabs = ['dashboard', 'boarding', 'leads', 'messages', 'news'];
  } else if (userRole === 'unit_madin' || userRole === 'unit_lpba') {
    allowedTabs = ['dashboard', 'units', 'messages', 'news'];
  } else if (userRole.startsWith('unit_')) {
    allowedTabs = ['dashboard', 'units', 'leads', 'messages', 'news'];
  }

  if (allowedTabs) {
    navBtns.forEach(btn => {
      const tabKey = btn.getAttribute('data-tab');
      if (allowedTabs.includes(tabKey)) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });
    if (userRole === 'lbb' && typeof window.switchToTab === 'function') {
      setTimeout(() => window.switchToTab('lbb'), 50);
    } else if (userRole === 'kbihu' && typeof window.switchToTab === 'function') {
      setTimeout(() => window.switchToTab('kbihu'), 50);
    }
  } else {
    navBtns.forEach(btn => {
      btn.style.display = '';
    });
  }
};

window.selectQuickAccount = function() {
  console.warn('[Keamanan Backoffice] Fitur demo pemilihan akun otomatis dinonaktifkan demi privasi dan integritas sistem.');
};

window.togglePasswordVisibility = function() {
  const pinInput = document.getElementById('adminPin');
  const eyeIcon = document.getElementById('eyeIcon');
  if (!pinInput) return;

  if (pinInput.type === 'password') {
    pinInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    }
  } else {
    pinInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  }
};

window.autoFillDefaultPin = function() {
  console.warn('[Keamanan Backoffice] Tombol isi cepat PIN demo dinonaktifkan demi mematuhi standar keamanan institusional.');
};

window.adminLogout = function(message) {
  const doLogout = () => {
    const user = getActiveAdminUser();
    if (user && user.username) {
      logSecurityEvent('LOGOUT_MANUAL', user.username, 'Sesi pengguna ditutup secara sadar oleh pengelola.');
    }
    localStorage.removeItem('ytpai_admin_auth');
    localStorage.removeItem('ytpai_admin_session');
    localStorage.removeItem('ytpai_session_token');
    sessionStorage.removeItem('ytpai_admin_auth');
    sessionStorage.removeItem('ytpai_admin_session');
    sessionStorage.removeItem('ytpai_session_token');
    localStorage.removeItem('ytpai_last_activity');

    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';

    const alertBox = document.getElementById('loginAlert');
    if (alertBox) {
      alertBox.className = 'login-alert-banner alert-success';
      alertBox.innerHTML = message || '👋 <strong>Anda telah logout.</strong> Sesi panel Backoffice CMS telah ditutup dengan aman.';
      alertBox.style.display = 'block';
    }

    const pinInput = document.getElementById('adminPin');
    if (pinInput) pinInput.value = '';

    updateLockoutUI();
    if (!message) {
      location.reload();
    }
  };

  if (message) {
    doLogout();
  } else if (confirm('Yakin ingin keluar dari panel admin?')) {
    doLogout();
  }
};

/* ==========================================================================
   SMART IMAGE UPLOADER & AUTO-COMPRESSOR (HTML5 CANVAS)
   Mengubah foto resolusi tinggi kamera (5-15MB) menjadi foto super ringan
   (~80-180KB) dengan kualitas WebP tajam & jernih (resolusi optimal 1200-1600px)
   ========================================================================== */

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Kompresi gambar langsung di browser tanpa server
 */
window.compressImageFile = function(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan gambar valid.'));
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale secara proporsional jika melebihi batas resolusi optimal
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Algoritma smoothing kualitas tinggi (high quality bicubic)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prioritaskan WebP untuk kompresi maksimal dengan ketajaman tinggi
        let dataUrl = canvas.toDataURL('image/webp', quality);
        let format = 'WebP';
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          format = 'JPEG';
        }

        // Estimasi ukuran file base64 dalam bytes
        const compressedSize = Math.round((dataUrl.length * 3) / 4);
        const percentSaved = Math.max(0, Math.round((1 - compressedSize / originalSize) * 100));

        resolve({
          dataUrl,
          width,
          height,
          originalSize,
          compressedSize,
          percentSaved,
          format
        });
      };

      img.onerror = function() {
        reject(new Error('Gagal memuat gambar untuk dioptimalkan.'));
      };

      img.src = e.target.result;
    };

    reader.onerror = function() {
      reject(new Error('Gagal membaca file dari perangkat.'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Handle pemilihan file dari perangkat - otomatis membuka Studio Penyesuaian Foto
 */
window.handleSmartImageUpload = function(inputElem, targetInputId, maxWidth = 1200, previewRatio = 'portrait') {
  const file = inputElem.files && inputElem.files[0];
  if (!file) return;

  const statBadge = document.getElementById('stat_' + targetInputId);
  if (statBadge) {
    statBadge.style.display = 'inline-flex';
    statBadge.style.color = '#1E40AF';
    statBadge.style.background = '#DBEAFE';
    statBadge.style.borderColor = '#BFDBFE';
    statBadge.innerHTML = `⚡ Membuka Studio Penyesuaian Foto...`;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    inputElem.value = ''; // Reset input agar bisa memilih ulang file yang sama
    openImageCropper(targetInputId, dataUrl, previewRatio);
  };
  reader.onerror = function() {
    alert('Gagal membaca file dari perangkat.');
  };
  reader.readAsDataURL(file);
};

/* ==========================================================================
   INTERACTIVE PHOTO ADJUSTMENT STUDIO (HTML5 CANVAS)
   Crop, Pan, Zoom, Fine Rotation (-45° to +45°), 90° Quick Rotate, Flip & Presets
   ========================================================================== */

let cropperState = {
  img: null,
  imgWidth: 0,
  imgHeight: 0,
  scale: 1.0,
  baseScale: 1.0,
  fineRotateDeg: 0,
  rot90Steps: 0,
  flipH: 1,
  panX: 0,
  panY: 0,
  cropBoxWidth: 240,
  cropBoxHeight: 300,
  ratio: '4:5',
  targetInputId: null,
  maxWidth: 1200,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0
};

let cropperEventsBound = false;

function computeBaseScale() {
  if (!cropperState.img) return 1.0;
  const boxW = cropperState.cropBoxWidth || 240;
  const boxH = cropperState.cropBoxHeight || 300;
  const totalDeg = (cropperState.rot90Steps * 90) + cropperState.fineRotateDeg;
  const rad = (totalDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const hw = boxW / 2;
  const hh = boxH / 2;
  const corners = [
    { x: -hw, y: -hh },
    { x:  hw, y: -hh },
    { x: -hw, y:  hh },
    { x:  hw, y:  hh }
  ];

  let maxCornerU = 0, maxCornerV = 0;
  for (let i = 0; i < 4; i++) {
    const cu = Math.abs(corners[i].x * cos + corners[i].y * sin);
    const cv = Math.abs(-corners[i].x * sin + corners[i].y * cos);
    if (cu > maxCornerU) maxCornerU = cu;
    if (cv > maxCornerV) maxCornerV = cv;
  }

  const scaleX = (2 * maxCornerU) / cropperState.imgWidth;
  const scaleY = (2 * maxCornerV) / cropperState.imgHeight;
  return Math.max(scaleX, scaleY);
}

function clampCropperPan() {
  if (!cropperState.img) return;

  const boxW = cropperState.cropBoxWidth || 240;
  const boxH = cropperState.cropBoxHeight || 300;
  const totalDeg = (cropperState.rot90Steps * 90) + cropperState.fineRotateDeg;
  const rad = (totalDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const currentZoom = cropperState.baseScale * cropperState.scale;
  const limitX = (cropperState.imgWidth * currentZoom) / 2;
  const limitY = (cropperState.imgHeight * currentZoom) / 2;

  const hw = boxW / 2;
  const hh = boxH / 2;
  const corners = [
    { x: -hw, y: -hh },
    { x:  hw, y: -hh },
    { x: -hw, y:  hh },
    { x:  hw, y:  hh }
  ];

  let maxCornerU = -Infinity, minCornerU = Infinity;
  let maxCornerV = -Infinity, minCornerV = Infinity;

  for (let i = 0; i < 4; i++) {
    const cu = corners[i].x * cos + corners[i].y * sin;
    const cv = -corners[i].x * sin + corners[i].y * cos;
    if (cu > maxCornerU) maxCornerU = cu;
    if (cu < minCornerU) minCornerU = cu;
    if (cv > maxCornerV) maxCornerV = cv;
    if (cv < minCornerV) minCornerV = cv;
  }

  const minU = maxCornerU - limitX;
  const maxU = minCornerU + limitX;
  const minV = maxCornerV - limitY;
  const maxV = minCornerV + limitY;

  let u = cropperState.panX * cos + cropperState.panY * sin;
  let v = -cropperState.panX * sin + cropperState.panY * cos;

  if (minU <= maxU) {
    u = Math.min(maxU, Math.max(minU, u));
  } else {
    u = (minU + maxU) / 2;
  }

  if (minV <= maxV) {
    v = Math.min(maxV, Math.max(minV, v));
  } else {
    v = (minV + maxV) / 2;
  }

  cropperState.panX = u * cos - v * sin;
  cropperState.panY = u * sin + v * cos;
}

function initCropperEvents() {
  if (cropperEventsBound) return;
  const viewportWrap = document.getElementById('cropperViewportWrap');
  if (!viewportWrap) return;

  // Mouse Drag / Pan with Strict Crop Boundary Clamping
  viewportWrap.addEventListener('mousedown', (e) => {
    if (!cropperState.img) return;
    cropperState.isDragging = true;
    cropperState.dragStartX = e.clientX - cropperState.panX;
    cropperState.dragStartY = e.clientY - cropperState.panY;
    viewportWrap.classList.add('grabbing');
  });

  window.addEventListener('mousemove', (e) => {
    if (!cropperState.isDragging) return;
    cropperState.panX = e.clientX - cropperState.dragStartX;
    cropperState.panY = e.clientY - cropperState.dragStartY;
    clampCropperPan();
    // Re-anchor so reversing direction does not suffer from accumulated dead-zone lag
    cropperState.dragStartX = e.clientX - cropperState.panX;
    cropperState.dragStartY = e.clientY - cropperState.panY;
    renderCropperCanvas();
  });

  window.addEventListener('mouseup', () => {
    if (cropperState.isDragging) {
      cropperState.isDragging = false;
      viewportWrap.classList.remove('grabbing');
    }
  });

  // Touch Drag / Pan for Mobile / Touchscreens with Boundary Clamping
  viewportWrap.addEventListener('touchstart', (e) => {
    if (!cropperState.img || e.touches.length === 0) return;
    cropperState.isDragging = true;
    cropperState.dragStartX = e.touches[0].clientX - cropperState.panX;
    cropperState.dragStartY = e.touches[0].clientY - cropperState.panY;
    viewportWrap.classList.add('grabbing');
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!cropperState.isDragging || e.touches.length === 0) return;
    cropperState.panX = e.touches[0].clientX - cropperState.dragStartX;
    cropperState.panY = e.touches[0].clientY - cropperState.dragStartY;
    clampCropperPan();
    cropperState.dragStartX = e.touches[0].clientX - cropperState.panX;
    cropperState.dragStartY = e.touches[0].clientY - cropperState.panY;
    renderCropperCanvas();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (cropperState.isDragging) {
      cropperState.isDragging = false;
      viewportWrap.classList.remove('grabbing');
    }
  });

  // Mousewheel Zoom with Bounds Clamping
  viewportWrap.addEventListener('wheel', (e) => {
    if (!cropperState.img) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    adjustCropperZoom(delta);
  }, { passive: false });

  cropperEventsBound = true;
}

window.renderCropperCanvas = function() {
  const canvas = document.getElementById('cropperCanvas');
  if (!canvas || !cropperState.img) return;

  // Defensively clamp pan offsets before rendering
  clampCropperPan();

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.translate(cx + cropperState.panX, cy + cropperState.panY);

  const totalDeg = (cropperState.rot90Steps * 90) + cropperState.fineRotateDeg;
  ctx.rotate((totalDeg * Math.PI) / 180);

  const currentZoom = cropperState.baseScale * cropperState.scale;
  ctx.scale(currentZoom * cropperState.flipH, currentZoom);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    cropperState.img,
    -cropperState.imgWidth / 2,
    -cropperState.imgHeight / 2,
    cropperState.imgWidth,
    cropperState.imgHeight
  );

  ctx.restore();
};

window.updateCropBoxDimensions = function(ratioKey) {
  const viewportWrap = document.getElementById('cropperViewportWrap');
  const cropBox = document.getElementById('cropperCropBox');
  const canvas = document.getElementById('cropperCanvas');
  if (!viewportWrap || !cropBox || !canvas) return;

  const wrapWidth = viewportWrap.clientWidth || 600;
  const wrapHeight = viewportWrap.clientHeight || 350;

  canvas.width = wrapWidth;
  canvas.height = wrapHeight;

  let boxW = 240;
  let boxH = 300;

  if (ratioKey === '820:312' || ratioKey === 'banner' || ratioKey === 'pc') {
    boxW = Math.min(540, wrapWidth - 30);
    boxH = Math.round(boxW * (312 / 820));
    if (boxH > wrapHeight - 40) {
      boxH = wrapHeight - 40;
      boxW = Math.round(boxH * (820 / 312));
    }
  } else if (ratioKey === '4:5') {
    boxH = Math.min(290, wrapHeight - 40);
    boxW = Math.round(boxH * (4 / 5));
  } else if (ratioKey === '1:1') {
    const side = Math.min(270, wrapHeight - 40, wrapWidth - 40);
    boxW = side;
    boxH = side;
  } else if (ratioKey === '16:9') {
    boxW = Math.min(460, wrapWidth - 40);
    boxH = Math.round(boxW * (9 / 16));
  } else {
    // 'free'
    boxW = Math.min(340, wrapWidth - 40);
    boxH = Math.min(280, wrapHeight - 40);
  }

  cropperState.cropBoxWidth = boxW;
  cropperState.cropBoxHeight = boxH;

  cropBox.style.width = boxW + 'px';
  cropBox.style.height = boxH + 'px';

  if (cropperState.img) {
    cropperState.baseScale = computeBaseScale();
    clampCropperPan();
  }
};

window.setCropperRatio = function(ratioKey) {
  cropperState.ratio = ratioKey;

  // Update UI chip active state
  document.querySelectorAll('.ratio-chip').forEach(btn => {
    if (btn.getAttribute('data-ratio') === ratioKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateCropBoxDimensions(ratioKey);
  clampCropperPan();
  renderCropperCanvas();
};

window.onCropperZoomChange = function(val) {
  cropperState.scale = Math.max(1.0, Math.min(3.0, parseFloat(val)));
  const badge = document.getElementById('cropperZoomVal');
  if (badge) badge.innerText = Math.round(cropperState.scale * 100) + '%';
  clampCropperPan();
  renderCropperCanvas();
};

window.adjustCropperZoom = function(delta) {
  const slider = document.getElementById('cropperZoomSlider');
  let newScale = Math.min(3.0, Math.max(1.0, parseFloat((cropperState.scale + delta).toFixed(2))));
  if (slider) slider.value = newScale;
  onCropperZoomChange(newScale);
};

window.onCropperRotateChange = function(val) {
  cropperState.fineRotateDeg = parseInt(val, 10);
  const badge = document.getElementById('cropperRotateVal');
  if (badge) {
    badge.innerText = (cropperState.fineRotateDeg > 0 ? '+' : '') + cropperState.fineRotateDeg + '°';
  }
  cropperState.baseScale = computeBaseScale();
  clampCropperPan();
  renderCropperCanvas();
};

window.adjustCropperRotate = function(delta) {
  const slider = document.getElementById('cropperRotateSlider');
  let newDeg = Math.min(45, Math.max(-45, cropperState.fineRotateDeg + delta));
  if (slider) slider.value = newDeg;
  onCropperRotateChange(newDeg);
};

window.rotateCropper90 = function(dir) {
  cropperState.rot90Steps = (cropperState.rot90Steps + dir + 4) % 4;
  cropperState.baseScale = computeBaseScale();
  clampCropperPan();
  renderCropperCanvas();
};

window.flipCropperHorizontal = function() {
  cropperState.flipH = cropperState.flipH * -1;
  clampCropperPan();
  renderCropperCanvas();
};

window.resetCropperAdjustments = function() {
  cropperState.scale = 1.0;
  cropperState.panX = 0;
  cropperState.panY = 0;
  cropperState.rot90Steps = 0;
  cropperState.fineRotateDeg = 0;
  cropperState.flipH = 1;

  const zoomSlider = document.getElementById('cropperZoomSlider');
  if (zoomSlider) zoomSlider.value = 1;
  const zoomBadge = document.getElementById('cropperZoomVal');
  if (zoomBadge) zoomBadge.innerText = '100%';

  const rotateSlider = document.getElementById('cropperRotateSlider');
  if (rotateSlider) rotateSlider.value = 0;
  const rotateBadge = document.getElementById('cropperRotateVal');
  if (rotateBadge) rotateBadge.innerText = '0°';

  if (cropperState.img) {
    cropperState.baseScale = computeBaseScale();
  }
  clampCropperPan();
  renderCropperCanvas();
};

window.openImageCropper = function(targetInputId, sourceUrl, defaultRatio = 'portrait') {
  cropperState.targetInputId = targetInputId;

  // If no sourceUrl provided, retrieve from current input or preview
  if (!sourceUrl) {
    const inputElem = document.getElementById(targetInputId);
    const previewElem = document.getElementById('preview_' + targetInputId);
    sourceUrl = (inputElem && inputElem.value) || (previewElem && previewElem.src) || '';
  }

  // If empty or placeholder, trigger file picker instead
  if (!sourceUrl || sourceUrl.includes('placehold.co') || sourceUrl.trim() === '') {
    const fileInput = document.getElementById('file_' + targetInputId);
    if (fileInput) {
      fileInput.click();
    }
    return;
  }

  initCropperEvents();

  const modal = document.getElementById('imageCropperModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  // Determine initial ratio based on ratio hint or targetInputId
  let targetRatio = '820:312';
  if (defaultRatio === 'banner' || defaultRatio === '820:312' || targetInputId.includes('slide') || targetInputId.includes('hero') || targetInputId.includes('gateway') || targetInputId.includes('banner')) {
    targetRatio = '820:312';
  } else if (defaultRatio === 'portrait' || targetInputId.includes('lead') || targetInputId.includes('pembina') || targetInputId.includes('tokoh')) {
    targetRatio = '4:5';
  } else if (defaultRatio === 'avatar' || targetInputId.includes('avatar') || targetInputId.includes('logo')) {
    targetRatio = '1:1';
  } else if (defaultRatio === 'free') {
    targetRatio = 'free';
  } else {
    // Default to landscape 16:9 for Program Unggulan, Berita, Fasilitas, dsb.
    targetRatio = '16:9';
  }

  // Set active chip and box dimensions
  setCropperRatio(targetRatio);

  const img = new Image();
  // Only set crossOrigin on http/https URLs; data: URIs and local paths fail with crossOrigin
  if (sourceUrl.startsWith('http')) {
    img.crossOrigin = 'anonymous';
  }

  img.onload = function() {
    cropperState.img = img;
    cropperState.imgWidth = img.naturalWidth || img.width;
    cropperState.imgHeight = img.naturalHeight || img.height;
    requestAnimationFrame(() => {
      updateCropBoxDimensions(cropperState.ratio);
      resetCropperAdjustments();
    });
  };

  img.onerror = function() {
    // If external image had CORS issues, try fallback without crossOrigin
    if (img.crossOrigin) {
      const fallback = new Image();
      fallback.onload = function() {
        cropperState.img = fallback;
        cropperState.imgWidth = fallback.naturalWidth || fallback.width;
        cropperState.imgHeight = fallback.naturalHeight || fallback.height;
        requestAnimationFrame(() => {
          updateCropBoxDimensions(cropperState.ratio);
          resetCropperAdjustments();
        });
      };
      fallback.onerror = function() {
        alert('Gagal memuat gambar untuk penyesuaian. Pastikan format gambar valid.');
        closeImageCropper();
      };
      fallback.src = sourceUrl;
      return;
    }
    alert('Gagal memuat gambar untuk penyesuaian. Pastikan format gambar valid.');
    closeImageCropper();
  };

  img.src = sourceUrl;
};

window.closeImageCropper = function() {
  const modal = document.getElementById('imageCropperModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  cropperState.img = null;
  if (cropperState.targetInputId) {
    const statBadge = document.getElementById('stat_' + cropperState.targetInputId);
    if (statBadge && statBadge.innerHTML.includes('Membuka Studio')) {
      statBadge.style.display = 'none';
    }
  }
};

window.applyCroppedImage = function() {
  if (!cropperState.img || !cropperState.targetInputId) {
    closeImageCropper();
    return;
  }

  // Defensively ensure pan is bounded before export
  clampCropperPan();

  // Compute high-resolution export dimensions
  let outW = 1640;
  let outH = Math.round(outW * (cropperState.cropBoxHeight / cropperState.cropBoxWidth));
  if (outH > 1600) {
    outH = 1600;
    outW = Math.round(outH * (cropperState.cropBoxWidth / cropperState.cropBoxHeight));
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  const exportScale = outW / cropperState.cropBoxWidth;

  outCtx.save();
  outCtx.translate(
    outW / 2 + (cropperState.panX * exportScale),
    outH / 2 + (cropperState.panY * exportScale)
  );

  const totalDeg = (cropperState.rot90Steps * 90) + cropperState.fineRotateDeg;
  outCtx.rotate((totalDeg * Math.PI) / 180);

  const finalScale = cropperState.baseScale * cropperState.scale * exportScale;
  outCtx.scale(finalScale * cropperState.flipH, finalScale);

  ctxImageSmooth(outCtx);

  outCtx.drawImage(
    cropperState.img,
    -cropperState.imgWidth / 2,
    -cropperState.imgHeight / 2,
    cropperState.imgWidth,
    cropperState.imgHeight
  );

  outCtx.restore();

  // Export handling: Preserve PNG transparency for Mascot, Logo & PNG images
  const isTransparent = (cropperState.targetInputId && (cropperState.targetInputId.includes('mascot') || cropperState.targetInputId.includes('logo') || cropperState.targetInputId.includes('Mascot'))) || (cropperState.img && cropperState.img.src && (cropperState.img.src.includes('image/png') || cropperState.img.src.endsWith('.png')));
  
  let dataUrl, format;
  if (isTransparent) {
    dataUrl = outCanvas.toDataURL('image/png');
    format = 'PNG Transparan';
  } else {
    dataUrl = outCanvas.toDataURL('image/webp', 0.88);
    format = 'WebP';
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = outCanvas.toDataURL('image/jpeg', 0.88);
      format = 'JPEG';
    }
  }

  const targetInput = document.getElementById(cropperState.targetInputId);
  const previewImg = document.getElementById('preview_' + cropperState.targetInputId);
  const mascotPreviewImg = document.getElementById('mascotPreviewImg');
  const dropzone = document.getElementById('dropzone_' + cropperState.targetInputId);
  const statBadge = document.getElementById('stat_' + cropperState.targetInputId);

  if (targetInput) targetInput.value = dataUrl;
  if (previewImg) previewImg.src = dataUrl;
  const leadFramed = document.getElementById('leadPreviewFramed');
  if (leadFramed && cropperState.targetInputId === 'leadPhoto') {
    leadFramed.src = dataUrl;
  }
  if (mascotPreviewImg) {
    mascotPreviewImg.src = dataUrl;
    mascotPreviewImg.style.display = 'block';
  }
  if (dropzone) dropzone.classList.add('has-image');

  if (statBadge) {
    statBadge.style.display = 'inline-flex';
    statBadge.style.color = '#065F46';
    statBadge.style.background = '#D1FAE5';
    statBadge.style.borderColor = '#A7F3D0';
    const approxBytes = Math.round((dataUrl.length * 3) / 4);
    statBadge.innerHTML = `✓ <strong>Foto Berhasil Disesuaikan!</strong> • ${outW}×${outH}px (${formatBytes(approxBytes)}) • ${format} Tajam`;
  }

  closeImageCropper();
};

function ctxImageSmooth(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

/**
 * Render komponen upload gambar cerdas (Hybrid: Dari Perangkat + URL Web + Studio Penyesuaian Foto)
 */
window.renderImageUploadWidget = function(inputId, label, currentValue, maxWidth = 1200, previewRatio = 'landscape', customRatio = null, customSize = null) {
  const previewClass = previewRatio === 'avatar' ? 'preview-avatar' : (previewRatio === 'portrait' ? 'preview-portrait' : 'preview-landscape');
  const hasValue = !!currentValue;

  // Metadata spesifikasi rasio & resolusi yang ideal untuk web
  let ratioBadge = '16:9';
  let sizeBadge = '1920 × 1080 px';
  let tipText = 'Lanskap lebar standar untuk Slide Hero Beranda & Banner PPDB';

  if (previewRatio === 'portrait') {
    ratioBadge = '3:4';
    sizeBadge = '600 × 800 px (atau 750 × 1000 px)';
    tipText = 'Potret vertikal presisi untuk Dewan Pengasuh & Tokoh Pimpinan';
  } else if (previewRatio === 'avatar') {
    ratioBadge = '1:1';
    sizeBadge = '500 × 500 px (Persegi)';
    tipText = 'Persegi simetris untuk foto santri, guru, atau ikon';
  } else if (previewRatio === 'facility') {
    ratioBadge = '3:2';
    sizeBadge = '800 × 533 px';
    tipText = 'Lanskap proporsional untuk dokumentasi sarana & fasilitas';
  } else if (previewRatio === 'news') {
    ratioBadge = '16:10';
    sizeBadge = '800 × 500 px';
    tipText = 'Editorial berita untuk cover thumbnail warta santri';
  }

  if (customRatio) ratioBadge = customRatio;
  if (customSize) sizeBadge = customSize;

  return `
    <div class="image-upload-wrapper" id="wrapper_${inputId}">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="form-label" style="margin-bottom:0;">${label} *</label>
        <span style="font-size:0.75rem; color:#059669; font-weight:700; background:#ECFDF5; padding:2px 8px; border-radius:6px; border:1px solid #A7F3D0;">
          ✨ Auto-Kompresi & Studio Foto
        </span>
      </div>

      <!-- KETERANGAN RASIO & RESOLUSI REKOMENDASI UNTUK ADMIN -->
      <div class="upload-spec-guide-card">
        <span style="font-size:1.15rem; line-height:1;">📐</span>
        <div>
          <span class="guide-title">Panduan Ukuran Foto Web:</span>
          Rasio Aspek <span class="guide-pill">${ratioBadge}</span> &bull; Resolusi Ideal <span class="guide-pill">${sizeBadge}</span>
          <span class="guide-tip">${tipText}. Gunakan ukuran ini saat mendesain di Canva/Photoshop/HP agar foto pas dan tidak terpotong kaku.</span>
        </div>
      </div>

      <div class="image-upload-zone ${hasValue ? 'has-image' : ''}" id="dropzone_${inputId}" 
           onclick="if(event.target.tagName !== 'INPUT' && event.target.tagName !== 'BUTTON' && !event.target.closest('button')) document.getElementById('file_${inputId}').click()"
           ondragover="event.preventDefault(); this.classList.add('dragover');"
           ondragleave="this.classList.remove('dragover');"
           ondrop="event.preventDefault(); this.classList.remove('dragover'); const files = event.dataTransfer.files; if(files.length){ document.getElementById('file_${inputId}').files = files; handleSmartImageUpload(document.getElementById('file_${inputId}'), '${inputId}', ${maxWidth}, '${previewRatio}'); }">
        
        <input type="file" id="file_${inputId}" accept="image/png, image/jpeg, image/webp, image/gif" style="display:none" onchange="handleSmartImageUpload(this, '${inputId}', ${maxWidth}, '${previewRatio}')">

        <div class="upload-preview-box ${previewClass}">
          <img id="preview_${inputId}" src="${currentValue || 'https://placehold.co/600x400/0f4c81/ffffff?text=Pilih+Foto'}" alt="Preview" class="upload-preview-img" onerror="this.src='https://placehold.co/600x400/0f4c81/ffffff?text=Pratinjau+Foto'">
        </div>

        <div class="upload-action-content">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;">
            <div class="upload-btn-chip" onclick="document.getElementById('file_${inputId}').click()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Pilih Foto dari Perangkat Ini</span>
            </div>
            <button type="button" class="btn-adjust-image" id="btn_adjust_${inputId}" onclick="event.stopPropagation(); openImageCropper('${inputId}', null, '${previewRatio}')" title="Sesuaikan crop, zoom & rotasi foto">
              <span>✂️ Sesuaikan Foto</span>
            </button>
          </div>
          <p class="upload-hint" style="margin-top:8px;">Klik tombol di atas atau seret foto ke sini. Anda dapat memotong (crop), zoom, dan meluruskan rotasi secara instan.</p>
          <div id="stat_${inputId}" class="upload-stat-badge" style="display:none;"></div>
        </div>
      </div>

      <div class="upload-url-toggle">
        <button type="button" class="btn-toggle-url" onclick="toggleUrlInput('${inputId}')">
          🔗 Atau gunakan tautan URL Web
        </button>
      </div>

      <div id="urlContainer_${inputId}" class="url-input-container" style="display:none; margin-top:8px;">
        <input type="text" id="${inputId}" class="form-input" value="${currentValue || ''}" placeholder="https://... atau assets/..." oninput="updatePreviewFromUrl('${inputId}', this.value)">
      </div>
    </div>
  `;
};

window.toggleUrlInput = function(inputId) {
  const container = document.getElementById('urlContainer_' + inputId);
  if (container) {
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      const input = document.getElementById(inputId);
      if (input) input.focus();
    }
  }
};

window.updatePreviewFromUrl = function(inputId, url) {
  const preview = document.getElementById('preview_' + inputId);
  if (preview && url) {
    preview.src = url;
  }
  // Sinkronkan ke live framed preview pimpinan jika ada
  const leadFramed = document.getElementById('leadPreviewFramed');
  if (leadFramed && inputId === 'leadPhoto' && url) {
    leadFramed.src = url;
  }
};

window.handleCategorySelectChange = function(selectEl, customWrapperId, customInputId) {
  const wrapper = document.getElementById(customWrapperId);
  const input = document.getElementById(customInputId);
  if (!wrapper) return;
  if (selectEl.value === 'CUSTOM') {
    wrapper.style.display = 'block';
    if (input) {
      input.focus();
      input.required = true;
    }
  } else {
    wrapper.style.display = 'none';
    if (input) {
      input.required = false;
    }
  }
};

/* 2. SIDEBAR TAB NAVIGATION (TREE-VIEW HIERARCHY) */
function initSidebar() {
  window.switchToTab(currentTab || 'dashboard');
}

window.toggleTreeFolder = function(headerEl) {
  const folder = headerEl.closest('.tree-folder');
  if (folder) {
    folder.classList.toggle('open');
  }
};

window.toggleAllTreeFolders = function(openState) {
  document.querySelectorAll('.tree-folder').forEach(folder => {
    if (openState) {
      folder.classList.add('open');
    } else {
      folder.classList.remove('open');
    }
  });
};

window.filterSidebarMenu = function(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  const clearBtn = document.getElementById('sidebarSearchClear');
  const noMatchEl = document.getElementById('sidebarNoMatch');
  const countBadge = document.getElementById('treeVisibleCount');

  if (clearBtn) {
    clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
  }

  // If query is empty, reset all items and folders to visible
  if (!query) {
    document.querySelectorAll('.tree-folder').forEach(f => {
      f.style.display = '';
    });
    document.querySelectorAll('.tree-item, .tree-subitem').forEach(item => {
      item.style.display = '';
    });
    if (noMatchEl) noMatchEl.style.display = 'none';
    if (countBadge) countBadge.textContent = '19 Modul';
    return;
  }

  // Deactivate filter chips if typing custom query
  document.querySelectorAll('.sidebar-chip').forEach(chip => chip.classList.remove('active'));

  let totalMatches = 0;

  document.querySelectorAll('.tree-folder').forEach(folder => {
    const folderLabel = (folder.querySelector('.tree-label')?.textContent || '').toLowerCase();
    const folderMatches = folderLabel.includes(query);

    let folderHasMatch = folderMatches;
    let childMatchCount = 0;

    // Check tree items
    folder.querySelectorAll('.tree-item').forEach(item => {
      const itemText = (item.textContent || '').toLowerCase();
      if (folderMatches || itemText.includes(query)) {
        item.style.display = '';
        folderHasMatch = true;
        childMatchCount++;
        totalMatches++;
      } else {
        item.style.display = 'none';
      }
    });

    // Check tree subitems (units)
    folder.querySelectorAll('.tree-subitem').forEach(subitem => {
      const subText = (subitem.textContent || '').toLowerCase();
      if (folderMatches || subText.includes(query)) {
        subitem.style.display = '';
        folderHasMatch = true;
        childMatchCount++;
        totalMatches++;
      } else {
        subitem.style.display = 'none';
      }
    });

    if (folderHasMatch) {
      folder.style.display = '';
      folder.classList.add('open'); // Auto open matching folder
    } else {
      folder.style.display = 'none';
    }
  });

  if (noMatchEl) {
    noMatchEl.style.display = totalMatches === 0 ? 'block' : 'none';
  }

  if (countBadge) {
    countBadge.textContent = totalMatches + ' Hasil';
  }
};

window.quickFilterSidebar = function(category, btnEl) {
  // Update active chip UI
  document.querySelectorAll('.sidebar-chip').forEach(chip => chip.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const searchInput = document.getElementById('sidebarSearchInput');
  const clearBtn = document.getElementById('sidebarSearchClear');
  const noMatchEl = document.getElementById('sidebarNoMatch');
  const countBadge = document.getElementById('treeVisibleCount');

  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (noMatchEl) noMatchEl.style.display = 'none';

  // Show all items within folders
  document.querySelectorAll('.tree-item, .tree-subitem').forEach(item => {
    item.style.display = '';
  });

  if (category === 'all') {
    document.querySelectorAll('.tree-folder').forEach(folder => {
      folder.style.display = '';
      folder.classList.add('open');
    });
    if (countBadge) countBadge.textContent = '19 Modul';
  } else {
    let visibleCount = 0;
    document.querySelectorAll('.tree-folder').forEach(folder => {
      const folderCat = folder.getAttribute('data-folder');
      if (folderCat === category) {
        folder.style.display = '';
        folder.classList.add('open');
        visibleCount += folder.querySelectorAll('.tree-item, .tree-subitem').length;
      } else {
        folder.style.display = 'none';
      }
    });
    if (countBadge) countBadge.textContent = visibleCount + ' Modul';
  }
};

window.clearSidebarSearch = function() {
  const searchInput = document.getElementById('sidebarSearchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  window.filterSidebarMenu('');
  const allChip = document.querySelector('.sidebar-chip[data-filter="all"]');
  if (allChip) {
    document.querySelectorAll('.sidebar-chip').forEach(c => c.classList.remove('active'));
    allChip.classList.add('active');
  }
};

// Global Keyboard Shortcut: '/' to focus search input
document.addEventListener('keydown', function(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
    const searchInput = document.getElementById('sidebarSearchInput');
    if (searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  }
});

window.selectTreeItem = function(itemEl, tabKey) {
  if (!tabKey) return;
  window.switchToTab(tabKey);
};

// Mapping of tab keys to parent folders in the sidebar tree
const TAB_TO_FOLDER_MAP = {
  dashboard: 'beranda',
  analytics: 'beranda',
  slider: 'beranda',
  corevalues: 'beranda',
  leadership: 'beranda',
  muassis: 'beranda',
  facilities: 'beranda',
  units: 'units',
  boarding: 'pesantren',
  programs: 'pesantren',
  daily_schedule: 'pesantren',
  kbihu: 'kbihu',
  lbb: 'lbb',
  leads: 'santri',
  agenda: 'santri',
  messages: 'santri',
  testimonials: 'santri',
  news: 'publikasi',
  achievements: 'publikasi',
  tasmik: 'publikasi',
  works: 'publikasi',
  settings: 'sistem',
  users: 'users'
};

// Mapping of tab keys to primary rail dock buttons
const TAB_TO_RAIL_MAP = {
  dashboard: 'dashboard',
  analytics: 'dashboard',
  slider: 'dashboard',
  corevalues: 'dashboard',
  leadership: 'dashboard',
  muassis: 'dashboard',
  facilities: 'dashboard',
  units: 'units',
  boarding: 'boarding',
  programs: 'boarding',
  daily_schedule: 'boarding',
  kbihu: 'kbihu',
  lbb: 'lbb',
  leads: 'leads',
  messages: 'leads',
  testimonials: 'leads',
  agenda: 'agenda',
  news: 'news',
  achievements: 'news',
  tasmik: 'news',
  works: 'news',
  settings: 'settings',
  users: 'users'
};

let tabTransitionTimer = null;
let folderHighlightTimeout = null;

window.switchToTab = function(tabKey) {
  if (tabTransitionTimer) {
    clearTimeout(tabTransitionTimer);
    tabTransitionTimer = null;
  }
  currentTab = tabKey;

  // 1. Support unified clean sidebar buttons
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    const tabAttr = btn.getAttribute('data-tab');
    if (tabAttr === tabKey || (tabKey === 'works' && tabAttr === 'studentWorks') || (tabKey === 'studentWorks' && tabAttr === 'works')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 2. Support mobile bottom nav items
  document.querySelectorAll('.admin-mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 3. Auto-close mobile drawer when menu item is selected
  if (typeof window.toggleAdminSidebar === 'function') {
    window.toggleAdminSidebar(false);
  }

  // 4. Smooth scroll to top of floating white canvas
  const canvas = document.getElementById('crmWhiteCanvas');
  if (canvas) {
    canvas.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. Silky-Smooth Micro Crossfade & Slide Transition
  const container = document.getElementById('adminContentArea');
  const titleEl = document.getElementById('adminPageTitle');
  if (container) {
    container.classList.add('crm-tab-leaving');
    container.classList.remove('crm-tab-entering');
    if (titleEl) titleEl.style.opacity = '0.35';

    tabTransitionTimer = setTimeout(() => {
      loadCurrentTab();
      container.classList.remove('crm-tab-leaving');
      container.classList.add('crm-tab-entering');
      if (titleEl) {
        titleEl.style.opacity = '';
        titleEl.classList.remove('crm-title-enter');
        void titleEl.offsetWidth;
        titleEl.classList.add('crm-title-enter');
      }
      tabTransitionTimer = null;
    }, 85);
  } else {
    loadCurrentTab();
  }

  // Close mobile drawer if on mobile/tablet
  if (window.innerWidth <= 991) {
    const sidebar = document.querySelector('.admin-sidebar');
    const backdrop = document.querySelector('.admin-sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }
};

/* CRM TOPBAR SEARCH & ASSISTANT MODAL HELPERS */
window.handleCrmTopSearch = function(rawQuery) {
  const query = (rawQuery || '').trim();
  const clearBtn = document.getElementById('topbarSearchClear');
  if (clearBtn) {
    clearBtn.style.display = query.length > 0 ? 'block' : 'none';
  }
  const sidebarInput = document.getElementById('sidebarSearchInput');
  if (sidebarInput && sidebarInput.value !== rawQuery) {
    sidebarInput.value = rawQuery;
  }
  if (typeof window.filterSidebarMenu === 'function') {
    window.filterSidebarMenu(rawQuery);
  }
};

window.clearCrmTopSearch = function() {
  const input = document.getElementById('topbarSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  window.handleCrmTopSearch('');
};

window.openCrmAssistantModal = function() {
  if (typeof window.openModalNewsDraftAI === 'function') {
    window.openModalNewsDraftAI();
  } else if (typeof window.switchToTab === 'function') {
    window.switchToTab('messages');
  }
};

window.openMobileFeaturesSheet = function() {
  const overlay = document.getElementById('adminFeaturesSheetOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeMobileFeaturesSheet = function(e) {
  if (e && e.target && e.target.id !== 'adminFeaturesSheetOverlay' && !e.target.classList.contains('sheet-close-btn')) {
    return;
  }
  const overlay = document.getElementById('adminFeaturesSheetOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.selectMobileSheetTab = function(tabKey) {
  const overlay = document.getElementById('adminFeaturesSheetOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  window.switchToTab(tabKey);
};

window.toggleDesktopSidebarCollapse = function(forceState) {
  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  const shouldCollapse = typeof forceState === 'boolean' ? forceState : !isCollapsed;
  if (shouldCollapse) {
    document.body.classList.add('sidebar-collapsed');
    try { localStorage.setItem('ytpai_admin_sidebar_collapsed', '1'); } catch (e) {}
  } else {
    document.body.classList.remove('sidebar-collapsed');
    try { localStorage.setItem('ytpai_admin_sidebar_collapsed', '0'); } catch (e) {}
  }
  window.updateSidebarCollapseButtons();
};

window.updateSidebarCollapseButtons = function() {
  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  const label = document.getElementById('labelToggleSidebar');
  if (label) {
    label.textContent = isCollapsed ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar';
  }
  const btn = document.getElementById('btnToggleFullWorkspace');
  if (btn) {
    btn.style.background = isCollapsed ? '#FEF3C7' : '#FFFFFF';
    btn.style.borderColor = isCollapsed ? '#F59E0B' : '#CBD5E1';
    btn.style.color = isCollapsed ? '#B45309' : '#0A2540';
  }
  const mainToggle = document.getElementById('adminSidebarToggle');
  if (mainToggle) {
    mainToggle.setAttribute('title', isCollapsed ? 'Tampilkan Sidebar Navigasi' : 'Sembunyikan Sidebar Navigasi');
  }
};

window.toggleAdminSidebar = function(forceState) {
  const sidebar = document.getElementById('adminSidebar') || document.querySelector('.admin-sidebar');
  const backdrop = document.getElementById('adminSidebarBackdrop') || document.querySelector('.admin-sidebar-backdrop');
  if (!sidebar) return;

  if (window.innerWidth <= 992) {
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('mobile-open');
    if (shouldOpen) {
      sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  } else {
    window.toggleDesktopSidebarCollapse(forceState);
  }
};

window.filterSidebarMenu = function(query) {
  const q = (query || '').toLowerCase().trim();
  const buttons = document.querySelectorAll('#adminSidebarNav .nav-item-btn');
  const labels = document.querySelectorAll('#adminSidebarNav .nav-section-label');
  
  if (!q) {
    buttons.forEach(btn => btn.style.display = '');
    labels.forEach(lbl => lbl.style.display = '');
    return;
  }
  
  labels.forEach(lbl => lbl.style.display = 'none');
  buttons.forEach(btn => {
    const text = btn.innerText.toLowerCase();
    btn.style.display = text.includes(q) ? 'flex' : 'none';
  });
};

function loadCurrentTab() {
  const db = getDB();
  const titleEl = document.getElementById('adminPageTitle');
  const container = document.getElementById('adminContentArea');
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';

  // Security guard: If non-superadmin tries to access unauthorized tab, redirect to their permitted tab
  if (!isSuperAdmin) {
    const role = activeUser.role || '';
    if (role === 'kbihu' && !['kbihu', 'news', 'messages'].includes(currentTab)) {
      currentTab = 'kbihu';
    } else if (role === 'lbb' && !['lbb', 'news', 'messages'].includes(currentTab)) {
      currentTab = 'lbb';
    } else if (role === 'unit_ponpes' && !['boarding', 'daily_schedule', 'programs', 'facilities', 'ekskul', 'news', 'agenda', 'leads', 'messages'].includes(currentTab)) {
      currentTab = 'boarding';
    } else if (role.startsWith('unit_') && !['units', 'news', 'agenda', 'leads', 'messages'].includes(currentTab)) {
      currentTab = 'units';
    }
  }

  // Restore persisted sidebar collapsed preference if on desktop
  try {
    if (localStorage.getItem('ytpai_admin_sidebar_collapsed') === '1') {
      document.body.classList.add('sidebar-collapsed');
    }
  } catch (e) {}

  setTimeout(() => {
    if (typeof window.updateSidebarCollapseButtons === 'function') {
      window.updateSidebarCollapseButtons();
    }
  }, 0);

  switch (currentTab) {
    case 'dashboard':
      titleEl.textContent = 'Ringkasan Dasbor Eksekutif';
      renderTabDashboard(db, container);
      break;
    case 'analytics':
      titleEl.textContent = 'Analisis Trafik & Asal Wilayah Pengunjung (Live Analytics)';
      renderTabAnalytics(db, container);
      break;
    case 'slider':
      titleEl.textContent = 'Manajemen Slide Foto, Video Profil & Parallax';
      renderTabSlider(db, container);
      break;
    case 'corevalues':
      titleEl.textContent = 'Manajemen 4 Pilar Nilai Dasar Pesantren';
      renderTabCoreValues(db, container);
      break;
    case 'leads':
      titleEl.textContent = isSuperAdmin ? 'Manajemen Pendaftar Santri Baru (PPDB)' : `Pendaftar PPDB Online: ${activeUser.roleName || activeUser.name}`;
      renderTabLeads(db, container);
      break;
    case 'messages':
      titleEl.textContent = isSuperAdmin ? 'Manajemen Kotak Pesan Masuk (Hubungi Kami)' : `Kotak Pesan Masuk: ${activeUser.roleName || activeUser.name}`;
      renderTabMessages(db, container);
      break;
    case 'popup':
      titleEl.textContent = 'Manajemen Pop-Up Pengumuman & Informasi Website';
      renderTabPopup(db, container);
      break;
    case 'news':
      titleEl.textContent = isSuperAdmin ? 'Manajemen Warta & Berita Pesantren' : `Warta & Berita: ${activeUser.roleName || activeUser.name}`;
      renderTabNews(db, container);
      break;
    case 'agenda':
      titleEl.textContent = 'Manajemen Agenda & Kalender Kegiatan Santri';
      renderTabAgenda(db, container);
      break;
    case 'units':
      titleEl.textContent = isSuperAdmin ? 'Manajemen Satuan Pendidikan (7 Unit Formal KB–SMA)' : `Manajemen Satuan Pendidikan: ${activeUser.roleName || activeUser.name}`;
      renderTabUnits(db, container);
      break;
    case 'boarding':
      titleEl.textContent = 'Manajemen Pondok Pesantren Putra & Putri (Mukim 24 Jam)';
      renderTabBoarding(db, container);
      break;
    case 'daily_schedule':
      titleEl.textContent = 'Manajemen Jadwal Kegiatan Sehari-hari Santri (24 Jam)';
      renderTabDailySchedule(db, container);
      break;
    case 'kbihu':
      titleEl.textContent = 'Manajemen KBIHU Haji & Umrah Raudlatul Muta\'allimin';
      renderTabKbihu(db, container);
      break;
    case 'lbb':
      titleEl.textContent = 'Manajemen LBB Sukses PTN & Laboratorium CBT';
      renderTabLbb(db, container);
      break;
    case 'bimbingan':
      titleEl.textContent = 'Manajemen Pusat Bimbingan Khusus (KBIHU & LBB)';
      renderTabKbihu(db, container);
      break;
    case 'programs':
      titleEl.textContent = 'Manajemen Program Unggulan & Khidmah Santri';
      renderTabPrograms(db, container);
      break;
    case 'leadership':
      titleEl.textContent = 'Manajemen Dewan Pembina & Sambutan';
      renderTabLeadership(db, container);
      break;
    case 'muassis':
      titleEl.textContent = 'Manajemen Muassis & Masyayikh Pendiri (1984)';
      renderTabMuassis(db, container);
      break;
    case 'facilities':
      titleEl.textContent = 'Manajemen Fasilitas Yayasan & Pesantren';
      renderTabFacilities(db, container);
      break;
    case 'ekskul':
      titleEl.textContent = 'Manajemen Ekstrakurikuler & Foto Kegiatan Santri';
      renderTabEkskul(db, container);
      break;
    case 'achievements':
      titleEl.textContent = 'Manajemen Etalase Prestasi';
      renderTabAchievements(db, container);
      break;
    case 'tasmik':
      titleEl.textContent = 'Manajemen Galeri Kehormatan Tasmik 5 Juz Al-Qur\'an';
      renderTabTasmik(db, container);
      break;
    case 'studentWorks':
    case 'works':
      titleEl.textContent = 'Manajemen Ruang Karya & Kreativitas Santri';
      renderTabWorks(db, container);
      break;
    case 'testimonials':
      titleEl.textContent = 'Manajemen Testimoni Santri & Alumni';
      renderTabTestimonials(db, container);
      break;
    case 'settings':
      titleEl.textContent = 'Pengaturan Identitas Yayasan & Statistik';
      renderTabSettings(db, container);
      break;
    case 'users':
      titleEl.textContent = 'Manajemen Akun Pengelola & Hak Akses (RBAC)';
      renderTabUsers(db, container);
      break;
    default:
      renderTabDashboard(db, container);
  }

  // Trigger smooth transition if called directly (e.g. initial page load)
  if (container && !container.classList.contains('crm-tab-entering') && !container.classList.contains('crm-tab-leaving')) {
    container.classList.add('crm-tab-entering');
  }
}

/* ===================================================================
   TAB RENDERERS & CRUD IMPLEMENTATIONS
   =================================================================== */

/* --- TAB 1: DASHBOARD --- */
function renderTabDashboard(db, container) {
  const titleEl = document.getElementById('adminPageTitle');
  if (titleEl) titleEl.textContent = 'Ringkasan Dasbor Eksekutif';

  const user = (typeof getActiveAdminUser === 'function' ? getActiveAdminUser() : null) || {
    name: 'Pimpinan Yayasan',
    role: 'superadmin',
    roleName: 'Super Admin (Penuh)',
    avatar: '👑'
  };

  const totalLeads = (db.leads || []).length;
  const newLeads = (db.leads || []).filter(l => l.status === 'Baru').length;
  const verifiedLeads = (db.leads || []).filter(l => l.status === 'Diverifikasi').length;
  const acceptedLeads = (db.leads || []).filter(l => l.status === 'Diterima').length;
  const newMsgCount = (db.contactMessages || []).filter(m => m.status === 'Baru').length;

  const p1 = Math.max(20, Math.min(100, Math.round((newLeads / (totalLeads || 1)) * 100) || 38));
  const p2 = Math.max(30, Math.min(100, Math.round((verifiedLeads / (totalLeads || 1)) * 100) || 74));
  const p3 = Math.max(25, Math.min(100, Math.round((acceptedLeads / (totalLeads || 1)) * 100) || 88));

  container.innerHTML = `
    <!-- 1. CLEAN EXECUTIVE PROFILE BANNER -->
    <div class="admin-welcome-card">
      <div class="welcome-card-left">
        <div class="welcome-avatar-wrap">
          <span class="welcome-avatar-emoji">${user.avatar || '👑'}</span>
          <span class="welcome-online-pulse"></span>
        </div>
        <div class="welcome-meta">
          <div class="welcome-greeting">
            Selamat datang, <strong>${user.name || 'Pimpinan Yayasan'}</strong>
            <span class="welcome-role-badge">${user.roleName || user.role || 'Super Admin'}</span>
          </div>
          <p class="welcome-sub">Kelola seluruh portal website dan data santri YTPAI Raudlatul Muta'allimin Lamongan secara ringkas, rapi, dan terpusat.</p>
        </div>
      </div>
      <div class="welcome-card-right">
        <a href="index.html" target="_blank" class="btn-welcome-preview" title="Buka Website Publik">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Lihat Website Publik</span>
        </a>
      </div>
    </div>

    <!-- 2. FOUR REAL-DATA METRIC CARDS -->
    <div class="admin-kpi-grid">
      <div class="admin-kpi-card card-kpi-leads" onclick="switchToTab('leads')" title="Klik untuk mengelola pendaftar PPDB">
        <div class="kpi-icon-wrap icon-leads">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Pendaftar PPDB Online</span>
          <div class="kpi-val-row">
            <span class="kpi-val">${totalLeads}</span>
            <span class="kpi-badge-new">${newLeads} Baru</span>
          </div>
        </div>
      </div>

      <div class="admin-kpi-card card-kpi-news" onclick="switchToTab('news')" title="Klik untuk mengelola berita & warta humas">
        <div class="kpi-icon-wrap icon-news">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Warta & Berita Humas</span>
          <div class="kpi-val-row">
            <span class="kpi-val">${(db.news || []).length}</span>
            <span class="kpi-badge-tag">Artikel Aktif</span>
          </div>
        </div>
      </div>

      <div class="admin-kpi-card card-kpi-units" onclick="switchToTab('units')" title="Klik untuk mengelola 7 satuan formal & pesantren">
        <div class="kpi-icon-wrap icon-units">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Lembaga Pendidikan</span>
          <div class="kpi-val-row">
            <span class="kpi-val">10</span>
            <span class="kpi-badge-tag" title="7 Satuan Formal + 3 Non-Formal">7 Formal • Ponpes</span>
          </div>
        </div>
      </div>

      <div class="admin-kpi-card card-kpi-msg" onclick="switchToTab('messages')" title="Klik untuk melihat pesan masuk publik">
        <div class="kpi-icon-wrap icon-msg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Kotak Pesan Publik</span>
          <div class="kpi-val-row">
            <span class="kpi-val">${(db.contactMessages || []).length}</span>
            <span class="kpi-badge-new">${newMsgCount} Baru</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. ACTION-ORIENTED SHORTCUT TILES -->
    <div class="admin-quick-section">
      <div class="quick-section-header">
        <h3 class="quick-section-title">Pintasan Aksi Cepat</h3>
        <span class="quick-section-subtitle">Akses langsung fungsi terpenting tanpa perlu mencari di menu</span>
      </div>

      <div class="admin-quick-grid">
        <div class="admin-action-tile" onclick="switchToTab('slider')">
          <div class="tile-icon-box icon-tile-hero">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="tile-info">
            <h4 class="tile-title">Edit Teks & Foto Hero</h4>
            <p class="tile-desc">Ganti foto slider beranda, akreditasi, dan slogan yayasan.</p>
          </div>
          <span class="tile-arrow">→</span>
        </div>

        <div class="admin-action-tile" onclick="openModalNews()">
          <div class="tile-icon-box icon-tile-news">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="tile-info">
            <h4 class="tile-title">Tulis Warta / Berita Baru</h4>
            <p class="tile-desc">Terbitkan rilis kegiatan atau artikel humas (~2,5 menit baca).</p>
          </div>
          <span class="tile-arrow">→</span>
        </div>

        <div class="admin-action-tile" onclick="switchToTab('leads')">
          <div class="tile-icon-box icon-tile-leads">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="tile-info">
            <h4 class="tile-title">Verifikasi Pendaftar PPDB</h4>
            <p class="tile-desc">Cek data santri, hubungi wali santri via WA, dan cetak bukti.</p>
          </div>
          <span class="tile-arrow">→</span>
        </div>

        <div class="admin-action-tile" onclick="switchToTab('units')">
          <div class="tile-icon-box icon-tile-units">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M4 21V9l8-5 8 5v12M9 14h6M9 21v-6h6v6"/></svg>
          </div>
          <div class="tile-info">
            <h4 class="tile-title">Kelola Satuan & Asrama</h4>
            <p class="tile-desc">Atur profil madrasah, kurikulum sains, dan asrama santri.</p>
          </div>
          <span class="tile-arrow">→</span>
        </div>

        <div class="admin-action-tile" onclick="switchToTab('settings')">
          <div class="tile-icon-box icon-tile-settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div class="tile-info">
            <h4 class="tile-title">Cadangkan ke Google Sheets</h4>
            <p class="tile-desc">Sinkronisasi cloud online untuk menjamin data aman 100%.</p>
          </div>
          <span class="tile-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- 4. TABEL PENDAFTAR SANTRI BARU TERBARU -->
    <div class="admin-card" style="padding:16px 20px; margin-top:24px; margin-bottom:20px; border-radius:16px;">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:1.02rem; font-weight:800; color:#0A2540;">Pendaftar Santri Baru Terbaru</h3>
            <span style="font-size:0.72rem; font-weight:700; background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px; border:1px solid #BFDBFE;">${db.leads.length} Total</span>
          </div>
          <p style="margin:2px 0 0; font-size:0.76rem; color:#64748B;">Calon santri yang baru saja mengisi formulir PPDB online.</p>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="exportLeadsExcel()" style="padding:5px 10px; font-size:0.76rem;">📥 CSV</button>
          <button class="btn btn-primary btn-sm" onclick="switchToTab('leads')" style="padding:5px 12px; font-size:0.76rem; font-weight:700; background:#0F4C81; border-color:#FBBF24;">Lihat Semua (${db.leads.length}) →</button>
        </div>
      </div>

      <!-- Desktop View: Sleek High-Density Table -->
      <div class="desktop-only-table" style="overflow-x:auto;">
        <table class="admin-table table-compact">
          <thead>
            <tr>
              <th style="width:110px;">No. Registrasi</th>
              <th style="min-width:170px;">Nama Santri</th>
              <th style="min-width:130px;">Unit Pilihan</th>
              <th style="min-width:160px;">Nama Wali / WhatsApp</th>
              <th style="width:110px;">Status</th>
              <th style="width:95px;">Waktu</th>
              <th style="width:120px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${db.leads.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:18px; color:#64748B; font-size:0.82rem;">Belum ada calon santri yang mendaftar.</td></tr>' : ''}
            ${db.leads.slice(0, 5).map((l, idx) => {
              const originalIndex = db.leads.findIndex(item => item.regNumber === l.regNumber);
              const waNumber = (l.whatsapp || '').replace(/[^0-9]/g, '');
              return `
                <tr>
                  <td>
                    <span style="font-family:ui-monospace, monospace; font-size:0.72rem; font-weight:700; background:#F1F5F9; color:#0A2540; padding:2px 6px; border-radius:4px; border:1px solid #CBD5E1; white-space:nowrap;">
                      ${l.regNumber}
                    </span>
                  </td>
                  <td>
                    <strong style="color:#0A2540; font-size:0.83rem; display:block; line-height:1.2;">${l.fullName}</strong>
                    <small style="color:#64748B; font-size:0.71rem;">${l.gender || '-'} • ${l.previousSchool || 'Sekolah Asal'}</small>
                  </td>
                  <td>${getCompactUnitBadge(l.unit)}</td>
                  <td>
                    <span style="font-size:0.8rem; font-weight:600; color:#1E293B; display:block; line-height:1.2;">${l.parentName || l.fatherName || 'Orang Tua'}</span>
                    <a href="https://wa.me/${waNumber}" target="_blank" style="color:#059669; font-weight:700; font-size:0.72rem; display:inline-flex; align-items:center; gap:2px; text-decoration:none;">
                      💬 ${l.whatsapp}
                    </a>
                  </td>
                  <td>
                    <select onchange="updateLeadStatus(${originalIndex}, this.value)" style="padding:3px 6px; border-radius:6px; border:1px solid #CBD5E1; font-size:0.75rem; font-weight:700; background:#FFF; color:#0A2540;">
                      <option value="Baru" ${l.status === 'Baru' ? 'selected' : ''}>Baru</option>
                      <option value="Diverifikasi" ${l.status === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
                      <option value="Diterima" ${l.status === 'Diterima' ? 'selected' : ''}>Diterima</option>
                      <option value="Ditolak" ${l.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
                    </select>
                  </td>
                  <td><span style="color:#64748B; font-size:0.74rem; white-space:nowrap;">${l.date}</span></td>
                  <td style="text-align:center;">
                    <div style="display:inline-flex; gap:3px;">
                      <button class="btn-action-edit" onclick="showLeadDetail(${originalIndex})" style="padding:3px 6px; font-size:0.72rem; border-radius:5px;" title="Lihat Rincian Formulir">👁️ Detail</button>
                      <button class="btn-action-edit" onclick="printLeadSlip(${originalIndex})" style="padding:3px 6px; font-size:0.72rem; border-radius:5px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;" title="Cetak Kartu Registrasi">🖨️ Cetak</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile View: Modern Stacked Touch Cards -->
      <div class="mobile-leads-list">
        ${db.leads.length === 0 ? '<div style="text-align:center; padding:16px; color:#64748B; font-size:0.8rem;">Belum ada calon santri yang mendaftar.</div>' : ''}
        ${db.leads.slice(0, 5).map((l, idx) => {
          const originalIndex = db.leads.findIndex(item => item.regNumber === l.regNumber);
          const waNumber = (l.whatsapp || '').replace(/[^0-9]/g, '');
          return `
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; margin-bottom:8px; box-shadow:0 2px 5px rgba(10,37,64,0.03);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; gap:6px;">
                <div>
                  <span style="font-family:ui-monospace, monospace; font-size:0.7rem; font-weight:700; background:#F1F5F9; color:#0A2540; padding:1px 5px; border-radius:4px; border:1px solid #CBD5E1;">
                    ${l.regNumber}
                  </span>
                  <strong style="color:#0A2540; font-size:0.85rem; display:block; margin-top:2px;">${l.fullName}</strong>
                </div>
                <div>${getCompactUnitBadge(l.unit)}</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748B; margin-bottom:8px; border-top:1px dashed #E2E8F0; padding-top:6px;">
                <div>
                  <span style="color:#1E293B; font-weight:600;">Wali: ${l.parentName || l.fatherName || 'Orang Tua'}</span>
                  <a href="https://wa.me/${waNumber}" target="_blank" style="color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:2px; margin-left:6px; text-decoration:none;">
                    💬 WA
                  </a>
                </div>
                <div>${l.date}</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                <select onchange="updateLeadStatus(${originalIndex}, this.value)" style="padding:3px 6px; border-radius:6px; border:1px solid #CBD5E1; font-size:0.75rem; font-weight:700; background:#FFF; color:#0A2540;">
                  <option value="Baru" ${l.status === 'Baru' ? 'selected' : ''}>Baru</option>
                  <option value="Diverifikasi" ${l.status === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
                  <option value="Diterima" ${l.status === 'Diterima' ? 'selected' : ''}>Diterima</option>
                  <option value="Ditolak" ${l.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
                </select>
                <div style="display:flex; gap:4px;">
                  <button class="btn-action-edit" onclick="showLeadDetail(${originalIndex})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px;">👁️ Detail</button>
                  <button class="btn-action-edit" onclick="printLeadSlip(${originalIndex})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;">🖨️ Cetak</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 5. ROADMAP & PEMELIHARAAN SISTEM -->
    <div class="admin-card" style="padding:16px 20px; border:1.5px solid #CBD5E1; background:#FFFFFF; border-radius:16px;">
      <div class="admin-card-header" style="margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:5px; background:#FEF3C7; color:#92400E; font-size:0.7rem; font-weight:800; padding:2px 7px; border-radius:6px; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:3px;">
            🛠️ Roadmap & Pemeliharaan Sistem
          </div>
          <h3 style="margin:0; font-size:1.02rem; font-weight:800; color:#0A2540;">Pengaturan Penambahan & Perbaikan Fitur Selanjutnya</h3>
          <p style="margin:2px 0 0; font-size:0.76rem; color:#64748B;">Catat ide, pantau status perbaikan, dan kelola rencana pengembangan sistem portal & CMS.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalAddFeatureRoadmap()" style="font-size:0.76rem; font-weight:700; padding:5px 12px; display:inline-flex; align-items:center; gap:5px; background:#0F4C81; border-color:#FBBF24;">
          <span>+ Tambah Catatan Fitur</span>
        </button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px;">
        ${(db.featureRoadmap || []).map((f, fIdx) => {
          let badgeColor = 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;';
          if (f.status === 'Aktif' || f.status === 'Optimal') badgeColor = 'background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;';
          if (f.status === 'Dalam Pengembangan') badgeColor = 'background:#FFFBEB; color:#B45309; border:1px solid #FDE68A;';
          if (f.status === 'Dalam Perencanaan') badgeColor = 'background:#F1F5F9; color:#475569; border:1px solid #CBD5E1;';

          return `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px; position:relative; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
                  <span style="font-size:0.68rem; font-weight:800; text-transform:uppercase; color:#64748B; letter-spacing:0.04em;">${f.category || 'Sistem'}</span>
                  <span style="font-size:0.68rem; font-weight:700; padding:2px 6px; border-radius:4px; ${badgeColor}">${f.status || 'Aktif'}</span>
                </div>
                <strong style="color:#0A2540; font-size:0.86rem; display:block; margin-bottom:4px; line-height:1.25;">${f.title}</strong>
                <p style="margin:0 0 8px; font-size:0.76rem; color:#475569; line-height:1.35;">${f.description || '-'}</p>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #CBD5E1; padding-top:6px; font-size:0.7rem; color:#64748B;">
                <span>📅 ${f.updatedAt || 'Terbaru'}</span>
                <div style="display:inline-flex; gap:4px;">
                  <button onclick="openModalAddFeatureRoadmap(${fIdx})" style="background:none; border:none; color:#0284C7; font-size:0.72rem; font-weight:700; cursor:pointer; padding:2px 4px;">Edit</button>
                  <button onclick="deleteFeatureRoadmap(${fIdx})" style="background:none; border:none; color:#DC2626; font-size:0.72rem; font-weight:700; cursor:pointer; padding:2px 4px;">Hapus</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getCompactUnitBadge(unitStr) {
  const str = (unitStr || '').toLowerCase();
  if (str.includes('ma ') || str.includes('aliyah')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#1D4ED8; background:#EFF6FF; border:1px solid #BFDBFE; padding:2px 7px; border-radius:5px; white-space:nowrap;">MA Aliyah</span>`;
  }
  if (str.includes('mts') || str.includes('tsanawiyah')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#0284C7; background:#F0F9FF; border:1px solid #BAE6FD; padding:2px 7px; border-radius:5px; white-space:nowrap;">MTs Tsanawiyah</span>`;
  }
  if (str.includes('smp')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#0D9488; background:#F0FDFA; border:1px solid #99F6E4; padding:2px 7px; border-radius:5px; white-space:nowrap;">SMP Formal</span>`;
  }
  if (str.includes('sma')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#4338CA; background:#EEF2FF; border:1px solid #C7D2FE; padding:2px 7px; border-radius:5px; white-space:nowrap;">SMA Formal</span>`;
  }
  if (str.includes('mi ') || str.includes('ibtidaiyah')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#059669; background:#ECFDF5; border:1px solid #A7F3D0; padding:2px 7px; border-radius:5px; white-space:nowrap;">MI Ibtidaiyah</span>`;
  }
  if (str.includes('tk')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#D97706; background:#FFFBEB; border:1px solid #FDE68A; padding:2px 7px; border-radius:5px; white-space:nowrap;">TK Formal</span>`;
  }
  if (str.includes('kb') || str.includes('paud')) {
    return `<span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#EA580C; background:#FFF7ED; border:1px solid #FED7AA; padding:2px 7px; border-radius:5px; white-space:nowrap;">KB PAUD</span>`;
  }
  const clean = (unitStr || 'Unit').replace(/raudlatul muta'allimin/gi, '').trim();
  return `<span style="display:inline-block; font-size:0.72rem; font-weight:700; color:#334155; background:#F1F5F9; border:1px solid #CBD5E1; padding:2px 7px; border-radius:5px; white-space:nowrap;">${clean || unitStr}</span>`;
}

window.openModalAddFeatureRoadmap = function(editIdx) {
  const modal = document.getElementById('adminModal');
  const title = document.getElementById('adminModalTitle');
  const body = document.getElementById('adminModalBody');
  if (!modal || !body) return;

  const db = getDB();
  const list = db.featureRoadmap || [];
  const isEdit = typeof editIdx === 'number' && list[editIdx];
  const item = isEdit ? list[editIdx] : {
    title: '',
    category: 'PPDB & Kesiswaan',
    status: 'Dalam Perencanaan',
    priority: 'Sedang',
    description: ''
  };

  title.textContent = isEdit ? 'Edit Catatan Rencana Fitur' : 'Tambah Rencana / Perbaikan Fitur Baru';
  body.innerHTML = `
    <form onsubmit="event.preventDefault(); saveFeatureRoadmap(${isEdit ? editIdx : -1});">
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Nama Fitur / Rencana Perbaikan *</label>
        <input type="text" id="featTitle" class="form-input" style="font-size:0.84rem; padding:8px 10px;" value="${item.title || ''}" placeholder="Contoh: Integrasi Pembayaran Online Otomatis" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Kategori Modul</label>
          <select id="featCategory" class="form-select" style="font-size:0.82rem; padding:7px 10px;">
            <option value="PPDB & Kesiswaan" ${item.category === 'PPDB & Kesiswaan' ? 'selected' : ''}>PPDB & Kesiswaan</option>
            <option value="Akademik" ${item.category === 'Akademik' ? 'selected' : ''}>Akademik</option>
            <option value="Publikasi & Berita" ${item.category === 'Publikasi & Berita' ? 'selected' : ''}>Publikasi & Berita</option>
            <option value="Performa & Mobile" ${item.category === 'Performa & Mobile' ? 'selected' : ''}>Performa & Mobile</option>
            <option value="Sistem & Keamanan" ${item.category === 'Sistem & Keamanan' ? 'selected' : ''}>Sistem & Keamanan</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Status Rencana</label>
          <select id="featStatus" class="form-select" style="font-size:0.82rem; padding:7px 10px;">
            <option value="Aktif" ${item.status === 'Aktif' ? 'selected' : ''}>🟢 Aktif</option>
            <option value="Siap Digunakan" ${item.status === 'Siap Digunakan' ? 'selected' : ''}>🔵 Siap Digunakan</option>
            <option value="Optimal" ${item.status === 'Optimal' ? 'selected' : ''}>✨ Optimal</option>
            <option value="Dalam Pengembangan" ${item.status === 'Dalam Pengembangan' ? 'selected' : ''}>🟡 Dalam Pengembangan</option>
            <option value="Dalam Perencanaan" ${item.status === 'Dalam Perencanaan' ? 'selected' : ''}>⚪ Dalam Perencanaan</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Prioritas</label>
          <select id="featPriority" class="form-select" style="font-size:0.82rem; padding:7px 10px;">
            <option value="Tinggi" ${item.priority === 'Tinggi' ? 'selected' : ''}>🔴 Tinggi</option>
            <option value="Sedang" ${item.priority === 'Sedang' ? 'selected' : ''}>🟡 Sedang</option>
            <option value="Rendah" ${item.priority === 'Rendah' ? 'selected' : ''}>🟢 Rendah</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Deskripsi & Catatan Teknis</label>
        <textarea id="featDesc" class="form-textarea" rows="2" style="font-size:0.82rem; padding:8px 10px;" placeholder="Uraian perbaikan atau fitur yang diinginkan...">${item.description || ''}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">💾 Simpan Rencana Fitur</button>
      </div>
    </form>
  `;
  modal.classList.add('active');
};

window.saveFeatureRoadmap = function(editIdx) {
  const db = getDB();
  if (!db.featureRoadmap) db.featureRoadmap = [];

  const title = document.getElementById('featTitle').value.trim();
  const category = document.getElementById('featCategory').value;
  const status = document.getElementById('featStatus').value;
  const priority = document.getElementById('featPriority').value;
  const description = document.getElementById('featDesc').value.trim();

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });

  if (editIdx >= 0 && db.featureRoadmap[editIdx]) {
    db.featureRoadmap[editIdx] = Object.assign(db.featureRoadmap[editIdx], {
      title, category, status, priority, description, updatedAt: dateStr
    });
  } else {
    db.featureRoadmap.push({
      id: 'feat-' + Date.now().toString(36),
      title, category, status, priority, description, updatedAt: dateStr
    });
  }

  saveDB(db);
  closeAdminModal();
  showToast('Rencana fitur berhasil disimpan!', 'success');
  const container = document.getElementById('adminContentArea');
  if (container) renderTabDashboard(db, container);
};

window.deleteFeatureRoadmap = function(idx) {
  if (!confirm('Apakah Anda yakin ingin menghapus catatan rencana fitur ini?')) return;
  const db = getDB();
  if (db.featureRoadmap && db.featureRoadmap[idx]) {
    db.featureRoadmap.splice(idx, 1);
    saveDB(db);
    showToast('Catatan rencana fitur dihapus.', 'info');
    const container = document.getElementById('adminContentArea');
    if (container) renderTabDashboard(db, container);
  }
};



function getStatusBadgeClass(status) {
  if (status === 'Baru') return 'badge-new';
  if (status === 'Diverifikasi') return 'badge-verified';
  if (status === 'Diterima') return 'badge-accepted';
  return 'badge-pending';
}

/* ===================================================================
   TAB 1B: ANALISIS TRAFIK & ASAL WILAYAH PENGUNJUNG (LIVE ANALYTICS)
   =================================================================== */
function renderTabAnalytics(db, container) {
  if (!db.analytics) db.analytics = DEFAULT_YAYASAN_DATA.analytics;

  const totalViews = (db.analytics.totalViews || 12480);
  const uniqueVisitors = (db.analytics.uniqueVisitors || 6820);
  const todayViews = (db.analytics.todayViews || 142);
  const todayUnique = (db.analytics.todayUnique || 98);
  const gaId = (db.meta && db.meta.gaId) || '';

  container.innerHTML = `
    <!-- Top Action Bar -->
    <div class="analytics-top-bar">
      <div>
        <div style="display:inline-flex; align-items:center; gap:6px; background:#ECFDF5; color:#047857; font-size:0.72rem; font-weight:800; padding:3px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.04em; border:1px solid #A7F3D0;">
          <span style="width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981; display:inline-block;"></span>
          Telemetry & Geolocation Engine Aktif
        </div>
        <h2 class="analytics-heading" style="margin:6px 0 0; font-size:1.25rem; font-weight:800; color:#0A2540;">Analisis Kunjungan & Asal Wilayah Calon Santri</h2>
      </div>
      <div class="analytics-top-actions">
        <button class="btn btn-outline btn-sm btn-analytics-action" onclick="exportAnalyticsCSV()" style="font-size:0.78rem; font-weight:700; padding:8px 12px; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
          <span>📥 Unduh Laporan (.CSV)</span>
        </button>
        <button class="btn btn-outline btn-sm btn-analytics-action" onclick="simulateVisitorTest()" style="font-size:0.78rem; font-weight:700; padding:8px 12px; display:inline-flex; align-items:center; justify-content:center; gap:5px; background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE;">
          <span>🔄 Uji Simulasi</span>
        </button>
        <button class="btn btn-outline btn-sm btn-analytics-action" onclick="resetAnalyticsData()" style="font-size:0.78rem; font-weight:700; padding:8px 12px; color:#DC2626; border-color:#FECACA; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
          <span>🗑️ Reset Log</span>
        </button>
      </div>
    </div>

    <!-- 6 KPI Metric Cards -->
    <div class="admin-stats-grid analytics-kpi-grid">
      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#EFF6FF; color:#2563EB;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val">${totalViews.toLocaleString('id-ID')}</div>
          <div class="admin-stat-title">Total Kunjungan</div>
        </div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#ECFDF5; color:#059669;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val">${uniqueVisitors.toLocaleString('id-ID')}</div>
          <div class="admin-stat-title">Pengunjung Unik</div>
        </div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#FEF3C7; color:#B45309;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val">+${todayViews.toLocaleString('id-ID')}</div>
          <div class="admin-stat-title">Hari Ini (${todayUnique} Unik)</div>
        </div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#FDF2F8; color:#BE185D;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val" style="font-size:1.05rem;">${db.analytics.cities?.[0]?.name || 'Lamongan'}</div>
          <div class="admin-stat-title">Kota Dominan (${db.analytics.cities?.[0]?.percent || 42}%)</div>
        </div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#FAF5FF; color:#9333EA;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val">${db.analytics.devices?.mobile || 82}%</div>
          <div class="admin-stat-title">Pengguna Ponsel (HP)</div>
        </div>
      </div>

      <div class="admin-stat-card">
        <div class="admin-stat-icon-wrap" style="background:#F0FDF4; color:#16A34A;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div style="min-width:0;">
          <div class="admin-stat-val" style="font-size:1.05rem;">WhatsApp</div>
          <div class="admin-stat-title">Rujukan PPDB Terbanyak</div>
        </div>
      </div>
    </div>

    <!-- 2-Column Grid: Sebaran Wilayah & Kanal Promosi -->
    <div class="analytics-two-col-grid">
      
      <!-- Card 1: Distribusi Wilayah / Kota Asal Pengunjung -->
      <div class="admin-card">
        <div class="admin-card-header" style="margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <h3 style="margin:0; font-size:1.02rem; font-weight:800; color:#0A2540;">📍 Matriks Sebaran Kota & Wilayah Asal Pengunjung</h3>
            <p style="margin:2px 0 0; font-size:0.75rem; color:#64748B;">Data demografi calon santri & wali santri yang mengakses website.</p>
          </div>
          <span style="font-size:0.72rem; font-weight:700; background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px;">${(db.analytics.cities || []).length} Wilayah Terpetakan</span>
        </div>

        <!-- Desktop City Table -->
        <div class="analytics-city-desktop-table admin-table-wrap">
          <table class="admin-table" style="font-size:0.8rem;">
            <thead>
              <tr>
                <th>Kota / Kabupaten</th>
                <th>Provinsi</th>
                <th style="text-align:right;">Pengunjung</th>
                <th style="text-align:right;">Pangsa</th>
                <th>Visualisasi Rasio</th>
              </tr>
            </thead>
            <tbody>
              ${(db.analytics.cities || []).map((c, i) => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-weight:700; color:#0A2540;">${c.name}</span>
                      ${i === 0 ? '<span style="font-size:0.62rem; font-weight:800; background:#FEF3C7; color:#B45309; padding:1px 5px; border-radius:3px;">UTAMA</span>' : ''}
                    </div>
                  </td>
                  <td><span style="color:#64748B; font-size:0.75rem;">${c.region || 'Jawa Timur'}</span></td>
                  <td style="text-align:right; font-weight:800; color:#0A2540;">${(c.count || 0).toLocaleString('id-ID')}</td>
                  <td style="text-align:right; font-weight:700; color:#059669;">${c.percent || 1}%</td>
                  <td style="min-width:110px;">
                    <div style="width:100%; height:7px; background:#F1F5F9; border-radius:4px; overflow:hidden;">
                      <div style="width:${Math.min((c.percent || 1) * 2.2, 100)}%; height:100%; background:linear-gradient(90deg, #0F4C81 0%, #FBBF24 100%); border-radius:4px;"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Mobile City Touch Cards -->
        <div class="analytics-city-mobile-list">
          ${(db.analytics.cities || []).map((c, i) => `
            <div class="analytics-city-card-mobile">
              <div class="city-card-mobile-header">
                <div class="city-name-wrap">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <strong class="city-name-text">${c.name}</strong>
                    ${i === 0 ? '<span class="city-badge-primary">UTAMA</span>' : ''}
                  </div>
                  <span class="city-region-tag">${c.region || 'Jawa Timur'}</span>
                </div>
                <div class="city-stat-wrap">
                  <span class="city-count-text">${(c.count || 0).toLocaleString('id-ID')}</span>
                  <span class="city-percent-text">${c.percent || 1}%</span>
                </div>
              </div>
              <div class="city-progress-bar-wrap">
                <div class="city-progress-fill" style="width:${Math.min((c.percent || 1) * 2.2, 100)}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Card 2: Kanal Rujukan & Konten Terfavorit -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- Kanal Rujukan Promosi -->
        <div class="admin-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
            <h4 style="margin:0; font-size:0.92rem; font-weight:800; color:#0A2540;">🔗 Sumber Trafik & Kanal Promosi</h4>
            <span style="font-size:0.7rem; color:#64748B;">Referrer Analysis</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:9px;">
            ${(db.analytics.sources || []).map(s => `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:0.78rem; margin-bottom:3px;">
                  <span style="font-weight:700; color:#1E293B;">${s.icon} ${s.name}</span>
                  <span style="font-weight:800; color:#0A2540;">${(s.count || 0).toLocaleString('id-ID')} <span style="font-weight:600; color:#64748B;">(${s.percent}%)</span></span>
                </div>
                <div style="width:100%; height:6px; background:#F1F5F9; border-radius:3px; overflow:hidden;">
                  <div style="width:${Math.min((s.percent || 1) * 2, 100)}%; height:100%; background:${s.color || '#2563EB'}; border-radius:3px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Halaman Terpopuler -->
        <div class="admin-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
            <h4 style="margin:0; font-size:0.92rem; font-weight:800; color:#0A2540;">📄 Halaman Paling Sering Dibaca</h4>
            <span style="font-size:0.7rem; color:#64748B;">Top Pageviews</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${(db.analytics.pages || []).slice(0, 4).map((p, idx) => `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; padding:8px 10px; background:#F8FAFC; border-radius:6px; border:1px solid #E2E8F0; gap:8px;">
                <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1;">
                  <strong style="color:#0A2540; font-size:0.8rem; display:block; overflow:hidden; text-overflow:ellipsis;">${idx + 1}. ${p.title}</strong>
                  <div style="font-size:0.68rem; color:#64748B; overflow:hidden; text-overflow:ellipsis;"><code>/${p.path}</code></div>
                </div>
                <span style="font-weight:800; color:#1D4ED8; font-size:0.78rem; white-space:nowrap; flex-shrink:0;">${(p.views || 0).toLocaleString('id-ID')} hits</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

    </div>

    <!-- Real-time Visitor Logs Table -->
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <div>
          <h3 style="margin:0; font-size:1.05rem; font-weight:800; color:#0A2540;">🕒 Log Aktivitas Kunjungan Terbaru (Real-Time)</h3>
          <p style="margin:2px 0 0; font-size:0.76rem; color:#64748B;">Rekaman jejak kunjungan calon santri, halaman yang dituju, dan lokasi akses.</p>
        </div>
        <span style="font-size:0.72rem; font-weight:700; background:#F1F5F9; color:#475569; padding:3px 9px; border-radius:4px; border:1px solid #CBD5E1;">
          ${(db.analytics.recentLogs || []).length} Riwayat Terakhir
        </span>
      </div>

      <!-- Desktop Visitor Logs Table -->
      <div class="analytics-logs-desktop-table admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Waktu Kunjungan</th>
              <th>Halaman Dituju</th>
              <th>Asal Wilayah / Kota</th>
              <th>Perangkat</th>
              <th>Kanal Masuk</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(db.analytics.recentLogs && db.analytics.recentLogs.length > 0) ? db.analytics.recentLogs.map(log => `
              <tr>
                <td><span style="font-size:0.76rem; font-weight:600; color:#64748B; font-family:ui-monospace, monospace;">${log.timestamp}</span></td>
                <td><strong style="color:#0A2540; font-size:0.82rem;">${log.page}</strong></td>
                <td>
                  <span style="font-weight:700; color:#0F4C81; display:inline-flex; align-items:center; gap:4px;">
                    📍 ${log.city}
                  </span>
                </td>
                <td><span style="font-size:0.76rem; color:#334155; background:#F1F5F9; padding:2px 6px; border-radius:4px; border:1px solid #E2E8F0;">${log.device}</span></td>
                <td>
                  <span style="font-size:0.76rem; font-weight:700; color:${log.source.includes('WhatsApp') ? '#047857' : (log.source.includes('Google') ? '#B45309' : '#1D4ED8')};">
                    ${log.source}
                  </span>
                </td>
                <td style="text-align:center;">
                  <span style="font-size:0.68rem; font-weight:800; background:#ECFDF5; color:#059669; padding:2px 6px; border-radius:4px; border:1px solid #A7F3D0;">BERHASIL</span>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; padding:18px; color:#64748B;">Belum ada log aktivitas.</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Mobile Visitor Logs Cards -->
      <div class="analytics-logs-mobile-list">
        ${(db.analytics.recentLogs && db.analytics.recentLogs.length > 0) ? db.analytics.recentLogs.map(log => `
          <div class="analytics-log-card-mobile">
            <div class="log-card-top">
              <span class="log-timestamp">${log.timestamp}</span>
              <span class="badge-status badge-verified" style="font-size:0.68rem; padding:1px 6px;">BERHASIL</span>
            </div>
            <div class="log-page-title">${log.page}</div>
            <div class="log-meta-row">
              <span class="log-meta-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${log.city}</span>
              <span class="log-meta-tag">${log.device}</span>
              <span class="log-meta-tag log-source-tag" style="color:${log.source.includes('WhatsApp') ? '#047857' : (log.source.includes('Google') ? '#B45309' : '#1D4ED8')}; font-weight:700;">${log.source}</span>
            </div>
          </div>
        `).join('') : '<div style="padding:16px; text-align:center; color:#64748B;">Belum ada log aktivitas.</div>'}
      </div>
    </div>

    <!-- Integrasi Google Analytics 4 (GA4) Configuration Box -->
    <div class="admin-card" style="border:1.5px solid #CBD5E1; background:#FFFFFF;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#FEF3C7; color:#92400E; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:4px; text-transform:uppercase; margin-bottom:4px;">
            📊 Google Analytics 4 (GA4) Enterprise
          </div>
          <h3 style="margin:0; font-size:1.05rem; font-weight:800; color:#0A2540;">Integrasi Resmi Google Analytics 4</h3>
          <p style="margin:2px 0 0; font-size:0.76rem; color:#64748B;">Hubungkan website dengan Google Analytics untuk pelaporan jangka panjang, demografi usia, dan heatmap interaksi.</p>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${gaId ? '<span style="background:#ECFDF5; color:#047857; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:6px; border:1px solid #A7F3D0;">🟢 Terhubung: ' + gaId + '</span>' : '<span style="background:#F1F5F9; color:#64748B; font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:6px; border:1px solid #CBD5E1;">⚪ Belum Terhubung</span>'}
        </div>
      </div>

      <div class="analytics-ga-form-wrap">
        <input type="text" id="analyticsGaInput" class="form-input" value="${gaId}" placeholder="Contoh: G-XXXXXXXXXX" style="font-family:ui-monospace, monospace; font-weight:700;">
        <button class="btn btn-primary" onclick="saveGaConfig()" style="font-size:0.82rem; font-weight:800; padding:8px 16px;">
          💾 Simpan ID GA4
        </button>
      </div>
      <small style="display:block; margin-top:8px; color:#64748B; font-size:0.75rem;">
        Tips: Dapatkan Measurement ID dari dashboard <a href="https://analytics.google.com" target="_blank" style="color:#0284C7; font-weight:700;">Google Analytics ↗</a> pada menu Admin &gt; Data Streams.
      </small>
    </div>
  `;
}

window.exportAnalyticsCSV = function() {
  const db = getDB();
  const logs = (db.analytics && db.analytics.recentLogs) || [];
  if (logs.length === 0) {
    alert('Belum ada log kunjungan yang dapat diekspor.');
    return;
  }

  let csv = 'Timestamp,Halaman,Kota_Wilayah,Perangkat,Kanal_Rujukan\n';
  logs.forEach(l => {
    csv += `"${l.timestamp}","${l.page}","${l.city}","${l.device}","${l.source}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Laporan_Analitik_Pengunjung_YTPAI_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.simulateVisitorTest = function() {
  const db = getDB();
  if (!db.analytics) db.analytics = DEFAULT_YAYASAN_DATA.analytics;

  const mockCities = [
    { city: 'Lamongan Kota', region: 'Jawa Timur' },
    { city: 'Babat', region: 'Jawa Timur' },
    { city: 'Tuban', region: 'Jawa Timur' },
    { city: 'Bojonegoro', region: 'Jawa Timur' },
    { city: 'Gresik', region: 'Jawa Timur' },
    { city: 'Surabaya', region: 'Jawa Timur' },
    { city: 'Sidoarjo', region: 'Jawa Timur' },
    { city: 'Mojokerto', region: 'Jawa Timur' }
  ];
  const mockPages = [
    'Pendaftaran Santri Baru (PPDB)',
    'Beranda Utama',
    'Pondok Pesantren Putra & Putri',
    'LBB Sukses PTN & CBT',
    'KBIHU Haji & Umrah'
  ];
  const mockSources = ['WhatsApp PPDB', 'Google Pencarian', 'Instagram', 'Direct / Ketik URL'];
  const mockDevices = ['Mobile (Android)', 'Mobile (iPhone)', 'Desktop (Windows)', 'Tablet (iPad)'];

  const chosenCity = mockCities[Math.floor(Math.random() * mockCities.length)];
  const chosenPage = mockPages[Math.floor(Math.random() * mockPages.length)];
  const chosenSource = mockSources[Math.floor(Math.random() * mockSources.length)];
  const chosenDevice = mockDevices[Math.floor(Math.random() * mockDevices.length)];

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  db.analytics.totalViews = (db.analytics.totalViews || 0) + 1;
  db.analytics.todayViews = (db.analytics.todayViews || 0) + 1;
  if (Math.random() > 0.4) {
    db.analytics.uniqueVisitors = (db.analytics.uniqueVisitors || 0) + 1;
    db.analytics.todayUnique = (db.analytics.todayUnique || 0) + 1;
  }

  // Update city tally
  let cityObj = db.analytics.cities.find(c => c.name.toLowerCase().includes(chosenCity.city.toLowerCase()));
  if (cityObj) {
    cityObj.count = (cityObj.count || 0) + 1;
  } else {
    db.analytics.cities.push({
      name: chosenCity.city,
      region: chosenCity.region,
      count: 1,
      percent: 1,
      isLocal: chosenCity.city.includes('Lamongan') || chosenCity.city.includes('Babat')
    });
  }

  // Update source
  let srcObj = db.analytics.sources.find(s => s.name === chosenSource);
  if (srcObj) srcObj.count = (srcObj.count || 0) + 1;

  if (!db.analytics.recentLogs) db.analytics.recentLogs = [];
  db.analytics.recentLogs.unshift({
    timestamp: timeStr,
    page: chosenPage,
    city: chosenCity.city,
    device: chosenDevice,
    source: chosenSource
  });
  if (db.analytics.recentLogs.length > 50) db.analytics.recentLogs = db.analytics.recentLogs.slice(0, 50);

  saveDB(db);
  const container = document.getElementById('adminContentArea');
  if (container) renderTabAnalytics(db, container);
  alert(`Simulasi kunjungan berhasil ditambahkan!\n\n• Asal Kota: ${chosenCity.city}\n• Halaman: ${chosenPage}\n• Sumber: ${chosenSource}`);
};

window.resetAnalyticsData = function() {
  if (confirm('Apakah Anda yakin ingin mereset data log kunjungan harian? Data statistik total akan diset ke baseline awal.')) {
    const db = getDB();
    db.analytics = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.analytics));
    saveDB(db);
    const container = document.getElementById('adminContentArea');
    if (container) renderTabAnalytics(db, container);
    alert('Data analitik berhasil direset ke baseline awal.');
  }
};

window.saveGaConfig = function() {
  const input = document.getElementById('analyticsGaInput');
  if (!input) return;
  const val = input.value.trim();
  const db = getDB();
  if (!db.meta) db.meta = {};
  db.meta.gaId = val;
  saveDB(db);
  const container = document.getElementById('adminContentArea');
  if (container) renderTabAnalytics(db, container);
  alert(val ? `ID Google Analytics 4 (${val}) berhasil disimpan dan aktif di website publik!` : 'ID Google Analytics telah dinonaktifkan.');
};

/* --- TAB: KONTEN & SLIDE FOTO BERANDA (HERO CONTENT & SLIDER) --- */
function renderTabSlider(db, container) {
  const hero = db.hero || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.hero) || {
    badgeTag: "Akreditasi Unggul (A)",
    badgeSlogan: "Unggul dalam Prestasi, Berkarakter dalam Budaya",
    headline: "Pendidikan Terbaik untuk <span class=\"highlight\">Generasi Unggul</span> dan Berkarakter",
    description: "Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin Lamongan mengintegrasikan kurikulum nasional, keunggulan sains terapan, serta keluhuran tradisi kepesantrenan salaf dalam satu ekosistem pendidikan modern.",
    cta1Text: "Daftar Santri Baru (PPDB)",
    cta1Link: "#pendaftaran",
    cta2Text: "Jelajahi 11 Satuan Pendidikan",
    cta2Link: "#unit"
  };
  const slides = db.heroSlides || [];

  container.innerHTML = `
    <!-- 1. EDIT TEKS & KONTEN HERO BERANDA -->
    <div class="admin-card" style="border: 2px solid #BFDBFE; background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); margin-bottom: 24px;">
      <div class="admin-card-header" style="border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#EFF6FF; color:#1D4ED8; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
            ✨ Teks & Konten Utama Halaman Depan
          </div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#1E3A8A;">Pengaturan Teks Area Hero Beranda</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Ubah judul headline, lencana akreditasi, slogan, deskripsi, dan tombol aksi di atas slide beranda.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveHeroTextForm()" style="background:#1D4ED8; border-color:#1D4ED8;">
          💾 Simpan Teks Beranda
        </button>
      </div>

      <form onsubmit="event.preventDefault(); saveHeroTextForm();">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Lencana Akreditasi (Badge Kiri) *</label>
            <input type="text" id="heroFormBadgeTag" class="form-input" value="${hero.badgeTag || 'Akreditasi Unggul (A)'}" placeholder="Contoh: Akreditasi Unggul (A)" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Slogan pada Lencana (Badge Kanan)</label>
            <input type="text" id="heroFormBadgeSlogan" class="form-input" value="${hero.badgeSlogan || (db.meta && db.meta.slogan) || 'Unggul dalam Prestasi, Berkarakter dalam Budaya'}" placeholder="Contoh: Unggul dalam Prestasi, Berkarakter dalam Budaya">
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-weight:700; color:#1E293B;">Judul Utama / Headline Hero *</label>
          <input type="text" id="heroFormHeadline" class="form-input" value="${hero.headline ? hero.headline.replace(/"/g, '&quot;') : 'Pendidikan Terbaik untuk <span class=\"highlight\">Generasi Unggul</span> dan Berkarakter'}" required>
          <span style="font-size:0.75rem; color:#64748B;">Tips: Gunakan <code>&lt;span class="highlight"&gt;kata yang ingin disorot&lt;/span&gt;</code> untuk memberi warna aksen biru/emas menyala pada teks.</span>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-weight:700; color:#1E293B;">Deskripsi Lengkap Beranda *</label>
          <textarea id="heroFormDescription" class="form-textarea" rows="3" required>${hero.description || ''}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px;">
          <div class="form-group" style="background:#FFF; padding:12px; border-radius:8px; border:1px solid #E2E8F0;">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Tombol Aksi 1 (Primer / Pendaftaran)</label>
            <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:8px;">
              <input type="text" id="heroFormCta1Text" class="form-input" value="${hero.cta1Text || 'Daftar Santri Baru (PPDB)'}" placeholder="Teks Tombol" required>
              <input type="text" id="heroFormCta1Link" class="form-input" value="${hero.cta1Link || '#pendaftaran'}" placeholder="Tautan (#pendaftaran)">
            </div>
          </div>

          <div class="form-group" style="background:#FFF; padding:12px; border-radius:8px; border:1px solid #E2E8F0;">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Tombol Aksi 2 (Sekunder / Jelajahi Unit)</label>
            <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:8px;">
              <input type="text" id="heroFormCta2Text" class="form-input" value="${hero.cta2Text || 'Jelajahi 11 Satuan Pendidikan'}" placeholder="Teks Tombol" required>
              <input type="text" id="heroFormCta2Link" class="form-input" value="${hero.cta2Link || '#unit'}" placeholder="Tautan (#unit)">
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px;">
          <span style="font-size:0.78rem; color:#059669; font-weight:600;">✓ Perubahan tersimpan langsung aktif di website publik</span>
          <button type="submit" class="btn btn-primary btn-sm" style="background:#1D4ED8; border-color:#1D4ED8;">
            💾 Simpan Teks Beranda
          </button>
        </div>
      </form>
    </div>

    <!-- 2. DAFTAR SLIDE FOTO LATAR BELAKANG -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem;">Slide Foto Latar Belakang (Hero Slideshow)</h3>
          <p style="margin:0; font-size:0.85rem; color:#64748B;">Kelola foto pemandangan, santri, dan fasilitas yang berganti otomatis di belakang teks dengan efek smooth zoom dan pudar.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalSlide()">+ Tambah Slide Foto</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="min-width:140px;">Pratinjau Foto <span class="table-ratio-hint">Rasio 16:9 • 1920×1080 px</span></th>
            <th>Judul Caption Slide</th>
            <th>Lencana Tag</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${slides.map((s, index) => `
            <tr>
              <td style="display:block;">
                <img src="${s.image}" alt="" style="width:100px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #CBD5E1;">
              </td>
              <td class="cell-main-title">
                <strong>${s.title}</strong>
              </td>
              <td>
                <span class="cell-mobile-label">Tag Kategori:</span>
                <span class="badge-status badge-verified">${s.tag || 'Unggulan'}</span>
              </td>
              <td class="cell-actions" style="text-align:center; vertical-align:middle;">
                <div class="admin-table-actions">
                  <button type="button" class="btn-action-edit" onclick="openModalSlide(${index})" title="Edit Slide">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-action-delete" onclick="deleteSlide(${index})" title="Hapus Slide">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 2B. BANNER PINTU UTAMA PENDAFTARAN SANTRI (PPDB GATEWAY SLIDER) -->
    <div class="admin-card" style="border: 2px solid #FDE68A; background: linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%); margin-top: 24px;">
      <div class="admin-card-header" style="border-bottom: 1px solid #FEF3C7; padding-bottom: 12px; margin-bottom: 16px; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#FEF3C7; color:#B45309; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
            🚪 Pintu Utama Pendaftaran Santri (Gateway Banner Slider)
          </div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#78350F;">Slide Foto Banner Pintu PPDB (Di Bawah 4 Pilar Nilai Dasar)</h3>
          <p style="margin:0; font-size:0.84rem; color:#92400E;">Kelola foto lanskap berbingkai emas yang berputar halus otomatis sebagai gerbang utama calon wali santri menuju pendaftaran.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <a href="index.html#info-ppdb" target="_blank" class="btn btn-outline btn-sm" style="border-color:#D97706; color:#B45309;">
            👁️ Lihat di Beranda ↗
          </a>
          <button class="btn btn-primary btn-sm" onclick="openModalPpdbSlide()" style="background:#D97706; border-color:#B45309;">
            + Tambah Slide Banner PPDB
          </button>
        </div>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:165px;">Pratinjau Foto <span class="table-ratio-hint">Rasio 16:9 • 1200×675 px</span></th>
            <th>Judul / Keterangan Banner</th>
            <th>Tautan Tujuan Klik</th>
            <th style="text-align:center;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${((db.ppdbGatewaySlides && db.ppdbGatewaySlides.length > 0) ? db.ppdbGatewaySlides : (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.ppdbGatewaySlides : [])).map((s, index) => `
            <tr>
              <td>
                <img src="${s.image}" alt="" style="width:130px; height:60px; object-fit:cover; border-radius:8px; border:2px solid #F59E0B; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
              </td>
              <td>
                <strong style="color:#0A2540;">${s.title}</strong>
                <div style="font-size:0.75rem; color:#64748B;">Slide urutan ke-0${index + 1}</div>
              </td>
              <td>
                <code style="background:#FEF3C7; color:#92400E; padding:3px 8px; border-radius:6px; font-size:0.8rem;">${s.link || 'psb.html'}</code>
              </td>
              <td style="text-align:center;">
                <div style="display:inline-flex; gap:6px;">
                  <button class="btn-action-edit" onclick="openModalPpdbSlide(${index})">Edit Foto</button>
                  <button class="btn-action-delete" onclick="deletePpdbSlide(${index})">Hapus</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 2C. FOTO LATAR BELAKANG PORTAL PENDAFTARAN SANTRI (MASTHEAD PSB.HTML) -->
    <div class="admin-card" style="border: 2px solid #BFDBFE; background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%); margin-top: 28px;">
      <div class="admin-card-header" style="border-bottom: 1px solid #BFDBFE; padding-bottom: 12px; margin-bottom: 16px; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#DBEAFE; color:#1E40AF; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
            🏛️ Latar Belakang Portal PSB (psb.html)
          </div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#1E3A8A;">Foto Latar Belakang Header Portal PSB (Masthead Banner)</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Ubah foto udara gedung / pemandangan kompleks yang tampil megah di belakang judul dan informasi gelombang pada portal PSB online.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('sliderPsbHeroBg').value='assets/banner_ppdb_hero.jpg'; document.getElementById('preview_sliderPsbHeroBg').src='assets/banner_ppdb_hero.jpg'; showToast('Foto dikembalikan ke foto drone resmi YTPAI. Klik Simpan untuk menerapkan.', 'info');" style="border-color:#CBD5E1; color:#475569;">
            ↺ Reset ke Foto Drone Asli
          </button>
          <a href="psb.html#info" target="_blank" class="btn btn-outline btn-sm" style="border-color:#2563EB; color:#1D4ED8;">
            👁️ Lihat Portal PSB ↗
          </a>
          <button type="button" class="btn btn-primary btn-sm" onclick="savePsbHeroBgFromSlider()" style="background:#1D4ED8; border-color:#1E40AF;">
            💾 Simpan Foto Latar PSB
          </button>
        </div>
      </div>

      <div style="margin-top:12px;">
        ${renderImageUploadWidget('sliderPsbHeroBg', 'Unggah Foto Latar Belakang Masthead Portal PSB', ((db.psbWaveConfig && db.psbWaveConfig.heroBackground) || 'assets/banner_ppdb_hero.jpg'), 1600, 'landscape', '16:9', '1920 × 1080 px')}
      </div>
    </div>

    <!-- 3. PENGATURAN VIDEO PROFIL & BANNER PARALLAX -->
    <div class="admin-card" style="border: 2px solid #FDE68A; background: linear-gradient(180deg, #FFFFFF 0%, #FEFCE8 100%); margin-top: 28px;">
      <div class="admin-card-header" style="border-bottom: 1px solid #FEF08A; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; background:#FEF3C7; color:#B45309; font-size:0.75rem; font-weight:800; padding:3px 10px; border-radius:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">
            🎥 Video Showcase & Parallax Banner (Ref: Al-Manar)
          </div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#78350F;">Pengaturan Bagian Parallax & Video Profil Pesantren</h3>
          <p style="margin:0; font-size:0.84rem; color:#92400E;">Kelola headline pertanyaan filosofis, video YouTube orientasi santri, dan foto latar dengan efek scroll parallax.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveVideoShowcaseForm()" style="background:#D97706; border-color:#B45309;">
          💾 Simpan Video & Parallax
        </button>
      </div>

      <form onsubmit="event.preventDefault(); saveVideoShowcaseForm();">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Lencana / Badge Tag *</label>
            <input type="text" id="videoFormBadge" class="form-input" value="${(db.videoShowcase && db.videoShowcase.badge) || 'Wawasan & Kehidupan Santri'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Tag Label Video (Di Atas Video) *</label>
            <input type="text" id="videoFormVideoTag" class="form-input" value="${(db.videoShowcase && db.videoShowcase.videoTag) || 'Orientasi Santri Baru'}" required>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-weight:700; color:#1E293B;">Judul Utama / Headline Pertanyaan *</label>
          <input type="text" id="videoFormHeadline" class="form-input" value="${((db.videoShowcase && db.videoShowcase.headline) || 'Ke YTPAI Raudlatul Muta\'allimin Lamongan,<br><span class=\"highlight-gold\">Apa yang Kamu Cari?</span>').replace(/"/g, '&quot;')}" required>
          <span style="font-size:0.75rem; color:#64748B;">Tips: Gunakan <code>&lt;span class="highlight-gold"&gt;kata emas&lt;/span&gt;</code> untuk sorotan warna emas elegan.</span>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label" style="font-weight:700; color:#1E293B;">Paragraf Deskripsi Filosofis *</label>
          <textarea id="videoFormDescription" class="form-textarea" rows="3" required>${(db.videoShowcase && db.videoShowcase.description) || 'Menemukan perpaduan mutiara tradisi salafiyah, kedalaman sains terapan, kecakapan bahasa internasional, dan keteladanan akhlaqul karimah dalam satu naungan yayasan dan pondok pesantren asri di Babat Lamongan.'}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:16px; margin-bottom:14px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Tautan Video YouTube (URL atau ID) *</label>
            <input type="text" id="videoFormYoutubeUrl" class="form-input" value="${(db.videoShowcase && (db.videoShowcase.youtubeUrl || db.videoShowcase.youtubeId)) || 'https://www.youtube.com/watch?v=kXx3g9qY8rE'}" placeholder="Contoh: https://www.youtube.com/watch?v=... atau ID video" required>
            <span style="font-size:0.75rem; color:#64748B;">Sistem otomatis mengekstrak ID video YouTube yang valid.</span>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Judul Video Profil *</label>
            <input type="text" id="videoFormVideoTitle" class="form-input" value="${(db.videoShowcase && db.videoShowcase.videoTitle) || 'Mendidik Santri Berkarakter dengan Disiplin & Kasih Sayang'}" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Narasumber / Pembicara Video *</label>
            <input type="text" id="videoFormSpeakerName" class="form-input" value="${(db.videoShowcase && db.videoShowcase.speakerName) || 'Masyayikh & Dewan Pengasuh Pesantren YTPAI'}" required>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700; color:#1E293B;">Teks Tombol Aksi PPDB</label>
            <input type="text" id="videoFormCtaText" class="form-input" value="${(db.videoShowcase && db.videoShowcase.ctaText) || 'Daftar Santri Baru (PPDB)'}">
          </div>
        </div>

        <!-- Foto Latar Parallax -->
        <div style="margin-bottom:18px;">
          ${renderImageUploadWidget('videoBgImg', 'Foto Latar Belakang Parallax (Fixed Scrolling Background)', (db.videoShowcase && db.videoShowcase.bgImage) || 'assets/hero_santri.jpg', 1600, 'landscape')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px;">
          <span style="font-size:0.78rem; color:#059669; font-weight:600;">✓ Efek parallax & video otomatis sinkron di halaman utama</span>
          <button type="submit" class="btn btn-primary btn-sm" style="background:#D97706; border-color:#B45309;">
            💾 Simpan Video & Parallax
          </button>
        </div>
      </form>
    </div>
  `;
}

window.saveHeroTextForm = function() {
  const db = getDB();
  if (!db.hero) db.hero = {};

  db.hero.badgeTag = document.getElementById('heroFormBadgeTag').value.trim();
  db.hero.badgeSlogan = document.getElementById('heroFormBadgeSlogan').value.trim();
  db.hero.headline = document.getElementById('heroFormHeadline').value.trim();
  db.hero.description = document.getElementById('heroFormDescription').value.trim();
  db.hero.cta1Text = document.getElementById('heroFormCta1Text').value.trim();
  db.hero.cta1Link = document.getElementById('heroFormCta1Link').value.trim();
  db.hero.cta2Text = document.getElementById('heroFormCta2Text').value.trim();
  db.hero.cta2Link = document.getElementById('heroFormCta2Link').value.trim();

  // Sinkronkan juga slogan global jika diubah
  if (db.hero.badgeSlogan && db.meta) {
    db.meta.slogan = db.hero.badgeSlogan;
  }

  saveDB(db);
  alert('Teks area hero beranda berhasil disimpan dan langsung aktif di halaman depan!');
};

window.savePsbHeroBgFromSlider = function() {
  const input = document.getElementById('sliderPsbHeroBg');
  if (!input) return;
  const val = input.value.trim() || 'assets/banner_ppdb_hero.jpg';
  const db = getDB();
  if (!db.psbWaveConfig) db.psbWaveConfig = {};
  db.psbWaveConfig.heroBackground = val;
  saveDB(db);
  showToast('✅ Foto latar belakang masthead Portal PSB berhasil disimpan dan langsung aktif di psb.html!', 'success');
};

window.saveVideoShowcaseForm = function() {
  const db = getDB();
  if (!db.videoShowcase) db.videoShowcase = {};

  const rawUrl = document.getElementById('videoFormYoutubeUrl').value.trim();
  
  // Ekstrak ID YouTube dari link atau raw ID
  function parseYoutubeId(url) {
    if (!url) return 'kXx3g9qY8rE';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  }

  const extractedId = parseYoutubeId(rawUrl);

  db.videoShowcase.badge = document.getElementById('videoFormBadge').value.trim();
  db.videoShowcase.videoTag = document.getElementById('videoFormVideoTag').value.trim();
  db.videoShowcase.headline = document.getElementById('videoFormHeadline').value.trim();
  db.videoShowcase.description = document.getElementById('videoFormDescription').value.trim();
  db.videoShowcase.youtubeUrl = rawUrl;
  db.videoShowcase.youtubeId = extractedId;
  db.videoShowcase.videoTitle = document.getElementById('videoFormVideoTitle').value.trim();
  db.videoShowcase.speakerName = document.getElementById('videoFormSpeakerName').value.trim();
  db.videoShowcase.ctaText = document.getElementById('videoFormCtaText').value.trim();
  db.videoShowcase.ctaLink = '#pendaftaran';

  const previewImg = document.getElementById('preview_videoBgImg');
  if (previewImg && previewImg.src && !previewImg.src.includes('placehold.co')) {
    db.videoShowcase.bgImage = previewImg.src;
  }

  saveDB(db);
  alert('Pengaturan Video Profil & Parallax berhasil disimpan dan langsung aktif di website publik!');
};

window.openModalSlide = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const s = isEdit ? db.heroSlides[editIndex] : { image: 'assets/hero_santri.jpg', title: '', tag: 'Prestasi Santri' };

  openAdminModal(isEdit ? 'Edit Slide Foto' : 'Tambah Slide Foto Beranda', `
    <form onsubmit="saveSlide(event, ${editIndex})">
      ${renderImageUploadWidget('slideImg', 'Foto Slide Beranda (Hero Banner Landscape)', s.image, 1600, 'landscape', '16:9', '1920 × 1080 px')}
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Judul Caption Foto *</label>
        <input type="text" id="slideTitle" class="form-input" value="${s.title}" placeholder="Contoh: Santri Berprestasi & Pembelajaran Digital" required>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Teks Lencana Tag *</label>
        <input type="text" id="slideTag" class="form-input" value="${s.tag}" placeholder="Contoh: Akademik, Fasilitas, Tahfidz" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Slide</button>
      </div>
    </form>
  `);
};

window.saveSlide = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.heroSlides) db.heroSlides = [];

  const newObj = {
    id: editIndex !== null ? db.heroSlides[editIndex].id : 'slide-' + Date.now(),
    image: document.getElementById('slideImg').value,
    title: document.getElementById('slideTitle').value,
    tag: document.getElementById('slideTag').value
  };

  if (editIndex !== null) {
    db.heroSlides[editIndex] = newObj;
  } else {
    db.heroSlides.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteSlide = function(index) {
  const db = getDB();
  if (db.heroSlides.length <= 1) {
    alert('Minimal harus ada 1 slide foto pada beranda.');
    return;
  }
  if (confirm('Hapus slide foto ini dari beranda?')) {
    db.heroSlides.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- CRUD FOTO BANNER PINTU PPDB (GATEWAY SLIDER) --- */
window.openModalPpdbSlide = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const slides = (db.ppdbGatewaySlides && db.ppdbGatewaySlides.length > 0)
    ? db.ppdbGatewaySlides
    : (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.ppdbGatewaySlides : []);

  const s = isEdit ? slides[editIndex] : { image: 'assets/banner_ppdb_slide1.jpg', title: '', link: 'psb.html' };

  openAdminModal(isEdit ? 'Edit Slide Banner Pintu PPDB' : 'Tambah Slide Banner Pintu PPDB Baru', `
    <form onsubmit="savePpdbSlide(event, ${editIndex})">
      ${renderImageUploadWidget('ppdbSlidePhoto', 'Foto Banner Pintu PPDB (Landscape Panorama)', s.image, 1600, 'landscape', '16:9', '1200 × 675 px')}
      
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Judul / Keterangan Banner *</label>
        <input type="text" id="ppdbSlideTitle" class="form-input" value="${s.title || ''}" placeholder="Contoh: Pintu Utama Pendaftaran Santri Baru - Suasana Pesantren Asri" required>
        <small style="color:#64748B; font-size:0.75rem;">Judul ini juga berfungsi sebagai teks alt foto bagi aksesibilitas dan SEO.</small>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Tautan URL Tujuan Ketika Banner Diklik *</label>
        <input type="text" id="ppdbSlideLink" class="form-input" value="${s.link || 'psb.html'}" placeholder="Contoh: psb.html atau #pendaftaran" required>
        <small style="color:#64748B; font-size:0.75rem;">Ketika calon wali santri mengklik banner ini di beranda, sistem akan mengarahkan ke halaman ini.</small>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm" style="background:#D97706; border-color:#B45309;">Simpan Banner PPDB</button>
      </div>
    </form>
  `);
};

window.savePpdbSlide = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.ppdbGatewaySlides) {
    db.ppdbGatewaySlides = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.ppdbGatewaySlides : []);
  }

  const newObj = {
    id: editIndex !== null && db.ppdbGatewaySlides[editIndex] ? db.ppdbGatewaySlides[editIndex].id : 'ppdb-slide-' + Date.now(),
    image: document.getElementById('ppdbSlidePhoto').value.trim() || 'assets/banner_ppdb_slide1.jpg',
    title: document.getElementById('ppdbSlideTitle').value.trim(),
    link: document.getElementById('ppdbSlideLink').value.trim() || 'psb.html'
  };

  if (editIndex !== null) {
    db.ppdbGatewaySlides[editIndex] = newObj;
  } else {
    db.ppdbGatewaySlides.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
  alert('Slide foto banner pintu pendaftaran (PPDB) berhasil disimpan dan langsung aktif di beranda!');
};

window.deletePpdbSlide = function(index) {
  const db = getDB();
  if (!db.ppdbGatewaySlides) {
    db.ppdbGatewaySlides = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.ppdbGatewaySlides : []);
  }

  if (db.ppdbGatewaySlides.length <= 1) {
    alert('Minimal harus ada 1 slide foto banner pintu pendaftaran pada area tersebut.');
    return;
  }

  if (confirm('Yakin ingin menghapus slide banner pintu PPDB ini?')) {
    db.ppdbGatewaySlides.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 1.5: 4 PILAR NILAI DASAR PESANTREN (BESPOKE ARCHITECTURE) --- */
function renderTabCoreValues(db, container) {
  const values = db.coreValues || (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.coreValues : []);
  const heroVal = values[0] || { title: 'Beraqidah Shohihah', subtitle: 'Merujuk pada kemurnian tauhid & keyakinan yang lurus sesuai ajaran Al-Qur\'an dan Sunnah Ahlussunnah Wal Jama\'ah.', icon: 'book', statNumber: '2.500+', statLabel: 'Santri Mukim & Kalong' };
  const subVals = values.slice(1);

  const subColorThemes = [
    { colorClass: 'icon-emerald', tag: 'Syariat & Amaliyah', btnClass: 'btn-bento-subcard-edit' },
    { colorClass: 'icon-sky', tag: 'Sains & Kitab Kuning', btnClass: 'btn-bento-subcard-edit' },
    { colorClass: 'icon-amber', tag: 'Adab & Akhlaq', btnClass: 'btn-bento-subcard-edit' }
  ];

  container.innerHTML = `
    <div class="bento-core-values-shell">
      <!-- 1. Master Executive Header -->
      <div class="bento-core-header">
        <div class="bento-core-title-group">
          <div class="bento-core-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Fondasi Nilai Luhur Yayasan</span>
          </div>
          <h3 class="bento-core-title">Manajemen 4 Pilar Nilai Dasar Pesantren</h3>
          <p class="bento-core-subtitle">Kurikulum terpadu pembinaan karakter santri YTPAI: Akidah Shohihah, Pengamalan Syariat, Integrasi Salaf & Sains, dan Akhlaqul Karimah.</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <a href="index.html#nilai-dasar" target="_blank" class="btn btn-outline btn-sm" style="background:#FFFFFF; font-weight:700;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Pratinjau di Beranda ↗</span>
          </a>
        </div>
      </div>

      <!-- 2. Asymmetric Bento Matrix (Anti-Repetitive Design) -->
      <div class="bento-pillars-matrix">
        <!-- Hero Anchor Pillar (Pilar 01: Akidah Shohihah) -->
        <div class="bento-pillar-hero">
          <div>
            <div class="bento-hero-top">
              <div class="bento-hero-emblem">
                ${getCoreValIconSvg(heroVal.icon)}
              </div>
              <span class="bento-hero-tag">Pilar Utama (Fondasi Akidah)</span>
            </div>
            <h4 class="bento-hero-heading">${heroVal.title}</h4>
            <p class="bento-hero-text">${heroVal.subtitle}</p>
          </div>

          <div>
            <div class="bento-hero-metric">
              <span class="bento-hero-metric-val">${heroVal.statNumber}</span>
              <span class="bento-hero-metric-lbl">${heroVal.statLabel}</span>
            </div>
            <button type="button" class="btn-bento-hero-edit" onclick="openModalCoreValue(0)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Sesuaikan Pilar 01 (${heroVal.title})</span>
            </button>
          </div>
        </div>

        <!-- Subcards (Pilar 02, 03, 04) -->
        ${subVals.map((val, i) => {
          const idx = i + 1;
          const theme = subColorThemes[i % subColorThemes.length];
          return `
            <div class="bento-pillar-subcard">
              <div>
                <div class="bento-subcard-header">
                  <div class="bento-subcard-icon ${theme.colorClass}">
                    ${getCoreValIconSvg(val.icon)}
                  </div>
                  <span class="bento-subcard-idx">0${idx + 1}</span>
                </div>
                <h4 class="bento-subcard-title">${val.title}</h4>
                <p class="bento-subcard-desc">${val.subtitle}</p>
              </div>

              <div>
                <div class="bento-subcard-footer">
                  <div class="bento-subcard-stat">
                    <span class="bento-subcard-stat-num">${val.statNumber}</span>
                    <span class="bento-subcard-stat-lbl">${val.statLabel}</span>
                  </div>
                  <button type="button" class="${theme.btnClass}" onclick="openModalCoreValue(${idx})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <span>Edit Pilar 0${idx + 1}</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 3. Live Sync Status Strip -->
      <div class="bento-live-preview-strip">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:10px; height:10px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981;"></div>
          <div>
            <span style="font-size:0.80rem; font-weight:800; color:#0A2540; display:block;">Harmonisasi 4 Pilar Terhubung Langsung</span>
            <span style="font-size:0.72rem; color:#64748B;">Perubahan data pada form pilar otomatis langsung tampil pada landing page beranda website publik.</span>
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" onclick="exportCoreValuesJSON()" style="font-size:0.75rem; font-weight:700;">
          📥 Ekspor Data Pilar (.JSON)
        </button>
      </div>
    </div>
  `;
}

window.exportCoreValuesJSON = function() {
  const db = getDB();
  const data = db.coreValues || [];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `4_Pilar_Nilai_Dasar_YTPAI_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


function getCoreValIconSvg(icon) {
  if (icon === 'book') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>';
  if (icon === 'heart') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
  if (icon === 'lightbulb') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  if (icon === 'shield') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  if (icon === 'award') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
}

window.openModalCoreValue = function(idx) {
  const db = getDB();
  if (!db.coreValues) db.coreValues = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.coreValues : []);
  const v = db.coreValues[idx] || { title: '', subtitle: '', icon: 'book', statNumber: '100+', statLabel: '' };

  openAdminModal(`Edit Pilar 0${idx + 1}: ${v.title}`, `
    <form onsubmit="saveCoreValue(event, ${idx})">
      <div style="margin-bottom:14px;">
        <label class="form-label">Judul Pilar Nilai Dasar *</label>
        <input type="text" id="coreValTitle" class="form-input" value="${v.title}" placeholder="Contoh: Beraqidah Shohihah" required>
      </div>

      <div style="margin-bottom:14px;">
        <label class="form-label">Penjelasan / Deskripsi Filosofis *</label>
        <textarea id="coreValSubtitle" class="form-textarea" rows="3" placeholder="Penjelasan komprehensif..." required>${v.subtitle}</textarea>
      </div>

      <div style="margin-bottom:14px;">
        <label class="form-label">Pilihan Ikon Simbol *</label>
        <select id="coreValIcon" class="form-select">
          <option value="book" ${v.icon === 'book' ? 'selected' : ''}>📖 Buku / Kitab Kuning (Aqidah / Syariat)</option>
          <option value="heart" ${v.icon === 'heart' ? 'selected' : ''}>❤️ Hati / Amal Sholeh & Ibadah</option>
          <option value="lightbulb" ${v.icon === 'lightbulb' ? 'selected' : ''}>💡 Lampu / Ilmu Manfaat & Sains</option>
          <option value="star" ${v.icon === 'star' ? 'selected' : ''}>⭐ Bintang / Akhlaq Karimah</option>
          <option value="shield" ${v.icon === 'shield' ? 'selected' : ''}>🛡️ Perisai / Perlindungan Aqidah</option>
          <option value="award" ${v.icon === 'award' ? 'selected' : ''}>🏆 Prestasi & Keunggulan</option>
        </select>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px; margin-bottom:20px;">
        <div>
          <label class="form-label">Angka Statistik *</label>
          <input type="text" id="coreValStatNumber" class="form-input" value="${v.statNumber}" placeholder="Contoh: 2.500+ / 100%" required>
        </div>
        <div>
          <label class="form-label">Label Keterangan Statistik *</label>
          <input type="text" id="coreValStatLabel" class="form-input" value="${v.statLabel}" placeholder="Contoh: Santri Mukim & Kalong" required>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Perubahan</button>
      </div>
    </form>
  `);
};

window.saveCoreValue = function(e, idx) {
  e.preventDefault();
  const db = getDB();
  if (!db.coreValues) db.coreValues = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' ? DEFAULT_YAYASAN_DATA.coreValues : []);

  db.coreValues[idx] = {
    id: db.coreValues[idx] ? db.coreValues[idx].id : `nilai-${idx + 1}`,
    title: document.getElementById('coreValTitle').value.trim(),
    subtitle: document.getElementById('coreValSubtitle').value.trim(),
    icon: document.getElementById('coreValIcon').value,
    statNumber: document.getElementById('coreValStatNumber').value.trim(),
    statLabel: document.getElementById('coreValStatLabel').value.trim()
  };

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
  alert(`Pilar Nilai Dasar 0${idx + 1} berhasil diperbarui dan langsung aktif di beranda!`);
};

/* --- TAB 2: DATA PENDAFTAR (PPDB) --- */
let leadsFilterState = 'all';
let leadsSearchTerm = '';
let leadsUnitFilter = 'all';
let leadsStatusFilter = 'all';

function renderTabLeads(db, container) {
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const isUnitAdmin = activeUser && activeUser.role && activeUser.role.startsWith('unit_');
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toUpperCase() : '';

  let allLeads = db.leads || [];

  // If unit admin, pre-filter all leads to their assigned unit only
  if (isUnitAdmin && userUnitId) {
    allLeads = allLeads.filter(l => {
      const u = (l.unit || '').toUpperCase();
      if (userUnitId === 'MA') return u.includes('MA') || u.includes('ALIYAH');
      if (userUnitId === 'MTS') return u.includes('MTS') || u.includes('TSANAWIYAH');
      if (userUnitId === 'SMP') return u.includes('SMP');
      if (userUnitId === 'SMA') return u.includes('SMA');
      if (userUnitId === 'MI') return u.includes('MI') || u.includes('IBTIDAIYAH');
      if (userUnitId === 'TK') return u.includes('TK') || u.includes('KANAK');
      if (userUnitId === 'KB') return u.includes('KB') || u.includes('BERMAIN');
      if (userUnitId === 'PONPES') return l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
      return u.includes(userUnitId);
    });
  }

  // Filter boarding/non-boarding
  let filteredLeads = allLeads.filter(l => {
    const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
    if (leadsFilterState === 'boarding' && !isMukim) return false;
    if (leadsFilterState === 'non-boarding' && isMukim) return false;

    // Filter unit
    if (leadsUnitFilter !== 'all' && !(l.unit && l.unit.includes(leadsUnitFilter))) return false;

    // Filter status
    if (leadsStatusFilter !== 'all' && l.status !== leadsStatusFilter) return false;

    // Search term
    if (leadsSearchTerm) {
      const term = leadsSearchTerm.toLowerCase();
      const matchName = (l.fullName || '').toLowerCase().includes(term);
      const matchReg = (l.regNumber || '').toLowerCase().includes(term);
      const matchParent = (l.parentName || l.fatherName || '').toLowerCase().includes(term);
      const matchPhone = (l.whatsapp || '').includes(term);
      const matchCity = (l.address || '').toLowerCase().includes(term);
      if (!matchName && !matchReg && !matchParent && !matchPhone && !matchCity) return false;
    }

    return true;
  });

  const countTotal = allLeads.length;
  const countBoarding = allLeads.filter(l => l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'))).length;
  const countNonBoarding = countTotal - countBoarding;

  const currentSheetUrl = (db.meta && db.meta.googleSheetWebhookUrl) || localStorage.getItem('ytpai_google_sheet_url') || '';
  const isSheetConnected = !!currentSheetUrl;

  const faqsList = (db.psbFaq && Array.isArray(db.psbFaq) && db.psbFaq.length > 0)
    ? db.psbFaq
    : ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbFaq) ? DEFAULT_YAYASAN_DATA.psbFaq : []);
  const sortedFaqs = [...faqsList].sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));

  const costs = (db.psbCosts && db.psbCosts.cards && Array.isArray(db.psbCosts.cards))
    ? db.psbCosts
    : ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbCosts) ? DEFAULT_YAYASAN_DATA.psbCosts : { cards: [] });

  container.innerHTML = `
    ${isSuperAdmin ? `
      <!-- Panel Pengaturan Sistem 2 Gelombang PPDB & Periode PSB -->
      <div class="admin-card" style="margin-bottom:22px; border-top:4px solid #0F4C81; background:#FFFFFF; box-shadow:0 4px 16px rgba(10,37,64,0.08); border-radius:10px;">
        <div class="admin-card-header" style="flex-wrap:wrap; gap:12px; padding-bottom:12px; border-bottom:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:8px; background:rgba(15,76,129,0.1); color:#0F4C81; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800;">
              ⚙️
            </div>
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#0A2540; font-weight:800;">Pengaturan Sistem 2 Gelombang PPDB (Header Portal & Jadwal)</h3>
              <p style="margin:0; font-size:0.80rem; color:#64748B;">Kelola tanggal, kuota, teks banner pengumuman untuk Gelombang I & Gelombang II, serta tentukan gelombang yang sedang aktif saat ini.</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="savePsbWaveConfigForm()" style="background:#0F4C81; border-color:#0A2540; font-weight:700; padding:8px 18px; border-radius:6px; box-shadow:0 2px 6px rgba(15,76,129,0.25);">
            💾 Simpan Pengaturan 2 Gelombang
          </button>
        </div>

        <form id="psbWaveConfigForm" onsubmit="event.preventDefault(); savePsbWaveConfigForm();" style="margin-top:16px;">
          <!-- Baris Global: Status Gelombang Berjalan & Tahun Ajaran -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-bottom:18px; padding:12px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-weight:800; font-size:0.82rem; color:#0A2540;">🎯 Gelombang yang Sedang Berjalan (Aktif Saat Ini) *</label>
              <select id="adminActiveWave" class="form-select" style="border-radius:6px; font-weight:800; border-color:#0F4C81; color:#0A2540; background:#FFFFFF;">
                <option value="1" ${(db.psbWaveConfig && db.psbWaveConfig.activeWave === 1) ? 'selected' : (!db.psbWaveConfig || db.psbWaveConfig.activeWave !== 2 && db.psbWaveConfig.activeWave !== 0 ? 'selected' : '')}>🟢 GELOMBANG I SEDANG BERJALAN (Aktif)</option>
                <option value="2" ${(db.psbWaveConfig && db.psbWaveConfig.activeWave === 2) ? 'selected' : ''}>🟡 GELOMBANG II SEDANG BERJALAN (Aktif)</option>
                <option value="0" ${(db.psbWaveConfig && db.psbWaveConfig.activeWave === 0) ? 'selected' : ''}>🔴 SEMUA GELOMBANG DITUTUP (Tutup Sementara)</option>
              </select>
              <small style="color:#64748B; font-size:0.72rem;">Gelombang terpilih akan otomatis tampil di banner masthead portal dan menjadi tag pendaftar baru.</small>
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-weight:800; font-size:0.82rem; color:#0A2540;">📅 Tahun Ajaran Resmi (T.A.) *</label>
              <input type="text" id="adminWaveAcademicYear" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.academicYear) || 'T.A. 2027/2028 (1447–1448 H)').replace(/"/g, '&quot;')}" placeholder="Contoh: T.A. 2027/2028 (1447–1448 H)" required style="border-radius:6px; font-weight:700;">
              <small style="color:#64748B; font-size:0.72rem;">Format kalender akademik nasional & penanggalan hijriyah.</small>
            </div>
          </div>

          <!-- Pengaturan Foto Latar Belakang Masthead Portal PSB -->
          <div style="margin-bottom:18px; padding:14px; background:#FFFFFF; border:1.5px solid #BFDBFE; border-radius:8px; box-shadow:0 2px 8px rgba(15,76,129,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
              <div>
                <strong style="color:#0A2540; font-size:0.90rem; display:flex; align-items:center; gap:6px;">
                  🖼️ Foto Latar Belakang Masthead Portal PSB (psb.html)
                </strong>
                <span style="font-size:0.75rem; color:#64748B;">Foto pemandangan udara / drone yang tampil dinamis di belakang header portal PSB online.</span>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('adminPsbHeroBg').value='assets/banner_ppdb_hero.jpg'; document.getElementById('preview_adminPsbHeroBg').src='assets/banner_ppdb_hero.jpg'; showToast('Foto dikembalikan ke foto drone resmi YTPAI. Klik Simpan untuk menerapkan.', 'info');" style="font-size:0.74rem; padding:4px 10px; border-color:#CBD5E1; color:#475569;" title="Kembalikan ke foto drone kompleks resmi">
                  ↺ Reset Drone Asli
                </button>
                <a href="psb.html#info" target="_blank" class="btn btn-outline btn-sm" style="font-size:0.74rem; padding:4px 10px; border-color:#0F4C81; color:#0F4C81;">
                  👁️ Pratinjau Portal PSB ↗
                </a>
              </div>
            </div>

            ${renderImageUploadWidget('adminPsbHeroBg', 'Unggah Foto Latar Belakang Masthead PSB', ((db.psbWaveConfig && db.psbWaveConfig.heroBackground) || 'assets/banner_ppdb_hero.jpg'), 1600, 'landscape', '16:9', '1920 × 1080 px')}
          </div>

          <!-- 2 Kartu Konfigurasi Gelombang Berdampingan -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
            
            <!-- KARTU GELOMBANG I -->
            <div style="border:1.5px solid #93C5FD; background:#F0F9FF; border-radius:8px; padding:14px; position:relative;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #BFDBFE; padding-bottom:8px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:1.1rem;">🌟</span>
                  <span style="font-size:0.88rem; font-weight:800; color:#0369A1;">GELOMBANG I (Jalur Prestasi & Inden)</span>
                </div>
                <span class="tree-badge" style="background:#0284C7; color:#FFFFFF; font-size:0.62rem; font-weight:800;">TAHAP 1</span>
              </div>

              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Nama Resmi Gelombang I *</label>
                <input type="text" id="adminWave1Name" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave1 && db.psbWaveConfig.wave1.name) || (db.psbWaveConfig && db.psbWaveConfig.name) || 'Gelombang I (Jalur Prestasi & Inden)').replace(/"/g, '&quot;')}" placeholder="Contoh: Gelombang I" required style="border-radius:4px; font-size:0.82rem;">
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Rentang Tanggal *</label>
                  <input type="text" id="adminWave1DateRange" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave1 && db.psbWaveConfig.wave1.dateRange) || (db.psbWaveConfig && db.psbWaveConfig.dateRange) || '02 Jan – 31 Mar 2026').replace(/"/g, '&quot;')}" placeholder="02 Jan – 31 Mar 2026" required style="border-radius:4px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Status Kuota *</label>
                  <input type="text" id="adminWave1Status" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave1 && db.psbWaveConfig.wave1.status) || (db.psbWaveConfig && db.psbWaveConfig.status) || 'Kuota Terbatas').replace(/"/g, '&quot;')}" placeholder="Kuota Terbatas" required style="border-radius:4px; font-size:0.82rem;">
                </div>
              </div>

              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Teks Pengumuman Gelombang I</label>
                <textarea id="adminWave1Announcement" class="form-input" rows="3" style="border-radius:4px; font-size:0.78rem; resize:vertical;" placeholder="Pengumuman khusus Gelombang I...">${((db.psbWaveConfig && db.psbWaveConfig.wave1 && db.psbWaveConfig.wave1.announcementText) || (db.psbWaveConfig && db.psbWaveConfig.announcementText) || 'Periode Gelombang I: 02 Januari s/d 31 Maret 2026. Kuota asrama putra dan putri terbatas. Pendaftaran online buka 24 jam atau hadir langsung ke Kantor Sekretariat Pusat PSB YTPAI Lamongan.')}</textarea>
              </div>
            </div>

            <!-- KARTU GELOMBANG II -->
            <div style="border:1.5px solid #FCD34D; background:#FEFCE8; border-radius:8px; padding:14px; position:relative;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #FDE68A; padding-bottom:8px;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-size:1.1rem;">🚀</span>
                  <span style="font-size:0.88rem; font-weight:800; color:#854D0E;">GELOMBANG II (Jalur Reguler)</span>
                </div>
                <span class="tree-badge" style="background:#D97706; color:#FFFFFF; font-size:0.62rem; font-weight:800;">TAHAP 2</span>
              </div>

              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Nama Resmi Gelombang II *</label>
                <input type="text" id="adminWave2Name" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave2 && db.psbWaveConfig.wave2.name) || 'Gelombang II (Jalur Reguler)').replace(/"/g, '&quot;')}" placeholder="Contoh: Gelombang II" required style="border-radius:4px; font-size:0.82rem;">
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                <div class="form-group" style="margin:0;">
                  <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Rentang Tanggal *</label>
                  <input type="text" id="adminWave2DateRange" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave2 && db.psbWaveConfig.wave2.dateRange) || '01 Apr – 30 Jun 2026').replace(/"/g, '&quot;')}" placeholder="01 Apr – 30 Jun 2026" required style="border-radius:4px; font-size:0.82rem;">
                </div>
                <div class="form-group" style="margin:0;">
                  <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Status Kuota *</label>
                  <input type="text" id="adminWave2Status" class="form-input" value="${((db.psbWaveConfig && db.psbWaveConfig.wave2 && db.psbWaveConfig.wave2.status) || 'Pengisian Sisa Kuota').replace(/"/g, '&quot;')}" placeholder="Pengisian Sisa Kuota" required style="border-radius:4px; font-size:0.82rem;">
                </div>
              </div>

              <div class="form-group" style="margin:0;">
                <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#1E293B;">Teks Pengumuman Gelombang II</label>
                <textarea id="adminWave2Announcement" class="form-input" rows="3" style="border-radius:4px; font-size:0.78rem; resize:vertical;" placeholder="Pengumuman khusus Gelombang II...">${((db.psbWaveConfig && db.psbWaveConfig.wave2 && db.psbWaveConfig.wave2.announcementText) || 'Periode Gelombang II: 01 April s/d 30 Juni 2026. Dibuka untuk kuota reguler yang masih tersedia. Pendaftaran dapat dilakukan online atau hadir langsung ke Kantor Sekretariat Pusat PSB YTPAI Lamongan.')}</textarea>
              </div>
            </div>

          </div>
        </form>
      </div>

      <!-- Panel Manajemen Rincian Biaya SPMB (Transparansi Biaya Terpadu & CRUD Dinamis) -->
      <div class="admin-card" style="margin-bottom:22px; border-top:4px solid #10B981; background:#FFFFFF; box-shadow:0 4px 16px rgba(10,37,64,0.08); border-radius:10px;">
        <div class="admin-card-header" style="flex-wrap:wrap; gap:12px; padding-bottom:12px; border-bottom:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:8px; background:rgba(16,185,129,0.12); color:#047857; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800;">
              💳
            </div>
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#0A2540; font-weight:800;">Manajemen Rincian & Estimasi Biaya SPMB</h3>
              <p style="margin:0; font-size:0.80rem; color:#64748B;">Kelola nominal formulir, infaq pangkal, SPP bulanan, dan catatan beasiswa yang tampil pada halaman pendaftaran (psb.html).</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openPsbCostsModal()" style="background:#0F4C81; border-color:#0A2540; font-weight:700; padding:8px 16px; border-radius:6px; box-shadow:0 2px 6px rgba(15,76,129,0.25);">
            ✏️ Kelola & Edit Biaya
          </button>
        </div>

        <!-- Preview 3 Kartu Biaya -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-top:14px;">
          ${(costs.cards || []).map((card, idx) => `
            <div style="background:#F8FAFC; border:1px solid ${card.isPopular ? '#FBBF24' : '#E2E8F0'}; border-radius:8px; padding:14px; position:relative;">
              ${card.isPopular ? '<span style="background:#FBBF24; color:#0A2540; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:999px; text-transform:uppercase; display:inline-block; margin-bottom:6px;">PALING POPULER</span>' : ''}
              <div style="font-weight:700; color:#0A2540; font-size:0.9rem;">${card.name}</div>
              <div style="font-size:1.25rem; font-weight:800; color:${card.isPopular ? '#B45309' : '#0F4C81'}; margin:4px 0;">${card.price}</div>
              <div style="font-size:0.75rem; color:#64748B; margin-bottom:8px;">${card.period}</div>
              <ul style="margin:0; padding-left:16px; font-size:0.75rem; color:#475569; line-height:1.5;">
                ${(card.features || []).slice(0, 3).map(f => `<li>${f}</li>`).join('')}
                ${(card.features || []).length > 3 ? `<li><em>+ ${(card.features || []).length - 3} fasilitas lainnya</em></li>` : ''}
              </ul>
            </div>
          `).join('')}
        </div>
        ${costs.scholarshipNote ? `
          <div style="margin-top:12px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:10px 14px; font-size:0.78rem; color:#1E3A8A; line-height:1.5;">
            ${costs.scholarshipNote}
          </div>
        ` : ''}
      </div>

      <!-- Panel Manajemen Tanya Jawab (FAQ) PPDB & Pesantren (CRUD Dinamis) -->
      <div class="admin-card" style="margin-bottom:22px; border-top:4px solid #C59B27; background:#FFFFFF; box-shadow:0 4px 16px rgba(10,37,64,0.08); border-radius:10px;">
        <div class="admin-card-header" style="flex-wrap:wrap; gap:12px; padding-bottom:12px; border-bottom:1px solid #E2E8F0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:8px; background:rgba(197,155,39,0.12); color:#B45309; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800;">
              ❓
            </div>
            <div>
              <h3 style="margin:0; font-size:1.05rem; color:#0A2540; font-weight:800;">Manajemen Pertanyaan & Jawaban (FAQ) PPDB</h3>
              <p style="margin:0; font-size:0.80rem; color:#64748B;">Kelola semua pertanyaan dan jawaban resmi seputar pendaftaran, sistem asrama / non-mukim, makan 2x sehari, dan biaya. Tanggal gelombang otomatis tersinkronisasi.</p>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openPsbFaqModal()" style="background:#0F4C81; border-color:#0A2540; font-weight:700; padding:8px 16px; border-radius:6px; box-shadow:0 2px 6px rgba(15,76,129,0.25);">
            ＋ Tambah Pertanyaan FAQ
          </button>
        </div>

        <div style="margin-top:14px; overflow-x:auto;">
          <table class="admin-table" style="font-size:0.82rem;">
            <thead>
              <tr style="background:#F8FAFC;">
                <th style="width:75px; text-align:center;">Urutan</th>
                <th style="min-width:230px;">Pertanyaan</th>
                <th style="min-width:320px;">Cuplikan Jawaban</th>
                <th style="width:125px; text-align:center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${sortedFaqs.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:24px; color:#64748B;">Belum ada daftar FAQ. Silakan klik tombol Tambah Pertanyaan FAQ di atas.</td></tr>' : ''}
              ${sortedFaqs.map((f, idx) => {
                const cleanAnswer = (f.answer || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
                const snippet = cleanAnswer.length > 130 ? cleanAnswer.substring(0, 130) + '...' : cleanAnswer;
                return `
                  <tr>
                    <td style="text-align:center;">
                      <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                        <span style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#0F4C81; color:#FFF; font-weight:800; font-size:0.75rem;">${f.order || (idx + 1)}</span>
                        <div style="display:flex; flex-direction:column; gap:2px;">
                          <button type="button" onclick="movePsbFaqOrder('${f.id}', 'up')" style="border:none; background:#E2E8F0; width:16px; height:12px; font-size:0.55rem; cursor:pointer; border-radius:2px; display:flex; align-items:center; justify-content:center;" title="Geser Naik">▲</button>
                          <button type="button" onclick="movePsbFaqOrder('${f.id}', 'down')" style="border:none; background:#E2E8F0; width:16px; height:12px; font-size:0.55rem; cursor:pointer; border-radius:2px; display:flex; align-items:center; justify-content:center;" title="Geser Turun">▼</button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style="color:#0A2540; font-size:0.85rem;">${f.question}</strong>
                    </td>
                    <td style="color:#475569; font-size:0.80rem; line-height:1.5;">
                      ${snippet}
                    </td>
                    <td style="text-align:center;">
                      <div style="display:flex; gap:6px; justify-content:center;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="openPsbFaqModal('${f.id}')" style="padding:4px 9px; font-size:0.75rem;" title="Edit Pertanyaan & Jawaban">
                          ✏️ Edit
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="deletePsbFaq('${f.id}')" style="padding:4px 8px; font-size:0.75rem; color:#DC2626; border-color:#FECACA; background:#FEF2F2;" title="Hapus FAQ">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem;">
            ${isUnitAdmin ? `Daftar Pendaftar Santri Baru: ${activeUser.roleName || activeUser.name} (${countTotal} Santri)` : `Daftar Pendaftar Santri Baru (${countTotal} Total Pendaftar)`}
          </h3>
          <p style="margin:0; font-size:0.85rem; color:#64748B;">
            ${isUnitAdmin ? `Kelola status seleksi berkas, verifikasi biodata, dan cetak bukti pendaftaran khusus ${activeUser.roleName || activeUser.name}.` : 'Kelola status seleksi, verifikasi biodata lengkap, cetak bukti pendaftaran, hubungi via WhatsApp, dan unduh rekapan ke Excel.'}
          </p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" id="btnToggleFullWorkspace" onclick="toggleDesktopSidebarCollapse()" style="font-weight:700; display:inline-flex; align-items:center; gap:5px; color:#0A2540; border-color:#CBD5E1; background:#FFFFFF;" title="Sembunyikan atau tampilkan sidebar navigasi untuk memperluas area kerja">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            <span id="labelToggleSidebar">${document.body.classList.contains('sidebar-collapsed') ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}</span>
          </button>
          ${isSuperAdmin ? `
            <button class="btn btn-outline btn-sm" onclick="openGoogleSheetModal()" style="font-weight:700; display:flex; align-items:center; gap:6px; border-color:${isSheetConnected ? '#10B981' : '#CBD5E1'}; color:${isSheetConnected ? '#047857' : '#334155'}; background:${isSheetConnected ? '#F0FDF4' : '#FFF'};">
              ${isSheetConnected ? '🟢 Google Sheets (Terhubung)' : '📊 Hubungkan Google Sheets'}
            </button>
          ` : ''}
          <button type="button" class="btn btn-outline btn-sm" onclick="resetDummyLeadsWithPhotos()" style="font-weight:700; display:inline-flex; align-items:center; gap:5px; color:#0F4C81; border-color:#CBD5E1; background:#FFFFFF;" title="Muat ulang 3 data pendaftar contoh lengkap dengan foto dokumen">
            <span>🔄 3 Data Contoh + Foto</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="exportLeadsExcel()">
            📥 Ekspor Rekap (.CSV)
          </button>
        </div>
      </div>

      <!-- Quick Filter Chips -->
      <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
        <button class="btn btn-sm ${leadsFilterState === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="filterLeadsBy('all')">
          Semua Pendaftar (${countTotal})
        </button>
        <button class="btn btn-sm ${leadsFilterState === 'boarding' ? 'btn-primary' : 'btn-outline'}" onclick="filterLeadsBy('boarding')" style="${leadsFilterState === 'boarding' ? 'background:#1D4ED8;' : ''}">
          🏡 Santri Mondok / Mukim (${countBoarding})
        </button>
        <button class="btn btn-sm ${leadsFilterState === 'non-boarding' ? 'btn-primary' : 'btn-outline'}" onclick="filterLeadsBy('non-boarding')" style="${leadsFilterState === 'non-boarding' ? 'background:#059669;' : ''}">
          🚶 Siswa Non-Mukim (${countNonBoarding})
        </button>
      </div>

      <!-- Advanced Search & Filter Toolbar -->
      <div class="leads-filter-toolbar">
        <div class="leads-search-box">
          <span class="leads-search-icon">🔍</span>
          <input type="text" placeholder="Cari nama santri, no. reg, nama ortu, kota..." value="${leadsSearchTerm}" oninput="onLeadsSearchChange(this.value)">
        </div>

        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          ${isSuperAdmin ? `
            <div>
              <select onchange="onLeadsUnitFilterChange(this.value)" style="padding:7px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.82rem; font-weight:600; background:#FFF;">
                <option value="all" ${leadsUnitFilter === 'all' ? 'selected' : ''}>Semua Satuan Pendidikan</option>
                <option value="KB" ${leadsUnitFilter === 'KB' ? 'selected' : ''}>KB Raudlatul Muta'allimin</option>
                <option value="TK" ${leadsUnitFilter === 'TK' ? 'selected' : ''}>TK Raudlatul Muta'allimin</option>
                <option value="MI" ${leadsUnitFilter === 'MI' ? 'selected' : ''}>MI Raudlatul Muta'allimin</option>
                <option value="MTs" ${leadsUnitFilter === 'MTs' ? 'selected' : ''}>MTs Raudlatul Muta'allimin</option>
                <option value="SMP" ${leadsUnitFilter === 'SMP' ? 'selected' : ''}>SMP Raudlatul Muta'allimin</option>
                <option value="MA" ${leadsUnitFilter === 'MA' ? 'selected' : ''}>MA Raudlatul Muta'allimin</option>
                <option value="SMA" ${leadsUnitFilter === 'SMA' ? 'selected' : ''}>SMA Raudlatul Muta'allimin</option>
              </select>
            </div>
          ` : `
            <div style="padding:6px 12px; border-radius:8px; background:#EFF6FF; border:1px solid #BFDBFE; font-size:0.82rem; font-weight:700; color:#1E40AF;">
              🏢 Unit: ${activeUser.roleName || activeUser.name}
            </div>
          `}

          <div>
            <select onchange="onLeadsStatusFilterChange(this.value)" style="padding:7px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.82rem; font-weight:600; background:#FFF;">
              <option value="all" ${leadsStatusFilter === 'all' ? 'selected' : ''}>Semua Status Seleksi</option>
              <option value="Baru" ${leadsStatusFilter === 'Baru' ? 'selected' : ''}>Baru</option>
              <option value="Diverifikasi" ${leadsStatusFilter === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi</option>
              <option value="Diterima" ${leadsStatusFilter === 'Diterima' ? 'selected' : ''}>Diterima</option>
              <option value="Ditolak" ${leadsStatusFilter === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Unified Responsive Student Cards (Zero Horizontal Scrollbar & Consolidated Data) -->
      <div class="leads-unified-container">
        ${filteredLeads.length === 0 ? `
          <div style="text-align:center; padding:36px 20px; color:#64748B; background:#FFFFFF; border:1px dashed #CBD5E1; border-radius:8px;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.8" style="margin-bottom:8px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div style="font-weight:700; color:#334155; font-size:0.92rem;">Tidak ada data pendaftar yang cocok</div>
            <div style="font-size:0.78rem; color:#64748B; margin-top:4px;">Coba gunakan kata kunci pencarian lain atau setel ulang filter status.</div>
          </div>
        ` : ''}

        ${filteredLeads.map((l) => {
          const originalIndex = db.leads.findIndex(item => item.regNumber === l.regNumber);
          const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
          const waNumber = (l.whatsapp || '').replace(/[^0-9]/g, '');
          const pasfotoUrl = (l.documents && l.documents.pasfoto && (l.documents.pasfoto.dataUrl || l.documents.pasfoto.url)) || 'assets/hero_santri.jpg';
          
          const rawUnit = String(l.unit || '').trim();
          const unitMatch = rawUnit.match(/^(KB|TK|MI|MTs|SMP|MA|SMA)/i);
          const unitCode = unitMatch ? (unitMatch[1].toUpperCase() === 'MTS' ? 'MTs' : unitMatch[1].toUpperCase()) : (rawUnit.length > 12 ? rawUnit.slice(0, 10) + '..' : rawUnit);
          let unitSub = '';
          if (unitCode === 'MA') unitSub = 'Madrasah Aliyah';
          else if (unitCode === 'MI') unitSub = 'Madrasah Ibtidaiyah';
          else if (unitCode === 'MTs') unitSub = 'Madrasah Tsanawiyah';
          else if (unitCode === 'SMP') unitSub = 'SMP BP';
          else if (unitCode === 'SMA') unitSub = 'SMA BP';
          else if (unitCode === 'TK') unitSub = 'TK Tarbiyatul';
          else if (unitCode === 'KB') unitSub = 'PAUD / KB';

          const ortuName = (l.fatherName && l.fatherName !== '-') ? l.fatherName : ((l.motherName && l.motherName !== '-') ? l.motherName : (l.parentName || '-'));

          return `
            <div class="lead-unified-card" data-status="${l.status}" data-reg="${l.regNumber}">
              <!-- Header Strip: No Reg, Gelombang, Tanggal, Status Seleksi & Aksi -->
              <div class="lead-card-header">
                <div class="lead-header-meta">
                  <span class="lead-reg-pill">${l.regNumber}</span>
                  <span class="lead-wave-pill ${l.wave === 'Gelombang II' ? 'wave-2' : 'wave-1'}">${l.wave || 'Gelombang I'}</span>
                  <span class="lead-date-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${l.date || '-'}
                  </span>
                </div>

                <div class="lead-header-actions">
                  <div class="lead-status-box">
                    <select onchange="updateLeadStatus(${originalIndex}, this.value)" class="lead-status-select" title="Pilih Status Seleksi">
                      <option value="Baru" ${l.status === 'Baru' ? 'selected' : ''}>⏳ Status: Baru</option>
                      <option value="Diverifikasi" ${l.status === 'Diverifikasi' ? 'selected' : ''}>🔍 Status: Diverifikasi</option>
                      <option value="Diterima" ${l.status === 'Diterima' ? 'selected' : ''}>✅ Status: Diterima</option>
                      <option value="Ditolak" ${l.status === 'Ditolak' ? 'selected' : ''}>✕ Status: Ditolak</option>
                    </select>
                  </div>

                  <div class="lead-action-btns">
                    <button type="button" class="btn-lead-act btn-act-detail" onclick="showLeadDetail(${originalIndex})" title="Lihat biodata lengkap & 5 berkas foto">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span>Detail</span>
                    </button>
                    <button type="button" class="btn-lead-act btn-act-wa" onclick="openLeadWhatsAppModal(${originalIndex})" title="Kirim Pesan WhatsApp Resmi ke Wali Santri" style="background:#F0FDF4; color:#047857; border-color:#A7F3D0;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.9 11.9 0 0 0 5.85 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.88a9.9 9.9 0 0 1-5.06-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
                      <span>WA Wali</span>
                    </button>
                    <button type="button" class="btn-lead-act btn-act-print" onclick="printLeadSlip(${originalIndex})" title="Cetak bukti tanda pendaftaran resmi">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      <span>Cetak</span>
                    </button>
                    <button type="button" class="btn-lead-act btn-act-del" onclick="deleteLead(${originalIndex})" title="Hapus pendaftar ini">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Body: 3 Responsive Clusters (Calon Santri & Pasfoto, Pendidikan & Asrama, Wali & Kontak) -->
              <div class="lead-card-body">
                <!-- Cluster 1: Calon Santri & Pasfoto Preview -->
                <div class="lead-cell lead-cell-student">
                  <div class="lead-photo-wrapper lead-photo-thumb" onclick="openDocLightbox(${originalIndex}, 'pasfoto')" title="Klik untuk perbesar pasfoto ${l.fullName}">
                    <img src="${pasfotoUrl}" alt="${l.fullName}">
                    <span class="lead-photo-tag">👁️ FOTO</span>
                  </div>
                  <div class="lead-student-details">
                    <div class="lead-student-fullname">${l.fullName}</div>
                    <div class="lead-student-sub">${l.gender || '-'} • ${l.birthPlaceDate || '-'}</div>
                  </div>
                </div>

                <!-- Cluster 2: Unit Pendidikan & Status Asrama -->
                <div class="lead-cell lead-cell-edu">
                  <div class="lead-unit-row">
                    <span class="lead-unit-badge">${unitCode}</span>
                    <span class="lead-unit-name">${unitSub || rawUnit}</span>
                  </div>
                  <div class="lead-boarding-row">
                    ${isMukim ? `
                      <span class="lead-boarding-badge mukim">
                        🏡 Mondok (${l.boardingWing || (l.gender === 'Perempuan' ? 'Putri' : 'Putra')})
                      </span>
                      <span class="lead-program-text">${l.program || 'Reguler'}</span>
                    ` : `
                      <span class="lead-boarding-badge nonmukim">
                        🚶 Siswa Non-Mukim
                      </span>
                    `}
                  </div>
                </div>

                <!-- Cluster 3: Wali, WhatsApp Link & Domisili -->
                <div class="lead-cell lead-cell-parent">
                  <div class="lead-parent-name" title="${ortuName}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Wali: <strong>${ortuName}</strong></span>
                  </div>
                  <div class="lead-contact-links">
                    <button type="button" class="lead-wa-link" onclick="openLeadWhatsAppModal(${originalIndex})" title="Kirim pesan WhatsApp resmi ke wali santri" style="cursor:pointer; border:none; background:none; padding:0; text-align:left; font:inherit;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.9 11.9 0 0 0 5.85 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.88a9.9 9.9 0 0 1-5.06-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
                      <span>${l.whatsapp}</span>
                    </button>
                    <span class="lead-address-tag" title="${l.address || '-'}">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                      ${l.address || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.onLeadsSearchChange = function(val) {
  leadsSearchTerm = val;
  const db = getDB();
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

window.onLeadsUnitFilterChange = function(val) {
  leadsUnitFilter = val;
  const db = getDB();
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

window.onLeadsStatusFilterChange = function(val) {
  leadsStatusFilter = val;
  const db = getDB();
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

window.filterLeadsBy = function(filterType) {
  leadsFilterState = filterType;
  const db = getDB();
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

/* Modal Detail Lengkap Santri */
window.showLeadDetail = function(index) {
  const db = getDB();
  const l = db.leads[index];
  if (!l) return;

  const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
  const originalIndex = index;
  const docs = l.documents || {};
  const pasfotoUrl = docs.pasfoto ? (docs.pasfoto.dataUrl || docs.pasfoto.url || docs.pasfoto.image || '') : '';
  const hasPasfoto = !!pasfotoUrl;

  openAdminModal(`Rincian Data Pendaftar: ${l.regNumber}`, `
    <div class="lead-detail-modal-root" style="width:100%; box-sizing:border-box;">
      <!-- Header Ringkas Santri (Presisi, Tanpa Terpotong) -->
      <div class="santri-detail-header" style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #E2E8F0; width:100%; box-sizing:border-box;">
        ${hasPasfoto ? `
          <div style="width:40px; height:50px; min-width:40px; border-radius:4px; overflow:hidden; border:1px solid #CBD5E1; box-shadow:0 1px 3px rgba(10,37,64,0.08); flex-shrink:0; cursor:pointer;" onclick="openDocLightbox(${originalIndex}, 'pasfoto')" title="Klik untuk perbesar pasfoto">
            <img src="${pasfotoUrl}" alt="Pasfoto Santri" style="width:100%; height:100%; object-fit:cover;">
          </div>
        ` : `
          <div class="santri-detail-avatar" style="width:40px; height:40px; min-width:40px; font-size:1.1rem; border-radius:4px; flex-shrink:0;">
            ${l.fullName ? l.fullName.charAt(0).toUpperCase() : 'S'}
          </div>
        `}
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
            <div style="min-width:0; flex:1;">
              <h3 style="margin:0; font-size:0.96rem; color:#0A2540; font-weight:700; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${l.fullName}</h3>
              <div style="font-size:0.71rem; color:#64748B; margin-top:2px; line-height:1.3;">
                <strong style="color:#0F4C81; font-weight:600;">${l.regNumber}</strong> • ${l.unit} • ${isMukim ? 'Mukim' : 'Non-Mukim'}
              </div>
            </div>
            <span class="badge-status ${getStatusBadgeClass(l.status)}" style="font-size:0.67rem; padding:2px 7px; font-weight:500; border-radius:3px; letter-spacing:0.01em; flex-shrink:0;">${l.status}</span>
          </div>
        </div>
      </div>

      <!-- Segmented Tab Switcher (Minimalist SVG Icons & Clean Subtle Corners) -->
      <div class="lead-modal-tabs">
        <button type="button" class="lead-tab-btn active" onclick="switchLeadModalTab(this, 'tab-docs')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>Berkas</span>
        </button>
        <button type="button" class="lead-tab-btn" onclick="switchLeadModalTab(this, 'tab-biodata')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Biodata</span>
        </button>
        <button type="button" class="lead-tab-btn" onclick="switchLeadModalTab(this, 'tab-parents')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Orang Tua</span>
        </button>
        <button type="button" class="lead-tab-btn" onclick="switchLeadModalTab(this, 'tab-all')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Semua</span>
        </button>
      </div>

      <!-- TAB 1: Berkas & Status (Utama Langsung Tampil) -->
      <div id="tab-docs" class="lead-tab-content active" style="display:block;">
        <!-- Update Status & Aksi Cepat (Side-by-side Rapi, Bebas Overflow) -->
        <div class="lead-status-action-box" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:8px 10px; margin-bottom:8px; width:100%; box-sizing:border-box;">
          <div style="margin-bottom:6px;">
            <label class="form-label" style="margin-bottom:3px; font-size:0.70rem; font-weight:600; color:#0F4C81; display:block;">Ubah Status Kelulusan / Seleksi:</label>
            <select id="modalLeadStatus" onchange="updateLeadStatus(${originalIndex}, this.value)" style="width:100%; padding:4px 8px; border-radius:4px; border:1px solid #CBD5E1; font-size:0.76rem; font-weight:600; background:#FFF; color:#0A2540; box-sizing:border-box;">
              <option value="Baru" ${l.status === 'Baru' ? 'selected' : ''}>Baru Masuk</option>
              <option value="Diverifikasi" ${l.status === 'Diverifikasi' ? 'selected' : ''}>Diverifikasi / Berkas Lengkap</option>
              <option value="Diterima" ${l.status === 'Diterima' ? 'selected' : ''}>Diterima / Lulus Seleksi</option>
              <option value="Ditolak" ${l.status === 'Ditolak' ? 'selected' : ''}>Ditolak / Cadangan</option>
            </select>
          </div>
          <div style="display:flex; gap:6px; width:100%;">
            <button type="button" class="btn btn-outline btn-sm" onclick="printLeadSlip(${originalIndex})" style="flex:1; padding:5px 8px; font-size:0.71rem; border-radius:4px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; gap:5px; border-color:#CBD5E1; color:#0F4C81; background:#FFF; white-space:nowrap;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Cetak Kartu</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="sendWhatsappTemplate(${originalIndex}, 'accepted')" style="flex:1; background:#059669; border-color:#059669; padding:5px 8px; font-size:0.71rem; border-radius:4px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; gap:5px; white-space:nowrap;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span>Kirim WA</span>
            </button>
          </div>
        </div>

        <!-- Berkas Persyaratan (5 Berkas) -->
        <div class="admin-docs-panel" style="margin-bottom:8px; border:none; padding:0; background:transparent;">
          <div class="admin-docs-panel-title" style="margin-bottom:6px; font-size:0.75rem; display:flex; align-items:center; gap:6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span style="font-weight:700; color:#0A2540;">Dokumen Persyaratan (5 Berkas)</span>
          </div>
          <div class="admin-docs-grid">
            ${renderAdminDocCard(originalIndex, 'pasfoto', 'Pasfoto Santri 3×4', docs.pasfoto)}
            ${renderAdminDocCard(originalIndex, 'kk', 'Kartu Keluarga (KK)', docs.kk)}
            ${renderAdminDocCard(originalIndex, 'akta', 'Akta Kelahiran', docs.akta)}
            ${renderAdminDocCard(originalIndex, 'ktp', 'KTP Orang Tua / Wali', docs.ktp)}
            ${renderAdminDocCard(originalIndex, 'ijazah', 'Ijazah / SKL', docs.ijazah)}
          </div>
        </div>
      </div>

      <!-- TAB 2: Biodata Santri -->
      <div id="tab-biodata" class="lead-tab-content" style="display:none;">
        <div class="santri-detail-section" style="border-radius:4px; padding:8px 10px; margin-bottom:8px;">
          <div class="santri-detail-section-title" style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; color:#0A2540; margin-bottom:6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Biodata Calon Santri</span>
          </div>
          <div class="santri-detail-grid">
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Jenis Kelamin</span>
              <span class="santri-detail-val">${l.gender || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Tempat, Tanggal Lahir</span>
              <span class="santri-detail-val">${l.birthPlaceDate || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">NIK Calon Santri</span>
              <span class="santri-detail-val">${l.nik || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">NISN</span>
              <span class="santri-detail-val">${l.nisn || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Asal Sekolah</span>
              <span class="santri-detail-val">${l.previousSchool || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Ukuran Seragam</span>
              <span class="santri-detail-val">${l.uniformSize || 'M (Standar)'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Unit Pilihan</span>
              <span class="santri-detail-val" style="color:#0F4C81; font-weight:700;">${l.unit}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Status Asrama</span>
              <span class="santri-detail-val">${isMukim ? 'Mondok di Pesantren' : 'Non-Mukim'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Data Orang Tua / Wali -->
      <div id="tab-parents" class="lead-tab-content" style="display:none;">
        <div class="santri-detail-section" style="border-radius:4px; padding:8px 10px; margin-bottom:8px;">
          <div class="santri-detail-section-title" style="display:flex; align-items:center; gap:6px; font-size:0.75rem; font-weight:700; color:#0A2540; margin-bottom:6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Data Orang Tua / Wali</span>
          </div>
          <div class="santri-detail-grid">
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Nama Ayah</span>
              <span class="santri-detail-val">${l.fatherName || l.parentName || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Pekerjaan Ayah</span>
              <span class="santri-detail-val">${l.fatherJob || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Nama Ibu</span>
              <span class="santri-detail-val">${l.motherName || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Pekerjaan Ibu</span>
              <span class="santri-detail-val">${l.motherJob || '-'}</span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">WhatsApp Wali</span>
              <span class="santri-detail-val">
                <button type="button" onclick="openLeadWhatsAppModal(${originalIndex})" style="color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:5px; background:#F0FDF4; border:1px solid #A7F3D0; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;" title="Buka dialog kirim pesan resmi WhatsApp">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.9 11.9 0 0 0 5.85 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.88a9.9 9.9 0 0 1-5.06-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
                  <span>${l.whatsapp || '-'} (Kirim Pesan Resmi)</span>
                </button>
              </span>
            </div>
            <div class="santri-detail-item">
              <span class="santri-detail-lbl">Email Wali</span>
              <span class="santri-detail-val">${l.email || '-'}</span>
            </div>
            <div class="santri-detail-item" style="grid-column:1/-1;">
              <span class="santri-detail-lbl">Alamat Lengkap</span>
              <span class="santri-detail-val">${l.address || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()" style="padding:4px 12px; font-size:0.72rem; border-radius:4px; font-weight:600; border-color:#CBD5E1; color:#475569;">Tutup</button>
      </div>
    </div>
  `);
};

window.switchLeadModalTab = function(btn, tabId) {
  const root = btn.closest('.lead-detail-modal-root');
  if (!root) return;

  root.querySelectorAll('.lead-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (tabId === 'tab-all') {
    root.querySelectorAll('.lead-tab-content').forEach(c => c.style.display = 'block');
  } else {
    root.querySelectorAll('.lead-tab-content').forEach(c => {
      c.style.display = (c.id === tabId) ? 'block' : 'none';
    });
  }
};

function getDocMinimalSvg(docKey) {
  if (docKey === 'pasfoto') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  } else if (docKey === 'kk') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  } else if (docKey === 'akta') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
  } else if (docKey === 'ktp') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><line x1="15" y1="8" x2="17" y2="8"></line><line x1="15" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>`;
  } else if (docKey === 'ijazah') {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`;
  }
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
}

function renderAdminDocCard(leadIndex, docKey, title, docObj) {
  const isUploaded = !!(docObj && (docObj.dataUrl || docObj.url || docObj.image));
  const docUrl = docObj ? (docObj.dataUrl || docObj.url || docObj.image || '') : '';
  const isPdf = docObj && (docObj.type === 'application/pdf' || docUrl.endsWith('.pdf'));

  return `
    <div class="admin-doc-card ${isUploaded ? 'uploaded' : ''}" style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:5px; padding:7px 10px; box-shadow:none; width:100%; box-sizing:border-box;">
      <div class="admin-doc-card-top" style="display:flex; align-items:center; gap:8px; width:100%;">
        <div class="admin-doc-thumb" style="width:34px; height:34px; min-width:34px; border-radius:3px; overflow:hidden; background:#F8FAFC; display:flex; align-items:center; justify-content:center; border:1px solid #CBD5E1; cursor:${isUploaded ? 'pointer' : 'default'}; flex-shrink:0;" ${isUploaded ? `onclick="openDocLightbox(${leadIndex}, '${docKey}')" title="Klik untuk pratinjau ${title}"` : ''}>
          ${isUploaded ? (
            isPdf 
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>` 
              : `<img src="${docUrl}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">`
          ) : getDocMinimalSvg(docKey)}
        </div>
        <div style="flex:1; min-width:0;">
          <div class="admin-doc-title" style="font-size:0.74rem; font-weight:600; color:#0A2540; line-height:1.2; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${title}">${title}</div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${isUploaded ? `
              <span class="admin-doc-status-badge uploaded" style="font-size:0.62rem; font-weight:500; padding:1px 5px; border-radius:2px; display:inline-flex; align-items:center; gap:3px; background:#ECFDF5; color:#047857; border:1px solid #A7F3D0;">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Tersedia</span>
              </span>
            ` : `
              <span class="admin-doc-status-badge empty" style="font-size:0.62rem; font-weight:500; padding:1px 5px; border-radius:2px; display:inline-flex; align-items:center; gap:3px; background:#F1F5F9; color:#64748B; border:1px solid #CBD5E1;">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Belum Diunggah</span>
              </span>
            `}
          </div>
        </div>
      </div>
      
      <div class="admin-doc-actions" style="display:flex; gap:5px; margin-top:6px; border-top:1px solid #F1F5F9; padding-top:5px; width:100%; box-sizing:border-box;">
        ${isUploaded ? `
          <button type="button" class="admin-doc-btn" onclick="openDocLightbox(${leadIndex}, '${docKey}')" style="background:#F8FAFC; color:#0F4C81; border:1px solid #CBD5E1; font-weight:500; padding:4px 6px; font-size:0.68rem; border-radius:3px; flex:1; display:inline-flex; align-items:center; justify-content:center; gap:4px; cursor:pointer;" title="Lihat pratinjau">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Preview</span>
          </button>
          <button type="button" class="admin-doc-btn download-btn" onclick="downloadLeadDoc(${leadIndex}, '${docKey}')" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; font-weight:500; padding:4px 6px; font-size:0.68rem; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; gap:3px; cursor:pointer;" title="Unduh berkas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Unduh</span>
          </button>
          <button type="button" class="admin-doc-btn" onclick="triggerAdminDocUpload(${leadIndex}, '${docKey}')" style="background:#F8FAFC; color:#334155; border:1px solid #CBD5E1; font-weight:500; padding:4px 6px; font-size:0.68rem; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; gap:3px; cursor:pointer;" title="Ganti berkas">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Ganti</span>
          </button>
        ` : `
          <button type="button" class="admin-doc-btn" onclick="triggerAdminDocUpload(${leadIndex}, '${docKey}')" style="background:#F0FDF4; color:#047857; border:1px solid #A7F3D0; font-weight:500; padding:5px 8px; font-size:0.68rem; border-radius:3px; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:4px; cursor:pointer;" title="Unggah berkas langsung">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>Unggah Berkas</span>
          </button>
        `}
      </div>
    </div>
  `;
}

/* Handler Unggah / Ganti Berkas Dokumen Langsung oleh Admin */
window.triggerAdminDocUpload = function(leadIndex, docKey) {
  let fileInput = document.getElementById('adminDocUploadInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'adminDocUploadInput';
    fileInput.accept = 'image/*,.pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }
  
  fileInput.value = '';
  fileInput.onchange = function() {
    if (!fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];

    const db = getDB();
    if (!db.leads || !db.leads[leadIndex]) return;
    if (!db.leads[leadIndex].documents) db.leads[leadIndex].documents = {};

    if (file.type.startsWith('image/')) {
      if (file.size > 15 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar (>15 MB). Silakan pilih foto dengan ukuran lebih kecil.');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const maxWidth = (docKey === 'pasfoto') ? 600 : ((docKey === 'kk' || docKey === 'ijazah') ? 1400 : 1200);
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const quality = (docKey === 'pasfoto') ? 0.85 : 0.82;
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          const compressedBytes = Math.round((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 0.75);

          db.leads[leadIndex].documents[docKey] = {
            name: file.name,
            type: 'image/jpeg',
            size: compressedBytes,
            dataUrl: dataUrl,
            uploadedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
          };

          saveDB(db);
          showLeadDetail(leadIndex);

          setTimeout(() => {
            openDocLightbox(leadIndex, docKey);
          }, 180);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('Ukuran dokumen PDF maksimal 2,5 MB agar tidak membebani kapasitas database.');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        db.leads[leadIndex].documents[docKey] = {
          name: file.name,
          type: 'application/pdf',
          size: file.size,
          dataUrl: e.target.result,
          uploadedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
        };

        saveDB(db);
        showLeadDetail(leadIndex);

        setTimeout(() => {
          openDocLightbox(leadIndex, docKey);
        }, 180);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Format berkas tidak didukung. Mohon gunakan foto (JPG, PNG, WebP) atau dokumen PDF.');
    }
  };
  fileInput.click();
};

/* Lightbox Modal Pratinjau Dokumen Foto Beresolusi Tinggi */
window.openDocLightbox = function(leadIndex, docKey) {
  const db = getDB();
  const l = db.leads[leadIndex];
  if (!l || !l.documents || !l.documents[docKey]) {
    alert('Dokumen belum diunggah atau tidak ditemukan.');
    return;
  }

  const doc = l.documents[docKey];
  const docNames = {
    pasfoto: 'Pasfoto Calon Santri',
    kk: 'Kartu Keluarga (KK)',
    akta: 'Akta Kelahiran',
    ktp: 'KTP Orang Tua / Wali',
    ijazah: 'Ijazah / Surat Keterangan Lulus (SKL)'
  };
  const docTitle = docNames[docKey] || 'Dokumen Persyaratan';

  // Remove existing lightbox if present
  const existing = document.getElementById('docLightboxModal');
  if (existing) existing.remove();

  const docUrl = doc.dataUrl || doc.url || doc.image || '';
  const isPdf = doc.type === 'application/pdf' || docUrl.endsWith('.pdf');

  const overlay = document.createElement('div');
  overlay.className = 'doc-lightbox-overlay';
  overlay.id = 'docLightboxModal';
  overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(10,37,64,0.85); backdrop-filter:blur(4px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';
  
  overlay.innerHTML = `
    <div class="doc-lightbox-card" style="background:#FFFFFF; border-radius:12px; max-width:880px; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.4); border:1.5px solid #C59B27;">
      <!-- Header Lightbox -->
      <div class="doc-lightbox-header" style="background:#0A2540; color:#FFFFFF; padding:12px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:36px; height:36px; border-radius:8px; background:rgba(251,191,36,0.18); color:#FBBF24; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:bold;">
            📁
          </div>
          <div>
            <h4 style="margin:0; font-size:0.98rem; font-weight:800; color:#FFFFFF; line-height:1.25;">${docTitle}</h4>
            <div style="font-size:0.75rem; color:#93C5FD; margin-top:2px;">
              Santri: <strong>${l.fullName}</strong> (${l.regNumber}) • ${l.unit}
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-sm" onclick="window.open('${docUrl}', '_blank')" style="background:#0284C7; color:#FFF; border:none; padding:5px 10px; font-size:0.74rem; font-weight:700; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Buka gambar di tab baru">
            🔍 Ukuran Asli ↗
          </button>
          <button type="button" class="btn btn-sm" onclick="downloadLeadDoc(${leadIndex}, '${docKey}')" style="background:#059669; color:#FFF; border:none; padding:5px 10px; font-size:0.74rem; font-weight:700; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Unduh berkas">
            ⬇️ Unduh File
          </button>
          <button type="button" onclick="document.getElementById('docLightboxModal').remove()" style="background:rgba(255,255,255,0.12); border:none; color:#FFF; font-size:1.2rem; cursor:pointer; width:32px; height:32px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; margin-left:4px;" title="Tutup pratinjau">✕</button>
        </div>
      </div>
      
      <!-- Body Lightbox (Preview Gambar / PDF) -->
      <div class="doc-lightbox-body" style="padding:16px; background:#0F172A; display:flex; align-items:center; justify-content:center; overflow:auto; max-height:calc(92vh - 70px);">
        ${isPdf ? `
          <div style="padding:40px 20px; text-align:center; background:#FFFFFF; border-radius:8px; max-width:500px; width:100%;">
            <div style="font-size:3.5rem; margin-bottom:12px;">📄</div>
            <h4 style="margin:0 0 6px; color:#0A2540; font-size:1.05rem;">Dokumen Berformat PDF</h4>
            <div style="font-size:0.80rem; color:#64748B; margin-bottom:16px;">${doc.name || 'Berkas Dokumen'}</div>
            <a href="${docUrl}" target="_blank" download="${doc.name || 'dokumen.pdf'}" class="btn btn-primary btn-sm" style="padding:8px 16px; font-size:0.82rem; font-weight:700;">
              Buka / Unduh Berkas PDF ↗
            </a>
          </div>
        ` : `
          <img src="${docUrl}" alt="${docTitle}" class="doc-lightbox-img" style="max-width:100%; max-height:75vh; object-fit:contain; border-radius:6px; box-shadow:0 8px 30px rgba(0,0,0,0.5); background:#FFFFFF;" onerror="this.src='assets/logo.png'">
        `}
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
};

/* Unduh Dokumen Berkas Santri */
window.downloadLeadDoc = function(leadIndex, docKey) {
  const db = getDB();
  const l = db.leads[leadIndex];
  if (!l || !l.documents || !l.documents[docKey]) return;

  const doc = l.documents[docKey];
  const ext = (doc.type === 'application/pdf') ? 'pdf' : 'png';
  const cleanName = (l.fullName || 'Santri').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${docKey.toUpperCase()}_${l.regNumber}_${cleanName}.${ext}`;

  const link = document.createElement('a');
  link.href = doc.dataUrl || doc.url || doc.image || '';
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* ==========================================================================
   MODAL PENGIRIMAN NOTIFIKASI WHATSAPP RESMI PPDB (SEMI-OTOMATIS TANPA VENDOR)
   ========================================================================== */
window.openLeadWhatsAppModal = function(index) {
  const db = getDB();
  const l = db.leads[index];
  if (!l) return;

  const ortuName = (l.fatherName && l.fatherName !== '-') ? l.fatherName : ((l.motherName && l.motherName !== '-') ? l.motherName : (l.parentName || 'Orang Tua / Calon Wali'));
  const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
  const asramaInfo = isMukim ? `Mondok (${l.boardingWing || (l.gender === 'Perempuan' ? 'Putri' : 'Putra')})` : 'Non-Mukim';
  
  // Format nomor WA Indonesia (contoh: 0812... -> 62812...)
  let cleanWa = (l.whatsapp || '').replace(/[^0-9]/g, '');
  if (cleanWa.startsWith('0')) {
    cleanWa = '62' + cleanWa.slice(1);
  } else if (!cleanWa.startsWith('62') && cleanWa.length > 8) {
    cleanWa = '62' + cleanWa;
  }

  // Deteksi berkas yang belum lengkap
  const docs = l.documents || {};
  const missingDocs = [];
  if (!docs.pasfoto) missingDocs.push('• Pasfoto Berwarna Calon Santri (Ukuran 3x4)');
  if (!docs.kk) missingDocs.push('• Fotokopi Kartu Keluarga (KK)');
  if (!docs.akta) missingDocs.push('• Fotokopi Akta Kelahiran');
  if (!docs.ktp) missingDocs.push('• Fotokopi KTP Orang Tua / Wali');
  if (!docs.ijazah) missingDocs.push('• Fotokopi Ijazah / SKL (dapat menyusul saat terbit)');
  const missingText = missingDocs.length > 0 
    ? missingDocs.join('\n') 
    : '• (Alhamdulillah seluruh berkas administrasi pokok telah lengkap)';

  // 4 Template Pesan Baku Institusional
  const templates = {
    confirm: 
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Bpk/Ibu *${ortuName}*,
Wali dari ananda *${l.fullName}*.

Kami dari Panitia Penerimaan Peserta Didik Baru (PPDB) YTPAI Raudlatul Muta'allimin Lamongan menginformasikan bahwa formulir pendaftaran daring ananda telah berhasil kami terima di sistem resmi dengan data:

• *No. Registrasi:* ${l.regNumber}
• *Satuan Pendidikan:* ${l.unit}
• *Status Asrama:* ${asramaInfo}
• *Gelombang:* ${l.wave || 'Gelombang I'}
• *Status Verifikasi:* ${l.status || 'Baru'}

Saat ini berkas sedang dalam proses verifikasi administratif awal. Jadwal observasi pemetaan potensi dan kelanjutan daftar ulang akan kami sampaikan secara berkala melalui nomor WhatsApp ini.

Terima kasih atas amanah dan kepercayaan Bpk/Ibu kepada yayasan kami.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Panitia PPDB YTPAI Raudlatul Muta'allimin Lamongan_`,

    invite:
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Bpk/Ibu *${ortuName}*,
Wali dari ananda *${l.fullName}* (No. Registrasi: *${l.regNumber}*).

Menindaklanjuti pendaftaran online PPDB pada *${l.unit}* YTPAI Raudlatul Muta'allimin Lamongan, kami mengundang ananda beserta orang tua/wali untuk hadir mengikuti agenda *Observasi Pemetaan Potensi & Verifikasi Berkas Fisik* pada:

📅 *Hari, Tanggal:* [Isi Hari/Tanggal]
⏰ *Waktu:* 08.00 WIB s.d. Selesai
📍 *Tempat:* Sekretariat Panitia PPDB YTPAI Raudlatul Muta'allimin Lamongan (Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Lamongan)

*Perlengkapan yang Wajib Dibawa:*
1. Lembar Cetak Tanda Bukti Registrasi PPDB
2. Fotokopi KK, Akta Kelahiran, dan KTP Orang Tua (rangkap 2)
3. Berpakaian busana muslim sopan dan rapi

Mohon konfirmasi kesiapan kehadiran Bpk/Ibu dengan membalas pesan ini. Terima kasih.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Sekretariat PPDB YTPAI Lamongan_`,

    reminder:
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Yth. Bpk/Ibu *${ortuName}*,
Wali dari calon santri ananda *${l.fullName}* (${l.regNumber}).

Berdasarkan pemeriksaan administratif panitia PPDB YTPAI Raudlatul Muta'allimin Lamongan, mohon bantuan untuk melengkapi berkas persyaratan fisik pendaftaran yang masih perlu diserahkan:

${missingText}

Berkas fotokopi tersebut dapat diserahkan langsung ke Kantor Sekretariat Yayasan pada jam pelayanan (Sabtu - Kamis, 07.30 - 14.00 WIB) atau dibawa saat jadwal observasi santri.

Apabila ada kendala atau pertanyaan seputar berkas, silakan langsung membalas pesan ini. Terima kasih.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Panitia PPDB YTPAI Lamongan_`,

    accepted:
`Assalamu'alaikum Warahmatullahi Wabarakatuh.

Alhamdulillahirabbil'alamin.

Keluarga Besar Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta'allimin Lamongan menyampaikan selamat kepada Bpk/Ibu *${ortuName}* bahwa ananda:

• *Nama Santri:* *${l.fullName}*
• *No. Registrasi:* *${l.regNumber}*
• *Satuan Pendidikan:* *${l.unit}*
• *Status Asrama:* *${asramaInfo}*

Dinyatakan: *DITERIMA SEBAGAI SANTRI BARU* Tahun Ajaran 2026/2027.

Tahap selanjutnya adalah proses *Daftar Ulang dan Administrasi Kelengkapan Santri Baru*. Jadwal dan rincian teknis daftar ulang dapat dikonfirmasikan ke Sekretariat Yayasan.

Semoga ananda diberikan kelancaran dalam menuntut ilmu, berakhlak mulia, dan berprestasi di YTPAI Raudlatul Muta'allimin Lamongan.

Wassalamu'alaikum Warahmatullahi Wabarakatuh.
_Panitia PPDB YTPAI Lamongan_`
  };

  window._currentLeadWaNumber = cleanWa;
  window._leadWaTemplates = templates;

  openAdminModal(`Kirim Notifikasi WhatsApp: ${l.fullName}`, `
    <div style="font-family:'Segoe UI', Tahoma, sans-serif; color:#0F172A;">
      <!-- Header Info Singkat -->
      <div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1px solid #E2E8F0; padding:10px 14px; border-radius:6px; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-size:0.75rem; color:#64748B;">Tujuan Kontak Wali:</div>
          <div style="font-size:0.95rem; font-weight:800; color:#0A2540;">
            ${ortuName} • <span style="color:#059669; font-weight:700;">${l.whatsapp || '-'}</span>
          </div>
          <div style="font-size:0.75rem; color:#64748B; margin-top:1px;">
            Santri: <strong>${l.fullName}</strong> (${l.regNumber}) • ${l.unit}
          </div>
        </div>
        <div style="text-align:right;">
          <span style="display:inline-block; font-size:0.72rem; font-weight:700; background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; padding:3px 8px; border-radius:4px;">
            100% Bebas Vendor (Direct WhatsApp API)
          </span>
        </div>
      </div>

      <!-- Pemilihan Template Pesan -->
      <div style="margin-bottom:10px;">
        <label style="display:block; font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:6px;">
          Pilih Format Template Pesan Resmi:
        </label>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:6px;">
          <button type="button" class="btn btn-sm btn-lead-tpl active" onclick="selectLeadWaTemplate('confirm', this)" style="border:1px solid #0F4C81; background:#0F4C81; color:#FFFFFF; padding:6px 8px; font-size:0.74rem; font-weight:600; border-radius:4px; text-align:center; cursor:pointer;">
            1. Konfirmasi Berkas
          </button>
          <button type="button" class="btn btn-sm btn-lead-tpl" onclick="selectLeadWaTemplate('invite', this)" style="border:1px solid #CBD5E1; background:#FFFFFF; color:#334155; padding:6px 8px; font-size:0.74rem; font-weight:600; border-radius:4px; text-align:center; cursor:pointer;">
            2. Undangan Tes
          </button>
          <button type="button" class="btn btn-sm btn-lead-tpl" onclick="selectLeadWaTemplate('reminder', this)" style="border:1px solid #CBD5E1; background:#FFFFFF; color:#334155; padding:6px 8px; font-size:0.74rem; font-weight:600; border-radius:4px; text-align:center; cursor:pointer;">
            3. Kurang Berkas
          </button>
          <button type="button" class="btn btn-sm btn-lead-tpl" onclick="selectLeadWaTemplate('accepted', this)" style="border:1px solid #CBD5E1; background:#FFFFFF; color:#334155; padding:6px 8px; font-size:0.74rem; font-weight:600; border-radius:4px; text-align:center; cursor:pointer;">
            4. Pengumuman Diterima
          </button>
        </div>
      </div>

      <!-- Textarea Editor Draf Pesan -->
      <div style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label for="leadWaMessageText" style="font-size:0.76rem; font-weight:700; color:#475569;">
            Draf Teks Pesan (Dapat Anda sesuaikan sebelum dikirim):
          </label>
          <span style="font-size:0.70rem; color:#64748B;">Format teks mendukung tanda bintang *tebal* WhatsApp</span>
        </div>
        <textarea id="leadWaMessageText" rows="10" style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:0.80rem; font-family:monospace, sans-serif; line-height:1.45; border:1px solid #CBD5E1; border-radius:6px; background:#FFFFFF; color:#0F172A; resize:vertical;">${templates.confirm}</textarea>
      </div>

      <!-- Tombol Aksi -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="copyLeadWaText()" style="padding:6px 14px; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid #CBD5E1; color:#334155; background:#FFF;">
          📋 Salin Pesan
        </button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()" style="padding:6px 14px; font-size:0.78rem; font-weight:600; border-radius:4px; border:1px solid #CBD5E1; color:#64748B;">
            Batal
          </button>
          <button type="button" class="btn btn-sm" onclick="dispatchLeadWhatsApp()" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); color:#FFFFFF; border:none; padding:7px 18px; font-size:0.82rem; font-weight:700; border-radius:4px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 8px rgba(5,150,105,0.28); cursor:pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.9 11.9 0 0 0 5.85 1.52h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.44zM12.06 21.88a9.9 9.9 0 0 1-5.06-1.39l-.36-.22-3.75.98 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.91-9.94 9.91zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51 0 1.48 1.08 2.91 1.23 3.11.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
            <span>Buka & Kirim WhatsApp ↗</span>
          </button>
        </div>
      </div>
    </div>
  `);
};

window.selectLeadWaTemplate = function(type, btn) {
  const container = btn.parentElement;
  container.querySelectorAll('.btn-lead-tpl').forEach(b => {
    b.style.background = '#FFFFFF';
    b.style.color = '#334155';
    b.style.borderColor = '#CBD5E1';
    b.classList.remove('active');
  });

  btn.style.background = '#0F4C81';
  btn.style.color = '#FFFFFF';
  btn.style.borderColor = '#0F4C81';
  btn.classList.add('active');

  const textarea = document.getElementById('leadWaMessageText');
  if (textarea && window._leadWaTemplates && window._leadWaTemplates[type]) {
    textarea.value = window._leadWaTemplates[type];
  }
};

window.copyLeadWaText = function() {
  const textarea = document.getElementById('leadWaMessageText');
  if (!textarea) return;
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert('✅ Draf pesan berhasil disalin ke clipboard.');
  }).catch(() => {
    document.execCommand('copy');
    alert('✅ Draf pesan berhasil disalin.');
  });
};

window.dispatchLeadWhatsApp = function() {
  const textarea = document.getElementById('leadWaMessageText');
  const cleanWa = window._currentLeadWaNumber;
  if (!cleanWa) {
    alert('Nomor WhatsApp wali santri tidak valid atau kosong.');
    return;
  }
  const text = textarea ? textarea.value.trim() : '';
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
};

/* Cetak Bukti Tanda Pendaftaran Resmi */
window.printLeadSlip = function(index) {
  const db = getDB();
  const l = db.leads[index];
  if (!l) return;

  const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
  const docs = l.documents || {};
  const hasPasfoto = docs.pasfoto && (docs.pasfoto.dataUrl || docs.pasfoto.url);
  const pasfotoSrc = hasPasfoto ? (docs.pasfoto.dataUrl || docs.pasfoto.url) : '';

  const printWindow = window.open('', '_blank', 'width=840,height=920');
  if (!printWindow) {
    alert('Browser memblokir jendela pop-up. Harap izinkan pop-up untuk mencetak bukti pendaftaran.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bukti Pendaftaran PPDB - ${l.regNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      color: #0F172A;
      background: #FFFFFF !important;
      font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif;
      line-height: 1.3;
      font-size: 9.5pt;
    }
    .page-container {
      width: 100% !important;
      max-width: 195mm !important;
      margin: 0 auto !important;
      padding: 6mm 10mm 6mm 10mm !important;
    }
    
    /* KOP SURAT FORMAL RESMI INSTITUSI - TEPAT DI BAGIAN ATAS KERTAS */
    .kop {
      border-bottom: 2.8px solid #0A2540;
      padding: 0 0 8px 0;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }
    .kop::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      right: 0;
      height: 1px;
      background: #0A2540;
    }
    .kop-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .kop-text h3 {
      margin: 0;
      font-size: 9.6pt;
      font-weight: 700;
      color: #0F4C81;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .kop-text h2 {
      margin: 2px 0;
      font-size: 14pt;
      font-weight: 800;
      color: #0A2540;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .kop-text h4 {
      margin: 2px 0;
      font-size: 9.6pt;
      font-weight: 700;
      color: #C59B27;
      letter-spacing: 0.02em;
    }
    .kop-text p {
      margin: 2px 0 0;
      font-size: 8.2pt;
      color: #475569;
      line-height: 1.3;
    }

    /* HEADER DOKUMEN & NO REGISTRASI */
    .title-box {
      text-align: center;
      margin: 10px 0 12px 0;
    }
    .title-box h3 {
      margin: 0;
      font-size: 12pt;
      font-weight: 800;
      color: #0A2540;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 2px solid #C59B27;
      display: inline-block;
      padding-bottom: 3px;
    }
    .reg-badge {
      margin-top: 4px;
      font-size: 10.5pt;
      font-weight: 800;
      color: #0F4C81;
      letter-spacing: 0.05em;
    }
    .print-date {
      font-size: 7.8pt;
      color: #64748B;
      margin-top: 2px;
    }

    /* KONTEN DUA KOLOM: TABEL BIODATA & FRAME PASFOTO 3X4 */
    .slip-content-grid {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 12px;
    }
    .slip-table-col {
      flex: 1;
      min-width: 0;
    }
    .slip-photo-col {
      width: 125px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pasfoto-card {
      width: 120px;
      height: 160px; /* Rasio proporsional 3x4 (3cm x 4cm) */
      border: 2px solid #0F4C81;
      border-radius: 4px;
      overflow: hidden;
      background: #F8FAFC;
      box-shadow: 0 1px 4px rgba(10,37,64,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pasfoto-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .pasfoto-empty-placeholder {
      padding: 10px;
      text-align: center;
      color: #94A3B8;
      font-size: 8pt;
      font-weight: 700;
      line-height: 1.3;
    }
    .pasfoto-label {
      font-size: 8pt;
      font-weight: 700;
      color: #0A2540;
      margin-top: 6px;
      letter-spacing: 0.04em;
      text-align: center;
    }

    /* TABEL BIODATA SANTRI */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .data-table th, .data-table td {
      padding: 5px 8px;
      border: 1px solid #CBD5E1;
      text-align: left;
      vertical-align: middle;
    }
    .data-table th {
      background: #F8FAFC !important;
      color: #0F4C81;
      font-weight: 700;
      width: 32%;
      font-size: 8.8pt;
    }
    .doc-check-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 12px;
    }
    .doc-check-item {
      font-size: 8.2pt;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .doc-check-box {
      font-weight: bold;
      color: #059669;
      font-size: 9pt;
    }

    /* PETUNJUK WALI SANTRI */
    .instructions {
      background: #F8FAFC !important;
      border: 1px dashed #0F4C81;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 7.8pt;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .instructions h5 {
      margin: 0 0 4px;
      font-size: 8.5pt;
      font-weight: 800;
      color: #0A2540;
      text-transform: uppercase;
    }
    .instructions ol {
      margin: 0;
      padding-left: 16px;
    }
    .instructions li {
      margin-bottom: 2px;
    }

    /* PENGESAHAN & TANDA TANGAN */
    .sig-section {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      width: 240px;
    }
    .sig-title {
      font-weight: 600;
      color: #334155;
      margin-bottom: 48px;
    }
    .sig-name {
      border-top: 1px solid #0F172A;
      padding-top: 3px;
      font-weight: 700;
      color: #0A2540;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- 1. KOP SURAT FORMAL RESMI INSTITUSI (FULL WIDTH, TEPAT DI BAGIAN ATAS KERTAS) -->
    <div class="kop">
      <img src="assets/logo.png" class="kop-logo" alt="Logo YTPAI">
      <div class="kop-text">
        <h3>YAYASAN TAMAN PENDIDIKAN AGAMA ISLAM (YTPAI)</h3>
        <h2>RAUDLATUL MUTA'ALLIMIN LAMONGAN</h2>
        <h4>PANITIA PENERIMAAN PESERTA DIDIK BARU (PPDB) TAHUN AJARAN 2026/2027</h4>
        <p>Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan, Jawa Timur 62271 • Telp/WA: ${(db.meta && db.meta.whatsapp) || '+62 857-0633-2002'}</p>
      </div>
    </div>

    <!-- 2. JUDUL DOKUMEN & IDENTIFIKASI REGISTRASI -->
    <div class="title-box">
      <h3>Tanda Bukti Pendaftaran Santri Baru</h3>
      <div class="reg-badge">NO. REGISTRASI: ${l.regNumber}</div>
      <div class="print-date">Dicetak otomatis pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <!-- 3. AREA BIODATA & FRAME PASFOTO RESMI 3X4 -->
    <div class="slip-content-grid">
      <div class="slip-table-col">
        <table class="data-table">
          <tr><th>Nama Lengkap Santri</th><td><strong style="font-size:9.5pt; color:#0A2540;">${l.fullName}</strong></td></tr>
          <tr><th>Jenis Kelamin</th><td>${l.gender || '-'}</td></tr>
          <tr><th>Tempat, Tanggal Lahir</th><td>${l.birthPlaceDate || '-'}</td></tr>
          <tr><th>Gelombang Pendaftaran</th><td><strong style="color:#0A2540;">${l.wave || 'Gelombang I'}</strong></td></tr>
          <tr><th>Pilihan Satuan Pendidikan</th><td><strong style="color:#0F4C81;">${l.unit}</strong></td></tr>
          <tr><th>Status Asrama / Mondok</th><td><strong>${isMukim ? 'Mondok / Mukim (' + (l.boardingWing || (l.gender === 'Perempuan' ? 'Putri' : 'Putra')) + ')' : 'Tidak Mondok (Siswa Non-Mukim)'}</strong></td></tr>
          <tr><th>Program Pilihan</th><td>${l.program || 'Reguler'}</td></tr>
          <tr><th>Nama Orang Tua / Wali</th><td>${l.fatherName || l.parentName || '-'} (Ayah) & ${l.motherName || '-'} (Ibu)</td></tr>
          <tr><th>Nomor WhatsApp Wali</th><td><strong>${l.whatsapp}</strong></td></tr>
          <tr><th>Alamat Tempat Tinggal</th><td>${l.address || '-'}</td></tr>
          <tr><th>Status Seleksi Berkas</th><td><strong style="color:#0A2540;">${l.status}</strong></td></tr>
          <tr>
            <th>Kelengkapan Berkas Persyaratan</th>
            <td>
              <div class="doc-check-grid">
                <div class="doc-check-item">
                  <span class="doc-check-box">[ ${docs.pasfoto ? '✓' : ' '} ]</span> 1. Pasfoto: <strong>${docs.pasfoto ? 'Terunggah' : 'Menyusul'}</strong>
                </div>
                <div class="doc-check-item">
                  <span class="doc-check-box">[ ${docs.kk ? '✓' : ' '} ]</span> 2. KK: <strong>${docs.kk ? 'Terunggah' : 'Bawa Fisik'}</strong>
                </div>
                <div class="doc-check-item">
                  <span class="doc-check-box">[ ${docs.akta ? '✓' : ' '} ]</span> 3. Akta Lahir: <strong>${docs.akta ? 'Terunggah' : 'Bawa Fisik'}</strong>
                </div>
                <div class="doc-check-item">
                  <span class="doc-check-box">[ ${docs.ktp ? '✓' : ' '} ]</span> 4. KTP Ortu: <strong>${docs.ktp ? 'Terunggah' : 'Bawa Fisik'}</strong>
                </div>
                <div class="doc-check-item" style="grid-column: 1 / -1;">
                  <span class="doc-check-box">[ ${docs.ijazah ? '✓' : ' '} ]</span> 5. Ijazah / SKL: <strong>${docs.ijazah ? 'Terunggah' : 'Menyusul'}</strong>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- KOLOM PASFOTO FORMAL 3X4 (BERDIRI TEGAK DI SAMPING BIODATA) -->
      <div class="slip-photo-col">
        <div class="pasfoto-card">
          ${hasPasfoto ? `
            <img src="${pasfotoSrc}" alt="Pasfoto 3x4 ${l.fullName}">
          ` : `
            <div class="pasfoto-empty-placeholder">
              <div>PASFOTO 3×4</div>
              <div style="font-size:6pt; font-weight:normal; margin-top:2px;">(Tempel di Sini)</div>
            </div>
          `}
        </div>
        <div class="pasfoto-label">PASFOTO 3×4</div>
      </div>
    </div>

    <!-- 4. PETUNJUK RESMI WALI SANTRI -->
    <div class="instructions">
      <h5>PETUNJUK BAGI CALON WALI SANTRI:</h5>
      <ol>
        <li>Simpan lembar tanda bukti pendaftaran ini sebagai bukti sah PPDB Online YTPAI Raudlatul Muta'allimin Lamongan.</li>
        <li>Untuk berkas persyaratan fisik, harap menyerahkan fotokopi (KK, Akta Kelahiran & KTP Ortu) saat verifikasi ke sekretariat yayasan.</li>
        <li>Jadwal observasi pemetaan/tes dan daftar ulang santri baru akan disampaikan via WhatsApp ke nomor: <strong>${l.whatsapp}</strong>.</li>
      </ol>
    </div>

    <!-- 5. TANDA TANGAN & PENGESAHAN -->
    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-title">Orang Tua / Calon Wali Santri,</div>
        <div class="sig-name">( ${l.fatherName || l.parentName || '...........................................'} )</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Lamongan, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br>Panitia PPDB YTPAI Lamongan,</div>
        <div class="sig-name">( Sekretariat PPDB )</div>
      </div>
    </div>
  </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

/* Kirim Pesan WhatsApp Resmi Berformat Cepat */
window.sendWhatsappTemplate = function(index, type = 'accepted') {
  const db = getDB();
  const l = db.leads[index];
  if (!l) return;

  const phone = (l.whatsapp || '').replace(/[^0-9]/g, '');
  let msg = '';

  if (type === 'accepted') {
    msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
          `Yth. Bapak/Ibu ${l.fatherName || l.parentName || 'Wali Santri'},\n` +
          `Alhamdulillah, kami dari Panitia PPDB YTPAI Raudlatul Muta'allimin Lamongan menginformasikan bahwa berkas pendaftaran santri baru atas nama:\n\n` +
          `👤 *Nama:* ${l.fullName}\n` +
          `📋 *No. Registrasi:* ${l.regNumber}\n` +
          `🏫 *Unit Pilihan:* ${l.unit}\n` +
          `🏡 *Status Asrama:* ${l.isBoarding ? 'Mukim / Mondok' : 'Non-Mukim'}\n\n` +
          `Telah dinyatakan *LENGKAP DAN DIVERIFIKASI* pada seleksi berkas awal. Jadwal observasi dan daftar ulang akan kami sampaikan secara berkala.\n\n` +
          `Terima kasih atas kepercayaan Bapak/Ibu kepada Pesantren YTPAI Raudlatul Muta'allimin Lamongan.\n\n` +
          `Wassalamu'alaikum Wr. Wb.\n` +
          `*Panitia PPDB YTPAI Lamongan*`;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
};

window.savePsbWaveConfigForm = function() {
  const activeWaveSelect = document.getElementById('adminActiveWave');
  const yearInput = document.getElementById('adminWaveAcademicYear');

  const wave1Name = document.getElementById('adminWave1Name');
  const wave1Date = document.getElementById('adminWave1DateRange');
  const wave1Status = document.getElementById('adminWave1Status');
  const wave1Announce = document.getElementById('adminWave1Announcement');

  const wave2Name = document.getElementById('adminWave2Name');
  const wave2Date = document.getElementById('adminWave2DateRange');
  const wave2Status = document.getElementById('adminWave2Status');
  const wave2Announce = document.getElementById('adminWave2Announcement');

  const activeWaveVal = activeWaveSelect ? parseInt(activeWaveSelect.value, 10) : 1;
  const academicYearVal = yearInput ? (yearInput.value.trim() || 'T.A. 2027/2028 (1447–1448 H)') : 'T.A. 2027/2028 (1447–1448 H)';

  const wave1Obj = {
    name: wave1Name ? (wave1Name.value.trim() || 'Gelombang I (Jalur Prestasi & Inden)') : 'Gelombang I (Jalur Prestasi & Inden)',
    shortName: 'Gelombang I',
    dateRange: wave1Date ? (wave1Date.value.trim() || '02 Jan – 31 Mar 2026') : '02 Jan – 31 Mar 2026',
    status: wave1Status ? (wave1Status.value.trim() || 'Kuota Terbatas') : 'Kuota Terbatas',
    isOpen: activeWaveVal === 1,
    announcementText: wave1Announce ? wave1Announce.value.trim() : ''
  };

  const wave2Obj = {
    name: wave2Name ? (wave2Name.value.trim() || 'Gelombang II (Jalur Reguler)') : 'Gelombang II (Jalur Reguler)',
    shortName: 'Gelombang II',
    dateRange: wave2Date ? (wave2Date.value.trim() || '01 Apr – 30 Jun 2026') : '01 Apr – 30 Jun 2026',
    status: wave2Status ? (wave2Status.value.trim() || 'Pengisian Sisa Kuota') : 'Pengisian Sisa Kuota',
    isOpen: activeWaveVal === 2,
    announcementText: wave2Announce ? wave2Announce.value.trim() : ''
  };

  // Tentukan payload kompatibilitas legacy sesuai gelombang yang aktif
  let activePayload = wave1Obj;
  let isOpenLegacy = true;

  if (activeWaveVal === 2) {
    activePayload = wave2Obj;
    isOpenLegacy = true;
  } else if (activeWaveVal === 0) {
    activePayload = wave1Obj;
    isOpenLegacy = false;
  }

  const bgInput = document.getElementById('adminPsbHeroBg');
  const heroBgVal = bgInput ? (bgInput.value.trim() || 'assets/banner_ppdb_hero.jpg') : ((db.psbWaveConfig && db.psbWaveConfig.heroBackground) || 'assets/banner_ppdb_hero.jpg');

  const db = getDB();
  db.psbWaveConfig = {
    activeWave: activeWaveVal,
    academicYear: academicYearVal,
    heroBackground: heroBgVal,
    wave1: wave1Obj,
    wave2: wave2Obj,
    // Properti Kompatibilitas Flat
    name: activePayload.name,
    shortName: activePayload.shortName,
    dateRange: activePayload.dateRange,
    status: activeWaveVal === 0 ? 'Pendaftaran Ditutup' : activePayload.status,
    isOpen: isOpenLegacy,
    announcementText: activePayload.announcementText
  };

  saveDB(db);
  showToast(`✅ Pengaturan Sistem 2 Gelombang PPDB & Foto Latar Belakang berhasil disimpan! Gelombang Aktif: ${activeWaveVal === 1 ? 'Gelombang I' : (activeWaveVal === 2 ? 'Gelombang II' : 'Ditutup Sementara')}.`, 'success');
  
  // Re-render tab leads agar tampilan langsung ter-refresh
  const container = document.getElementById('adminContentArea');
  if (container) {
    renderTabLeads(db, container);
  }
};

/* ===================================================================
   MANAJEMEN FAQ PPDB & PESANTREN (CRUD LENGKAP & DINAMIS)
   =================================================================== */

window.openPsbFaqModal = function(id) {
  const db = getDB();
  const faqs = (db.psbFaq && Array.isArray(db.psbFaq))
    ? db.psbFaq
    : ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbFaq) ? DEFAULT_YAYASAN_DATA.psbFaq : []);
  const item = id ? faqs.find(f => f.id === id) : null;
  const isEdit = !!item;

  const title = isEdit ? 'Edit Pertanyaan FAQ PPDB' : 'Tambah Pertanyaan FAQ PPDB Baru';
  const nextOrder = !isEdit ? (faqs.length + 1) : (item.order || 1);

  const formHtml = `
    <form id="faqCrudForm" onsubmit="event.preventDefault(); savePsbFaqForm('${id || ''}');">
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Nomor Urut Tampil *</label>
        <input type="number" id="faqFormOrder" class="form-input" value="${nextOrder}" min="1" max="99" required style="width:120px; font-weight:700;">
        <small style="color:#64748B; font-size:0.73rem;">Menentukan posisi urutan pertanyaan di website portal pendaftaran.</small>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540;">Pertanyaan Resmi (Question) *</label>
        <input type="text" id="faqFormQuestion" class="form-input" value="${item ? (item.question || '').replace(/"/g, '&quot;') : ''}" placeholder="Contoh: Apakah diperbolehkan sekolah saja tanpa tinggal di asrama (santri non-mukim)?" required style="font-weight:600; font-size:0.88rem;">
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; flex-wrap:wrap; gap:4px;">
          <label class="form-label" style="font-weight:700; font-size:0.82rem; color:#0A2540; margin:0;">Isi Jawaban Resmi (Answer) *</label>
          <span style="font-size:0.72rem; color:#64748B;">Mendukung teks tebal, list, & tag tanggal dinamis</span>
        </div>
        
        <!-- Shortcut Tag Bantuan Tanggal -->
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
          <button type="button" class="btn btn-sm" onclick="insertFaqToken('{{WAVE_1_DATES}}')" style="background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-size:0.72rem; padding:3px 8px; border-radius:4px; font-weight:700;" title="Otomatis mengikuti rentang tanggal Gelombang I yang disetel di admin">
            ＋ Sisipkan Tanggal Gel. I
          </button>
          <button type="button" class="btn btn-sm" onclick="insertFaqToken('{{WAVE_2_DATES}}')" style="background:#FEF3C7; border:1px solid #FCD34D; color:#92400E; font-size:0.72rem; padding:3px 8px; border-radius:4px; font-weight:700;" title="Otomatis mengikuti rentang tanggal Gelombang II yang disetel di admin">
            ＋ Sisipkan Tanggal Gel. II
          </button>
        </div>

        <textarea id="faqFormAnswer" class="form-textarea" rows="7" placeholder="Tuliskan jawaban yang lengkap, ramah, dan solutif..." required style="font-size:0.84rem; line-height:1.6; resize:vertical;">${item ? (item.answer || '') : ''}</textarea>
        <small style="color:#64748B; font-size:0.72rem; display:block; margin-top:4px;">
          💡 <strong>Tips:</strong> Gunakan token <code>{{WAVE_1_DATES}}</code> dan <code>{{WAVE_2_DATES}}</code> agar tanggal otomatis terupdate saat rentang gelombang diubah di panel admin.
        </small>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px; padding-top:12px; border-top:1px solid #E2E8F0;">
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()" style="font-weight:600; padding:8px 16px;">
          Batal
        </button>
        <button type="submit" class="btn btn-primary" style="background:#0F4C81; border-color:#0A2540; font-weight:700; padding:8px 22px;">
          💾 Simpan Pertanyaan FAQ
        </button>
      </div>
    </form>
  `;

  openAdminModal(title, formHtml);
};

window.insertFaqToken = function(token) {
  const textarea = document.getElementById('faqFormAnswer');
  if (!textarea) return;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + token + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + token.length;
};

window.savePsbFaqForm = function(id) {
  const orderEl = document.getElementById('faqFormOrder');
  const questionEl = document.getElementById('faqFormQuestion');
  const answerEl = document.getElementById('faqFormAnswer');

  const order = orderEl ? parseInt(orderEl.value, 10) || 1 : 1;
  const question = questionEl ? questionEl.value.trim() : '';
  const answer = answerEl ? answerEl.value.trim() : '';

  if (!question || !answer) {
    alert('Mohon lengkapi pertanyaan dan jawaban FAQ.');
    return;
  }

  const db = getDB();
  if (!db.psbFaq || !Array.isArray(db.psbFaq)) {
    db.psbFaq = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.psbFaq || []));
  }

  if (id) {
    const idx = db.psbFaq.findIndex(f => f.id === id);
    if (idx !== -1) {
      db.psbFaq[idx].order = order;
      db.psbFaq[idx].question = question;
      db.psbFaq[idx].answer = answer;
    }
  } else {
    const newId = 'faq-' + Date.now();
    db.psbFaq.push({
      id: newId,
      order: order,
      question: question,
      answer: answer
    });
  }

  // Urutkan ulang berdasarkan urutan
  db.psbFaq.sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));

  saveDB(db);
  closeAdminModal();
  showToast(id ? '✅ Pertanyaan FAQ berhasil diperbarui!' : '✅ Pertanyaan FAQ baru berhasil ditambahkan!', 'success');

  const container = document.getElementById('adminContentArea');
  if (container) {
    renderTabLeads(db, container);
  }
};

window.deletePsbFaq = function(id) {
  if (!confirm('Yakin ingin menghapus pertanyaan FAQ ini dari portal PSB?')) return;
  const db = getDB();
  if (!db.psbFaq || !Array.isArray(db.psbFaq)) return;
  db.psbFaq = db.psbFaq.filter(f => f.id !== id);
  // Perbaiki penomoran urutan
  db.psbFaq.forEach((f, idx) => { f.order = idx + 1; });
  saveDB(db);
  showToast('🗑️ Pertanyaan FAQ berhasil dihapus.', 'info');
  const container = document.getElementById('adminContentArea');
  if (container) {
    renderTabLeads(db, container);
  }
};

window.movePsbFaqOrder = function(id, direction) {
  const db = getDB();
  if (!db.psbFaq || !Array.isArray(db.psbFaq)) return;
  const list = [...db.psbFaq].sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));
  const idx = list.findIndex(f => f.id === id);
  if (idx === -1) return;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  // Tukar urutan
  const tempOrder = list[idx].order;
  list[idx].order = list[targetIdx].order;
  list[targetIdx].order = tempOrder;

  list.sort((a, b) => (parseInt(a.order, 10) || 0) - (parseInt(b.order, 10) || 0));
  // Normalisasi urutan 1..N
  list.forEach((f, i) => { f.order = i + 1; });
  db.psbFaq = list;

  saveDB(db);
  const container = document.getElementById('adminContentArea');
  if (container) {
    renderTabLeads(db, container);
  }
};

/* ========================================================
   MODAL & LOGIKA PENGELOLAAN RINCIAN BIAYA SPMB (psb.html)
   ======================================================== */
window.openPsbCostsModal = function() {
  const db = getDB();
  const costs = (db.psbCosts && db.psbCosts.cards && Array.isArray(db.psbCosts.cards))
    ? db.psbCosts
    : ((typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.psbCosts) ? DEFAULT_YAYASAN_DATA.psbCosts : { cards: [] });

  const c1 = (costs.cards && costs.cards[0]) || { name: 'Infaq Formulir & Seleksi', price: 'Rp 140.000', period: 'Sekali bayar saat registrasi awal', btnText: 'Pilih Jalur Reguler', btnLink: '#formulir', features: [] };
  const c2 = (costs.cards && costs.cards[1]) || { name: 'Infaq Masuk & Seragam Lengkap', price: 'Mulai Rp 1.236.000', period: 'Sekali di awal masuk (Sudah Termasuk Seragam Lengkap)', isPopular: true, popularBadge: 'Paling Populer', btnText: 'Daftar Sekarang', btnLink: '#formulir', features: [] };
  const c3 = (costs.cards && costs.cards[2]) || { name: 'Iuran SPP Bulanan Terpadu', price: 'Mulai Rp 281.000', period: 'Per bulan (Rp 281rb SLTP / Rp 330rb SLTA - Paket Mukim)', btnText: 'Buka Rincian Biaya Resmi', btnLink: 'javascript:openOfficialCostsModal()', features: [] };

  const formHtml = `
    <form id="psbCostsCrudForm" onsubmit="event.preventDefault(); savePsbCostsForm();">
      <!-- Section Header Info -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px; margin-bottom:16px;">
        <h4 style="margin:0 0 10px 0; font-size:0.86rem; color:#0A2540; font-weight:800;">Header Seksi Biaya (psb.html)</h4>
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:10px; margin-bottom:8px;">
          <div>
            <label class="form-label" style="font-weight:700; font-size:0.75rem;">Lencana Seksi</label>
            <input type="text" id="costFormSectionBadge" class="form-input" value="${(costs.sectionBadge || 'Transparan & Terjangkau').replace(/"/g, '&quot;')}" style="font-size:0.82rem;">
          </div>
          <div>
            <label class="form-label" style="font-weight:700; font-size:0.75rem;">Judul Utama Seksi</label>
            <input type="text" id="costFormSectionTitle" class="form-input" value="${(costs.sectionTitle || 'Rincian Estimasi Biaya Pendidikan').replace(/"/g, '&quot;')}" style="font-size:0.82rem; font-weight:700;">
          </div>
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:0.75rem;">Subjudul / Deskripsi Seksi</label>
          <input type="text" id="costFormSectionSub" class="form-input" value="${(costs.sectionSubtitle || '').replace(/"/g, '&quot;')}" style="font-size:0.82rem;">
        </div>
      </div>

      <!-- Tab / Accordion 3 Kartu -->
      <div style="display:flex; flex-direction:column; gap:14px; max-height:420px; overflow-y:auto; padding-right:4px;">
        <!-- Card 1 -->
        <div style="border:1px solid #CBD5E1; border-radius:8px; padding:12px; background:#FFF;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:#0F4C81; font-size:0.84rem;">Kartu 1: Biaya Pendaftaran / Seleksi</strong>
            <span style="font-size:0.7rem; color:#64748B;">Reguler / Awal</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-bottom:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nama Biaya *</label>
              <input type="text" id="c1_name" class="form-input" value="${(c1.name || '').replace(/"/g, '&quot;')}" required style="font-size:0.8rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nominal Biaya (Format Rp) *</label>
              <input type="text" id="c1_price" class="form-input" value="${(c1.price || '').replace(/"/g, '&quot;')}" required style="font-size:0.82rem; font-weight:700; color:#0F4C81;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Keterangan Periode</label>
              <input type="text" id="c1_period" class="form-input" value="${(c1.period || '').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <label class="form-label" style="font-size:0.73rem; font-weight:600;">Daftar Fasilitas / Cakupan (1 baris per fasilitas)</label>
            <textarea id="c1_features" class="form-textarea" rows="4" style="font-size:0.78rem; line-height:1.4;">${(c1.features || []).join('\n')}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem;">Teks Tombol Aksi</label>
              <input type="text" id="c1_btnText" class="form-input" value="${(c1.btnText || 'Pilih Jalur Reguler').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem;">Tautan Tombol (Anchor/URL)</label>
              <input type="text" id="c1_btnLink" class="form-input" value="${(c1.btnLink || '#formulir').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div style="border:2px solid #FBBF24; border-radius:8px; padding:12px; background:#FFFBEB;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:#B45309; font-size:0.84rem;">Kartu 2: Infaq Pangkal & Fasilitas Masuk (Sorotan Utama)</strong>
            <span style="background:#FBBF24; color:#0A2540; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:999px;">HIGHLIGHT</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-bottom:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nama Biaya *</label>
              <input type="text" id="c2_name" class="form-input" value="${(c2.name || '').replace(/"/g, '&quot;')}" required style="font-size:0.8rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nominal Biaya (Format Rp) *</label>
              <input type="text" id="c2_price" class="form-input" value="${(c2.price || '').replace(/"/g, '&quot;')}" required style="font-size:0.82rem; font-weight:700; color:#B45309;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Keterangan Periode / Angsuran</label>
              <input type="text" id="c2_period" class="form-input" value="${(c2.period || '').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <label class="form-label" style="font-size:0.73rem; font-weight:600;">Daftar Fasilitas / Cakupan (1 baris per fasilitas)</label>
            <textarea id="c2_features" class="form-textarea" rows="5" style="font-size:0.78rem; line-height:1.4;">${(c2.features || []).join('\n')}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem;">Teks Tombol Aksi</label>
              <input type="text" id="c2_btnText" class="form-input" value="${(c2.btnText || 'Daftar Sekarang').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem;">Tautan Tombol (Anchor/URL)</label>
              <input type="text" id="c2_btnLink" class="form-input" value="${(c2.btnLink || '#formulir').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div style="border:1px solid #CBD5E1; border-radius:8px; padding:12px; background:#FFF;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:#0F4C81; font-size:0.84rem;">Kartu 3: SPP Bulanan Terpadu (All-in-One Mukim)</strong>
            <span style="font-size:0.7rem; color:#64748B;">Bulanan</span>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-bottom:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nama Biaya *</label>
              <input type="text" id="c3_name" class="form-input" value="${(c3.name || '').replace(/"/g, '&quot;')}" required style="font-size:0.8rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Nominal SPP (Format Rp) *</label>
              <input type="text" id="c3_price" class="form-input" value="${(c3.price || '').replace(/"/g, '&quot;')}" required style="font-size:0.82rem; font-weight:700; color:#0F4C81;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem; font-weight:600;">Keterangan Periode</label>
              <input type="text" id="c3_period" class="form-input" value="${(c3.period || '').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <label class="form-label" style="font-size:0.73rem; font-weight:600;">Daftar Fasilitas / Cakupan (1 baris per fasilitas)</label>
            <textarea id="c3_features" class="form-textarea" rows="5" style="font-size:0.78rem; line-height:1.4;">${(c3.features || []).join('\n')}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label class="form-label" style="font-size:0.73rem;">Teks Tombol Aksi</label>
              <input type="text" id="c3_btnText" class="form-input" value="${(c3.btnText || 'Pelajari Selengkapnya').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
            <div>
              <label class="form-label" style="font-size:0.73rem;">Tautan Tombol (Anchor/URL)</label>
              <input type="text" id="c3_btnLink" class="form-input" value="${(c3.btnLink || '#faq').replace(/"/g, '&quot;')}" style="font-size:0.78rem;">
            </div>
          </div>
        </div>

        <!-- Beasiswa Note -->
        <div style="background:#F0F9FF; border:1px solid #BAE6FD; border-radius:8px; padding:12px;">
          <label class="form-label" style="font-weight:700; font-size:0.78rem; color:#0369A1; margin-bottom:4px;">Catatan Beasiswa Pendidikan (Bebas Biaya 100%)</label>
          <textarea id="costFormScholarshipNote" class="form-textarea" rows="3" style="font-size:0.8rem; line-height:1.5;">${(costs.scholarshipNote || '')}</textarea>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px; padding-top:12px; border-top:1px solid #E2E8F0;">
        <button type="button" class="btn btn-outline" onclick="closeAdminModal()" style="font-weight:600; padding:8px 16px;">Batal</button>
        <button type="submit" class="btn btn-primary" style="background:#0F4C81; border-color:#0A2540; font-weight:700; padding:8px 22px;">💾 Simpan Rincian Biaya</button>
      </div>
    </form>
  `;

  openAdminModal('Kelola Rincian & Estimasi Biaya SPMB', formHtml);
};

window.savePsbCostsForm = function() {
  const db = getDB();
  if (!db.psbCosts) db.psbCosts = {};

  const badge = document.getElementById('costFormSectionBadge') ? document.getElementById('costFormSectionBadge').value.trim() : 'Transparan & Terjangkau';
  const title = document.getElementById('costFormSectionTitle') ? document.getElementById('costFormSectionTitle').value.trim() : 'Rincian Estimasi Biaya Pendidikan';
  const sub = document.getElementById('costFormSectionSub') ? document.getElementById('costFormSectionSub').value.trim() : '';
  const scholarship = document.getElementById('costFormScholarshipNote') ? document.getElementById('costFormScholarshipNote').value.trim() : '';

  const parseFeatures = (id) => {
    const el = document.getElementById(id);
    if (!el) return [];
    return el.value.split('\n').map(s => s.trim()).filter(Boolean);
  };

  const c1_name = document.getElementById('c1_name') ? document.getElementById('c1_name').value.trim() : 'Infaq Formulir & Seleksi';
  const c1_price = document.getElementById('c1_price') ? document.getElementById('c1_price').value.trim() : 'Rp 140.000';
  const c1_period = document.getElementById('c1_period') ? document.getElementById('c1_period').value.trim() : 'Sekali bayar saat registrasi awal';
  const c1_btnText = document.getElementById('c1_btnText') ? document.getElementById('c1_btnText').value.trim() : 'Pilih Jalur Reguler';
  const c1_btnLink = document.getElementById('c1_btnLink') ? document.getElementById('c1_btnLink').value.trim() : '#formulir';

  const c2_name = document.getElementById('c2_name') ? document.getElementById('c2_name').value.trim() : 'Infaq Masuk & Seragam Lengkap';
  const c2_price = document.getElementById('c2_price') ? document.getElementById('c2_price').value.trim() : 'Mulai Rp 1.236.000';
  const c2_period = document.getElementById('c2_period') ? document.getElementById('c2_period').value.trim() : 'Sekali di awal masuk (Sudah Termasuk Seragam Lengkap)';
  const c2_btnText = document.getElementById('c2_btnText') ? document.getElementById('c2_btnText').value.trim() : 'Daftar Sekarang';
  const c2_btnLink = document.getElementById('c2_btnLink') ? document.getElementById('c2_btnLink').value.trim() : '#formulir';

  const c3_name = document.getElementById('c3_name') ? document.getElementById('c3_name').value.trim() : 'Iuran SPP Bulanan Terpadu';
  const c3_price = document.getElementById('c3_price') ? document.getElementById('c3_price').value.trim() : 'Mulai Rp 281.000';
  const c3_period = document.getElementById('c3_period') ? document.getElementById('c3_period').value.trim() : 'Per bulan (Rp 281rb SLTP / Rp 330rb SLTA - Paket Mukim)';
  const c3_btnText = document.getElementById('c3_btnText') ? document.getElementById('c3_btnText').value.trim() : 'Buka Rincian Biaya Resmi';
  const c3_btnLink = document.getElementById('c3_btnLink') ? document.getElementById('c3_btnLink').value.trim() : 'javascript:openOfficialCostsModal()';

  db.psbCosts = {
    sectionBadge: badge,
    sectionTitle: title,
    sectionSubtitle: sub,
    scholarshipNote: scholarship,
    cards: [
      {
        id: "cost-card-1",
        name: c1_name,
        price: c1_price,
        period: c1_period,
        isPopular: false,
        popularBadge: "",
        btnText: c1_btnText,
        btnLink: c1_btnLink,
        features: parseFeatures('c1_features')
      },
      {
        id: "cost-card-2",
        name: c2_name,
        price: c2_price,
        period: c2_period,
        isPopular: true,
        popularBadge: "Paling Populer",
        btnText: c2_btnText,
        btnLink: c2_btnLink,
        features: parseFeatures('c2_features')
      },
      {
        id: "cost-card-3",
        name: c3_name,
        price: c3_price,
        period: c3_period,
        isPopular: false,
        popularBadge: "",
        btnText: c3_btnText,
        btnLink: c3_btnLink,
        features: parseFeatures('c3_features')
      }
    ]
  };

  saveDB(db);
  closeAdminModal();
  showToast('💾 Rincian estimasi biaya SPMB berhasil diperbarui dan disinkronkan!', 'success');
  const container = document.getElementById('adminContentArea');
  if (container) {
    renderTabLeads(db, container);
  }
};

window.updateLeadStatus = function(index, newStatus) {
  const db = getDB();
  db.leads[index].status = newStatus;
  saveDB(db);
  alert(`Status No Registrasi ${db.leads[index].regNumber} berhasil diperbarui menjadi: ${newStatus}`);
};

window.deleteLead = function(index) {
  if (confirm('Yakin ingin menghapus data pendaftar ini? Tindakan ini tidak dapat dibatalkan.')) {
    const db = getDB();
    db.leads.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

window.resetDummyLeadsWithPhotos = function() {
  if (confirm('Muat ulang 3 data contoh pendaftar PPDB lengkap dengan pasfoto dan berkas dokumen siap pratinjau?')) {
    const db = getDB();
    if (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && Array.isArray(DEFAULT_YAYASAN_DATA.leads) && DEFAULT_YAYASAN_DATA.leads.length >= 3) {
      db.leads = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.leads));
    }
    saveDB(db);
    alert('✅ Berhasil memuat 3 data pendaftar PPDB lengkap dengan pasfoto dan 5 berkas dokumen beresolusi tinggi!');
    loadCurrentTab();
  }
};

window.exportLeadsExcel = function() {
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const isUnitAdmin = activeUser && activeUser.role && activeUser.role.startsWith('unit_');
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toUpperCase() : '';

  let leadsToExport = db.leads || [];
  if (isUnitAdmin && userUnitId) {
    leadsToExport = leadsToExport.filter(l => {
      const u = (l.unit || '').toUpperCase();
      if (userUnitId === 'MA') return u.includes('MA') || u.includes('ALIYAH');
      if (userUnitId === 'MTS') return u.includes('MTS') || u.includes('TSANAWIYAH');
      if (userUnitId === 'SMP') return u.includes('SMP');
      if (userUnitId === 'SMA') return u.includes('SMA');
      if (userUnitId === 'MI') return u.includes('MI') || u.includes('IBTIDAIYAH');
      if (userUnitId === 'TK') return u.includes('TK') || u.includes('KANAK');
      if (userUnitId === 'KB') return u.includes('KB') || u.includes('BERMAIN');
      if (userUnitId === 'PONPES') return l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
      return u.includes(userUnitId);
    });
  }

  let csv = "No Registrasi,Waktu Daftar,Nama Santri,Jenis Kelamin,Tempat Tgl Lahir,Unit Pilihan,Status Mondok,Penempatan Asrama,Fokus Program,Nama Ayah,Nama Ibu,Nama Orang Tua/Wali,WhatsApp,Email,Alamat,Status Seleksi,Pasfoto,KK,Akta,KTP Wali,Ijazah SKL,Catatan\r\n";
  
  leadsToExport.forEach(l => {
    const isMukim = l.isBoarding || (l.boardingStatus && l.boardingStatus.includes('Mondok'));
    const statusMondok = isMukim ? 'Mondok (Mukim)' : 'Tidak Mondok (Non-Mukim)';
    const asrama = isMukim ? (l.boardingWing || (l.gender === 'Perempuan' ? 'Pondok Pesantren Putri' : 'Pondok Pesantren Putra')) : '-';
    const docs = l.documents || {};

    const row = [
      `"${l.regNumber}"`,
      `"${l.date}"`,
      `"${(l.fullName || '').replace(/"/g, '""')}"`,
      `"${l.gender || '-'}"`,
      `"${(l.birthPlaceDate || '').replace(/"/g, '""')}"`,
      `"${(l.unit || '').replace(/"/g, '""')}"`,
      `"${statusMondok}"`,
      `"${asrama}"`,
      `"${(l.program || '').replace(/"/g, '""')}"`,
      `"${(l.fatherName || '-').replace(/"/g, '""')}"`,
      `"${(l.motherName || '-').replace(/"/g, '""')}"`,
      `"${(l.parentName || '').replace(/"/g, '""')}"`,
      `"${l.whatsapp || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${docs.pasfoto ? 'Ada' : 'Tidak'}"`,
      `"${docs.kk ? 'Ada' : 'Tidak'}"`,
      `"${docs.akta ? 'Ada' : 'Tidak'}"`,
      `"${docs.ktp ? 'Ada' : 'Tidak'}"`,
      `"${docs.ijazah ? 'Ada' : 'Tidak'}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ].join(",");
    csv += row + "\r\n";
  });

  const uri = "data:text/csv;charset=utf-8," + encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  const filePrefix = isUnitAdmin ? `Rekap_PPDB_${userUnitId}_YTPAI_` : 'Rekap_PPDB_YTPAI_Lamongan_';
  link.setAttribute("download", `${filePrefix}${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* --- MODAL PENGATURAN & UJI COBA GOOGLE SHEETS PPDB --- */
window.openGoogleSheetModal = function() {
  const db = getDB();
  const currentUrl = (db.meta && db.meta.googleSheetWebhookUrl) || localStorage.getItem('ytpai_google_sheet_url') || '';
  const isConnected = !!currentUrl;

  const content = `
    <div style="font-size:0.92rem; color:#1E293B;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px; padding:12px 16px; border-radius:6px; background:${isConnected ? '#F0FDF4' : '#F8FAFC'}; border:1px solid ${isConnected ? '#86EFAC' : '#E2E8F0'};">
        <span style="font-size:1.5rem;">${isConnected ? '🟢' : '⚪'}</span>
        <div>
          <div style="font-weight:700; color:${isConnected ? '#15803D' : '#475569'}; font-size:0.95rem;">
            ${isConnected ? 'Status: Terhubung ke Google Sheets' : 'Status: Belum Terhubung'}
          </div>
          <div style="font-size:0.8rem; color:#64748B;">
            ${isConnected ? 'Setiap pendaftar PPDB baru akan otomatis masuk ke Google Sheets Anda.' : 'Hubungkan spreadsheet Anda agar data pendaftar otomatis tercatat di Excel online.'}
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label" style="font-weight:700; color:#0A2540;">URL Webhook Google Apps Script</label>
        <input type="url" id="inputGoogleSheetUrl" class="form-input" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="${currentUrl}" style="font-family:monospace; font-size:0.82rem;">
        <div style="font-size:0.78rem; color:#64748B; margin-top:4px;">
          Didapatkan dari Google Sheet: <em>Ekstensi → Apps Script → Terapkan sebagai Aplikasi Web (Web App)</em>.
        </div>
      </div>

      <div id="testResultBox" style="display:none; margin-bottom:16px; padding:12px; border-radius:8px; font-size:0.85rem;"></div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:space-between; align-items:center; border-top:1px solid #E2E8F0; padding-top:16px;">
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="saveGoogleSheetWebhook()">
            💾 Simpan URL
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="testGoogleSheetConnection()" style="border-color:#10B981; color:#047857;">
            🧪 Tes Kirim Data Contoh
          </button>
        </div>
        ${isConnected ? `
          <button type="button" class="btn btn-sm" onclick="disconnectGoogleSheet()" style="background:#FEE2E2; color:#B91C1C; border:none;">
            Putuskan Koneksi
          </button>
        ` : ''}
      </div>

      <div style="margin-top:20px; padding:14px; background:#F8FAFC; border-radius:6px; border-left:4px solid #0F4C81; font-size:0.82rem; line-height:1.5;">
        <strong style="color:#0A2540; display:block; margin-bottom:6px;">📖 Panduan 4 Langkah Singkat:</strong>
        <ol style="margin:0; padding-left:18px; color:#475569;">
          <li>Buka file Google Sheets baru di Google Drive Anda.</li>
          <li>Klik menu <strong>Ekstensi (Extensions) → Apps Script</strong>.</li>
          <li>Tempel skrip penerima data (tersedia di file <code>PANDUAN_GOOGLE_SHEETS.md</code>).</li>
          <li>Klik <strong>Deploy (Terapkan) → Aplikasi Web Baru → Siapa saja (Anyone)</strong>, lalu salin URL yang diberikan ke kolom di atas.</li>
        </ol>
      </div>
    </div>
  `;

  openAdminModal('Konfigurasi Sinkronisasi Otomatis Google Sheets', content);
};

window.saveGoogleSheetWebhook = function() {
  const input = document.getElementById('inputGoogleSheetUrl');
  if (!input) return;
  const url = input.value.trim();

  const db = getDB();
  if (!db.meta) db.meta = {};
  db.meta.googleSheetWebhookUrl = url;
  saveDB(db);
  localStorage.setItem('ytpai_google_sheet_url', url);

  showAdminNotification(url ? '✅ URL Google Sheets berhasil disimpan!' : 'Koneksi Google Sheets dinonaktifkan.');
  closeAdminModal();
  
  // Refresh tab leads
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

window.disconnectGoogleSheet = function() {
  if (!confirm('Yakin ingin memutuskan koneksi ke Google Sheets? Data pendaftar berikutnya tidak akan otomatis dikirim ke spreadsheet.')) return;
  const db = getDB();
  if (db.meta) db.meta.googleSheetWebhookUrl = '';
  saveDB(db);
  localStorage.removeItem('ytpai_google_sheet_url');

  showAdminNotification('Koneksi Google Sheets berhasil diputuskan.');
  closeAdminModal();
  const container = document.getElementById('adminContentArea');
  renderTabLeads(db, container);
};

window.testGoogleSheetConnection = function() {
  const input = document.getElementById('inputGoogleSheetUrl');
  const resultBox = document.getElementById('testResultBox');
  if (!input || !resultBox) return;

  const url = input.value.trim();
  if (!url || !url.startsWith('http')) {
    resultBox.style.display = 'block';
    resultBox.style.background = '#FEF2F2';
    resultBox.style.border = '1px solid #FECACA';
    resultBox.style.color = '#B91C1C';
    resultBox.innerHTML = '⚠️ Mohon masukkan URL Webhook Google Apps Script terlebih dahulu.';
    return;
  }

  resultBox.style.display = 'block';
  resultBox.style.background = '#EFF6FF';
  resultBox.style.border = '1px solid #BFDBFE';
  resultBox.style.color = '#1D4ED8';
  resultBox.innerHTML = '⏳ Sedang mengirim data contoh ke Google Sheets Anda...';

  const testLead = {
    date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    regNumber: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
    fullName: 'Ahmad Santri Contoh (Uji Coba Sistem)',
    gender: 'Laki-laki',
    birthPlaceDate: 'Lamongan, 01 Januari 2012',
    fatherName: 'H. Abdullah',
    motherName: 'Hj. Siti Fatimah',
    parentName: 'H. Abdullah',
    whatsapp: '081234567890',
    email: 'santri.contoh@gmail.com',
    unit: 'MTs Raudlatul Muta\'allimin',
    isBoarding: true,
    boardingStatus: 'Mondok (Mukim)',
    boardingWing: 'Pondok Pesantren Putra',
    program: 'Tahfidz Al-Qur\'an',
    address: 'Babat, Lamongan',
    status: 'Baru',
    notes: 'Ini adalah baris uji coba koneksi otomatis dari Backoffice CMS.'
  };

  fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testLead)
  })
  .then(() => {
    resultBox.style.background = '#F0FDF4';
    resultBox.style.border = '1px solid #86EFAC';
    resultBox.style.color = '#15803D';
    resultBox.innerHTML = `
      <strong>🎉 Berhasil Dikirim!</strong><br>
      Data santri uji coba (<strong>${testLead.regNumber} - ${testLead.fullName}</strong>) telah dikirim. 
      Silakan periksa Google Sheet Anda, baris baru harusnya sudah langsung muncul!
    `;
  })
  .catch(err => {
    resultBox.style.background = '#FEF2F2';
    resultBox.style.border = '1px solid #FECACA';
    resultBox.style.color = '#B91C1C';
    resultBox.innerHTML = `⚠️ Terjadi kendala saat mengirim: ${err.message}. Pastikan URL Webhook Anda sudah diset ke 'Anyone / Siapa saja'.`;
  });
};

/* --- TAB 2.5: KOTAK PESAN MASUK (HUBUNGI KAMI) --- */
let messagesFilterState = 'all';
let messagesSearchTerm = '';

function renderTabMessages(db, container) {
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';
  const userRole = activeUser ? activeUser.role : 'superadmin';

  let rawMessages = db.contactMessages || [];
  if (!isSuperAdmin) {
    rawMessages = rawMessages.filter(m => {
      const target = (m.targetUnit || m.unit || '').toLowerCase();
      if (userRole === 'kbihu') return target.includes('kbihu') || target.includes('haji');
      if (userRole === 'lbb') return target.includes('lbb') || target.includes('bimbel') || target.includes('ptn');
      if (userRole === 'unit_ponpes') return target.includes('pesantren') || target.includes('pondok') || target.includes('asrama');
      return target.includes(userUnitId) || (userUnitId === 'ma' && target.includes('aliyah')) || (userUnitId === 'mts' && target.includes('tsanawiyah'));
    });
  }

  let filtered = rawMessages;
  if (messagesFilterState !== 'all') {
    filtered = rawMessages.filter(m => m.status === messagesFilterState);
  }

  if (messagesSearchTerm) {
    const term = messagesSearchTerm.toLowerCase();
    filtered = filtered.filter(m => {
      const matchName = (m.name || '').toLowerCase().includes(term);
      const matchSubject = (m.subject || '').toLowerCase().includes(term);
      const matchMessage = (m.message || '').toLowerCase().includes(term);
      const matchPhone = (m.whatsapp || '').includes(term);
      const matchUnit = (m.targetUnit || m.unit || '').toLowerCase().includes(term);
      return matchName || matchSubject || matchMessage || matchPhone || matchUnit;
    });
  }

  const countTotal = rawMessages.length;
  const countBaru = rawMessages.filter(m => m.status === 'Baru').length;
  const countDihubungi = rawMessages.filter(m => m.status === 'Dihubungi').length;
  const countArsip = rawMessages.filter(m => m.status === 'Arsip').length;

  container.innerHTML = `
    <div class="admin-card" style="padding:16px 18px; border-radius:10px; border:1px solid #E2E8F0; background:#FFFFFF; box-shadow:0 2px 10px rgba(10,37,64,0.04);">
      <!-- Header & Search Toolbar -->
      <div class="crm-msg-toolbar">
        <div>
          <h3 style="margin:0 0 3px; font-size:1.05rem; font-weight:800; color:#0A2540; display:flex; align-items:center; gap:8px;">
            <span>📬</span>
            <span>${isSuperAdmin ? `Kotak Pesan Masuk (${countTotal} Total)` : `Pesan Masuk: ${activeUser.roleName || activeUser.name} (${countTotal})`}</span>
          </h3>
          <p style="margin:0; font-size:0.78rem; color:#64748B;">
            ${isSuperAdmin ? 'Pesan dan pertanyaan dari calon santri, wali santri, dan masyarakat melalui formulir portal.' : `Pesan dan konsultasi yang ditujukan ke ${activeUser.roleName || activeUser.name}.`}
          </p>
        </div>
        
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <div class="crm-msg-search-box">
            <svg class="crm-msg-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="crm-msg-search-input" placeholder="Cari nama, kontak, subjek..." value="${(messagesSearchTerm || '').replace(/"/g, '&quot;')}" oninput="filterMessagesSearch(this.value)">
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="exportMessagesExcel()" style="padding:5px 10px; font-size:0.74rem; font-weight:700; border-radius:6px; display:inline-flex; align-items:center; gap:4px;" title="Unduh data pesan ke format CSV">
            <span>📥 Ekspor CSV</span>
          </button>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="crm-msg-filter-pills">
        <button type="button" class="crm-msg-pill-btn ${messagesFilterState === 'all' ? 'active' : ''}" onclick="filterMessagesBy('all')">
          Semua (${countTotal})
        </button>
        <button type="button" class="crm-msg-pill-btn ${messagesFilterState === 'Baru' ? 'active pill-baru' : ''}" onclick="filterMessagesBy('Baru')">
          <span class="msg-pulse-amber"></span> Menunggu Respons (${countBaru})
        </button>
        <button type="button" class="crm-msg-pill-btn ${messagesFilterState === 'Dihubungi' ? 'active pill-dihubungi' : ''}" onclick="filterMessagesBy('Dihubungi')">
          ✓ Sudah Dihubungi (${countDihubungi})
        </button>
        <button type="button" class="crm-msg-pill-btn ${messagesFilterState === 'Arsip' ? 'active' : ''}" onclick="filterMessagesBy('Arsip')">
          📁 Selesai / Arsip (${countArsip})
        </button>
      </div>

      <!-- 1. DESKTOP VIEW: SLEEK ULTRA-COMPACT TABLE (Anti-Melar & Tanpa Scrollbar Dalam Sel) -->
      <div class="crm-messages-desktop-table" style="overflow-x:auto;">
        <table class="admin-table table-compact" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="width:200px;">PENGIRIM & KONTAK</th>
              <th style="width:140px;">UNIT TUJUAN</th>
              <th style="width:130px;">WAKTU</th>
              <th>PERIHAL & ISI PESAN</th>
              <th style="width:120px; text-align:center;">STATUS</th>
              <th style="width:160px; text-align:right;">AKSI CEPAT</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align:center; padding:32px 16px; color:#64748B; font-size:0.80rem;">
                  Tidak ada pesan yang cocok dengan filter / kata kunci pencarian.
                </td>
              </tr>
            ` : ''}
            ${filtered.map((m) => {
              const originalIndex = db.contactMessages.findIndex(item => item.id === m.id);
              const waClean = (m.whatsapp || '').replace(/[^0-9]/g, '');
              const waFormatted = waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean;
              const waText = encodeURIComponent(`Halo Bapak/Ibu ${m.name}, kami dari ${activeUser.roleName || 'Sekretariat YTPAI Raudlatul Muta\'allimin Lamongan'} merespons pesan Anda mengenai "${m.subject}".`);
              const dateDisplay = m.date || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-');
              const targetUnit = m.targetUnit || m.unit || 'Umum / Yayasan';

              // Initial Avatar
              const names = (m.name || 'Santri').trim().split(/\s+/);
              const initials = (names.length >= 2 ? (names[0][0] + names[1][0]) : names[0].substring(0, 2)).toUpperCase();

              let statusClass = 'status-baru';
              let statusLabel = '🟡 Baru';
              if (m.status === 'Dihubungi') {
                statusClass = 'status-dihubungi';
                statusLabel = '✓ Dihubungi';
              } else if (m.status === 'Arsip') {
                statusClass = 'status-arsip';
                statusLabel = '📁 Diarsipkan';
              }

              return `
                <tr>
                  <!-- Pengirim & Kontak -->
                  <td>
                    <div class="msg-sender-cell">
                      <div class="msg-avatar-initials">${initials}</div>
                      <div class="msg-sender-info">
                        <div class="msg-sender-name" title="${m.name}">${m.name}</div>
                        <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" class="msg-wa-link" title="Buka obrolan WhatsApp">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                          <span>${m.whatsapp || '-'}</span>
                        </a>
                        ${m.email && m.email !== '-' ? `
                          <a href="mailto:${m.email}" class="msg-email-link" title="Kirim email">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <span>${m.email}</span>
                          </a>
                        ` : ''}
                      </div>
                    </div>
                  </td>

                  <!-- Unit Tujuan -->
                  <td>
                    <span class="msg-unit-tag">${targetUnit}</span>
                  </td>

                  <!-- Waktu Kirim -->
                  <td>
                    <span class="msg-time-chip">${dateDisplay}</span>
                  </td>

                  <!-- Perihal & Isi Pesan (Rapi, Tanpa Scrollbar Dalam Sel) -->
                  <td>
                    <div class="msg-content-cell">
                      <div class="msg-subject-title" title="${m.subject}">${m.subject}</div>
                      <div class="msg-body-preview" title="${m.message}">${m.message}</div>
                      <button type="button" class="msg-read-more-btn" onclick="openMessageDetailModal(${originalIndex})">
                        🔍 Lihat Pesan Penuh
                      </button>
                    </div>
                  </td>

                  <!-- Status -->
                  <td style="text-align:center;">
                    <span class="msg-badge-pill ${statusClass}">
                      ${m.status === 'Baru' ? '<span class="msg-pulse-amber"></span>' : ''}
                      ${statusLabel}
                    </span>
                  </td>

                  <!-- Aksi Cepat -->
                  <td>
                    <div class="msg-action-flex" style="justify-content:flex-end;">
                      <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" class="msg-btn-wa" title="Balas langsung via WhatsApp">
                        <span>💬 WA</span>
                      </a>
                      <button type="button" class="msg-btn-state" onclick="toggleMessageStatus(${originalIndex})" title="Ubah status respons">
                        ${m.status === 'Baru' ? '✓ Dihubungi' : (m.status === 'Dihubungi' ? '📁 Arsipkan' : '🔄 Buka')}
                      </button>
                      <button type="button" class="msg-btn-del" onclick="deleteMessage(${originalIndex})" title="Hapus pesan dari sistem">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. MOBILE VIEW: BESPOKE RESPONSIVE TOUCH CARDS (Zero Cutoff & Zero Horizontal Scroll) -->
      <div class="mobile-messages-list">
        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:24px 12px; color:#64748B; font-size:0.78rem; background:#F8FAFC; border-radius:8px;">
            Belum ada pesan yang cocok dengan filter / pencarian.
          </div>
        ` : ''}
        ${filtered.map((m) => {
          const originalIndex = db.contactMessages.findIndex(item => item.id === m.id);
          const waClean = (m.whatsapp || '').replace(/[^0-9]/g, '');
          const waFormatted = waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean;
          const waText = encodeURIComponent(`Halo Bapak/Ibu ${m.name}, kami dari ${activeUser.roleName || 'Sekretariat YTPAI Raudlatul Muta\'allimin Lamongan'} merespons pesan Anda mengenai "${m.subject}".`);
          const dateDisplay = m.date || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-');
          const targetUnit = m.targetUnit || m.unit || 'Umum / Yayasan';

          const names = (m.name || 'Santri').trim().split(/\s+/);
          const initials = (names.length >= 2 ? (names[0][0] + names[1][0]) : names[0].substring(0, 2)).toUpperCase();

          let statusClass = 'status-baru';
          let statusLabel = '🟡 Baru';
          if (m.status === 'Dihubungi') {
            statusClass = 'status-dihubungi';
            statusLabel = '✓ Dihubungi';
          } else if (m.status === 'Arsip') {
            statusClass = 'status-arsip';
            statusLabel = '📁 Arsip';
          }

          return `
            <div class="crm-msg-card-mobile">
              <!-- Top Row: User & Status Badge -->
              <div class="crm-msg-card-top">
                <div class="crm-msg-card-user">
                  <div class="msg-avatar-initials">${initials}</div>
                  <div>
                    <div class="msg-sender-name">${m.name}</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                      <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" class="msg-wa-link">
                        <span>💬 ${m.whatsapp || '-'}</span>
                      </a>
                    </div>
                  </div>
                </div>
                <span class="msg-badge-pill ${statusClass}">${statusLabel}</span>
              </div>

              <!-- Submeta: Unit & Date -->
              <div class="crm-msg-card-submeta">
                <span class="msg-unit-tag">${targetUnit}</span>
                <span class="msg-time-chip">📅 ${dateDisplay}</span>
              </div>

              <!-- Message Content Box -->
              <div>
                <div class="msg-subject-title">${m.subject}</div>
                <div class="crm-msg-card-bubble">${m.message}</div>
              </div>

              <!-- Bottom Thumb Action Buttons -->
              <div class="crm-msg-card-actions">
                <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" class="msg-btn-wa">
                  <span>💬 Balas WA</span>
                </a>
                <button type="button" class="msg-btn-state" onclick="toggleMessageStatus(${originalIndex})">
                  ${m.status === 'Baru' ? '✓ Selesai Kontak' : (m.status === 'Dihubungi' ? '📁 Arsipkan' : '🔄 Buka')}
                </button>
                <button type="button" class="msg-btn-del" onclick="deleteMessage(${originalIndex})" title="Hapus pesan">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.filterMessagesBy = function(status) {
  messagesFilterState = status;
  renderTabMessages(getDB(), document.getElementById('adminContentArea'));
};

window.filterMessagesSearch = function(val) {
  messagesSearchTerm = val;
  renderTabMessages(getDB(), document.getElementById('adminContentArea'));
};

/* Modal Rincian Lengkap Pesan & Quick Response Generator */
window.openMessageDetailModal = function(index) {
  const db = getDB();
  const m = db.contactMessages && db.contactMessages[index];
  if (!m) return;

  const activeUser = getActiveAdminUser() || {};
  const waClean = (m.whatsapp || '').replace(/[^0-9]/g, '');
  const waFormatted = waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean;
  const waText = encodeURIComponent(`Halo Bapak/Ibu ${m.name}, kami dari ${activeUser.roleName || 'Sekretariat YTPAI Raudlatul Muta\'allimin Lamongan'} merespons pesan Anda mengenai "${m.subject}".\n\nTerima kasih.`);
  const dateDisplay = m.date || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-');
  const targetUnit = m.targetUnit || m.unit || 'Umum / Yayasan';

  // Remove existing modal if any
  const existing = document.getElementById('messageDetailModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'messageDetailModal';
  modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(10,37,64,0.75); backdrop-filter:blur(4px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;';

  modal.innerHTML = `
    <div style="background:#FFFFFF; border-radius:12px; max-width:560px; width:100%; box-shadow:0 20px 40px rgba(0,0,0,0.3); border:1.5px solid #0F4C81; overflow:hidden; display:flex; flex-direction:column; max-height:90vh;">
      <!-- Header -->
      <div style="background:#0A2540; color:#FFFFFF; padding:12px 18px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem;">📬</span>
          <h4 style="margin:0; font-size:0.95rem; font-weight:800; color:#FFFFFF;">Rincian Pesan Masuk</h4>
        </div>
        <button type="button" onclick="document.getElementById('messageDetailModal').remove()" style="background:rgba(255,255,255,0.12); border:none; color:#FFF; font-size:1.1rem; width:28px; height:28px; border-radius:6px; cursor:pointer;">✕</button>
      </div>

      <!-- Body -->
      <div style="padding:16px; overflow-y:auto; flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:1rem; font-weight:800; color:#0A2540;">${m.name}</div>
            <div style="font-size:0.75rem; color:#64748B; margin-top:2px;">Waktu Kirim: <strong>${dateDisplay}</strong></div>
          </div>
          <span class="msg-unit-tag">${targetUnit}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; background:#F8FAFC; padding:10px 12px; border-radius:8px; border:1px solid #E2E8F0;">
          <div>
            <span style="font-size:0.70rem; color:#64748B; font-weight:700; text-transform:uppercase;">Nomor WhatsApp</span>
            <div style="margin-top:2px;">
              <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" style="color:#059669; font-weight:700; font-size:0.80rem; text-decoration:none;">
                💬 ${m.whatsapp || '-'}
              </a>
            </div>
          </div>
          <div>
            <span style="font-size:0.70rem; color:#64748B; font-weight:700; text-transform:uppercase;">Alamat Email</span>
            <div style="margin-top:2px;">
              <a href="mailto:${m.email}" style="color:#0F4C81; font-weight:600; font-size:0.80rem; text-decoration:none;">
                ✉️ ${m.email || '-'}
              </a>
            </div>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <span style="font-size:0.70rem; color:#64748B; font-weight:700; text-transform:uppercase;">Perihal / Topik</span>
          <div style="font-size:0.88rem; font-weight:800; color:#0A2540; margin-top:3px;">${m.subject}</div>
        </div>

        <div style="margin-bottom:16px;">
          <span style="font-size:0.70rem; color:#64748B; font-weight:700; text-transform:uppercase;">Isi Pesan Lengkap</span>
          <div style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:8px; padding:12px; font-size:0.82rem; color:#1E293B; line-height:1.5; margin-top:4px; white-space:pre-wrap;">${m.message}</div>
        </div>

        <!-- Quick Response Action Box -->
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-size:0.80rem; font-weight:800; color:#065F46;">Balas Cepat via WhatsApp</div>
            <div style="font-size:0.72rem; color:#047857;">Membuka obrolan WhatsApp dengan templat salam resmi YTPAI.</div>
          </div>
          <a href="https://wa.me/${waFormatted}?text=${waText}" target="_blank" class="msg-btn-wa" style="padding:7px 14px; font-size:0.78rem;">
            💬 Buka WhatsApp Sekarang
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:10px 16px; background:#F8FAFC; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="btn btn-outline btn-sm" onclick="toggleMessageStatus(${index}); document.getElementById('messageDetailModal').remove();">
          Ubah Status: ${m.status === 'Baru' ? 'Tandai Dihubungi' : (m.status === 'Dihubungi' ? 'Arsipkan' : 'Buka Lagi')}
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('messageDetailModal').remove()" style="background:#0F4C81; border-color:#0A2540;">
          Tutup
        </button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
};

window.toggleMessageStatus = function(index) {
  const db = getDB();
  if (!db.contactMessages || !db.contactMessages[index]) return;

  const current = db.contactMessages[index].status || 'Baru';
  if (current === 'Baru') {
    db.contactMessages[index].status = 'Dihubungi';
  } else if (current === 'Dihubungi') {
    db.contactMessages[index].status = 'Arsip';
  } else {
    db.contactMessages[index].status = 'Baru';
  }

  saveDB(db);
  loadCurrentTab();
};

window.deleteMessage = function(index) {
  if (confirm('Yakin ingin menghapus pesan ini dari arsip?')) {
    const db = getDB();
    db.contactMessages.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

window.exportMessagesExcel = function() {
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';
  const userRole = activeUser ? activeUser.role : 'superadmin';

  let messages = db.contactMessages || [];
  if (!isSuperAdmin) {
    messages = messages.filter(m => {
      const target = (m.targetUnit || m.unit || '').toLowerCase();
      if (userRole === 'kbihu') return target.includes('kbihu') || target.includes('haji');
      if (userRole === 'lbb') return target.includes('lbb') || target.includes('bimbel') || target.includes('ptn');
      if (userRole === 'unit_ponpes') return target.includes('pesantren') || target.includes('pondok') || target.includes('asrama');
      return target.includes(userUnitId) || (userUnitId === 'ma' && target.includes('aliyah')) || (userUnitId === 'mts' && target.includes('tsanawiyah'));
    });
  }

  let csv = "ID Pesan,Waktu Kirim,Nama Pengirim,WhatsApp,Email,Unit Tujuan,Perihal,Isi Pesan,Status\r\n";

  messages.forEach(m => {
    const row = [
      `"${m.id}"`,
      `"${m.createdAt || ''}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.whatsapp || ''}"`,
      `"${m.email || ''}"`,
      `"${(m.targetUnit || '').replace(/"/g, '""')}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${m.status || 'Baru'}"`
    ].join(",");
    csv += row + "\r\n";
  });

  const uri = "data:text/csv;charset=utf-8," + encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  const filePrefix = !isSuperAdmin ? `Rekap_Pesan_${userUnitId || userRole}_YTPAI_` : 'Rekap_Pesan_Masuk_YTPAI_';
  link.setAttribute("download", `${filePrefix}${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* --- TAB 3: WARTA & BERITA (CRUD) --- */
let newsFilterCategory = 'all';
let newsSearchQuery = '';

window.handleCategorySelectChange = function(selectEl, customWrapperId, customInputId) {
  const wrapper = document.getElementById(customWrapperId);
  const customInput = document.getElementById(customInputId);
  if (!wrapper) return;
  if (selectEl.value === 'CUSTOM') {
    wrapper.style.display = 'block';
    if (customInput) customInput.focus();
  } else {
    wrapper.style.display = 'none';
  }
};

window.getNewsCategoryBadge = function(category) {
  const cat = (category || 'Akademik').trim();
  let badgeClass = 'badge-cat-default';
  let dotColor = '#64748B';

  if (cat.toLowerCase().includes('akademik')) {
    badgeClass = 'badge-cat-academic';
    dotColor = '#2563EB';
  } else if (cat.toLowerCase().includes('kegiatan') || cat.toLowerCase().includes('yayasan')) {
    badgeClass = 'badge-cat-activity';
    dotColor = '#059669';
  } else if (cat.toLowerCase().includes('bahasa') || cat.toLowerCase().includes('lpba')) {
    badgeClass = 'badge-cat-language';
    dotColor = '#7C3AED';
  } else if (cat.toLowerCase().includes('ppdb') || cat.toLowerCase().includes('santri baru') || cat.toLowerCase().includes('daftar')) {
    badgeClass = 'badge-cat-ppdb';
    dotColor = '#D97706';
  } else if (cat.toLowerCase().includes('prestasi') || cat.toLowerCase().includes('juara')) {
    badgeClass = 'badge-cat-achievement';
    dotColor = '#E11D48';
  }

  return `
    <span class="badge-category-pill ${badgeClass}">
      <span class="category-dot" style="background:${dotColor};"></span>
      <span>${cat}</span>
    </span>
  `;
};

window.filterNewsByCategory = function(category) {
  newsFilterCategory = category;
  renderTabNews(getDB(), document.getElementById('adminContentArea'));
};

window.onNewsSearch = function(query) {
  newsSearchQuery = query;
  renderTabNews(getDB(), document.getElementById('adminContentArea'));
};

function renderTabNews(db, container) {
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';
  const userRole = activeUser ? activeUser.role : 'superadmin';

  let allNews = db.news || [];

  // Filter scoped to role if not superadmin
  let roleScopedNews = allNews;
  if (!isSuperAdmin) {
    if (userRole === 'kbihu') {
      roleScopedNews = allNews.filter(n => 
        (n.category && n.category.toLowerCase().includes('kbihu')) ||
        (n.category && n.category.toLowerCase().includes('haji')) ||
        (n.unitId === 'kbihu') ||
        (n.createdBy === activeUser.username) ||
        (n.author && n.author.toLowerCase().includes('kbihu'))
      );
    } else if (userRole === 'lbb') {
      roleScopedNews = allNews.filter(n => 
        (n.category && n.category.toLowerCase().includes('lbb')) ||
        (n.category && n.category.toLowerCase().includes('cbt')) ||
        (n.unitId === 'lbb') ||
        (n.createdBy === activeUser.username) ||
        (n.author && n.author.toLowerCase().includes('lbb'))
      );
    } else if (userRole === 'unit_ponpes') {
      roleScopedNews = allNews.filter(n => 
        (n.category && (n.category.toLowerCase().includes('pesantren') || n.category.toLowerCase().includes('kitab') || n.category.toLowerCase().includes('asrama') || n.category.toLowerCase().includes('santri'))) ||
        (n.unitId === 'ponpes') ||
        (n.createdBy === activeUser.username) ||
        (n.author && n.author.toLowerCase().includes('pesantren'))
      );
    } else if (userRole.startsWith('unit_')) {
      roleScopedNews = allNews.filter(n => 
        (n.unitId === userUnitId) ||
        (n.createdBy === activeUser.username) ||
        (n.category && n.category.toLowerCase().includes(userUnitId)) ||
        (n.author && n.author.toLowerCase().includes(userUnitId)) ||
        (n.title && n.title.toLowerCase().includes(userUnitId))
      );
    }
  }

  let filteredNews = roleScopedNews.filter((item) => {
    if (newsFilterCategory !== 'all' && item.category !== newsFilterCategory) return false;
    if (newsSearchQuery) {
      const q = newsSearchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchAuthor = (item.author || '').toLowerCase().includes(q);
      const matchExcerpt = (item.excerpt || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchExcerpt) return false;
    }
    return true;
  });

  const countTotal = roleScopedNews.length;

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#0A2540;">
            ${isSuperAdmin ? `Daftar Warta & Berita Pesantren (${countTotal} Artikel)` : `Daftar Warta & Berita: ${activeUser.roleName || activeUser.name} (${countTotal} Artikel)`}
          </h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">
            ${isSuperAdmin ? 'Kelola artikel kegiatan santri, prestasi akademik, info pendaftaran, dan pengumuman resmi yayasan.' : `Kelola publikasi warta, kegiatan, dan prestasi khusus ${activeUser.roleName || activeUser.name}.`}
          </p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <a href="berita.html" target="_blank" class="btn btn-outline btn-sm" style="font-weight:700; display:inline-flex; align-items:center; gap:6px;">
            👁️ Lihat Halaman Berita
          </a>
          ${isSuperAdmin ? `
            <button type="button" class="btn btn-sm" onclick="openAiNewsDrafterModal()" style="background: linear-gradient(135deg, #0A2540 0%, #0F4C81 100%); color: #FFF; border: 1px solid #FBBF24; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(10,37,64,0.15); padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>✨ Asisten AI Humas</span>
            </button>
          ` : ''}
          <button class="btn btn-primary btn-sm" onclick="openModalNews()" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Tambah Berita Baru</span>
          </button>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; padding:12px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:0.8rem; font-weight:700; color:#475569; margin-right:4px;">Filter:</span>
          <button class="btn btn-sm ${newsFilterCategory === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="filterNewsByCategory('all')" style="padding:4px 12px; font-size:0.78rem;">Semua (${countTotal})</button>
          ${isSuperAdmin ? `
            <button class="btn btn-sm ${newsFilterCategory === 'Akademik' ? 'btn-primary' : 'btn-outline'}" onclick="filterNewsByCategory('Akademik')" style="padding:4px 12px; font-size:0.78rem;">Akademik</button>
            <button class="btn btn-sm ${newsFilterCategory === 'Kegiatan Yayasan' ? 'btn-primary' : 'btn-outline'}" onclick="filterNewsByCategory('Kegiatan Yayasan')" style="padding:4px 12px; font-size:0.78rem;">Kegiatan Yayasan</button>
            <button class="btn btn-sm ${newsFilterCategory === 'Bahasa' ? 'btn-primary' : 'btn-outline'}" onclick="filterNewsByCategory('Bahasa')" style="padding:4px 12px; font-size:0.78rem;">Bahasa</button>
            <button class="btn btn-sm ${newsFilterCategory === 'Info PPDB' ? 'btn-primary' : 'btn-outline'}" onclick="filterNewsByCategory('Info PPDB')" style="padding:4px 12px; font-size:0.78rem;">Info PPDB</button>
          ` : ''}
        </div>

        <div style="position:relative; width:100%; max-width:260px;">
          <input type="text" placeholder="Cari judul berita atau penulis..." value="${newsSearchQuery}" oninput="onNewsSearch(this.value)" style="width:100%; padding:7px 12px 7px 32px; font-size:0.82rem; border-radius:8px; border:1px solid #CBD5E1; background:#FFF;">
          <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:0.85rem; color:#94A3B8;">🔍</span>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:115px; text-align:center;">Gambar <span class="table-ratio-hint">Rasio 16:10 • 800×500 px</span></th>
              <th>Judul Artikel & Cuplikan</th>
              <th style="width:170px; text-align:center;">Kategori</th>
              <th style="width:160px;">Penulis / Tanggal</th>
              <th style="width:170px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredNews.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align:center; padding:36px; color:#64748B;">
                  ${!isSuperAdmin ? `Belum ada warta khusus ${activeUser.roleName || 'unit ini'}. Klik <strong>+ Tambah Berita Baru</strong> di atas untuk membuat artikel pertama.` : 'Tidak ada artikel yang cocok dengan filter atau pencarian ini.'}
                </td>
              </tr>
            ` : ''}
            ${filteredNews.map((item) => {
              const originalIndex = allNews.indexOf(item);
              return `
                <tr>
                  <td style="text-align:center; vertical-align:middle;">
                    <img src="${item.image || 'assets/logo.png'}" alt="" style="width:72px; height:48px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0; box-shadow:0 2px 5px rgba(0,0,0,0.06); display:block; margin:0 auto;" onerror="this.src='assets/logo.png'">
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:800; color:#0A2540; font-size:0.91rem; margin-bottom:3px; line-height:1.35;">${item.title}</div>
                    <small style="color:#64748B; font-size:0.8rem; line-height:1.3; display:block;">${(item.excerpt || '').slice(0, 85)}...</small>
                  </td>
                  <td style="text-align:center; vertical-align:middle;">
                    ${getNewsCategoryBadge(item.category)}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-weight:700; color:#1E293B; font-size:0.83rem;">${item.author || 'Redaksi Media'}</div>
                    <small style="color:#64748B; font-size:0.77rem; display:inline-flex; align-items:center; gap:4px; margin-top:2px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      ${item.date}
                    </small>
                  </td>
                  <td style="text-align:center; vertical-align:middle;">
                    <div class="admin-table-actions">
                      <button type="button" class="btn-action-edit" onclick="openModalNews(${originalIndex})" title="Ubah Isi Berita">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button type="button" class="btn-action-delete" onclick="deleteNews(${originalIndex})" title="Hapus Berita Ini">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openModalNews = function(editIndex = null) {
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';
  const userRole = activeUser ? activeUser.role : 'superadmin';

  if (!isSuperAdmin && editIndex !== null) {
    const itemToEdit = db.news[editIndex];
    if (itemToEdit) {
      const isOwner = (itemToEdit.unitId === userUnitId) || 
                      (itemToEdit.createdBy === activeUser.username) || 
                      (itemToEdit.author && itemToEdit.author.toLowerCase().includes(userUnitId)) ||
                      (itemToEdit.category && itemToEdit.category.toLowerCase().includes(userUnitId));
      if (!isOwner) {
        alert('Akses Ditolak: Anda hanya berwenang mengedit berita milik unit Anda.');
        return;
      }
    }
  }

  const isEdit = editIndex !== null;
  
  // Default values based on logged-in role
  let defaultAuthor = 'Humas Yayasan';
  let defaultCategory = 'Akademik';
  if (!isSuperAdmin) {
    if (userRole === 'kbihu') {
      defaultAuthor = 'Humas KBIHU Raudlatul Muta\'allimin';
      defaultCategory = 'KBIHU Haji';
    } else if (userRole === 'lbb') {
      defaultAuthor = 'Pengelola LBB Raudlatul Muta\'allimin';
      defaultCategory = 'LBB & CBT';
    } else if (userRole === 'unit_ponpes') {
      defaultAuthor = 'Biro Kepesantrenan YTPAI';
      defaultCategory = 'Kajian Kitab';
    } else if (userRole.startsWith('unit_')) {
      const unitCode = (activeUser.roleName || '').replace('Admin ', '');
      defaultAuthor = `Tata Usaha ${unitCode} Raudlatul Muta'allimin`;
      defaultCategory = 'Akademik';
    }
  }

  const item = isEdit ? db.news[editIndex] : { 
    title: '', 
    category: defaultCategory, 
    author: defaultAuthor, 
    readTime: '3 Menit Baca', 
    date: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }), 
    image: 'assets/berita_santri_prestasi.jpg', 
    excerpt: '', 
    content: '' 
  };
  
  const stdCategories = ['Akademik', 'Kegiatan Yayasan', 'Prestasi', 'Bahasa', 'Info PPDB', 'Kajian Kitab', 'LBB & CBT', 'KBIHU Haji'];
  const isCustom = isEdit && item.category && !stdCategories.includes(item.category);

  openAdminModal(isEdit ? 'Edit Berita & Warta' : `Tambah Berita Baru (${activeUser ? activeUser.roleName : 'Admin'})`, `
    <form onsubmit="saveNews(event, ${editIndex})">
      ${isSuperAdmin ? `
        <div style="background: linear-gradient(135deg, rgba(10, 37, 64, 0.04) 0%, rgba(251, 191, 36, 0.12) 100%); border: 1.5px solid rgba(251, 191, 36, 0.45); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg, #0A2540 0%, #0F4C81 100%); display: flex; align-items: center; justify-content: center; color: #FBBF24; box-shadow: 0 2px 6px rgba(10,37,64,0.18); flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div style="font-weight: 800; color: #0A2540; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                <span>Asisten AI Penulis Warta Humas</span>
                <span class="ai-badge-superadmin">👑 Khusus Super Admin</span>
              </div>
              <div style="font-size: 0.74rem; color: #475569; margin-top: 1px;">
                Cukup ketik pokok-pokok fakta warta, AI menyusun naskah berita 5W+1H resmi (~3 menit baca).
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-sm" onclick="openAiNewsDrafterModal()" style="background: linear-gradient(135deg, #0A2540 0%, #0F4C81 100%); color: #FFF; border: 1px solid #FBBF24; font-weight: 700; padding: 6px 14px; border-radius: 7px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(10,37,64,0.15); cursor: pointer; font-size: 0.78rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>Buka Asisten Warta AI</span>
          </button>
        </div>
      ` : ''}
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Judul Berita *</label>
        <input type="text" id="newsTitle" class="form-input" value="${item.title}" required placeholder="Contoh: Santri Raih Prestasi Tingkat Nasional">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Pilihan Kategori Berita *</label>
          <select id="newsCategorySelect" class="form-select" onchange="handleCategorySelectChange(this, 'newsCustomCatWrapper', 'newsCategoryCustom')" required>
            <option value="Akademik" ${item.category === 'Akademik' ? 'selected' : ''}>🎓 Akademik & Sains</option>
            <option value="Kegiatan Yayasan" ${item.category === 'Kegiatan Yayasan' ? 'selected' : ''}>🕌 Kegiatan Yayasan & Kepesantrenan</option>
            <option value="Prestasi" ${item.category === 'Prestasi' ? 'selected' : ''}>🏆 Prestasi & Kejuaraan</option>
            <option value="Bahasa" ${item.category === 'Bahasa' ? 'selected' : ''}>🌐 Bahasa Asing (LPBA)</option>
            <option value="Info PPDB" ${item.category === 'Info PPDB' ? 'selected' : ''}>📢 Informasi PPDB & Beasiswa</option>
            <option value="Kajian Kitab" ${item.category === 'Kajian Kitab' ? 'selected' : ''}>📖 Kajian Kitab Kuning & Turats</option>
            <option value="LBB & CBT" ${item.category === 'LBB & CBT' ? 'selected' : ''}>🚀 Bimbingan Belajar LBB & CBT</option>
            <option value="KBIHU Haji" ${item.category === 'KBIHU Haji' ? 'selected' : ''}>🕋 KBIHU Haji & Umrah</option>
            <option value="CUSTOM" ${isCustom ? 'selected' : ''}>✏️ + Kategori Kustom (Ketik Sendiri)...</option>
          </select>
          <div id="newsCustomCatWrapper" style="margin-top:8px; display:${isCustom ? 'block' : 'none'};">
            <input type="text" id="newsCategoryCustom" class="form-input" value="${isCustom ? item.category : ''}" placeholder="Ketik nama kategori berita baru...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Penulis / Redaksi *</label>
          <input type="text" id="newsAuthor" class="form-input" value="${item.author}" required placeholder="Humas Yayasan / Redaksi Santri">
        </div>
      </div>
      
      <!-- Smart Image Uploader with Auto-Compressor -->
      ${renderImageUploadWidget('newsImage', 'Gambar Cover / Thumbnail Berita', item.image, 1200, 'news', '16:10', '800 × 500 px')}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Estimasi Waktu Baca</label>
          <input type="text" id="newsReadTime" class="form-input" value="${item.readTime || '3 Menit Baca'}" placeholder="3 Menit Baca">
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal Terbit</label>
          <input type="text" id="newsDate" class="form-input" value="${item.date}" placeholder="Contoh: 11 September 2026">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Ringkasan / Cuplikan Artikel *</label>
        <textarea id="newsExcerpt" class="form-textarea" rows="2" required placeholder="1-2 kalimat ringkasan yang tampil di kartu depan">${item.excerpt}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Isi Narasi Lengkap Artikel (Format paragraf, pisahkan dengan baris baru ganda) *</label>
        <textarea id="newsContent" class="form-textarea" rows="7" placeholder="Tuliskan isi berita lengkap di sini..." required>${item.content || item.excerpt}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Berita</button>
      </div>
    </form>
  `);
};

window.saveNews = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : null;

  const catSelect = document.getElementById('newsCategorySelect');
  const catCustom = document.getElementById('newsCategoryCustom');
  let selectedCategory = 'Akademik';
  if (catSelect) {
    if (catSelect.value === 'CUSTOM' && catCustom && catCustom.value.trim()) {
      selectedCategory = catCustom.value.trim();
    } else {
      selectedCategory = catSelect.value;
    }
  }

  const existingItem = editIndex !== null ? db.news[editIndex] : {};

  const newObj = {
    ...existingItem,
    id: editIndex !== null ? db.news[editIndex].id : Date.now(),
    title: document.getElementById('newsTitle').value,
    category: selectedCategory,
    author: document.getElementById('newsAuthor').value,
    readTime: document.getElementById('newsReadTime') ? document.getElementById('newsReadTime').value : '3 Menit Baca',
    date: document.getElementById('newsDate') ? document.getElementById('newsDate').value : (editIndex !== null ? db.news[editIndex].date : new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })),
    image: document.getElementById('newsImage').value || 'assets/hero_santri.jpg',
    excerpt: document.getElementById('newsExcerpt').value,
    content: document.getElementById('newsContent') ? document.getElementById('newsContent').value : document.getElementById('newsExcerpt').value,
    unitId: existingItem.unitId || userUnitId || null,
    createdBy: existingItem.createdBy || (activeUser ? activeUser.username : 'admin')
  };

  if (editIndex !== null) {
    db.news[editIndex] = newObj;
  } else {
    db.news.unshift(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteNews = function(index) {
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';

  if (!isSuperAdmin) {
    const itemToDelete = db.news[index];
    if (itemToDelete) {
      const isOwner = (itemToDelete.unitId === userUnitId) || 
                      (itemToDelete.createdBy === activeUser.username) || 
                      (itemToDelete.author && itemToDelete.author.toLowerCase().includes(userUnitId)) ||
                      (itemToDelete.category && itemToDelete.category.toLowerCase().includes(userUnitId));
      if (!isOwner) {
        alert('Akses Ditolak: Anda hanya berwenang menghapus berita milik unit Anda.');
        return;
      }
    }
  }

  if (confirm('Hapus artikel ini?')) {
    db.news.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* ===================================================================
   ASISTEN AI PENULIS WARTA HUMAS (SUPER ADMIN CO-PILOT)
   =================================================================== */

window.openAiNewsDrafterModal = function() {
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  if (!isSuperAdmin) {
    alert('Akses Terbatas: Fitur Asisten AI Penulis Warta Humas khusus disediakan untuk Super Admin Yayasan.');
    return;
  }

  const modal = document.getElementById('aiNewsDrafterModal');
  if (!modal) return;

  // Set default date if empty
  const dateInput = document.getElementById('aiDraftDate');
  if (dateInput && !dateInput.value.trim()) {
    dateInput.value = new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  // Pre-fill topic if user already typed something in newsTitle
  const existingTitle = document.getElementById('newsTitle');
  const topicInput = document.getElementById('aiDraftTopic');
  if (existingTitle && existingTitle.value.trim() && topicInput && !topicInput.value.trim()) {
    topicInput.value = existingTitle.value.trim();
  }

  modal.style.display = 'flex';
};

window.closeAiNewsDrafterModal = function() {
  const modal = document.getElementById('aiNewsDrafterModal');
  if (modal) modal.style.display = 'none';
};

// Luwes Theme Selector Handler
window.onAiThemeSelect = function(themeKey) {
  const topicInput = document.getElementById('aiDraftTopic');
  const eventInput = document.getElementById('aiDraftEvent');
  const toneSelect = document.getElementById('aiDraftTone');
  const partInput = document.getElementById('aiDraftParticipants');
  const pointsInput = document.getElementById('aiDraftPoints');
  const locInput = document.getElementById('aiDraftLocation');
  const unitSelect = document.getElementById('aiDraftUnit');

  if (themeKey === 'alumni') {
    if (topicInput) topicInput.placeholder = 'Misal: Kenangan Mengaji di Mushola Ponpes Putra & Warisan Berkah Masyayikh';
    if (eventInput) eventInput.placeholder = 'Misal: Kilas balik masa mondok santri, silaturahmi alumni, temu kangen';
    if (toneSelect) toneSelect.selectedIndex = 0; // Hangat & Nostalgia Alumni
    if (partInput) partInput.placeholder = 'Misal: Para alumni santri putra lintas generasi, pengasuh Dr. KH. Ghozi, dll.';
    if (pointsInput) pointsInput.placeholder = 'Misal: Tempat bersantai yang asyik untuk mendekatkan diri pada Allah, kerinduan masa santri, nasihat kiai agar tetap istiqomah sholat berjamaah...';
    if (locInput) locInput.value = 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
    if (unitSelect) unitSelect.value = 'Pondok Pesantren Raudlatul Muta\'allimin';
  } else if (themeKey === 'mushola') {
    if (topicInput) topicInput.placeholder = 'Misal: Mushola Pondok Pesantren Putra: Sarana Ibadah & Ruang Syahdu Santri';
    if (eventInput) eventInput.placeholder = 'Misal: Suasana ibadah sholat fardhu berjamaah, tadarus, dan ruang santai rohani';
    if (toneSelect) toneSelect.selectedIndex = 1; // Sejuk & Syahdu Ruang Ibadah
    if (partInput) partInput.placeholder = 'Misal: Santri putra mukim, siswa sekolah, dan asatidz pembina';
    if (pointsInput) pointsInput.placeholder = 'Misal: Tempat ibadah yang adem dan nyaman untuk mendekatkan diri pada Allah, obrolan santri usai ngaji kitab, ukhuwah yang rekat...';
    if (locInput) locInput.value = 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
    if (unitSelect) unitSelect.value = 'Pondok Pesantren Raudlatul Muta\'allimin';
  } else if (themeKey === 'prestasi') {
    if (topicInput) topicInput.placeholder = 'Misal: Santri Juara 1 Pidato Bahasa Arab / Sains Terintegrasi Jawa Timur';
    if (eventInput) eventInput.placeholder = 'Misal: PORSENI, KSM, Olimpiade Robotik, Kompetisi Bahasa Asing';
    if (toneSelect) toneSelect.selectedIndex = 3; // Semangat & Memotivasi
    if (partInput) partInput.placeholder = 'Misal: M. Zidni Ilman (Kelas 9 MTs), Nayla (MA), Pembina Ust. Zaidan';
    if (pointsInput) pointsInput.placeholder = 'Misal: Bimbingan intensif malam hari di asrama, persaingan ketat, nasihat kiai agar tetap tawadhu dan tidak jumawa...';
  } else if (themeKey === 'kegiatan') {
    if (topicInput) topicInput.placeholder = 'Misal: Peringatan Maulid Nabi Muhammad SAW & Wisuda Khotmil Qur\'an';
    if (eventInput) eventInput.placeholder = 'Misal: Peringatan Hari Besar Islam (PHBI), Tasyakuran Wisuda Tahfidz';
    if (toneSelect) toneSelect.selectedIndex = 2; // Inspiratif & Berwibawa
    if (partInput) partInput.placeholder = 'Misal: Pengasuh Dr. KH. Ghozi, Ketua Yayasan KH. Miftahul Falah, 42 santri khotimin';
    if (pointsInput) pointsInput.placeholder = 'Misal: Pembacaan maulid khidmat, penyerahan syahadah sanad, pesan menjaga niat dan kemuliaan akhlak...';
  } else if (themeKey === 'ppdb') {
    if (topicInput) topicInput.placeholder = 'Misal: Penerimaan Santri & Peserta Didik Baru (PPDB) 2027/2028 Resmi Dibuka';
    if (eventInput) eventInput.placeholder = 'Misal: Peluncuran PPDB Terpadu & Seleksi Beasiswa Tahfidz Prestasi';
    if (toneSelect) toneSelect.selectedIndex = 4; // Resmi & Edukatif
    if (partInput) partInput.placeholder = 'Misal: Panitia Bersama PPDB Yayasan & Para Kepala Satuan Pendidikan';
    if (pointsInput) pointsInput.placeholder = 'Misal: Kuota asrama terbatas, kemudahan daftar online satu pintu, beasiswa penuh bagi santri berprestasi dan yatim...';
  } else if (themeKey === 'opini') {
    if (topicInput) topicInput.placeholder = 'Misal: Menjaga Sanad Keilmuan & Adab Santri di Tengah Arus Modernisasi';
    if (eventInput) eventInput.placeholder = 'Misal: Catatan refleksi kepesantrenan, tausiyah pengasuh, pandangan humas';
    if (toneSelect) toneSelect.selectedIndex = 2; // Inspiratif & Berwibawa
    if (partInput) partInput.placeholder = 'Misal: Dewan Masyayikh YTPAI Raudlatul Muta\'allimin Lamongan';
    if (pointsInput) pointsInput.placeholder = 'Misal: Nilai adab sebelum ilmu, keberkahan khidmah, ikatan batin santri dengan kiai yang tidak pernah putus...';
  }
};

window.fillAiSampleDraft = function(sampleType) {
  const themeSelect = document.getElementById('aiDraftTheme');
  const topicInput = document.getElementById('aiDraftTopic');
  const eventInput = document.getElementById('aiDraftEvent');
  const scaleSelect = document.getElementById('aiDraftScale');
  const dateInput = document.getElementById('aiDraftDate');
  const locInput = document.getElementById('aiDraftLocation');
  const unitSelect = document.getElementById('aiDraftUnit');
  const toneSelect = document.getElementById('aiDraftTone');
  const partInput = document.getElementById('aiDraftParticipants');
  const pointsInput = document.getElementById('aiDraftPoints');

  if (sampleType === 'alumni') {
    if (themeSelect) themeSelect.value = 'alumni';
    if (topicInput) topicInput.value = 'Nostalgia Mengaji di Mushola Ponpes Putra: Tempat Beribadah & Bersantai Asyik Mendekatkan Diri pada Allah';
    if (eventInput) eventInput.value = 'Kilas Balik Masa Mondok & Silaturahmi Alumni Santri Mukim';
    if (scaleSelect) scaleSelect.value = 'Seluruh Alumni & Simpatisan Pesantren';
    if (dateInput) dateInput.value = 'Mengenang Masa Nyantri & Edisi Temu Alumni 2026';
    if (locInput) locInput.value = 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
    if (unitSelect) unitSelect.value = 'Pondok Pesantren Raudlatul Muta\'allimin';
    if (toneSelect) toneSelect.selectedIndex = 0; // Hangat & Nostalgia Alumni
    if (partInput) partInput.value = 'Santri putra, siswa sekolah, alumni lintas angkatan, dan masyayikh pondok';
    if (pointsInput) pointsInput.value = 'Mushola pondok bukan sekadar tempat ibadah sholat berjamaah, melainkan ruang yang asyik dan nyaman untuk bersantai santri sambil mendekatkan diri pada Allah, mengulang hafalan, dan mengikat tali persaudaraan batin yang tak pernah pudar.';
  } else if (sampleType === 'mushola') {
    if (themeSelect) themeSelect.value = 'mushola';
    if (topicInput) topicInput.value = 'Menelisik Mushola Pondok Pesantren Putra: Sarana Ibadah Nyaman & Ruang Syahdu Mendekatkan Diri pada Allah';
    if (eventInput) eventInput.value = 'Suasana Ibadah, Qiyamul Lail & Kehidupan Sehari-hari Santri';
    if (scaleSelect) scaleSelect.value = 'Keluarga Besar Yayasan, Santri & Wali Murid';
    if (dateInput) dateInput.value = 'Terkini / Sepanjang Masa 2026';
    if (locInput) locInput.value = 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
    if (unitSelect) unitSelect.value = 'Pondok Pesantren Raudlatul Muta\'allimin';
    if (toneSelect) toneSelect.selectedIndex = 1; // Sejuk & Syahdu Ruang Ibadah
    if (partInput) partInput.value = 'Santri putra mukim, siswa madrasah, dan Pengasuh Dr. KH. Ghozi, Lc., M.Fil.I';
    if (pointsInput) pointsInput.value = 'Tempat ibadah utama santri putra yang adem dan syahdu, tempat bersantai yang asyik untuk dzikir, murojaah kitab kuning, dan bermunajat mendekatkan diri pada Allah SWT dengan penuh ketenangan batin.';
  } else if (sampleType === 'prestasi') {
    if (themeSelect) themeSelect.value = 'prestasi';
    if (topicInput) topicInput.value = 'Santri MTs & MA Raih Juara 1 Pidato Bahasa Arab & Sains Terpadu Jawa Timur';
    if (eventInput) eventInput.value = 'PORSENI & Kompetisi Sains Madrasah (KSM) Se-Jawa Timur';
    if (scaleSelect) scaleSelect.value = 'Tingkat Kabupaten Lamongan & Jawa Timur';
    if (dateInput) dateInput.value = 'Sabtu, 19 September 2026';
    if (locInput) locInput.value = 'Gedung Islamic Center & Kampus UINSA Surabaya';
    if (unitSelect) unitSelect.value = 'MA Raudlatul Muta\'allimin';
    if (toneSelect) toneSelect.selectedIndex = 3; // Semangat & Memotivasi
    if (partInput) partInput.value = 'M. Zidni Ilman (Kelas 9 MTs) & Nayla Nur Izzah (Kelas 11 MA), Pembina: Ust. Muhammad Zaidan, S.Pd';
    if (pointsInput) pointsInput.value = 'Ikhtiar bimbingan intensif malam hari di asrama santri selama 1 bulan, bersaing dengan 38 kontingen kabupaten/kota se-Jatim, arahan Ketua Yayasan KH. Miftahul Falah agar selalu tawadhu dan tidak jumawa.';
  } else if (sampleType === 'kegiatan') {
    if (themeSelect) themeSelect.value = 'kegiatan';
    if (topicInput) topicInput.value = 'Peringatan Maulid Nabi Muhammad SAW & Wisuda Khotmil Qur\'an Santri Mukim';
    if (eventInput) eventInput.value = 'Peringatan Hari Besar Islam (PHBI) & Tasyakuran Khotmil Qur\'an';
    if (scaleSelect) scaleSelect.value = 'Keluarga Besar Yayasan, Santri & Wali Murid';
    if (dateInput) dateInput.value = 'Ahad Malam Senin, 20 September 2026';
    if (locInput) locInput.value = 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
    if (unitSelect) unitSelect.value = 'Pondok Pesantren Raudlatul Muta\'allimin';
    if (toneSelect) toneSelect.selectedIndex = 2; // Inspiratif & Berwibawa
    if (partInput) partInput.value = 'Pengasuh Dr. KH. Ghozi, Lc., M.Fil.I, Ketua Yayasan KH. Miftahul Falah, S.Pd, bersama 42 santri khotimin tahfidz';
    if (pointsInput) pointsInput.value = 'Pembacaan Maulid Simthudduror khidmat, penyerahan syahadah sanad tahfidz, pesan pengasuh tentang pentingnya menjaga kemurnian niat dan berakhlak mulia di tengah tantangan zaman.';
  } else if (sampleType === 'ppdb') {
    if (themeSelect) themeSelect.value = 'ppdb';
    if (topicInput) topicInput.value = 'Penerimaan Santri & Peserta Didik Baru (PPDB) Tahun Ajaran 2027/2028 Resmi Dibuka';
    if (eventInput) eventInput.value = 'Peluncuran PPDB Terpadu & Seleksi Beasiswa Tahfidz Prestasi';
    if (scaleSelect) scaleSelect.value = 'Tingkat Kabupaten Lamongan & Jawa Timur';
    if (dateInput) dateInput.value = 'Gelombang 1 Dibuka Mulai 1 Oktober 2026';
    if (locInput) locInput.value = 'Kantor Sekretariat PPDB Pusat Yayasan Babat & Portal Online';
    if (unitSelect) unitSelect.value = 'Yayasan Taman Pendidikan Agama Islam (YTPAI) Lamongan';
    if (toneSelect) toneSelect.selectedIndex = 4; // Resmi & Edukatif
    if (partInput) partInput.value = 'Panitia Bersama PPDB Yayasan & Para Kepala Satuan Pendidikan KB hingga SMA/Madin';
    if (pointsInput) pointsInput.value = 'Kuota asrama santri terbatas demi efektivitas pembinaan karakter 24 jam, kemudahan pendaftaran online satu pintu, fasilitas beasiswa penuh bagi santri berprestasi dan yatim piatu.';
  }

  const statusMsg = document.getElementById('aiDraftStatusMessage');
  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#0F4C81';
    statusMsg.textContent = '✓ Ide warta terisi rapi. Klik tombol "Susun Narasi Warta Humas" untuk merumuskan draf artikel.';
  }
};

window.resetAiDraftForm = function() {
  ['aiDraftTopic', 'aiDraftEvent', 'aiDraftLocation', 'aiDraftParticipants', 'aiDraftPoints'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const placeholder = document.getElementById('aiDraftPlaceholder');
  const resultCard = document.getElementById('aiDraftResultCard');
  const badge = document.getElementById('aiDraftWordCountBadge');
  const statusMsg = document.getElementById('aiDraftStatusMessage');
  const loadingBox = document.getElementById('aiDraftLoadingBox');
  if (placeholder) placeholder.style.display = 'flex';
  if (resultCard) resultCard.style.display = 'none';
  if (badge) badge.style.display = 'none';
  if (statusMsg) statusMsg.style.display = 'none';
  if (loadingBox) loadingBox.style.display = 'none';
};

window.copyAiDraftText = function() {
  const title = document.getElementById('aiResultTitle')?.value || '';
  const excerpt = document.getElementById('aiResultExcerpt')?.value || '';
  const content = document.getElementById('aiResultContent')?.value || '';
  const fullText = `*${title.toUpperCase()}*\n\n[RINGKASAN]\n${excerpt}\n\n[WARTA LENGKAP]\n${content}\n\n(Sumber: Humas YTPAI Raudlatul Muta'allimin Lamongan)`;

  navigator.clipboard.writeText(fullText).then(() => {
    alert('✓ Seluruh naskah warta berhasil disalin ke clipboard.');
  }).catch(() => {
    const textarea = document.getElementById('aiResultContent');
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
      alert('✓ Naskah berita berhasil disalin.');
    }
  });
};

window.applyAiDraftToNewsForm = function() {
  const title = document.getElementById('aiResultTitle')?.value.trim() || '';
  const category = document.getElementById('aiResultCategory')?.value.trim() || 'Kegiatan Yayasan';
  const readTime = document.getElementById('aiResultReadTime')?.value.trim() || '3 Menit Baca';
  const excerpt = document.getElementById('aiResultExcerpt')?.value.trim() || '';
  const content = document.getElementById('aiResultContent')?.value.trim() || '';

  if (!title) {
    alert('Draf berita belum tersedia. Silakan susun naskah terlebih dahulu.');
    return;
  }

  // If news form is not currently open, open it first
  if (!document.getElementById('newsTitle')) {
    openModalNews();
  }

  // Populate news form inputs
  const newsTitleEl = document.getElementById('newsTitle');
  const newsExcerptEl = document.getElementById('newsExcerpt');
  const newsContentEl = document.getElementById('newsContent');
  const newsReadTimeEl = document.getElementById('newsReadTime');
  const catSelectEl = document.getElementById('newsCategorySelect');
  const catCustomWrap = document.getElementById('newsCustomCatWrapper');
  const catCustomInput = document.getElementById('newsCategoryCustom');

  if (newsTitleEl) {
    newsTitleEl.value = title;
    newsTitleEl.classList.add('ai-field-highlight');
  }
  if (newsExcerptEl) {
    newsExcerptEl.value = excerpt;
    newsExcerptEl.classList.add('ai-field-highlight');
  }
  if (newsContentEl) {
    newsContentEl.value = content;
    newsContentEl.classList.add('ai-field-highlight');
  }
  if (newsReadTimeEl) {
    newsReadTimeEl.value = readTime;
    newsReadTimeEl.classList.add('ai-field-highlight');
  }

  // Handle category mapping
  if (catSelectEl) {
    const validCats = ['Akademik', 'Kegiatan Yayasan', 'Prestasi', 'Bahasa', 'Info PPDB', 'Kajian Kitab', 'LBB & CBT', 'KBIHU Haji'];
    if (validCats.includes(category)) {
      catSelectEl.value = category;
      if (catCustomWrap) catCustomWrap.style.display = 'none';
    } else {
      catSelectEl.value = 'CUSTOM';
      if (catCustomWrap) catCustomWrap.style.display = 'block';
      if (catCustomInput) catCustomInput.value = category;
    }
  }

  // Close AI Drafter Modal
  closeAiNewsDrafterModal();

  // Remove highlight class after animation
  setTimeout(() => {
    [newsTitleEl, newsExcerptEl, newsContentEl, newsReadTimeEl].forEach(el => {
      if (el) el.classList.remove('ai-field-highlight');
    });
  }, 1800);

  alert('✓ Draf warta Humas berhasil diterapkan ke formulir berita! Silakan pilih foto cover dan simpan artikel Anda.');
};

// Smart Offline Generator (Sangat Luwes untuk Alumni, Mushola & Warta)
window.generateOfflineHumasNewsDraft = function(topic, eventName, scale, date, location, unit, tone, participants, points) {
  const cleanTopic = topic || eventName || 'Catatan Warta Pesantren';
  const cleanUnit = unit || 'Pondok Pesantren Raudlatul Muta\'allimin, Babat';
  const cleanLoc = location || 'Mushola Pondok Pesantren Putra, Babat, Lamongan';
  const cleanDate = date || 'Masa Mondok & Terkini';
  const cleanScale = scale || 'Seluruh Alumni & Simpatisan Pesantren';

  const isAlumniOrMushola = /alumni|nostalgia|kenangan|mushola|ibadah|santai|mendekatkan diri/i.test(cleanTopic + eventName + points);

  let recommendedCat = 'Kegiatan Yayasan';
  if (/prestasi|juara|lomba|porseni|olimpiade|ksm|emas|perak|medali/i.test(cleanTopic + eventName)) {
    recommendedCat = 'Prestasi';
  } else if (/bahasa|lpba|arab|inggris|speech|pidato/i.test(cleanTopic + eventName)) {
    recommendedCat = 'Bahasa';
  } else if (/ppdb|pendaftaran|santri baru|beasiswa/i.test(cleanTopic + eventName)) {
    recommendedCat = 'Info PPDB';
  } else if (/kitab|ngaji|kajian|salaf|turats|arba['’]in|hikam/i.test(cleanTopic + eventName)) {
    recommendedCat = 'Kajian Kitab';
  } else if (/ujian|cbt|lbb|bimbel|akademik/i.test(cleanTopic + eventName)) {
    recommendedCat = 'Akademik';
  }

  let title = '';
  let excerpt = '';
  let p1 = '', p2 = '', p3 = '', p4 = '';

  if (isAlumniOrMushola) {
    title = cleanTopic.length > 15 ? cleanTopic : `${cleanTopic}: Ruang Penuh Berkah, Kenangan Hangat Alumni & Kehidupan Santri`;
    excerpt = `Bagi santri dan alumni, ${cleanLoc} bukan sekadar tempat beribadah, melainkan ruang yang asyik dan syahdu untuk bersantai sambil mendekatkan diri kepada Allah SWT.`;

    p1 = `Babat, Lamongan — Ada getaran rindu yang senantiasa membekas di relung hati setiap santri dan alumni saat mengenang kembali sudut-sudut syahdu di Pondok Pesantren Raudlatul Muta'allimin. Di antara deretan ruang penuh berkah, keberadaan ${cleanLoc} memegang peranan istimewa. Bukan sekadar tempat sholat fardhu berjamaah dan kajian kitab salaf, sarana ibadah ini telah lama menjadi ruang yang asyik dan nyaman bagi ${participants || 'santri putra dan siswa'} untuk bersantai, bertadarus, dan menemukan ketenangan batin dalam mendekatkan diri kepada Allah SWT.`;

    p2 = `Suasana kekeluargaan di lingkungan pesantren terasa begitu kental saat waktu luang usai kepulangan sekolah reguler maupun menjelang malam. Para santri kerap berkumpul di serambi mushola dengan penuh kehangatan; ada yang mengulang hafalan nadzam, berdiskusi santai tentang ilmu agama, hingga bermunajat dalam keheningan doa. Bagi para alumni lintas generasi, kesederhanaan dan ukhuwah inilah yang paling dirindukan.`;

    p3 = `Pimpinan yayasan dan para masyayikh dalam setiap perjumpaan bersama alumni selalu berpesan agar ikatan batin dengan pesantren tetap terjaga kokoh. ${points ? `Sebagaimana sering diutarakan, "${points}". ` : ''}Beliau mengingatkan bahwa hakikat keberkahan ilmu santri terpancar dari ketulusan hati untuk senantiasa tawadhu (rendah hati) dan istiqomah menjaga ibadah sholat di mana pun berada.`;

    p4 = `Mengiringi langkah para alumni yang kini bertebaran mengabdi di masyarakat luas, doa dan harapan terbaik senantiasa dipanjatkan dari serambi Pondok Pesantren Raudlatul Muta'allimin, Babat, Lamongan. Semoga Allah SWT senantiasa melimpahkan taufiq dan kesehatan bagi kita semua. Pintu mushola akan selalu terbuka lebar menyambut kepulangan para alumni untuk melepas rindu dan kembali menautkan jiwa pada sang Maha Pencipta.`;
  } else {
    title = cleanTopic.length > 15 ? cleanTopic : `${cleanTopic}: Ikhtiar Mulia Mewujudkan Generasi Santri Berkarakter`;
    excerpt = `Melalui ikhtiar terpadu dan bimbingan berkelanjutan, ${cleanUnit} sukses menyelenggarakan agenda ${eventName || cleanTopic} pada ${cleanDate} di ${cleanLoc}.`;

    p1 = `Babat, Lamongan — Dalam rangka meneguhkan komitmen pembinaan santri dan syiar pendidikan Islam, ${cleanUnit} sukses menggelar agenda ${eventName || cleanTopic} bertempat di ${cleanLoc}. Kegiatan berskala ${cleanScale} yang berlangsung pada ${cleanDate} ini diikuti dengan antusias dan kesungguhan oleh para santri serta segenap keluarga besar pesantren.`;

    p2 = `Pelaksanaan kegiatan ini menjadi cerminan positif dari pembinaan terpadu di pesantren. Melalui persiapan matang, para peserta${participants ? `, khususnya ${participants},` : ''} mampu menampilkan kemampuan terbaik serta kedisiplinan tinggi. Suasana kebersamaan yang harmonis senantiasa berlandaskan adab luhur, sportivitas, dan nilai-nilai kepesantrenan.`;

    p3 = `Pimpinan yayasan menyampaikan apresiasi mendalam atas dedikasi seluruh pihak yang terlibat. ${points ? `Dalam pesannya, ditekankan bahwa "${points}". ` : ''}Beliau berpesan agar setiap capaian disyukuri dengan sikap tawadhu (rendah hati) sebagai amanah dari Allah SWT demi kemaslahatan bersama.`;

    p4 = `Rangkaian agenda resmi ini dipungkasi dengan doa bersama demi keberkahan dan kemajuan berkelanjutan bagi ${cleanUnit}. Semoga lahir inspirasi baru bagi santri untuk terus berprestasi dan mengamalkan ilmu demi kemanfaatan umat dan bangsa.`;
  }

  const content = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;

  return {
    title,
    category: recommendedCat,
    readTime: '2,5 Menit Baca',
    excerpt,
    content
  };
};

// Global generation controllers for AI News Drafter Pause & Resume
let aiNewsAbortController = null;
let aiNewsProgressInterval = null;
let isAiNewsGenerating = false;

window.pauseAiNewsGeneration = function() {
  if (aiNewsAbortController) {
    try { aiNewsAbortController.abort(); } catch (e) {}
    aiNewsAbortController = null;
  }
  if (aiNewsProgressInterval) {
    clearInterval(aiNewsProgressInterval);
    aiNewsProgressInterval = null;
  }
  isAiNewsGenerating = false;

  const loadingBox = document.getElementById('aiDraftLoadingBox');
  const btn = document.getElementById('btnAiDraftGenerate');
  const spinner = document.getElementById('aiDraftBtnSpinner');
  const btnText = document.getElementById('aiDraftBtnText');
  const statusMsg = document.getElementById('aiDraftStatusMessage');

  if (loadingBox) loadingBox.style.display = 'none';
  if (btn) btn.disabled = false;
  if (spinner) spinner.style.display = 'none';
  if (btnText) btnText.textContent = '✨ Lanjutkan / Susun Ulang Narasi';

  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#92400E';
    statusMsg.style.background = '#FEF3C7';
    statusMsg.style.border = '1px solid #FCD34D';
    statusMsg.style.padding = '8px 12px';
    statusMsg.style.borderRadius = '8px';
    statusMsg.innerHTML = `
      <div style="font-weight:700; display:flex; align-items:center; gap:6px; margin-bottom:2px;">
        <span>⏸️ Pembuatan Naskah Warta Dijeda</span>
      </div>
      <div style="font-size:0.75rem; line-height:1.4;">
        Proses AI dihentikan sementara. Silakan periksa atau perbaiki poin-poin ide Anda di formulir sebelah kiri, lalu klik <b>Lanjutkan / Susun Ulang Narasi</b> bila sudah siap.
      </div>
    `;
  }
};

// Generate Humas Draft with Capsule Progress Bar, Pause Option & Fast Gemini Connection (~2,5 Menit Baca)
window.generateHumasNewsDraft = async function(isRegenerate = false) {
  const topic = document.getElementById('aiDraftTopic')?.value.trim() || '';
  const eventName = document.getElementById('aiDraftEvent')?.value.trim() || '';
  const scale = document.getElementById('aiDraftScale')?.value || 'Seluruh Alumni & Simpatisan Pesantren';
  const date = document.getElementById('aiDraftDate')?.value.trim() || '';
  const location = document.getElementById('aiDraftLocation')?.value.trim() || '';
  const unit = document.getElementById('aiDraftUnit')?.value || 'Pondok Pesantren Raudlatul Muta\'allimin';
  const tone = document.getElementById('aiDraftTone')?.value || 'Hangat, penuh kenangan indah, dan menggugah rasa rindu masa nyantri (Nostalgia Alumni)';
  const participants = document.getElementById('aiDraftParticipants')?.value.trim() || '';
  const points = document.getElementById('aiDraftPoints')?.value.trim() || '';

  if (!topic && !eventName && !points) {
    alert('Mohon isi minimal Gagasan Utama atau Poin Cerita terlebih dahulu.');
    document.getElementById('aiDraftTopic')?.focus();
    return;
  }

  // Cancel any previous running generation before starting new one
  if (aiNewsAbortController) {
    try { aiNewsAbortController.abort(); } catch (e) {}
  }
  if (aiNewsProgressInterval) {
    clearInterval(aiNewsProgressInterval);
  }

  aiNewsAbortController = new AbortController();
  isAiNewsGenerating = true;

  const btn = document.getElementById('btnAiDraftGenerate');
  const spinner = document.getElementById('aiDraftBtnSpinner');
  const btnText = document.getElementById('aiDraftBtnText');
  const statusMsg = document.getElementById('aiDraftStatusMessage');

  // Capsule Progress Elements (Matching Image 2)
  const loadingBox = document.getElementById('aiDraftLoadingBox');
  const progressBar = document.getElementById('aiCapsuleProgressBar');
  const percentBadge = document.getElementById('aiCapsulePercentBadge');
  const stepText = document.getElementById('aiCapsuleStepText');
  const descText = document.getElementById('aiCapsuleDescText');

  const updateCapsule = (pct, step, desc) => {
    if (progressBar) progressBar.style.width = pct + '%';
    if (percentBadge) percentBadge.textContent = pct + '%';
    if (stepText) stepText.textContent = step;
    if (descText) descText.textContent = desc;
  };

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = isRegenerate ? 'Menyusun Ulang...' : 'Menyusun Narasi Humas...';
  if (statusMsg) statusMsg.style.display = 'none';

  if (loadingBox) {
    loadingBox.style.display = 'block';
    updateCapsule(15, 'Tahap 1/4: Menghubungkan ke Mesin Cerdas Humas...', 'Mengirimkan pokok-pokok fakta dan tema warta...');
  }

  // Smooth step-by-step progress ticker while waiting for Gemini
  let progressPct = 15;
  aiNewsProgressInterval = setInterval(() => {
    if (!isAiNewsGenerating) {
      clearInterval(aiNewsProgressInterval);
      return;
    }
    if (progressPct < 35) {
      progressPct += 5;
      updateCapsule(progressPct, 'Tahap 2/4: Menganalisis tema & merancang alur cerita...', 'Menyelaraskan gaya bahasa dengan tema yang dipilih...');
    } else if (progressPct < 65) {
      progressPct += 4;
      updateCapsule(progressPct, 'Tahap 3/4: Menyusun narasi luwes 5W+1H (~250–300 kata)...', 'Menenun pembuka hangat, dinamika cerita, dan pesan hikmah...');
    } else if (progressPct < 88) {
      progressPct += 3;
      updateCapsule(progressPct, 'Tahap 4/4: Memperhalus diksi & menyelaraskan adab santri...', 'Memastikan kesantunan bahasa dan nilai kepesantrenan...');
    } else if (progressPct < 96) {
      progressPct += 1;
      updateCapsule(progressPct, 'Memfinalisasi naskah siap terbit (~2,5 menit baca)...', 'Sedikit lagi, naskah sedang disempurnakan...');
    }
  }, 450);

  const db = (typeof getDB === 'function') ? getDB() : {};
  const apiKey = (db.meta && db.meta.geminiApiKey && db.meta.geminiApiKey.trim())
    ? db.meta.geminiApiKey.trim()
    : '';

  // Fast-path models: gemini-3.1-flash-lite first (~1.8s ultra-fast), then fallback models
  const preferredModel = (db.meta && db.meta.chatbotModel && db.meta.chatbotModel.trim())
    ? db.meta.chatbotModel.trim()
    : 'gemini-3.1-flash-lite';

  const modelsToTry = [
    preferredModel,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash'
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  const systemInstruction = `Anda adalah Senior Humas (Kepala Biro Publikasi & Warta Pesantren) di Pondok Pesantren Raudlatul Muta'allimin / YTPAI (Yayasan Taman Pendidikan Agama Islam) Babat, Lamongan yang sangat berpengalaman dalam jurnalisme pesantren dan rilis pers resmi.

GAYA ANDA:
Sangat LUWES, hangat, menyentuh hati, lembut (soft), mengalir santun, tidak kaku, terstruktur rapi (5W+1H), bernas, dan tidak membosankan.

TUGAS UTAMA:
Susun naskah warta / narasi artikel resmi berdurasi baca ~2,5 MENIT (PANJANG SEKITAR 250 HINGGA 300 KATA SAJA) berdasarkan poin-poin yang diberikan.
Hindari naskah yang terlalu panjang atau bertele-tele. Setiap kalimat harus bermakna dan memikat pembaca di layar ponsel.
Topik bisa berupa: kenangan/nostalgia alumni, kisah mushola tempat ibadah & bersantai santri mendekatkan diri pada Allah, silaturahmi pondok, prestasi lomba, kajian kitab, atau pengumuman resmi yayasan.

STRUKTUR 4 PARAGRAF RINGKAS:
- Paragraf 1 (Lead/Pintu Masuk): Membuka narasi secara hangat dan memikat. Menguraikan inti kabar, subjek cerita, waktu, dan tempat secara mengalir.
- Paragraf 2 (Dinamika / Suasana Nyata): Menggambarkan suasana akrab santri/alumni, kehangatan kebersamaan di pondok, atau ikhtiar perjuangan santri.
- Paragraf 3 (Kutipan Hikmah & Ketawadhuan): Pernyataan hikmah/pesan dari pimpinan pesantren/masyayikh tentang pentingnya rasa syukur, tawadhu (rendah hati), dan kesinambungan ikatan batin dengan pesantren.
- Paragraf 4 (Penutup, Doa & Harapan): Harapan masa depan, doa berkah untuk santri/alumni/keluarga besar pesantren, dan menyambung tali ukhuwah.

ATURAN BAKU INSTITUSI (MUTLAK):
1. DILARANG menggunakan kata "Masjid Jami'" atau "Masjid Jamik". Gunakan "Mushola Pondok Pesantren Putra" (atau "Mushola Pondok Pesantren Putri").
2. DILARANG menggunakan kata "Simorejo" atau kiasan sastra kaku "bumi Simorejo" / "bumi [daerah]". Kompleks pesantren berada di Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan. Sebutlah secara natural seperti "dari serambi Pondok Pesantren Raudlatul Muta'allimin, Babat, Lamongan" atau "di lingkungan pesantren".
3. Nama Lembaga: Yayasan Taman Pendidikan Agama Islam (YTPAI) Raudlatul Muta'allimin Lamongan. Bila menulis narasi santri/alumni/ibadah, prioritaskan menyebut "Pondok Pesantren Raudlatul Muta'allimin" agar lebih hangat dan akrab.
4. HINDARI klise robotik seperti "Dalam era globalisasi...", "Tak dapat dipungkiri bahwa...", atau kalimat kaku berputar-putar.

FORMAT OUTPUT (WAJIB JSON VALID):
Hasilkan HANYA JSON tanpa markdown di luar JSON:
{
  "title": "Judul Warta Menarik, Bernuansa Jurnalistik Humas & Menyentuh Hati (Maksimal 12 kata)",
  "category": "Pilih salah satu: Kegiatan Yayasan / Prestasi / Akademik / Kajian Kitab / Bahasa / Info PPDB / LBB & CBT / KBIHU Haji",
  "readTime": "2,5 Menit Baca",
  "excerpt": "Ringkasan 1-2 kalimat padat yang memikat pembaca untuk kartu cuplikan depan (maksimal 25 kata)...",
  "content": "Isi lengkap 4 paragraf warta (~250-300 kata) dipisahkan baris baru ganda (\\n\\n)..."
}`;

  const userFactPrompt = `POKOK-POKOK CERITA / WARTA:
- Gagasan Utama / Topik: ${topic || eventName || 'Catatan Kehidupan Pesantren'}
- Fokus Bahasan: ${eventName || topic || 'Kilas balik & warta santri'}
- Sasaran Pembaca: ${scale}
- Waktu / Periode: ${date || 'Masa Mondok & Terkini'}
- Latar Tempat: ${location || 'Mushola Pondok Pesantren Putra, Babat, Lamongan'}
- Lembaga Terkait: ${unit}
- Gaya Penulisan: ${tone}
- Tokoh / Subjek Cerita: ${participants || 'Santri putra, siswa sekolah, dan alumni'}
- Poin Cerita & Kesan Penting: ${points || 'Tempat bersantai yang asyik untuk mendekatkan diri kepada Allah, kebersamaan santri, dan nasihat kiai agar selalu tawadhu'}

Tolong rumuskan naskah warta resmi berstandar Humas Senior yang luwes (~250–300 kata, durasi pas 2,5 menit baca, 4 paragraf padat) dalam format JSON sesuai ketentuan.`;

  let draftResult = null;
  let usedModel = 'offline_generator';

  // Try API call with 12s timeout per attempt
  for (const model of modelsToTry) {
    if (!isAiNewsGenerating || (aiNewsAbortController && aiNewsAbortController.signal.aborted)) {
      break;
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal: aiNewsAbortController ? aiNewsAbortController.signal : undefined,
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            { role: 'user', parts: [{ text: userFactPrompt }] }
          ],
          generationConfig: {
            temperature: 0.65,
            topP: 0.95,
            maxOutputTokens: 1600,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      });

      if (!isAiNewsGenerating) break;

      if (response.ok) {
        const json = await response.json();
        const rawText = (json?.candidates?.[0]?.content?.parts || [])
          .map(p => p.text || '')
          .join('')
          .trim();

        if (rawText) {
          let cleanJsonStr = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

          // Strict institution terminology sanitization
          cleanJsonStr = cleanJsonStr
            .replace(/masjid\s+jami['’`]?/gi, 'Mushola Pondok Pesantren Putra')
            .replace(/masjid\s+jamik/gi, 'Mushola Pondok Pesantren Putra')
            .replace(/bumi\s+simorejo/gi, 'Pondok Pesantren Raudlatul Muta\'allimin, Babat')
            .replace(/simorejo/gi, 'Babat')
            .replace(/yayasan\s+tarbiyatul\s+pelajar/gi, 'Pondok Pesantren');

          try {
            const parsed = JSON.parse(cleanJsonStr);
            if (parsed && parsed.title && parsed.content) {
              draftResult = parsed;
              usedModel = model;
              break;
            }
          } catch (pe) {
            const titleMatch = cleanJsonStr.match(/"title"\s*:\s*"([^"]+)"/);
            const catMatch = cleanJsonStr.match(/"category"\s*:\s*"([^"]+)"/);
            const excMatch = cleanJsonStr.match(/"excerpt"\s*:\s*"([^"]+)"/);
            if (titleMatch && excMatch) {
              draftResult = {
                title: titleMatch[1],
                category: catMatch ? catMatch[1] : 'Kegiatan Yayasan',
                readTime: '2,5 Menit Baca',
                excerpt: excMatch[1],
                content: cleanJsonStr.replace(/^[^{]*{/, '').replace(/}[^}]*$/, '')
              };
              usedModel = model;
              break;
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || !isAiNewsGenerating) {
        console.log('[Asisten AI Humas] Pembuatan dijeda oleh admin.');
        return; // Exit cleanly on user pause
      }
      console.warn(`[Asisten AI Humas] Model ${model} skipped:`, err);
    }
  }

  if (!isAiNewsGenerating) {
    return; // Exit cleanly if paused
  }

  if (aiNewsProgressInterval) {
    clearInterval(aiNewsProgressInterval);
    aiNewsProgressInterval = null;
  }
  isAiNewsGenerating = false;

  // Fallback to offline generator if API unreachable
  if (!draftResult) {
    draftResult = generateOfflineHumasNewsDraft(topic, eventName, scale, date, location, unit, tone, participants, points);
    usedModel = 'Generator Cerdas Humas (Lokal)';
  }

  // Set progress to 100%
  updateCapsule(100, '✓ Selesai! Naskah Warta Humas Berhasil Dirumuskan', 'Naskah siap ditinjau dan diterapkan.');

  setTimeout(() => {
    if (loadingBox) loadingBox.style.display = 'none';
  }, 700);

  // Display result in Right Column
  const placeholder = document.getElementById('aiDraftPlaceholder');
  const resultCard = document.getElementById('aiDraftResultCard');
  const badge = document.getElementById('aiDraftWordCountBadge');

  const resTitle = document.getElementById('aiResultTitle');
  const resCat = document.getElementById('aiResultCategory');
  const resReadTime = document.getElementById('aiResultReadTime');
  const resExcerpt = document.getElementById('aiResultExcerpt');
  const resContent = document.getElementById('aiResultContent');
  const charInfo = document.getElementById('aiResultCharInfo');

  if (resTitle) resTitle.value = draftResult.title || topic;
  if (resCat) resCat.value = draftResult.category || 'Kegiatan Yayasan';
  if (resReadTime) resReadTime.value = draftResult.readTime || '2,5 Menit Baca';
  if (resExcerpt) resExcerpt.value = draftResult.excerpt || '';
  if (resContent) resContent.value = draftResult.content || '';

  const totalWords = (draftResult.content || '').trim().split(/\s+/).filter(Boolean).length;

  if (badge) {
    badge.style.display = 'inline-block';
    badge.textContent = `${totalWords} Kata (~2,5 Menit Baca)`;
  }
  if (charInfo) {
    charInfo.textContent = `${totalWords} Kata (2,5 Menit Baca)`;
  }

  if (placeholder) placeholder.style.display = 'none';
  if (resultCard) resultCard.style.display = 'flex';

  if (btn) btn.disabled = false;
  if (spinner) spinner.style.display = 'none';
  if (btnText) btnText.textContent = '✨ Susun Ulang Narasi Warta';
  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#059669';
    statusMsg.textContent = `✓ Naskah luwes berhasil diracik (${usedModel.includes('Lokal') ? 'Generator Cerdas Humas' : 'Mesin Cerdas Warta'} • ${totalWords} kata). Klik "Terapkan ke Formulir Berita" untuk menggunakan.`;
  }
};



/* --- TAB 3.5: AGENDA & KALENDER KEGIATAN SANTRI (CRUD) --- */
function renderTabAgenda(db, container) {
  if (!db.agenda) db.agenda = [];
  container.innerHTML = `
    <div class="admin-card" style="padding:18px 22px; border:1.5px solid #CBD5E1; background:#FFFFFF;">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:1.08rem; font-weight:800; color:#0A2540;">Daftar Agenda & Kalender Santri</h3>
            <span style="font-size:0.72rem; font-weight:800; background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px; border:1px solid #BFDBFE;">${db.agenda.length} Agenda</span>
          </div>
          <p style="margin:2px 0 0; font-size:0.78rem; color:#64748B;">Kelola jadwal kegiatan berkala, pengajian akbar, ujian santri, dan pembukaan pendaftaran.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalAgenda()" style="font-size:0.78rem; font-weight:700; padding:6px 14px; display:inline-flex; align-items:center; gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Tambah Agenda Baru</span>
        </button>
      </div>

      <!-- Desktop View: Sleek High-Density Agenda Table -->
      <div class="desktop-only-table" style="overflow-x:auto;">
        <table class="admin-table table-compact">
          <thead>
            <tr>
              <th style="width:85px; text-align:center;">Tanggal</th>
              <th style="min-width:220px;">Judul Agenda & Kategori</th>
              <th style="min-width:200px;">Waktu & Lokasi</th>
              <th style="width:130px; text-align:center;">Status</th>
              <th style="width:130px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${db.agenda.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748B;">Belum ada agenda kegiatan yang dijadwalkan.</td></tr>' : ''}
            ${db.agenda.map((item, index) => {
              let statusStyle = 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;';
              let dotColor = '#3B82F6';
              if (item.status === 'Sedang Berlangsung') {
                statusStyle = 'background:#FEF3C7; color:#92400E; border:1px solid #FCD34D;';
                dotColor = '#F59E0B';
              } else if (item.status === 'Selesai') {
                statusStyle = 'background:#F1F5F9; color:#475569; border:1px solid #CBD5E1;';
                dotColor = '#94A3B8';
              }

              return `
                <tr>
                  <td style="vertical-align:middle; text-align:center;">
                    <div style="display:inline-block; text-align:center; background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:8px; overflow:hidden; width:62px; box-shadow:0 2px 5px rgba(10,37,64,0.05);">
                      <div style="background:#0A2540; color:#FBBF24; font-size:0.62rem; font-weight:800; padding:2px 3px; text-transform:uppercase; letter-spacing:0.04em;">
                        ${item.dateMonth || 'Bln'} ${item.dateYear || '2026'}
                      </div>
                      <div style="font-size:1.25rem; font-weight:900; color:#0A2540; padding:3px 0 2px; line-height:1;">
                        ${item.dateDay || '01'}
                      </div>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                      <strong style="color:#0A2540; font-size:0.86rem; font-weight:800; line-height:1.25;">${item.title}</strong>
                      <span style="font-size:0.68rem; font-weight:700; padding:1px 7px; border-radius:4px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;">${item.category || 'Umum'}</span>
                    </div>
                    ${item.desc ? `<small style="color:#64748B; font-size:0.74rem; display:block; margin-top:3px; line-height:1.3;">${item.desc}</small>` : ''}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="display:inline-flex; align-items:center; gap:4px; font-weight:700; font-size:0.78rem; color:#0A2540;">
                      <span style="font-size:0.82rem;">⏰</span>
                      <span>${item.timeRange || '-'}</span>
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:4px; font-size:0.74rem; color:#475569; margin-top:2px;">
                      <span style="color:#EF4444; font-size:0.8rem; flex-shrink:0;">📍</span>
                      <span style="line-height:1.3;">${item.location || '-'}</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle; text-align:center;">
                    <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:4px; ${statusStyle}">
                      <span style="width:6px; height:6px; border-radius:50%; background:${dotColor};"></span>
                      <span>${item.status || 'Mendatang'}</span>
                    </span>
                  </td>
                  <td style="text-align:center; vertical-align:middle;">
                    <div style="display:inline-flex; gap:4px;">
                      <button type="button" class="btn-action-edit" onclick="openModalAgenda(${index})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px; display:inline-flex; align-items:center; gap:3px;" title="Ubah Agenda">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Edit</span>
                      </button>
                      <button type="button" class="btn-action-delete" onclick="deleteAgenda(${index})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px; display:inline-flex; align-items:center; gap:3px;" title="Hapus Agenda">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile View: Modern Stacked Agenda Cards (Optimized for Smartphones) -->
      <div class="mobile-leads-list">
        ${db.agenda.length === 0 ? '<div style="text-align:center; padding:18px; color:#64748B; font-size:0.8rem;">Belum ada agenda kegiatan yang dijadwalkan.</div>' : ''}
        ${db.agenda.map((item, index) => {
          let statusStyle = 'background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;';
          let dotColor = '#3B82F6';
          if (item.status === 'Sedang Berlangsung') {
            statusStyle = 'background:#FEF3C7; color:#92400E; border:1px solid #FCD34D;';
            dotColor = '#F59E0B';
          } else if (item.status === 'Selesai') {
            statusStyle = 'background:#F1F5F9; color:#475569; border:1px solid #CBD5E1;';
            dotColor = '#94A3B8';
          }

          return `
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:6px; padding:12px; box-shadow:0 2px 6px rgba(10,37,64,0.04);">
              <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:8px;">
                <div style="text-align:center; background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:8px; overflow:hidden; width:54px; flex-shrink:0; box-shadow:0 2px 4px rgba(10,37,64,0.05);">
                  <div style="background:#0A2540; color:#FBBF24; font-size:0.58rem; font-weight:800; padding:2px; text-transform:uppercase;">
                    ${item.dateMonth || 'Bln'}
                  </div>
                  <div style="font-size:1.15rem; font-weight:900; color:#0A2540; padding:2px 0 1px; line-height:1;">
                    ${item.dateDay || '01'}
                  </div>
                </div>
                <div style="flex-grow:1; overflow:hidden;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                    <strong style="color:#0A2540; font-size:0.84rem; line-height:1.25;">${item.title}</strong>
                    <span style="font-size:0.65rem; font-weight:700; padding:1px 6px; border-radius:4px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; flex-shrink:0;">${item.category || 'Umum'}</span>
                  </div>
                  <div style="font-size:0.72rem; color:#475569; margin-top:4px;">⏰ ${item.timeRange || '-'}</div>
                  <div style="font-size:0.72rem; color:#64748B;">📍 ${item.location || '-'}</div>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E2E8F0; padding-top:8px; margin-top:6px;">
                <span style="display:inline-flex; align-items:center; gap:4px; font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:4px; ${statusStyle}">
                  <span style="width:5px; height:5px; border-radius:50%; background:${dotColor};"></span>
                  <span>${item.status || 'Mendatang'}</span>
                </span>
                <div style="display:inline-flex; gap:4px;">
                  <button type="button" class="btn-action-edit" onclick="openModalAgenda(${index})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px;">Edit</button>
                  <button type="button" class="btn-action-delete" onclick="deleteAgenda(${index})" style="padding:4px 8px; font-size:0.72rem; border-radius:6px;">Hapus</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.openModalAgenda = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const item = isEdit ? db.agenda[editIndex] : {
    title: '',
    category: 'Akademik',
    dateDay: '15',
    dateMonth: 'Okt',
    dateYear: '2026',
    timeRange: '08.00 - 12.00 WIB',
    location: 'Aula Utama & Mushola Pondok Pesantren Putra Raudlatul Muta\'allimin',
    desc: '',
    status: 'Mendatang'
  };

  openAdminModal(isEdit ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Baru', `
    <form onsubmit="saveAgenda(event, ${editIndex})">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Judul Agenda Kegiatan *</label>
        <input type="text" id="agendaTitle" class="form-input" value="${item.title}" required placeholder="Contoh: Haflah Akhirussanah & Wisuda Santri">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Kategori Agenda *</label>
          <select id="agendaCategory" class="form-input" required>
            <option value="Akademik" ${item.category === 'Akademik' ? 'selected' : ''}>Akademik & Ujian</option>
            <option value="Keagamaan" ${item.category === 'Keagamaan' ? 'selected' : ''}>Keagamaan & Pengajian</option>
            <option value="Kepesantrenan" ${item.category === 'Kepesantrenan' ? 'selected' : ''}>Kepesantrenan</option>
            <option value="PPDB" ${item.category === 'PPDB' ? 'selected' : ''}>PPDB & Santri Baru</option>
            <option value="Organisasi" ${item.category === 'Organisasi' ? 'selected' : ''}>Organisasi Santri</option>
            <option value="Umum" ${item.category === 'Umum' ? 'selected' : ''}>Umum & Silaturahmi</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status Pelaksanaan *</label>
          <select id="agendaStatus" class="form-input" required>
            <option value="Mendatang" ${item.status === 'Mendatang' ? 'selected' : ''}>Mendatang</option>
            <option value="Sedang Berlangsung" ${item.status === 'Sedang Berlangsung' ? 'selected' : ''}>Sedang Berlangsung</option>
            <option value="Selesai" ${item.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1.5fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Tanggal (Hari) *</label>
          <input type="text" id="agendaDay" class="form-input" value="${item.dateDay}" required placeholder="Contoh: 15">
        </div>
        <div class="form-group">
          <label class="form-label">Bulan (3-4 Huruf) *</label>
          <input type="text" id="agendaMonth" class="form-input" value="${item.dateMonth}" required placeholder="Contoh: Okt / Nov / Des">
        </div>
        <div class="form-group">
          <label class="form-label">Tahun *</label>
          <input type="text" id="agendaYear" class="form-input" value="${item.dateYear}" required placeholder="Contoh: 2026">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Waktu Pelaksanaan *</label>
          <input type="text" id="agendaTime" class="form-input" value="${item.timeRange}" required placeholder="Contoh: 08.00 - Selesai WIB">
        </div>
        <div class="form-group">
          <label class="form-label">Lokasi Kegiatan *</label>
          <input type="text" id="agendaLocation" class="form-input" value="${item.location}" required placeholder="Contoh: Mushola Pondok Pesantren Putra / Gedung Asrama">
        </div>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Keterangan / Rincian Kegiatan *</label>
        <textarea id="agendaDesc" class="form-textarea" rows="4" required placeholder="Jelaskan ringkasan acara, peserta yang diharapkan hadir, dan perlengkapan yang perlu disiapkan...">${item.desc || ''}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Agenda</button>
      </div>
    </form>
  `);
};

window.saveAgenda = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.agenda) db.agenda = [];

  const newObj = {
    id: editIndex !== null ? db.agenda[editIndex].id : 'evt-' + Date.now(),
    title: document.getElementById('agendaTitle').value,
    category: document.getElementById('agendaCategory').value,
    dateDay: document.getElementById('agendaDay').value,
    dateMonth: document.getElementById('agendaMonth').value,
    dateYear: document.getElementById('agendaYear').value,
    timeRange: document.getElementById('agendaTime').value,
    location: document.getElementById('agendaLocation').value,
    desc: document.getElementById('agendaDesc').value,
    status: document.getElementById('agendaStatus').value
  };

  if (editIndex !== null) {
    db.agenda[editIndex] = newObj;
  } else {
    db.agenda.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteAgenda = function(index) {
  if (confirm('Hapus agenda kegiatan ini?')) {
    const db = getDB();
    if (db.agenda) {
      db.agenda.splice(index, 1);
      saveDB(db);
      loadCurrentTab();
    }
  }
};

/* --- TAB 4: SATUAN PENDIDIKAN FORMAL (7 UNIT KB–SMA) --- */
let unitFilterId = 'all';

window.filterUnitBy = function(unitId) {
  unitFilterId = unitId;
  renderTabUnits(getDB(), document.getElementById('adminContentArea'));
};

window.openUnitSpecific = function(unitId) {
  currentTab = 'units';
  unitFilterId = unitId;
  window.switchToTab('units');
};

function renderTabUnits(db, container) {
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const isUnitAdmin = activeUser && activeUser.role && activeUser.role.startsWith('unit_');
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';

  const allUnits = db.units || [];
  
  if (isUnitAdmin && userUnitId) {
    unitFilterId = userUnitId;
  }

  const displayUnits = isUnitAdmin
    ? allUnits.filter(u => u.id.toLowerCase() === userUnitId || u.id.toLowerCase().includes(userUnitId))
    : (unitFilterId === 'all' ? allUnits : allUnits.filter(u => u.id === unitFilterId));

  const currentUnit = displayUnits[0] || (isUnitAdmin ? allUnits.find(u => u.id.toLowerCase().includes(userUnitId)) : null);

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.18rem; color:#0A2540;">
            ${isUnitAdmin && currentUnit ? `Manajemen Satuan Pendidikan: ${currentUnit.name}` : `Daftar Satuan Pendidikan Formal (${allUnits.length} Unit)`}
          </h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">
            ${isUnitAdmin && currentUnit ? `Kelola rincian profil, akreditasi, kepala madrasah/sekolah, kuota, jam belajar, program unggulan, fasilitas, dan galeri khusus ${currentUnit.name}.` : 'Kelola rincian profil, akreditasi, kepala madrasah/sekolah, kuota, jam belajar, program unggulan, fasilitas, dan galeri per unit.'}
          </p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <a href="unit.html" target="_blank" class="btn btn-outline btn-sm" style="font-weight:700;">
            👁️ Lihat Halaman Satuan Pendidikan ↗
          </a>
          ${isSuperAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="openModalUnit()" style="font-weight:700;">
              + Tambah Satuan Baru
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Cepat Per Unit / Hak Kelola Badge -->
      ${isUnitAdmin ? `
        <div style="margin-bottom:20px; padding:10px 14px; background:#EFF6FF; border:1.5px solid #BFDBFE; border-radius:6px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:inline-flex; align-items:center; gap:8px; font-size:0.85rem; color:#1E40AF;">
            <span>🏢 <strong>Hak Kelola Satuan:</strong></span>
            <span style="background:#FFF; color:#0A2540; font-weight:800; padding:3px 10px; border-radius:6px; border:1px solid #CBD5E1;">${currentUnit ? currentUnit.name : activeUser.roleName}</span>
          </div>
          <span style="font-size:0.75rem; font-weight:700; background:#DBEAFE; color:#1D4ED8; padding:3px 10px; border-radius:4px; border:1px solid #BFDBFE;">
            🔒 Akses Khusus ${activeUser.roleName || 'Unit Terpilih'}
          </span>
        </div>
      ` : `
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:20px; padding:10px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px;">
          <span style="font-size:0.8rem; font-weight:700; color:#475569; margin-right:4px;">Pilih Unit:</span>
          <button class="btn btn-sm ${unitFilterId === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="filterUnitBy('all')" style="padding:4px 10px; font-size:0.78rem;">
            Semua (${allUnits.length} Unit)
          </button>
          ${allUnits.map(u => `
            <button class="btn btn-sm ${unitFilterId === u.id ? 'btn-primary' : 'btn-outline'}" onclick="filterUnitBy('${u.id}')" style="padding:4px 10px; font-size:0.78rem;">
              ${u.name.replace('Raudlatul Muta\'allimin', '').trim() || u.name}
            </button>
          `).join('')}
        </div>
      `}

      <!-- Grid Kartu Satuan Pendidikan -->
      <div class="admin-unit-grid" style="${isUnitAdmin ? 'grid-template-columns: minmax(320px, 680px);' : ''}">
        ${displayUnits.map((u) => {
          const originalIndex = allUnits.findIndex(item => item.id === u.id);
          const progs = u.programs || [];
          const facilities = u.facilities || [];
          const gallery = u.gallery || [];

          return `
            <div class="admin-unit-card">
              <div class="admin-unit-cover">
                <img src="${u.image || 'assets/pesantren_gedung.jpg'}" alt="${u.name}" onerror="this.src='assets/pesantren_gedung.jpg'">
                <div class="admin-unit-badges">
                  <span class="admin-unit-badge-pill" style="background:rgba(10,37,64,0.85); color:#FBBF24; border:1px solid rgba(251,191,36,0.3);">
                    ${u.category}
                  </span>
                  <span class="admin-unit-badge-pill" style="background:rgba(5,150,105,0.9); color:#FFFFFF;">
                    ${u.accreditation || 'Terakreditasi'}
                  </span>
                </div>
              </div>

              <div class="admin-unit-body">
                <h4 class="admin-unit-title">${u.name}</h4>
                <p class="admin-unit-desc">${u.shortDesc || ''}</p>

                <div class="admin-unit-meta-grid">
                  <div class="admin-unit-meta-item">
                    <span class="label">Kepala Madrasah/Sekolah</span>
                    <span class="val">${u.headmaster || '-'}</span>
                  </div>
                  <div class="admin-unit-meta-item">
                    <span class="label">Kuota / Rombel</span>
                    <span class="val">${u.quota || '-'}</span>
                  </div>
                  <div class="admin-unit-meta-item" style="grid-column:1/-1;">
                    <span class="label">Waktu Belajar</span>
                    <span class="val" style="color:#0F4C81;">⏰ ${u.studyTime || 'Full Day & Pesantren'}</span>
                  </div>
                </div>

                <div style="margin-bottom:8px;">
                  <span style="font-size:0.72rem; font-weight:700; color:#475569; text-transform:uppercase;">Program Unggulan:</span>
                  <div class="admin-unit-progs" style="margin-top:4px;">
                    ${progs.slice(0, 3).map(p => `<span class="admin-unit-prog-chip">${p}</span>`).join('')}
                    ${progs.length > 3 ? `<span class="admin-unit-prog-chip" style="background:#F1F5F9; color:#64748B;">+${progs.length - 3} Lainnya</span>` : ''}
                  </div>
                </div>

                <div class="admin-unit-footer">
                  <div style="font-size:0.75rem; color:#64748B;">
                    📸 <strong>${gallery.length}</strong> Foto Galeri
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="btn btn-outline btn-sm" onclick="openUnitGalleryModal(${originalIndex})" style="padding:4px 8px; font-size:0.75rem;" title="Kelola Galeri Foto Unit">
                      📸 Galeri
                    </button>
                    <button type="button" class="btn-action-edit" onclick="openModalUnit(${originalIndex})" title="Edit Rincian Unit">
                      ✏️ Edit
                    </button>
                    ${isSuperAdmin ? `
                      <button type="button" class="btn-action-delete" onclick="deleteUnit(${originalIndex})" title="Hapus Unit">
                        🗑️
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

window.openModalUnit = function(editIndex = null) {
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const isUnitAdmin = activeUser && activeUser.role && activeUser.role.startsWith('unit_');
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';

  if (isUnitAdmin && editIndex !== null) {
    const targetUnit = db.units[editIndex];
    if (targetUnit && targetUnit.id.toLowerCase() !== userUnitId && !targetUnit.id.toLowerCase().includes(userUnitId)) {
      alert('Akses Ditolak: Anda hanya berwenang mengedit unit Anda sendiri.');
      return;
    }
  }

  if (isUnitAdmin && editIndex === null) {
    alert('Akses Ditolak: Hanya Super Admin yang dapat menambahkan satuan pendidikan baru.');
    return;
  }

  const isEdit = editIndex !== null;
  const u = isEdit ? db.units[editIndex] : {
    id: 'unit-' + Date.now(),
    name: '',
    category: 'Madrasah Tsanawiyah (MTs)',
    shortDesc: '',
    fullDesc: '',
    image: 'assets/pesantren_gedung.jpg',
    accreditation: 'Akreditasi A Unggul',
    headmaster: 'Ustadz / Kepala Sekolah, M.Pd',
    quota: '4 Rombel (120 Siswa)',
    studyTime: 'Full Day & Boarding (07.00 - 14.30 WIB)',
    programs: ['Tahfidz Al-Qur\'an Bersanad', 'Klub Sains & Olimpiade', 'Bahasa Arab & Inggris Aktif'],
    facilities: ['Ruang Kelas AC', 'Laboratorium Komputer', 'Perpustakaan Digital', 'Mushola Pondok Pesantren Putra (Utama)'],
    extracurriculars: ['Pramuka Garuda', 'Hadrah Banjari', 'Klub Olahraga Santri', 'KIR']
  };

  openAdminModal(isEdit ? `Edit Rincian Unit: ${u.name}` : 'Tambah Satuan Pendidikan Baru', `
    <form onsubmit="saveUnit(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:2fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap Satuan Pendidikan *</label>
          <input type="text" id="unitName" class="form-input" value="${u.name}" placeholder="Contoh: MTs Raudlatul Muta'allimin" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kode / ID Unit (Unik) *</label>
          <input type="text" id="unitId" class="form-input" value="${u.id || ''}" placeholder="contoh: mts" ${isEdit || isUnitAdmin ? 'readonly style="background:#F1F5F9;"' : 'required'}>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Kategori / Jenjang *</label>
          <input type="text" id="unitCat" class="form-input" value="${u.category}" placeholder="Contoh: Madrasah Tsanawiyah (MTs)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Status Akreditasi *</label>
          <input type="text" id="unitAccred" class="form-input" value="${u.accreditation}" placeholder="Contoh: Akreditasi A Unggul" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kepala Madrasah / Sekolah *</label>
          <input type="text" id="unitHeadmaster" class="form-input" value="${u.headmaster || ''}" placeholder="Nama & Gelar Kepala" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Kuota Santri / Rombel *</label>
          <input type="text" id="unitQuota" class="form-input" value="${u.quota || ''}" placeholder="Contoh: 4 Rombel (120 Siswa)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jam & Pola Belajar *</label>
          <input type="text" id="unitStudyTime" class="form-input" value="${u.studyTime || ''}" placeholder="Contoh: Full Day & Boarding (07.00 - 14.30 WIB)" required>
        </div>
      </div>

      <!-- Smart Image Uploader with Auto-Compressor & Crop Studio -->
      ${renderImageUploadWidget('unitImg', 'Foto Sampul Satuan Pendidikan', u.image || 'assets/pesantren_gedung.jpg', 1200, 'landscape')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Singkat (Tampil di Kartu Beranda & Overview) *</label>
        <input type="text" id="unitShort" class="form-input" value="${u.shortDesc || ''}" placeholder="1-2 kalimat ringkasan keunggulan unit..." required>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Lengkap & Kurikulum Pembelajaran *</label>
        <textarea id="unitFull" class="form-textarea" rows="3" required>${u.fullDesc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Daftar Program Unggulan (Pisahkan dengan koma atau baris baru) *</label>
        <textarea id="unitProgs" class="form-textarea" rows="2" placeholder="Program 1, Program 2, Program 3" required>${(u.programs || []).join(', ')}</textarea>
      </div>

      <!-- Field Sambutan & Amanah Kepala Sekolah -->
      <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-left:4px solid #C59B27; border-radius:10px; padding:14px; margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="font-size:1.1rem;">🎙️</span>
          <div>
            <h4 style="margin:0; font-size:0.88rem; font-weight:800; color:#0A2540;">Amanah & Sambutan Kepala Satuan Pendidikan</h4>
            <p style="margin:0; font-size:0.73rem; color:#64748B;">Akan ditampilkan di tab resmi & plakat sambutan profil satuan pendidikan</p>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          ${renderImageUploadWidget('unitHeadmasterPhoto', 'Foto Resmi Kepala Sekolah (Format Potret 3:4)', u.headmasterPhoto || 'assets/pesantren_gedung.jpg', 800, 'portrait', '3:4', '600 × 800 px')}
        </div>

        <div class="form-group" style="margin-bottom:10px;">
          <label class="form-label">Tema / Judul Sambutan Kepala Sekolah</label>
          <input type="text" id="unitHeadmasterSpeechTitle" class="form-input" value="${u.headmasterSpeechTitle || ''}" placeholder="Contoh: Merawat Fitrah, Menumbuhkan Kasih Sayang & Adab Sejak Dini">
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Naskah Lengkap Sambutan Kepala Sekolah</label>
          <textarea id="unitHeadmasterSpeech" class="form-textarea" rows="4" placeholder="Tuliskan naskah sambutan, visi, dan pesan kepala sekolah...">${u.headmasterSpeech || ''}</textarea>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group">
          <label class="form-label">Fasilitas Khusus Unit (Pisahkan dengan koma)</label>
          <input type="text" id="unitFacilities" class="form-input" value="${(u.facilities || []).join(', ')}" placeholder="Lab Komputer, Lapangan, AC, dll.">
        </div>
        <div class="form-group">
          <label class="form-label">Ekstrakurikuler Unit (Pisahkan dengan koma)</label>
          <input type="text" id="unitExtracurriculars" class="form-input" value="${(u.extracurriculars || []).join(', ')}" placeholder="Pramuka, Banjari, Futsal, dll.">
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Perubahan Unit' : 'Tambahkan Satuan Pendidikan'}</button>
      </div>
    </form>
  `);
};

window.saveUnit = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const isUnitAdmin = activeUser && activeUser.role && activeUser.role.startsWith('unit_');
  const userUnitId = (activeUser && activeUser.unitId) ? activeUser.unitId.toLowerCase() : '';

  if (isUnitAdmin && editIndex !== null) {
    const targetUnit = db.units[editIndex];
    if (targetUnit && targetUnit.id.toLowerCase() !== userUnitId && !targetUnit.id.toLowerCase().includes(userUnitId)) {
      alert('Akses Ditolak: Anda hanya berwenang mengedit unit Anda sendiri.');
      return;
    }
  }

  const progs = document.getElementById('unitProgs').value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  const facs = document.getElementById('unitFacilities').value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  const extras = document.getElementById('unitExtracurriculars').value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  const existing = editIndex !== null ? db.units[editIndex] : {};

  const headmasterPhotoInput = document.getElementById('unitHeadmasterPhoto');
  const speechTitleInput = document.getElementById('unitHeadmasterSpeechTitle');
  const speechInput = document.getElementById('unitHeadmasterSpeech');

  const newObj = {
    ...existing,
    id: editIndex !== null ? db.units[editIndex].id : (document.getElementById('unitId').value.trim().toLowerCase() || 'unit-' + Date.now()),
    name: document.getElementById('unitName').value.trim(),
    category: document.getElementById('unitCat').value.trim(),
    accreditation: document.getElementById('unitAccred').value.trim(),
    headmaster: document.getElementById('unitHeadmaster').value.trim(),
    headmasterPhoto: headmasterPhotoInput ? headmasterPhotoInput.value.trim() : (existing.headmasterPhoto || ''),
    headmasterSpeechTitle: speechTitleInput ? speechTitleInput.value.trim() : (existing.headmasterSpeechTitle || ''),
    headmasterSpeech: speechInput ? speechInput.value.trim() : (existing.headmasterSpeech || ''),
    quota: document.getElementById('unitQuota').value.trim(),
    studyTime: document.getElementById('unitStudyTime').value.trim(),
    image: document.getElementById('unitImg').value.trim() || 'assets/pesantren_gedung.jpg',
    shortDesc: document.getElementById('unitShort').value.trim(),
    fullDesc: document.getElementById('unitFull').value.trim(),
    programs: progs,
    facilities: facs,
    extracurriculars: extras,
    gallery: existing.gallery || []
  };

  if (editIndex !== null) {
    db.units[editIndex] = newObj;
  } else {
    db.units.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteUnit = function(index) {
  const activeUser = getActiveAdminUser();
  if (activeUser && activeUser.role !== 'superadmin') {
    alert('Akses Ditolak: Hanya Super Admin yang berwenang menghapus satuan pendidikan.');
    return;
  }
  if (confirm('Yakin ingin menghapus satuan pendidikan ini? Data profil dan galeri unit akan dihapus.')) {
    const db = getDB();
    db.units.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* Modal Kelola Galeri Foto Unit Spesifik */
window.openUnitGalleryModal = function(unitIndex) {
  const db = getDB();
  const u = db.units[unitIndex];
  if (!u) return;
  const gallery = u.gallery || [];

  openAdminModal(`Galeri Foto: ${u.name} (${gallery.length} Foto)`, `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <p style="margin:0; font-size:0.85rem; color:#64748B;">Foto dokumentasi kegiatan belajar, fasilitas, dan prestasi khusus ${u.name}.</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAddUnitPhotoModal(${unitIndex})">+ Tambah Foto Unit</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:90px;">Foto</th>
            <th>Keterangan / Caption Foto</th>
            <th style="width:110px; text-align:center;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${gallery.length === 0 ? `
            <tr><td colspan="3" style="text-align:center; color:#94A3B8; padding:24px;">Belum ada foto galeri untuk unit ini.</td></tr>
          ` : gallery.map((p, pIdx) => `
            <tr>
              <td>
                <img src="${p.src}" alt="${p.caption || ''}" style="width:75px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0;">
              </td>
              <td>
                <strong style="color:#1E293B; font-size:0.9rem;">${p.caption || 'Tanpa Keterangan'}</strong>
                <div style="font-size:0.75rem; color:#64748B; word-break:break-all;">${p.src.slice(0, 50)}...</div>
              </td>
              <td style="text-align:center;">
                <button type="button" class="btn-action-delete" onclick="deleteUnitPhoto(${unitIndex}, ${pIdx})" title="Hapus Foto">Hapus</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `);
};

window.openAddUnitPhotoModal = function(unitIndex) {
  const db = getDB();
  const u = db.units[unitIndex];
  if (!u) return;

  openAdminModal(`Tambah Foto Galeri: ${u.name}`, `
    <form onsubmit="saveUnitPhoto(event, ${unitIndex})">
      ${renderImageUploadWidget('unitPhotoSrc', `Foto Kegiatan / Fasilitas ${u.name}`, 'assets/pesantren_gedung.jpg', 1200, 'landscape')}
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Keterangan / Caption Foto *</label>
        <input type="text" id="unitPhotoCaption" class="form-input" placeholder="Contoh: Suasana Pembelajaran Interaktif di Kelas Multimedia" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="openUnitGalleryModal(${unitIndex})">Kembali ke Galeri</button>
        <button type="submit" class="btn btn-primary btn-sm">Tambahkan ke Galeri</button>
      </div>
    </form>
  `);
};

window.saveUnitPhoto = function(e, unitIndex) {
  e.preventDefault();
  const db = getDB();
  const u = db.units[unitIndex];
  if (!u) return;
  if (!u.gallery) u.gallery = [];

  const newPhoto = {
    src: document.getElementById('unitPhotoSrc').value.trim() || 'assets/pesantren_gedung.jpg',
    caption: document.getElementById('unitPhotoCaption').value.trim()
  };

  u.gallery.push(newPhoto);
  saveDB(db);
  openUnitGalleryModal(unitIndex);
};

window.deleteUnitPhoto = function(unitIndex, photoIndex) {
  if (confirm('Hapus foto ini dari galeri unit?')) {
    const db = getDB();
    if (db.units[unitIndex] && db.units[unitIndex].gallery) {
      db.units[unitIndex].gallery.splice(photoIndex, 1);
      saveDB(db);
      openUnitGalleryModal(unitIndex);
    }
  }
};

/* --- TAB 4B: PONDOK PESANTREN PUTRA & PUTRI (MUKIM ASRAMA 24 JAM) --- */
function renderTabBoarding(db, container) {
  const wings = db.boardingWings || [
    {
      id: "ponpes-putra",
      name: "Pondok Pesantren Putra Raudlatul Muta'allimin",
      category: "Asrama Santri Putra (Mukim)",
      shortDesc: "Asrama santri putra dengan pembinaan disiplin 24 jam, tahfidzul Qur'an bersanad, dan kajian kitab kuning salaf.",
      fullDesc: "Kompleks Pondok Pesantren Khusus Putra yang menaungi santri dari berbagai penjuru daerah. Diasuh langsung oleh Masyayikh dan Dewan Asatidz dengan sistem asrama 24 jam yang tertib dan mandiri. Menyelenggarakan program tahfidzul Qur'an, mudzakarah kitab kuning turats salafiyah, pembiasaan sholat fardhu berjamaah di Mushola Pondok Pesantren Putra (mushola utama pesantren & pusat ngaji bersama alumni), bahasa Arab aktif, serta pembentukan karakter kepemimpinan muslim tangguh.",
      image: "assets/hero_santri.jpg",
      programs: ["Tahfidzul Qur'an 30 Juz Bersanad", "Kajian Kitab Kuning Turats Salaf", "Asrama Disiplin 24 Jam Mandiri", "Halaqah Mudzakarah & Bahsul Masail"],
      accreditation: "Pondok Pesantren Mu'adalah Kemenag",
      headmaster: "Dewan Pengasuh & Masyayikh YTPAI",
      quota: "Kapasitas 1.500 Santri Mukim",
      studyTime: "Pondok Pesantren 24 Jam",
      facilities: ["Gedung Asrama Putra Bertingkat", "Mushola Pondok Pesantren Putra (Utama)", "Dapur Umum & Katering Bersih", "Klinik Pratama Santri 24 Jam", "Kantin & Koperasi Pondok"],
      extracurriculars: ["Kajian Ba'da Subuh & Maghrib", "Tahfidz 30 Juz Bersanad", "Latihan Khitobah 3 Bahasa", "Ro'an Kebersihan & Bakti Lingkungan", "Klub Olahraga Santri (Futsal & Voli)"],
      gallery: [
        { src: "assets/hero_santri.jpg", caption: "Kehidupan Disiplin Santri Pondok Putra" },
        { src: "assets/program_4_kitab.jpg", caption: "Sorogan & Bandongan Kitab Salaf Ba'da Subuh" }
      ]
    },
    {
      id: "ponpes-putri",
      name: "Pondok Pesantren Putri Raudlatul Muta'allimin",
      category: "Asrama Santriwati Putri (Mukim)",
      shortDesc: "Asrama santriwati aman, nyaman, dan terjaga syar'i. Fokus pada tahfidzul Qur'an, fiqih wanita (nisaiyyah), dan adab salaf.",
      fullDesc: "Kompleks Pondok Pesantren Khusus Putri yang dirancang khusus dengan tata ruang asri, aman, dan privasi tertutup (syar'i) dengan penjagaan 24 jam. Dilengkapi sarana ibadah Mushola Pondok Pesantren Putri yang bersifat eksklusif khusus santriwati mukim. Diasuh oleh Ibu Nyai dan Dewan Asatidzah berkompeten dalam mencetak santriwati hafidzah Al-Qur'an, mutafaqqihah fiddin, menguasai fiqih wanita (nisaiyyah), berakhlaqul karimah, serta memiliki keterampilan tata boga dan seni keputrian.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      programs: ["Tahfidzatil Qur'an Khusus Putri", "Kajian Fiqih Wanita (Nisaiyyah)", "Pembinaan Adab & Karakter Muslimah", "Klub Seni Hadrah Banjari & Tata Boga"],
      accreditation: "Pondok Pesantren Mu'adalah Kemenag",
      headmaster: "Ibu Nyai & Dewan Asatidzah YTPAI",
      quota: "Kapasitas 1.000 Santriwati Mukim",
      studyTime: "Pondok Pesantren Putri 24 Jam",
      facilities: ["Kompleks Asrama Putri Terjaga Syar'i", "Mushola Pondok Pesantren Putri (Eksklusif)", "Dapur Higienis & Ruang Tata Boga", "Taman Asri & Area Jemur Tertutup", "Poskestren Khusus Santriwati"],
      extracurriculars: ["Tahfidzatil Qur'an Khusus Putri", "Fiqih Wanita & Bimbingan Keputrian", "Seni Hadrah Banjari Santriwati", "Kursus Tata Boga & Kerajinan Tangan", "Klub Muhadatsah Arab-Inggris"],
      gallery: [
        { src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "Suasana Asrama Santriwati Putri Terjaga Syar'i" },
        { src: "assets/program_1_tahfidz.jpg", caption: "Halaqah Tahfidzatil Qur'an Khusus Santriwati" }
      ]
    }
  ];

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.18rem; color:#0A2540;">Pondok Pesantren Putra & Putri (2 Kompleks Asrama Mukim)</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Kelola profil asrama santri putra (Mushola Pondok Putra, kajian kitab turats) dan asrama santriwati putri (terjaga syar'i, tahfidz khusus & fiqih nisaiyyah).</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <a href="unit.html" target="_blank" class="btn btn-outline btn-sm" style="font-weight:700;">
            👁️ Lihat di Website Publik
          </a>
        </div>
      </div>

      <div class="admin-unit-grid">
        ${wings.map((w, idx) => `
          <div class="admin-unit-card">
            <div class="admin-unit-cover" style="height:180px;">
              <img src="${w.image || 'assets/hero_santri.jpg'}" alt="${w.name}" onerror="this.src='assets/hero_santri.jpg'">
              <div class="admin-unit-badges">
                <span class="admin-unit-badge-pill" style="background:rgba(10,37,64,0.9); color:#FBBF24;">
                  ${w.id === 'ponpes-putra' ? '👦 Asrama Santri Putra' : '👧 Asrama Santri Putri'}
                </span>
                <span class="admin-unit-badge-pill" style="background:#059669; color:#FFFFFF;">
                  ${w.quota || 'Mukim 24 Jam'}
                </span>
              </div>
            </div>

            <div class="admin-unit-body">
              <h4 class="admin-unit-title">${w.name}</h4>
              <p class="admin-unit-desc">${w.shortDesc}</p>

              <div class="admin-unit-meta-grid">
                <div class="admin-unit-meta-item">
                  <span class="label">Dewan Pengasuh / Pembina</span>
                  <span class="val">${w.headmaster || 'Masyayikh & Ibu Nyai'}</span>
                </div>
                <div class="admin-unit-meta-item">
                  <span class="label">Sistem Pembinaan</span>
                  <span class="val" style="color:#059669;">24 Jam Disiplin Mandiri</span>
                </div>
              </div>

              <div style="margin-bottom:12px;">
                <span style="font-size:0.72rem; font-weight:700; color:#475569; text-transform:uppercase;">Program Utama Asrama:</span>
                <div class="admin-unit-progs" style="margin-top:4px;">
                  ${(w.programs || []).map(p => `<span class="admin-unit-prog-chip">${p}</span>`).join('')}
                </div>
              </div>

              <div class="admin-unit-footer">
                <div style="font-size:0.75rem; color:#64748B;">
                  📸 <strong>${(w.gallery || []).length}</strong> Foto Galeri Asrama
                </div>
                <button type="button" class="btn-action-edit" onclick="openModalBoarding(${idx})">
                  ✏️ Edit Profil Asrama
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openModalBoarding = function(index) {
  const db = getDB();
  if (!db.boardingWings) {
    db.boardingWings = [
      { id: "ponpes-putra", name: "Pondok Pesantren Putra Raudlatul Muta'allimin", category: "Asrama Santri Putra", shortDesc: "Asrama santri putra disiplin 24 jam...", fullDesc: "Kompleks Pondok Pesantren Khusus Putra...", image: "assets/hero_santri.jpg", headmaster: "Dewan Pengasuh & Masyayikh YTPAI", quota: "Kapasitas 1.500 Santri Mukim", studyTime: "Pondok Pesantren 24 Jam", programs: ["Tahfidzul Qur'an 30 Juz Bersanad", "Kajian Kitab Kuning Turats Salaf"] },
      { id: "ponpes-putri", name: "Pondok Pesantren Putri Raudlatul Muta'allimin", category: "Asrama Santriwati Putri", shortDesc: "Asrama santriwati aman, nyaman, dan terjaga syar'i...", fullDesc: "Kompleks Pondok Pesantren Khusus Putri...", image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", headmaster: "Ibu Nyai & Dewan Asatidzah YTPAI", quota: "Kapasitas 1.000 Santriwati Mukim", studyTime: "Pondok Pesantren Putri 24 Jam", programs: ["Tahfidzatil Qur'an Khusus Putri", "Kajian Fiqih Wanita (Nisaiyyah)"] }
    ];
  }
  const w = db.boardingWings[index];

  openAdminModal(`Edit Asrama: ${w.name}`, `
    <form onsubmit="saveBoardingWing(event, ${index})">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Nama Lengkap Kompleks Asrama *</label>
        <input type="text" id="bwName" class="form-input" value="${w.name}" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Dewan Pengasuh / Pembina *</label>
          <input type="text" id="bwHeadmaster" class="form-input" value="${w.headmaster || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kapasitas Asrama *</label>
          <input type="text" id="bwQuota" class="form-input" value="${w.quota || ''}" required>
        </div>
      </div>
      ${renderImageUploadWidget('bwImg', 'Foto Sampul Kompleks Asrama', w.image || 'assets/hero_santri.jpg', 1200, 'landscape')}
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Singkat *</label>
        <input type="text" id="bwShort" class="form-input" value="${w.shortDesc || ''}" required>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Lengkap & Pola Pengasuhan 24 Jam *</label>
        <textarea id="bwFull" class="form-textarea" rows="3" required>${w.fullDesc || ''}</textarea>
      </div>

      <!-- Field Sambutan & Amanah Musyrif / Pengasuh Asrama -->
      <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-left:4px solid #C59B27; border-radius:10px; padding:14px; margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="font-size:1.1rem;">🎙️</span>
          <div>
            <h4 style="margin:0; font-size:0.88rem; font-weight:800; color:#0A2540;">Amanah & Sambutan Musyrif / Pengasuh Asrama</h4>
            <p style="margin:0; font-size:0.73rem; color:#64748B;">Akan ditampilkan di tab resmi sambutan profil asrama pesantren</p>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          ${renderImageUploadWidget('bwHeadmasterPhoto', 'Foto Resmi Musyrif / Pengasuh (Format Potret 3:4)', w.headmasterPhoto || 'assets/pembimbing_baqir.jpg', 800, 'portrait', '3:4', '600 × 800 px')}
        </div>

        <div class="form-group" style="margin-bottom:10px;">
          <label class="form-label">Tema / Judul Sambutan Musyrif / Pengasuh</label>
          <input type="text" id="bwHeadmasterSpeechTitle" class="form-input" value="${w.headmasterSpeechTitle || ''}" placeholder="Contoh: Menempa Kemandirian, Disiplin Ibadah 24 Jam, dan Penguasaan Turats Ulama Salaf">
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Naskah Lengkap Sambutan Musyrif / Pengasuh</label>
          <textarea id="bwHeadmasterSpeech" class="form-textarea" rows="4" placeholder="Tuliskan naskah sambutan, arahan adab, dan pola pengasuhan santri...">${w.headmasterSpeech || ''}</textarea>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Program Utama (Pisahkan dengan koma) *</label>
        <textarea id="bwProgs" class="form-textarea" rows="2" required>${(w.programs || []).join(', ')}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Profil Asrama</button>
      </div>
    </form>
  `);
};

window.saveBoardingWing = function(e, index) {
  e.preventDefault();
  const db = getDB();
  if (!db.boardingWings) db.boardingWings = [];
  const progs = document.getElementById('bwProgs').value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

  const prev = db.boardingWings[index] || {};
  db.boardingWings[index] = {
    ...prev,
    name: document.getElementById('bwName').value.trim(),
    headmaster: document.getElementById('bwHeadmaster').value.trim(),
    quota: document.getElementById('bwQuota').value.trim(),
    image: document.getElementById('bwImg').value.trim() || 'assets/hero_santri.jpg',
    shortDesc: document.getElementById('bwShort').value.trim(),
    fullDesc: document.getElementById('bwFull').value.trim(),
    programs: progs,
    headmasterPhoto: document.getElementById('bwHeadmasterPhoto') ? document.getElementById('bwHeadmasterPhoto').value.trim() : (prev.headmasterPhoto || 'assets/pembimbing_baqir.jpg'),
    headmasterSpeechTitle: document.getElementById('bwHeadmasterSpeechTitle') ? document.getElementById('bwHeadmasterSpeechTitle').value.trim() : (prev.headmasterSpeechTitle || ''),
    headmasterSpeech: document.getElementById('bwHeadmasterSpeech') ? document.getElementById('bwHeadmasterSpeech').value.trim() : (prev.headmasterSpeech || '')
  };

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

/* --- TAB 4C: KBIHU RAUDLATUL MUTA'ALLIMIN (MANDIRI & TERPISAH DARI LBB) --- */
function renderTabKbihu(db, container) {
  const hg = db.heroGateway || {
    kbihu: { name: "KBIHU Haji & Umrah", tag: "Izin Kemenag", desc: "Bimbingan Manasik Teori & Praktik Miniatur Ka'bah", url: "kbihu.html" },
    lbb: { name: "LBB Sukses PTN", tag: "Terbuka Siswa Luar", desc: "Bimbel UTBK, SNBT & Simulasi CBT Laboratorium", url: "lbb.html" }
  };
  const kbihu = db.kbihuInfo || {};
  const kbihuHero = kbihu.hero || {
    badge: "LAYANAN KHIDMAH KEUMATAN • IZIN RESMI KEMENAG RI",
    title: "Membina Calon Tamu Allah Menuju <span class=\"highlight-gold\">Haji & Umrah Mabrur</span> Sesuai Sunnah",
    desc: "Pusat bimbingan ibadah haji dan umrah terakreditasi resmi Kemenag RI di bawah asuhan Masyayikh pesantren. Dilengkapi sarana miniatur Ka'bah mandiri, pendalaman fiqih Syafi'iyah, kelas khusus wanita bersama Ibu Nyai, hingga pendampingan total di Tanah Suci.",
    statusBadge: "STATUS PEMBINAAN CALON JAMAAH",
    seasonText: "Musim 1447 H / 2026 M",
    cardTitle: "Pendaftaran Bimbingan Manasik Dibuka",
    cardDesc: "Calon jamaah haji estimasi keberangkatan & calon jamaah umrah keluarga dapat mendaftar pembinaan berkala di Sekretariat KBIHU.",
    features: [
      { label: "Legalitas SK", value: "Kemenag RI" },
      { label: "Simulasi Lapangan", value: "Miniatur Ka'bah" },
      { label: "Bimbingan Fiqih", value: "Madzhab Syafi'i" },
      { label: "Pengawalan Ibadah", value: "Hingga Makkah" }
    ],
    checkPorsiText: "Cek Nomor Porsi & Jadwal Manasik ↗",
    checkPorsiUrl: "https://wa.me/6285606307911?text=Assalamu'alaikum.%20Saya%20ingin%20mengecek%20nomor%20porsi%20haji%20dan%20jadwal%20manasik%20KBIHU%20Raudlatul%20Muta'allimin.",
    pillars: [
      { title: "Legalitas Resmi", subtitle: "Izin Kemenag RI" },
      { title: "Sarana Praktik", subtitle: "Miniatur Ka'bah Pesantren" },
      { title: "Dewan Asatidz", subtitle: "Masyayikh Berlisensi" },
      { title: "Layanan Khidmah", subtitle: "Fiqih & Medis Jamaah" }
    ]
  };
  const heroFeatures = kbihuHero.features || [
    { label: "Legalitas SK", value: "Kemenag RI" },
    { label: "Simulasi Lapangan", value: "Miniatur Ka'bah" },
    { label: "Bimbingan Fiqih", value: "Madzhab Syafi'i" },
    { label: "Pengawalan Ibadah", value: "Hingga Makkah" }
  ];
  const heroPillars = kbihuHero.pillars || [
    { title: "Legalitas Resmi", subtitle: "Izin Kemenag RI" },
    { title: "Sarana Praktik", subtitle: "Miniatur Ka'bah Pesantren" },
    { title: "Dewan Asatidz", subtitle: "Masyayikh Berlisensi" },
    { title: "Layanan Khidmah", subtitle: "Fiqih & Medis Jamaah" }
  ];
  const kbihuHighlights = kbihu.highlights || [
    { title: "Miniatur Ka'bah & Lintasan Sa'i", desc: "Fasilitas simulasi manasik proporsional untuk kemantapan rukun dan wajib haji" },
    { title: "Bimbingan Langsung KH. Miftahul Falah", desc: "Kajian fiqih haji bersanad madzhab Syafi'i, bimbingan manasik intensif, dan pengawalan ibadah mabrur" },
    { title: "Layanan Konsultasi & Pendaftaran", desc: "Narahubung: Ust. Yusuf Afif Rifa'i — Kontak WA: +62 856-0630-7911" }
  ];
  const kbihuGallery = kbihu.gallery || [];
  const kbihuMentors = db.kbihuPembimbing || [];

  container.innerHTML = `
    <!-- 1. HERO GATEWAY DOCK MANAGEMENT -->
    <div class="admin-card" style="margin-bottom:24px;">
      <div class="admin-card-header">
        <div>
          <h3 style="font-size:1.15rem; color:#0A2540; margin:0 0 6px;">1. Tombol Gerbang Cepat Hero KBIHU (Hero Gateway Dock)</h3>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola judul tombol, tag lencana, dan deskripsi singkat KBIHU yang tampil di beranda utama.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="saveKbihuHeroGateway()">Simpan Tombol Hero KBIHU</button>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:16px; max-width:650px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="font-size:1.2rem;">🕋</span>
          <strong style="color:#0F4C81; font-size:1rem;">Konfigurasi Tombol Hero KBIHU Haji & Umrah</strong>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Judul Tombol *</label>
            <input type="text" id="heroKbihuName" class="form-input" value="${(hg.kbihu && hg.kbihu.name) || 'KBIHU Haji & Umrah'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Lencana / Status Tag *</label>
            <input type="text" id="heroKbihuTag" class="form-input" value="${(hg.kbihu && hg.kbihu.tag) || 'Izin Kemenag'}" placeholder="Izin Kemenag" required>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:10px;">
          <label class="form-label" style="font-size:0.8rem;">Deskripsi Singkat Tombol *</label>
          <input type="text" id="heroKbihuDesc" class="form-input" value="${(hg.kbihu && hg.kbihu.desc) || 'Bimbingan Manasik Teori & Praktik Miniatur Ka\'bah'}" required>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:0.8rem;">Target URL Halaman *</label>
          <input type="text" id="heroKbihuUrl" class="form-input" value="${(hg.kbihu && hg.kbihu.url) || 'kbihu.html'}" required>
        </div>
      </div>
    </div>

    <!-- 2. BANNER & HERO UTAMA KBIHU (HEADLINE, LIVE STATUS CARD & 4 PILAR) -->
    <div class="admin-card" style="margin-bottom:24px;">
      <div class="admin-card-header">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:1.3rem;">✨</span>
            <h3 style="font-size:1.15rem; color:#0F4C81; margin:0;">2. Banner & Hero Utama KBIHU (Headline & Live Card)</h3>
          </div>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola teks lencana, headline judul besar, deskripsi, kartu status musim pendaftaran, dan 4 pilar keunggulan KBIHU.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="saveKbihuHero()">Simpan Hero KBIHU</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr; gap:14px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Lencana Atas Hero (Badge) *</label>
          <input type="text" id="kbihuHeroBadge" class="form-input" value="${kbihuHero.badge || 'LAYANAN KHIDMAH KEUMATAN • IZIN RESMI KEMENAG RI'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Judul Utama / Headline Hero (Dapat menggunakan tag HTML) *</label>
          <input type="text" id="kbihuHeroTitle" class="form-input" value="${(kbihuHero.title || 'Membina Calon Tamu Allah Menuju <span class=\"highlight-gold\">Haji & Umrah Mabrur</span> Sesuai Sunnah').replace(/"/g, '&quot;')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi Lengkap Hero *</label>
          <textarea id="kbihuHeroDesc" class="form-textarea" rows="3" required>${kbihuHero.desc || 'Pusat bimbingan ibadah haji dan umrah terakreditasi resmi Kemenag RI di bawah asuhan Masyayikh pesantren. Dilengkapi sarana miniatur Ka\'bah mandiri, pendalaman fiqih Syafi\'iyah, kelas khusus wanita bersama Ibu Nyai, hingga pendampingan total di Tanah Suci.'}</textarea>
        </div>
      </div>

      <!-- Kartu Status Interaktif Kanan -->
      <div style="background:#F1F5F9; border-radius:6px; padding:16px; margin-bottom:16px; border:1px solid #CBD5E1;">
        <h4 style="font-size:0.95rem; color:#0A2540; margin:0 0 12px; font-weight:700;">🕋 Kartu Status Interaktif (Live Tracker Calon Jamaah):</h4>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Status Badge Label</label>
            <input type="text" id="kbihuHeroStatusBadge" class="form-input" value="${kbihuHero.statusBadge || 'STATUS PEMBINAAN CALON JAMAAH'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Musim / Tahun Keberangkatan</label>
            <input type="text" id="kbihuHeroSeason" class="form-input" value="${kbihuHero.seasonText || 'Musim 1447 H / 2026 M'}" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:12px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Judul Kartu Status</label>
            <input type="text" id="kbihuHeroCardTitle" class="form-input" value="${kbihuHero.cardTitle || 'Pendaftaran Bimbingan Manasik Dibuka'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Keterangan Kartu Status</label>
            <input type="text" id="kbihuHeroCardDesc" class="form-input" value="${kbihuHero.cardDesc || 'Calon jamaah haji estimasi keberangkatan & calon jamaah umrah keluarga dapat mendaftar pembinaan berkala di Sekretariat KBIHU.'}" required>
          </div>
        </div>

        <!-- 4 Kotak Fitur Card -->
        <label class="form-label" style="font-size:0.8rem; font-weight:700; margin-bottom:6px; display:block;">4 Kotak Grid Fitur Kartu:</label>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:12px;">
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Kotak 1</span>
            <input type="text" id="kbihuHeroF1Label" class="form-input" value="${(heroFeatures[0] && heroFeatures[0].label) || 'Legalitas SK'}" placeholder="Label 1" style="margin:4px 0;" required>
            <input type="text" id="kbihuHeroF1Val" class="form-input" value="${(heroFeatures[0] && heroFeatures[0].value) || 'Kemenag RI'}" placeholder="Nilai 1" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Kotak 2</span>
            <input type="text" id="kbihuHeroF2Label" class="form-input" value="${(heroFeatures[1] && heroFeatures[1].label) || 'Simulasi Lapangan'}" placeholder="Label 2" style="margin:4px 0;" required>
            <input type="text" id="kbihuHeroF2Val" class="form-input" value="${(heroFeatures[1] && heroFeatures[1].value) || 'Miniatur Ka\'bah'}" placeholder="Nilai 2" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Kotak 3</span>
            <input type="text" id="kbihuHeroF3Label" class="form-input" value="${(heroFeatures[2] && heroFeatures[2].label) || 'Bimbingan Fiqih'}" placeholder="Label 3" style="margin:4px 0;" required>
            <input type="text" id="kbihuHeroF3Val" class="form-input" value="${(heroFeatures[2] && heroFeatures[2].value) || 'Madzhab Syafi\'i'}" placeholder="Nilai 3" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Kotak 4</span>
            <input type="text" id="kbihuHeroF4Label" class="form-input" value="${(heroFeatures[3] && heroFeatures[3].label) || 'Pengawalan Ibadah'}" placeholder="Label 4" style="margin:4px 0;" required>
            <input type="text" id="kbihuHeroF4Val" class="form-input" value="${(heroFeatures[3] && heroFeatures[3].value) || 'Hingga Makkah'}" placeholder="Nilai 4" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Teks Tombol Cek Porsi *</label>
            <input type="text" id="kbihuHeroCheckPorsiText" class="form-input" value="${kbihuHero.checkPorsiText || 'Cek Nomor Porsi & Jadwal Manasik ↗'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Link / URL Tombol Cek Porsi *</label>
            <input type="text" id="kbihuHeroCheckPorsiUrl" class="form-input" value="${kbihuHero.checkPorsiUrl || 'https://wa.me/6285606307911?text=Assalamu\'alaikum.%20Saya%20ingin%20mengecek%20nomor%20porsi%20haji%20dan%20jadwal%20manasik%20KBIHU%20Raudlatul%20Muta\'allimin.'}" required>
          </div>
        </div>
      </div>

      <!-- 4 Pilar Keunggulan Bar KBIHU -->
      <div style="background:#F8FAFC; border-radius:6px; padding:16px; border:1px solid #E2E8F0;">
        <h4 style="font-size:0.95rem; color:#0A2540; margin:0 0 12px; font-weight:700;">⭐ 4 Pilar Keunggulan Bar KBIHU:</h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Pilar 1</span>
            <input type="text" id="kbihuP1Sub" class="form-input" value="${(heroPillars[0] && heroPillars[0].subtitle) || 'Legalitas Resmi'}" placeholder="Subjudul 1" style="margin:4px 0;" required>
            <input type="text" id="kbihuP1Title" class="form-input" value="${(heroPillars[0] && heroPillars[0].title) || 'Izin Kemenag RI'}" placeholder="Judul 1" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Pilar 2</span>
            <input type="text" id="kbihuP2Sub" class="form-input" value="${(heroPillars[1] && heroPillars[1].subtitle) || 'Sarana Praktik'}" placeholder="Subjudul 2" style="margin:4px 0;" required>
            <input type="text" id="kbihuP2Title" class="form-input" value="${(heroPillars[1] && heroPillars[1].title) || 'Miniatur Ka\'bah Pesantren'}" placeholder="Judul 2" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Pilar 3</span>
            <input type="text" id="kbihuP3Sub" class="form-input" value="${(heroPillars[2] && heroPillars[2].subtitle) || 'Dewan Asatidz'}" placeholder="Subjudul 3" style="margin:4px 0;" required>
            <input type="text" id="kbihuP3Title" class="form-input" value="${(heroPillars[2] && heroPillars[2].title) || 'Masyayikh Berlisensi'}" placeholder="Judul 3" required>
          </div>
          <div style="background:#FFFFFF; padding:10px; border-radius:6px; border:1px solid #E2E8F0;">
            <span style="font-size:0.75rem; color:#64748B; font-weight:700;">Pilar 4</span>
            <input type="text" id="kbihuP4Sub" class="form-input" value="${(heroPillars[3] && heroPillars[3].subtitle) || 'Layanan Khidmah'}" placeholder="Subjudul 4" style="margin:4px 0;" required>
            <input type="text" id="kbihuP4Title" class="form-input" value="${(heroPillars[3] && heroPillars[3].title) || 'Fiqih & Medis Jamaah'}" placeholder="Judul 4" required>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. KBIHU PROFILE & LEGAL INFO -->
    <div class="admin-card" style="margin-bottom:24px;">
      <div class="admin-card-header">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:1.3rem;">🕋</span>
            <h3 style="font-size:1.15rem; color:#0F4C81; margin:0;">3. Profil Resmi, Kontak & Layanan KBIHU</h3>
          </div>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola nomor izin resmi Kemenag RI, koordinator, kontak WhatsApp jamaah, fasilitas miniatur Ka'bah, dan jam pelayanan.</p>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="kbihu.html" target="_blank" class="btn btn-outline btn-sm" style="font-weight:700;">👁️ Buka Halaman KBIHU ↗</a>
          <button type="button" class="btn btn-primary btn-sm" onclick="saveKbihuProfile()">Simpan Profil KBIHU</button>
        </div>
      </div>

      <!-- KBIHU Profile Form -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Nama Lembaga *</label>
          <input type="text" id="kbihuName" class="form-input" value="${kbihu.name || 'KBIHU Raudlatul Muta\'allimin'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Resmi Kemenag RI *</label>
          <input type="text" id="kbihuOfficialName" class="form-input" value="${kbihu.officialName || 'Kelompok Bimbingan Ibadah Haji & Umrah (KBIHU) Raudlatul Muta\'allimin Lamongan'}" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Nomor Izin Kemenag RI *</label>
          <input type="text" id="kbihuSk" class="form-input" value="${kbihu.skKemenag || ''}" placeholder="Contoh: Izin Resmi Kemenag RI No. Kd.13.06/4/HJ.00/1984/2019" required>
        </div>
        <div class="form-group">
          <label class="form-label">Slogan / Tagline Ibadah *</label>
          <input type="text" id="kbihuTagline" class="form-input" value="${kbihu.tagline || ''}" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px; background:#F8FAFC; padding:14px; border-radius:8px; border:1px solid #E2E8F0;">
        <div class="form-group">
          <label class="form-label">Koordinator Pelayanan *</label>
          <input type="text" id="kbihuCoordinator" class="form-input" value="${kbihu.coordinator || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jabatan Koordinator *</label>
          <input type="text" id="kbihuRole" class="form-input" value="${kbihu.role || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">No. WhatsApp Jamaah *</label>
          <input type="text" id="kbihuWa" class="form-input" value="${kbihu.whatsapp || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Telepon Kantor / Ext</label>
          <input type="text" id="kbihuPhone" class="form-input" value="${kbihu.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email Pelayanan</label>
          <input type="email" id="kbihuEmail" class="form-input" value="${kbihu.email || ''}">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Kantor Sekretariat *</label>
          <input type="text" id="kbihuOffice" class="form-input" value="${kbihu.office || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Alamat Lengkap *</label>
          <input type="text" id="kbihuAddress" class="form-input" value="${kbihu.address || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jam Pelayanan & Konsultasi *</label>
          <input type="text" id="kbihuHours" class="form-input" value="${kbihu.serviceHours || ''}" required>
        </div>
      </div>

      <!-- Photo Cover Upload -->
      ${renderImageUploadWidget('kbihuImg', 'Foto Sampul Utama KBIHU (Gedung Pusat Manasik & Miniatur Ka\'bah)', kbihu.image || 'assets/pesantren_gedung.jpg', 1200, 'landscape')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Singkat (Tampil di Kartu Tab Beranda) *</label>
        <textarea id="kbihuShortDesc" class="form-textarea" rows="2" required>${kbihu.shortDesc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Deskripsi Lengkap & Profil Bimbingan Manasik *</label>
        <textarea id="kbihuFullDesc" class="form-textarea" rows="3" required>${kbihu.fullDesc || ''}</textarea>
      </div>

      <!-- 3 Highlights -->
      <div style="margin-bottom:16px;">
        <label class="form-label" style="font-weight:700; color:#1E293B;">3 Poin Keunggulan Utama KBIHU:</label>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0F4C81; font-size:0.85rem;">Poin 1</strong>
            <input type="text" id="kbihuH1Title" class="form-input" value="${kbihuHighlights[0] ? kbihuHighlights[0].title : ''}" placeholder="Judul Poin 1" style="margin:6px 0;" required>
            <input type="text" id="kbihuH1Desc" class="form-input" value="${kbihuHighlights[0] ? kbihuHighlights[0].desc : ''}" placeholder="Keterangan Poin 1" required>
          </div>
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0F4C81; font-size:0.85rem;">Poin 2</strong>
            <input type="text" id="kbihuH2Title" class="form-input" value="${kbihuHighlights[1] ? kbihuHighlights[1].title : ''}" placeholder="Judul Poin 2" style="margin:6px 0;" required>
            <input type="text" id="kbihuH2Desc" class="form-input" value="${kbihuHighlights[1] ? kbihuHighlights[1].desc : ''}" placeholder="Keterangan Poin 2" required>
          </div>
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0F4C81; font-size:0.85rem;">Poin 3</strong>
            <input type="text" id="kbihuH3Title" class="form-input" value="${kbihuHighlights[2] ? kbihuHighlights[2].title : ''}" placeholder="Judul Poin 3" style="margin:6px 0;" required>
            <input type="text" id="kbihuH3Desc" class="form-input" value="${kbihuHighlights[2] ? kbihuHighlights[2].desc : ''}" placeholder="Keterangan Poin 3" required>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:24px;">
        <label class="form-label">Daftar Program / Fasilitas Bimbingan Jamaah (1 baris per program) *</label>
        <textarea id="kbihuPrograms" class="form-textarea" rows="3" required>${(kbihu.programs || []).join('\n')}</textarea>
      </div>

      <!-- KBIHU Mentors / Pembimbing Table (Full CRUD) -->
      <div style="border-top:2px solid #E2E8F0; padding-top:20px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h4 style="margin:0; font-size:1.05rem; color:#0F4C81;">4. Dewan Pembina & Pembimbing Ibadah KBIHU (${kbihuMentors.length} Tokoh Asatidz)</h4>
            <small style="color:#64748B;">Kelola foto resmi (dengan auto-crop portrait), nama lengkap & gelar, peran, spesialisasi, dan deskripsi pembimbing manasik.</small>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openModalKbihuPembimbing()">+ Tambah Pembimbing KBIHU</button>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:70px; text-align:center;">Foto</th>
              <th>Nama Lengkap & Gelar</th>
              <th>Peran & Jabatan</th>
              <th>Lencana / Tag</th>
              <th>Keterangan / Latar Belakang</th>
              <th style="width:130px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${kbihuMentors.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">Belum ada data pembimbing. Silakan tambahkan pembimbing baru.</td></tr>
            ` : kbihuMentors.map((m, idx) => `
              <tr>
                <td style="text-align:center;">
                  <img src="${m.photo || 'assets/pembimbing_baqir.jpg'}" alt="${m.name}" style="width:48px; height:58px; object-fit:cover; border-radius:6px; border:1.5px solid #059669; box-shadow:0 2px 6px rgba(0,0,0,0.08);">
                </td>
                <td>
                  <strong style="color:#0A2540; font-size:0.92rem;">${m.name}</strong>
                </td>
                <td>
                  <span style="color:#059669; font-weight:700; font-size:0.85rem;">${m.role}</span>
                </td>
                <td>
                  <span style="display:inline-block; background:#ECFDF5; color:#065F46; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; border:1px solid #A7F3D0;">
                    ✓ ${m.tag || 'Bimbingan Ibadah'}
                  </span>
                </td>
                <td>
                  <div style="font-size:0.80rem; color:#64748B; max-width:280px;">${m.desc || '-'}</div>
                </td>
                <td style="text-align:center;">
                  <button type="button" class="btn-action-edit" onclick="openModalKbihuPembimbing(${idx})">Edit</button>
                  <button type="button" class="btn-action-delete" onclick="deleteKbihuPembimbing(${idx})">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- KBIHU Photo Gallery Table (Full CRUD) -->
      <div style="border-top:2px solid #E2E8F0; padding-top:20px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h4 style="margin:0; font-size:1.05rem; color:#1E293B;">5. Galeri Foto Manasik & Miniatur Ka'bah (${kbihuGallery.length} Foto)</h4>
            <small style="color:#64748B;">Foto-foto dokumentasi ini otomatis tampil pada portal publik KBIHU dan galeri Beranda.</small>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openModalKbihuPhoto()">+ Tambah Foto Galeri KBIHU</button>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:90px;">Foto</th>
              <th>Keterangan / Caption Foto</th>
              <th style="width:130px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${kbihuGallery.length === 0 ? `
              <tr><td colspan="3" style="text-align:center; color:#94A3B8; padding:20px;">Belum ada foto galeri. Silakan tambahkan foto baru.</td></tr>
            ` : kbihuGallery.map((p, idx) => `
              <tr>
                <td>
                  <img src="${p.src}" alt="${p.caption || ''}" style="width:75px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0;">
                </td>
                <td>
                  <strong style="color:#1E293B; font-size:0.9rem;">${p.caption || 'Tanpa Keterangan'}</strong>
                  <div style="font-size:0.75rem; color:#64748B; word-break:break-all;">${p.src.slice(0, 50)}...</div>
                </td>
                <td style="text-align:center;">
                  <button type="button" class="btn-action-edit" onclick="openModalKbihuPhoto(${idx})">Edit</button>
                  <button type="button" class="btn-action-delete" onclick="deleteKbihuPhoto(${idx})">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.saveKbihuHeroGateway = function() {
  const db = getDB();
  if (!db.heroGateway) db.heroGateway = {};
  db.heroGateway.kbihu = {
    name: document.getElementById('heroKbihuName').value.trim(),
    tag: document.getElementById('heroKbihuTag').value.trim(),
    desc: document.getElementById('heroKbihuDesc').value.trim(),
    url: document.getElementById('heroKbihuUrl').value.trim() || 'kbihu.html'
  };
  saveDB(db);
  alert('Konfigurasi Tombol Gerbang Hero KBIHU berhasil disimpan!');
};

window.saveKbihuHero = function() {
  const db = getDB();
  if (!db.kbihuInfo) db.kbihuInfo = {};
  if (!db.kbihuInfo.hero) db.kbihuInfo.hero = {};

  db.kbihuInfo.hero = {
    badge: document.getElementById('kbihuHeroBadge').value.trim(),
    title: document.getElementById('kbihuHeroTitle').value.trim(),
    desc: document.getElementById('kbihuHeroDesc').value.trim(),
    statusBadge: document.getElementById('kbihuHeroStatusBadge').value.trim(),
    seasonText: document.getElementById('kbihuHeroSeason').value.trim(),
    cardTitle: document.getElementById('kbihuHeroCardTitle').value.trim(),
    cardDesc: document.getElementById('kbihuHeroCardDesc').value.trim(),
    features: [
      { label: document.getElementById('kbihuHeroF1Label').value.trim(), value: document.getElementById('kbihuHeroF1Val').value.trim() },
      { label: document.getElementById('kbihuHeroF2Label').value.trim(), value: document.getElementById('kbihuHeroF2Val').value.trim() },
      { label: document.getElementById('kbihuHeroF3Label').value.trim(), value: document.getElementById('kbihuHeroF3Val').value.trim() },
      { label: document.getElementById('kbihuHeroF4Label').value.trim(), value: document.getElementById('kbihuHeroF4Val').value.trim() }
    ],
    checkPorsiText: document.getElementById('kbihuHeroCheckPorsiText').value.trim(),
    checkPorsiUrl: document.getElementById('kbihuHeroCheckPorsiUrl').value.trim(),
    pillars: [
      { subtitle: document.getElementById('kbihuP1Sub').value.trim(), title: document.getElementById('kbihuP1Title').value.trim() },
      { subtitle: document.getElementById('kbihuP2Sub').value.trim(), title: document.getElementById('kbihuP2Title').value.trim() },
      { subtitle: document.getElementById('kbihuP3Sub').value.trim(), title: document.getElementById('kbihuP3Title').value.trim() },
      { subtitle: document.getElementById('kbihuP4Sub').value.trim(), title: document.getElementById('kbihuP4Title').value.trim() }
    ]
  };

  saveDB(db);
  alert('Banner & Hero KBIHU berhasil disimpan!');
  loadCurrentTab();
};

window.saveKbihuProfile = function() {
  const db = getDB();
  if (!db.kbihuInfo) db.kbihuInfo = {};

  db.kbihuInfo.name = document.getElementById('kbihuName').value.trim();
  db.kbihuInfo.officialName = document.getElementById('kbihuOfficialName').value.trim();
  db.kbihuInfo.skKemenag = document.getElementById('kbihuSk').value.trim();
  db.kbihuInfo.tagline = document.getElementById('kbihuTagline').value.trim();
  db.kbihuInfo.image = document.getElementById('kbihuImg').value.trim();
  db.kbihuInfo.coordinator = document.getElementById('kbihuCoordinator').value.trim();
  db.kbihuInfo.role = document.getElementById('kbihuRole').value.trim();
  const rawWa = document.getElementById('kbihuWa').value.trim();
  db.kbihuInfo.whatsapp = rawWa;
  db.kbihuInfo.whatsappClean = rawWa.replace(/\D/g, '');
  db.kbihuInfo.phone = document.getElementById('kbihuPhone').value.trim();
  db.kbihuInfo.email = document.getElementById('kbihuEmail').value.trim();
  db.kbihuInfo.office = document.getElementById('kbihuOffice').value.trim();
  db.kbihuInfo.address = document.getElementById('kbihuAddress').value.trim();
  db.kbihuInfo.serviceHours = document.getElementById('kbihuHours').value.trim();
  db.kbihuInfo.shortDesc = document.getElementById('kbihuShortDesc').value.trim();
  db.kbihuInfo.fullDesc = document.getElementById('kbihuFullDesc').value.trim();

  db.kbihuInfo.highlights = [
    {
      title: document.getElementById('kbihuH1Title').value.trim(),
      desc: document.getElementById('kbihuH1Desc').value.trim()
    },
    {
      title: document.getElementById('kbihuH2Title').value.trim(),
      desc: document.getElementById('kbihuH2Desc').value.trim()
    },
    {
      title: document.getElementById('kbihuH3Title').value.trim(),
      desc: document.getElementById('kbihuH3Desc').value.trim()
    }
  ];

  const progsText = document.getElementById('kbihuPrograms').value;
  db.kbihuInfo.programs = progsText.split('\n').map(p => p.trim()).filter(Boolean);

  saveDB(db);
  alert('Profil & Konten KBIHU berhasil disimpan!');
  loadCurrentTab();
};

/* --- KBIHU PEMBIMBING CRUD MODALS --- */
window.openModalKbihuPembimbing = function(editIndex = null) {
  const db = getDB();
  if (!db.kbihuPembimbing) {
    db.kbihuPembimbing = [
      { id: "pembimbing-1", name: "KH. Miftahul Falah, S.Pd", role: "Pembimbing Utama Ibadah Haji & Umrah", desc: "Ketua Dewan Pengasuh Pondok Pesantren Raudlatul Muta'allimin Tegalrejo • Lisensi Pembimbing Resmi Kemenag RI", tag: "Kajian Fiqih Manasik Syafi'iyah", photo: "assets/pengasuh_miftahul_falah.jpg?v=seimbang" }
    ];
  }
  const isEdit = editIndex !== null;
  const m = isEdit ? db.kbihuPembimbing[editIndex] : {
    name: '',
    role: '',
    desc: '',
    tag: 'Bimbingan Ibadah',
    photo: 'assets/pembimbing_baqir.jpg'
  };

  openAdminModal(isEdit ? 'Edit Pembimbing KBIHU' : 'Tambah Pembimbing KBIHU Baru', `
    <form onsubmit="saveKbihuPembimbing(event, ${editIndex})">
      ${renderImageUploadWidget('kbihuPembimbingPhoto', 'Foto Resmi Pembimbing (Format Potret)', m.photo || 'assets/pembimbing_baqir.jpg', 1000, 'portrait')}
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Nama Lengkap & Gelar Pembimbing *</label>
        <input type="text" id="kbihuPembimbingName" class="form-input" value="${m.name || ''}" placeholder="Contoh: KH. Moh. Baqir Sholih" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group">
          <label class="form-label">Peran & Bidang Bimbingan *</label>
          <input type="text" id="kbihuPembimbingRole" class="form-input" value="${m.role || ''}" placeholder="Contoh: Pembina Utama Fiqih Haji" required>
        </div>
        <div class="form-group">
          <label class="form-label">Lencana / Tag *</label>
          <input type="text" id="kbihuPembimbingTag" class="form-input" value="${m.tag || ''}" placeholder="Contoh: Kajian Fiqih Salafiyah" required>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Keterangan / Latar Belakang *</label>
        <input type="text" id="kbihuPembimbingDesc" class="form-input" value="${m.desc || ''}" placeholder="Contoh: Pengasuh Pesantren • Lisensi Pembimbing Kemenag RI" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Perubahan' : 'Tambahkan Pembimbing'}</button>
      </div>
    </form>
  `);
};

window.saveKbihuPembimbing = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.kbihuPembimbing) db.kbihuPembimbing = [];

  const newObj = {
    id: editIndex !== null && db.kbihuPembimbing[editIndex] ? db.kbihuPembimbing[editIndex].id : 'pembimbing-' + Date.now(),
    name: document.getElementById('kbihuPembimbingName').value.trim(),
    role: document.getElementById('kbihuPembimbingRole').value.trim(),
    tag: document.getElementById('kbihuPembimbingTag').value.trim(),
    desc: document.getElementById('kbihuPembimbingDesc').value.trim(),
    photo: document.getElementById('kbihuPembimbingPhoto').value.trim() || 'assets/pembimbing_baqir.jpg'
  };

  if (editIndex !== null) {
    db.kbihuPembimbing[editIndex] = newObj;
  } else {
    db.kbihuPembimbing.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteKbihuPembimbing = function(index) {
  const db = getDB();
  const m = db.kbihuPembimbing && db.kbihuPembimbing[index];
  const name = m ? m.name : 'pembimbing ini';

  if (confirm(`Apakah Anda yakin ingin menghapus "${name}" dari daftar pembimbing KBIHU?`)) {
    db.kbihuPembimbing.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- KBIHU PHOTO GALLERY CRUD MODALS --- */
window.openModalKbihuPhoto = function(editIndex = null) {
  const db = getDB();
  if (!db.kbihuInfo) db.kbihuInfo = {};
  if (!db.kbihuInfo.gallery) db.kbihuInfo.gallery = [];

  const isEdit = editIndex !== null;
  const p = isEdit ? db.kbihuInfo.gallery[editIndex] : {
    src: '',
    caption: ''
  };

  openAdminModal(isEdit ? 'Edit Foto Galeri KBIHU' : 'Tambah Foto Galeri KBIHU Baru', `
    <form onsubmit="saveKbihuPhoto(event, ${editIndex})">
      ${renderImageUploadWidget('kbihuPhotoSrc', 'File / URL Foto Dokumentasi Manasik', p.src || 'assets/pesantren_gedung.jpg', 1200, 'landscape')}
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Keterangan / Caption Foto *</label>
        <input type="text" id="kbihuPhotoCaption" class="form-input" value="${p.caption || ''}" placeholder="Contoh: Praktik Manasik Miniatur Ka'bah" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Foto' : 'Tambahkan Foto'}</button>
      </div>
    </form>
  `);
};

window.saveKbihuPhoto = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.kbihuInfo) db.kbihuInfo = {};
  if (!db.kbihuInfo.gallery) db.kbihuInfo.gallery = [];

  const newObj = {
    src: document.getElementById('kbihuPhotoSrc').value.trim() || 'assets/pesantren_gedung.jpg',
    caption: document.getElementById('kbihuPhotoCaption').value.trim()
  };

  if (editIndex !== null) {
    db.kbihuInfo.gallery[editIndex] = newObj;
  } else {
    db.kbihuInfo.gallery.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteKbihuPhoto = function(index) {
  const db = getDB();
  if (confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri KBIHU?')) {
    db.kbihuInfo.gallery.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 4D: LBB RAUDLATUL MUTA'ALLIMIN (MANDIRI & TERPISAH DARI KBIHU) --- */
function renderTabLbb(db, container) {
  const hg = db.heroGateway || {
    kbihu: { name: "KBIHU Haji & Umrah", tag: "Izin Kemenag", desc: "Bimbingan Manasik Teori & Praktik Miniatur Ka'bah", url: "kbihu.html" },
    lbb: { name: "LBB Sukses PTN", tag: "Terbuka Siswa Luar", desc: "Bimbel UTBK, SNBT & Simulasi CBT Laboratorium", url: "lbb.html" }
  };
  const lbb = db.lbbInfo || {};
  const lbbHighlights = lbb.highlights || [
    { title: "Laboratorium CBT & Tryout Terjadwal", desc: "Simulasi ujian komputer berstandar nasional dengan analisis skor dan ranking instan" },
    { title: "Sesi Belajar Setelah Jam Pulang Sekolah", desc: "Jadwal presisi (13.40 – Ashar) tidak menyita waktu malam dan dibimbing tentor master alumni PTN terbaik" },
    { title: "Layanan Informasi & Pendaftaran Siswa", desc: "Narahubung: Ust. M. Wildan Pratama, M.Pd. — Kontak WA: +62 813-5789-2244" }
  ];
  const lbbGallery = lbb.gallery || [];
  const lbbTentors = db.lbbTentors || [
    { name: "Novin Mayang Arum, S.Pd", role: "Ketua LBB & Master Tutor Bahasa", desc: "Alumni Universitas Negeri • Pakar Trik Cepat SNBT & Literasi", photo: "assets/tutor_novin.jpg", tag: "Ketua LBB" },
    { name: "Dinda Ayu Lestari, S.Si", role: "Master Tentor Penalaran Matematika & TPS", desc: "Alumni FMIPA PTN Ternama • Penulis Modul 'The King'", photo: "assets/tutor_dinda.jpg", tag: "TPS & Matematika" },
    { name: "Muhimmatul Aliyah, S.Pd", role: "Master Tentor Literasi Bahasa Inggris & Indonesia", desc: "Spesialis Reading Comprehension & Analisis Wacana", photo: "assets/tutor_muhim.jpg", tag: "Literasi Bahasa" },
    { name: "M. Isroil Hidayatullah, S.Pd", role: "Master Tentor TKA Sains & Penalaran Umum", desc: "Pengajar Olimpiade Sains • Strategi Eliminasi Cepat", photo: "assets/tutor_isroil.jpg", tag: "TKA Sains" }
  ];

  container.innerHTML = `
    <!-- 1. HERO GATEWAY DOCK MANAGEMENT -->
    <div class="admin-card" style="margin-bottom:24px;">
      <div class="admin-card-header">
        <div>
          <h3 style="font-size:1.15rem; color:#0A2540; margin:0 0 6px;">1. Tombol Gerbang Cepat Hero LBB (Hero Gateway Dock)</h3>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola judul tombol, tag lencana (Terbuka Siswa Luar & Santri), dan deskripsi singkat LBB yang tampil di beranda.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="saveLbbHeroGateway()">Simpan Tombol Hero LBB</button>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:16px; max-width:650px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="font-size:1.2rem;">🚀</span>
          <strong style="color:#0284C7; font-size:1rem;">Konfigurasi Tombol Hero LBB Sukses PTN</strong>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Judul Tombol *</label>
            <input type="text" id="heroLbbName" class="form-input" value="${(hg.lbb && hg.lbb.name) || 'LBB Sukses PTN'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:0.8rem;">Lencana / Status Tag *</label>
            <input type="text" id="heroLbbTag" class="form-input" value="${(hg.lbb && hg.lbb.tag) || 'Terbuka Siswa Luar'}" placeholder="Terbuka Siswa Luar" required>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:10px;">
          <label class="form-label" style="font-size:0.8rem;">Deskripsi Singkat Tombol *</label>
          <input type="text" id="heroLbbDesc" class="form-input" value="${(hg.lbb && hg.lbb.desc) || 'Bimbel UTBK, SNBT & Simulasi CBT Laboratorium'}" required>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:0.8rem;">Target URL Halaman *</label>
          <input type="text" id="heroLbbUrl" class="form-input" value="${(hg.lbb && hg.lbb.url) || 'lbb.html'}" required>
        </div>
      </div>
    </div>

    <!-- 2. LBB PROFILE & TARGET AUDIENCE -->
    <div class="admin-card" style="margin-bottom:24px;">
      <div class="admin-card-header">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span style="font-size:1.3rem;">🚀</span>
            <h3 style="font-size:1.15rem; color:#0284C7; margin:0;">2. Profil & Layanan Bimbingan Belajar LBB</h3>
          </div>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola profil LBB, keterbukaan untuk siswa luar, koordinator, nomor WhatsApp, fasilitas laboratorium CBT, dan jadwal sesi belajar (13.40 – Ashar).</p>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="lbb.html" target="_blank" class="btn btn-outline btn-sm" style="font-weight:700;">👁️ Buka Halaman LBB ↗</a>
          <button type="button" class="btn btn-primary btn-sm" onclick="saveLbbProfile()">Simpan Profil LBB</button>
        </div>
      </div>

      <!-- LBB Profile Form -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Nama Lembaga *</label>
          <input type="text" id="lbbName" class="form-input" value="${lbb.name || 'LBB Raudlatul Muta\'allimin'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nama Resmi Lembaga *</label>
          <input type="text" id="lbbOfficialName" class="form-input" value="${lbb.officialName || 'Lembaga Bimbingan Belajar (LBB) Raudlatul Muta\'allimin'}" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Target Audiens / Peserta Didik *</label>
          <input type="text" id="lbbTargetAudience" class="form-input" value="${lbb.targetAudience || 'Terbuka Siswa Luar & Santri'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Slogan / Tagline *</label>
          <input type="text" id="lbbTagline" class="form-input" value="${lbb.tagline || 'Gerbang Sukses Tembus PTN Favorit, Kedinasan & Beasiswa Internasional'}" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom:16px; background:#F8FAFC; padding:14px; border-radius:8px; border:1px solid #E2E8F0;">
        <div class="form-group">
          <label class="form-label">Koordinator / Narahubung *</label>
          <input type="text" id="lbbCoordinator" class="form-input" value="${lbb.coordinator || 'Novin Mayang Arum, S.Pd'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jabatan Koordinator *</label>
          <input type="text" id="lbbRole" class="form-input" value="${lbb.role || 'Ketua LBB Raudlatul Muta\'allimin'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">No. WhatsApp Siswa *</label>
          <input type="text" id="lbbWa" class="form-input" value="${lbb.whatsapp || '+62 813-5789-2244'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Telepon Kantor / Ext</label>
          <input type="text" id="lbbPhone" class="form-input" value="${lbb.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email Pelayanan</label>
          <input type="email" id="lbbEmail" class="form-input" value="${lbb.email || ''}">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:16px;">
        <div class="form-group">
          <label class="form-label">Kantor Sekretariat *</label>
          <input type="text" id="lbbOffice" class="form-input" value="${lbb.office || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Alamat Lengkap *</label>
          <input type="text" id="lbbAddress" class="form-input" value="${lbb.address || ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Waktu Belajar (Standar LBB) *</label>
          <input type="text" id="lbbHours" class="form-input" value="${lbb.serviceHours || 'Sabtu – Kamis: 07.00 – 14.00 WIB (Hari Jum\'at Libur) • Sesi Belajar: 13.40 – Ashar'}" required>
        </div>
      </div>

      <!-- Photo Cover Upload -->
      ${renderImageUploadWidget('lbbImg', 'Foto Sampul Utama LBB (Laboratorium CBT & Ruang Belajar)', lbb.image || 'assets/lbb_bimbel_intensif.jpg', 1200, 'landscape')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Singkat (Tampil di Kartu Tab Beranda) *</label>
        <textarea id="lbbShortDesc" class="form-textarea" rows="2" required>${lbb.shortDesc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">Deskripsi Lengkap & Fasilitas Belajar CBT *</label>
        <textarea id="lbbFullDesc" class="form-textarea" rows="3" required>${lbb.fullDesc || ''}</textarea>
      </div>

      <!-- 3 Highlights -->
      <div style="margin-bottom:16px;">
        <label class="form-label" style="font-weight:700; color:#1E293B;">3 Poin Keunggulan Utama LBB:</label>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0284C7; font-size:0.85rem;">Poin 1</strong>
            <input type="text" id="lbbH1Title" class="form-input" value="${lbbHighlights[0] ? lbbHighlights[0].title : ''}" placeholder="Judul Poin 1" style="margin:6px 0;" required>
            <input type="text" id="lbbH1Desc" class="form-input" value="${lbbHighlights[0] ? lbbHighlights[0].desc : ''}" placeholder="Keterangan Poin 1" required>
          </div>
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0284C7; font-size:0.85rem;">Poin 2</strong>
            <input type="text" id="lbbH2Title" class="form-input" value="${lbbHighlights[1] ? lbbHighlights[1].title : ''}" placeholder="Judul Poin 2" style="margin:6px 0;" required>
            <input type="text" id="lbbH2Desc" class="form-input" value="${lbbHighlights[1] ? lbbHighlights[1].desc : ''}" placeholder="Keterangan Poin 2" required>
          </div>
          <div style="background:#F1F5F9; padding:12px; border-radius:8px;">
            <strong style="color:#0284C7; font-size:0.85rem;">Poin 3</strong>
            <input type="text" id="lbbH3Title" class="form-input" value="${lbbHighlights[2] ? lbbHighlights[2].title : ''}" placeholder="Judul Poin 3" style="margin:6px 0;" required>
            <input type="text" id="lbbH3Desc" class="form-input" value="${lbbHighlights[2] ? lbbHighlights[2].desc : ''}" placeholder="Keterangan Poin 3" required>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:24px;">
        <label class="form-label">Daftar Program / Paket Bimbel (1 baris per program) *</label>
        <textarea id="lbbPrograms" class="form-textarea" rows="3" required>${(lbb.programs || []).join('\n')}</textarea>
      </div>

      <!-- Dewan Tentor Master LBB (Full CRUD) -->
      <div style="border-top:2px solid #E2E8F0; padding-top:20px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h4 style="margin:0; font-size:1.05rem; color:#0284C7;">Dewan Tentor Master & Pengajar LBB (${lbbTentors.length} Tentor)</h4>
            <small style="color:#64748B;">Kelola foto resmi (dengan auto-crop portrait), nama lengkap, bidang mata pelajaran SNBT/CBT, dan kualifikasi tentor.</small>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openModalLbbTentor()">+ Tambah Tentor LBB</button>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:70px; text-align:center;">Foto</th>
              <th>Nama Lengkap & Gelar</th>
              <th>Bidang / Mata Pelajaran</th>
              <th>Lencana / Tag</th>
              <th>Kualifikasi / Latar Belakang</th>
              <th style="width:130px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${lbbTentors.map((t, idx) => `
              <tr>
                <td style="text-align:center;">
                  <img src="${t.photo || 'assets/tutor_dinda.jpg'}" alt="${t.name}" style="width:48px; height:58px; object-fit:cover; border-radius:6px; border:1.5px solid #0284C7; box-shadow:0 2px 6px rgba(0,0,0,0.08);" onerror="this.src='assets/pengasuh_ghozi.jpg'">
                </td>
                <td>
                  <strong style="color:#0A2540; font-size:0.92rem;">${t.name}</strong>
                </td>
                <td>
                  <span style="color:#0284C7; font-weight:700; font-size:0.85rem;">${t.role}</span>
                </td>
                <td>
                  <span style="display:inline-block; background:#EFF6FF; color:#1D4ED8; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; border:1px solid #DBEAFE;">
                    ★ ${t.tag || 'Tentor Master'}
                  </span>
                </td>
                <td>
                  <div style="font-size:0.80rem; color:#64748B; max-width:280px;">${t.desc || '-'}</div>
                </td>
                <td style="text-align:center;">
                  <button type="button" class="btn-action-edit" onclick="openModalLbbTentor(${idx})">Edit</button>
                  <button type="button" class="btn-action-delete" onclick="deleteLbbTentor(${idx})">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- LBB Photo Gallery Table (Full CRUD) -->
      <div style="border-top:2px solid #E2E8F0; padding-top:20px; margin-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h4 style="margin:0; font-size:1.05rem; color:#1E293B;">Galeri Foto Fasilitas CBT & Belajar LBB (${lbbGallery.length} Foto)</h4>
            <small style="color:#64748B;">Foto-foto fasilitas ini otomatis tampil pada portal publik LBB dan halaman beranda.</small>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="openModalLbbPhoto()">+ Tambah Foto Galeri LBB</button>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:90px;">Foto</th>
              <th>Keterangan / Caption Foto</th>
              <th style="width:130px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${lbbGallery.length === 0 ? `
              <tr><td colspan="3" style="text-align:center; color:#94A3B8; padding:20px;">Belum ada foto galeri. Silakan tambahkan foto baru.</td></tr>
            ` : lbbGallery.map((p, idx) => `
              <tr>
                <td>
                  <img src="${p.src}" alt="${p.caption || ''}" style="width:75px; height:50px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0;">
                </td>
                <td>
                  <strong style="color:#1E293B; font-size:0.9rem;">${p.caption || 'Tanpa Keterangan'}</strong>
                  <div style="font-size:0.75rem; color:#64748B; word-break:break-all;">${p.src.slice(0, 50)}...</div>
                </td>
                <td style="text-align:center;">
                  <button type="button" class="btn-action-edit" onclick="openModalLbbPhoto(${idx})">Edit</button>
                  <button type="button" class="btn-action-delete" onclick="deleteLbbPhoto(${idx})">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.saveLbbHeroGateway = function() {
  const db = getDB();
  if (!db.heroGateway) db.heroGateway = {};
  db.heroGateway.lbb = {
    name: document.getElementById('heroLbbName').value.trim(),
    tag: document.getElementById('heroLbbTag').value.trim(),
    desc: document.getElementById('heroLbbDesc').value.trim(),
    url: document.getElementById('heroLbbUrl').value.trim() || 'lbb.html'
  };
  saveDB(db);
  alert('Konfigurasi Tombol Gerbang Hero LBB berhasil disimpan!');
};

/* --- LBB TENTOR CRUD MODALS --- */
window.openModalLbbTentor = function(editIndex = null) {
  const db = getDB();
  if (!db.lbbTentors) {
    db.lbbTentors = [
      { name: "Novin Mayang Arum, S.Pd", role: "Ketua LBB & Master Tutor Bahasa", desc: "Alumni Universitas Negeri • Pakar Trik Cepat SNBT & Literasi", photo: "assets/tutor_novin.jpg", tag: "Ketua LBB" },
      { name: "Dinda Ayu Lestari, S.Si", role: "Master Tentor Penalaran Matematika & TPS", desc: "Alumni FMIPA PTN Ternama • Penulis Modul 'The King'", photo: "assets/tutor_dinda.jpg", tag: "TPS & Matematika" },
      { name: "Muhimmatul Aliyah, S.Pd", role: "Master Tentor Literasi Bahasa Inggris & Indonesia", desc: "Spesialis Reading Comprehension & Analisis Wacana", photo: "assets/tutor_muhim.jpg", tag: "Literasi Bahasa" },
      { name: "M. Isroil Hidayatullah, S.Pd", role: "Master Tentor TKA Sains & Penalaran Umum", desc: "Pengajar Olimpiade Sains • Strategi Eliminasi Cepat", photo: "assets/tutor_isroil.jpg", tag: "TKA Sains" }
    ];
  }
  const isEdit = editIndex !== null;
  const t = isEdit ? db.lbbTentors[editIndex] : {
    name: '',
    role: '',
    desc: '',
    tag: 'Tentor Master',
    photo: 'assets/tutor_dinda.jpg'
  };

  openAdminModal(isEdit ? 'Edit Tentor LBB' : 'Tambah Tentor LBB Baru', `
    <form onsubmit="saveLbbTentor(event, ${editIndex})">
      ${renderImageUploadWidget('lbbTentorPhoto', 'Foto Resmi Tentor (Format Potret)', t.photo || 'assets/tutor_dinda.jpg', 1000, 'portrait')}
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Nama Lengkap & Gelar Tentor *</label>
        <input type="text" id="lbbTentorName" class="form-input" value="${t.name || ''}" placeholder="Contoh: Dinda Ayu Lestari, S.Si" required>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group">
          <label class="form-label">Bidang Pengajaran / Peran *</label>
          <input type="text" id="lbbTentorRole" class="form-input" value="${t.role || ''}" placeholder="Contoh: Master Tentor Penalaran Matematika" required>
        </div>
        <div class="form-group">
          <label class="form-label">Lencana / Tag *</label>
          <input type="text" id="lbbTentorTag" class="form-input" value="${t.tag || ''}" placeholder="Contoh: TPS & Matematika" required>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Kualifikasi / Latar Belakang *</label>
        <input type="text" id="lbbTentorDesc" class="form-input" value="${t.desc || ''}" placeholder="Contoh: Alumni FMIPA PTN Ternama • Penulis Modul 'The King'" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Perubahan' : 'Tambahkan Tentor'}</button>
      </div>
    </form>
  `);
};

window.saveLbbTentor = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.lbbTentors) db.lbbTentors = [];

  const newObj = {
    name: document.getElementById('lbbTentorName').value.trim(),
    role: document.getElementById('lbbTentorRole').value.trim(),
    tag: document.getElementById('lbbTentorTag').value.trim(),
    desc: document.getElementById('lbbTentorDesc').value.trim(),
    photo: document.getElementById('lbbTentorPhoto').value.trim() || 'assets/tutor_dinda.jpg'
  };

  if (editIndex !== null) {
    db.lbbTentors[editIndex] = newObj;
  } else {
    db.lbbTentors.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteLbbTentor = function(index) {
  if (confirm('Yakin ingin menghapus tentor ini dari daftar pengajar LBB?')) {
    const db = getDB();
    if (db.lbbTentors) {
      db.lbbTentors.splice(index, 1);
      saveDB(db);
      loadCurrentTab();
    }
  }
};

window.saveLbbProfile = function() {
  const db = getDB();
  if (!db.lbbInfo) db.lbbInfo = {};

  db.lbbInfo.name = document.getElementById('lbbName').value.trim();
  db.lbbInfo.officialName = document.getElementById('lbbOfficialName').value.trim();
  db.lbbInfo.targetAudience = document.getElementById('lbbTargetAudience').value.trim();
  db.lbbInfo.tagline = document.getElementById('lbbTagline').value.trim();
  db.lbbInfo.coordinator = document.getElementById('lbbCoordinator').value.trim();
  db.lbbInfo.headmaster = db.lbbInfo.coordinator;
  db.lbbInfo.role = document.getElementById('lbbRole').value.trim();
  const rawWa = document.getElementById('lbbWa').value.trim();
  db.lbbInfo.whatsapp = rawWa;
  db.lbbInfo.whatsappClean = rawWa.replace(/\D/g, '');
  db.lbbInfo.phone = document.getElementById('lbbPhone').value.trim();
  db.lbbInfo.email = document.getElementById('lbbEmail').value.trim();
  db.lbbInfo.office = document.getElementById('lbbOffice').value.trim();
  db.lbbInfo.address = document.getElementById('lbbAddress').value.trim();
  db.lbbInfo.serviceHours = document.getElementById('lbbHours').value.trim();
  db.lbbInfo.image = document.getElementById('lbbImg').value.trim();
  db.lbbInfo.shortDesc = document.getElementById('lbbShortDesc').value.trim();
  db.lbbInfo.fullDesc = document.getElementById('lbbFullDesc').value.trim();

  db.lbbInfo.highlights = [
    {
      title: document.getElementById('lbbH1Title').value.trim(),
      desc: document.getElementById('lbbH1Desc').value.trim()
    },
    {
      title: document.getElementById('lbbH2Title').value.trim(),
      desc: document.getElementById('lbbH2Desc').value.trim()
    },
    {
      title: document.getElementById('lbbH3Title').value.trim(),
      desc: document.getElementById('lbbH3Desc').value.trim()
    }
  ];

  const progsText = document.getElementById('lbbPrograms').value;
  db.lbbInfo.programs = progsText.split('\n').map(p => p.trim()).filter(Boolean);

  // Synchronize with nonFormalUnits where id === 'lbb'
  if (db.nonFormalUnits) {
    const unitLbb = db.nonFormalUnits.find(u => u.id === 'lbb');
    if (unitLbb) {
      unitLbb.name = db.lbbInfo.name;
      unitLbb.fullName = db.lbbInfo.officialName;
      unitLbb.coordinator = db.lbbInfo.coordinator;
      unitLbb.headmaster = db.lbbInfo.coordinator;
      unitLbb.role = db.lbbInfo.role;
      unitLbb.whatsapp = db.lbbInfo.whatsapp;
      unitLbb.whatsappClean = db.lbbInfo.whatsappClean;
      unitLbb.phone = db.lbbInfo.phone;
      unitLbb.office = db.lbbInfo.office;
      unitLbb.serviceHours = db.lbbInfo.serviceHours;
      unitLbb.image = db.lbbInfo.image;
      unitLbb.shortDesc = db.lbbInfo.shortDesc;
      unitLbb.fullDesc = db.lbbInfo.fullDesc;
      unitLbb.programs = db.lbbInfo.programs;
      if (db.lbbInfo.gallery && db.lbbInfo.gallery.length > 0) {
        unitLbb.gallery = db.lbbInfo.gallery;
      }
    }
  }

  saveDB(db);
  alert('Profil & Layanan LBB berhasil disimpan!');
  loadCurrentTab();
};

/* --- LBB PHOTO GALLERY CRUD MODALS --- */
window.openModalLbbPhoto = function(editIndex = null) {
  const db = getDB();
  if (!db.lbbInfo) db.lbbInfo = {};
  if (!db.lbbInfo.gallery) db.lbbInfo.gallery = [];

  const isEdit = editIndex !== null;
  const p = isEdit ? db.lbbInfo.gallery[editIndex] : {
    src: '',
    caption: ''
  };

  openAdminModal(isEdit ? 'Edit Foto Galeri LBB' : 'Tambah Foto Galeri LBB Baru', `
    <form onsubmit="saveLbbPhoto(event, ${editIndex})">
      ${renderImageUploadWidget('lbbPhotoSrc', 'File / URL Foto Dokumentasi Laboratorium CBT & Belajar', p.src || 'assets/lbb_bimbel_intensif.jpg', 1200, 'landscape')}
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Keterangan / Caption Foto *</label>
        <input type="text" id="lbbPhotoCaption" class="form-input" value="${p.caption || ''}" placeholder="Contoh: Simulasi Ujian SNBT Berbasis CBT" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Foto' : 'Tambahkan Foto'}</button>
      </div>
    </form>
  `);
};

window.saveLbbPhoto = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.lbbInfo) db.lbbInfo = {};
  if (!db.lbbInfo.gallery) db.lbbInfo.gallery = [];

  const newObj = {
    src: document.getElementById('lbbPhotoSrc').value.trim() || 'assets/lbb_bimbel_intensif.jpg',
    caption: document.getElementById('lbbPhotoCaption').value.trim()
  };

  if (editIndex !== null) {
    db.lbbInfo.gallery[editIndex] = newObj;
  } else {
    db.lbbInfo.gallery.push(newObj);
  }

  // Sync to nonFormalUnits
  if (db.nonFormalUnits) {
    const unitLbb = db.nonFormalUnits.find(u => u.id === 'lbb');
    if (unitLbb) unitLbb.gallery = db.lbbInfo.gallery;
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteLbbPhoto = function(index) {
  const db = getDB();
  if (confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri LBB?')) {
    if (db.lbbInfo && db.lbbInfo.gallery) {
      db.lbbInfo.gallery.splice(index, 1);
      if (db.nonFormalUnits) {
        const unitLbb = db.nonFormalUnits.find(u => u.id === 'lbb');
        if (unitLbb) unitLbb.gallery = db.lbbInfo.gallery;
      }
      saveDB(db);
      loadCurrentTab();
    }
  }
};

/* --- TAB: JADWAL KEGIATAN SEHARI-HARI SANTRI 24 JAM (CMS ADMIN PONDOK) --- */
function renderTabDailySchedule(db, container) {
  const schedules = db.dailySchedules || [];
  // Sort by order ascending
  schedules.sort((a, b) => (a.order || 0) - (b.order || 0));

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="font-size:1.18rem; color:#0A2540; margin:0 0 6px;">Jadwal Rutin Santri 24 Jam (${schedules.length} Sesi Kegiatan)</h3>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola jadwal rutinitas keseharian santri mukim mulai bangun tidur (Tahajud) hingga istirahat malam. Perubahan otomatis tayang ke website (PSB & Profil Pesantren).</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="resetDailySchedule()" style="border-color:#CBD5E1; color:#475569;">
            ↺ Reset ke Default
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="openDailyScheduleModal()" style="font-weight:700;">
            + Tambah Jadwal Baru
          </button>
        </div>
      </div>

      <div class="admin-table-responsive" style="margin-top:16px;">
        <table class="admin-table" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0;">
              <th style="width:60px; text-align:center; padding:12px 8px;">No</th>
              <th style="width:170px; padding:12px 14px;">Waktu (WIB)</th>
              <th style="padding:12px 14px;">Kegiatan & Rutinitas Santri</th>
              <th style="width:110px; text-align:center; padding:12px 8px;">Urutan</th>
              <th style="width:130px; text-align:center; padding:12px 8px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${schedules.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align:center; padding:32px; color:#94A3B8;">Belum ada jadwal yang tersimpan. Klik "+ Tambah Jadwal Baru" atau "Reset ke Default".</td>
              </tr>
            ` : schedules.map((item, idx) => `
              <tr style="border-bottom:1px solid #F1F5F9;">
                <td style="text-align:center; font-weight:700; color:#64748B; padding:12px 8px;">${idx + 1}</td>
                <td style="padding:12px 14px;">
                  <span style="display:inline-block; font-weight:800; font-family:monospace; background:#EFF6FF; color:#0F4C81; padding:4px 10px; border-radius:6px; font-size:0.86rem; border:1px solid #BFDBFE;">
                    ${escapeHTML(item.time || '')}
                  </span>
                </td>
                <td style="padding:12px 14px; font-size:0.9rem; color:#1E293B; line-height:1.5;">
                  ${escapeHTML(item.activity || '')}
                </td>
                <td style="text-align:center; padding:12px 8px;">
                  <div style="display:inline-flex; gap:4px;">
                    <button type="button" class="btn btn-xs btn-outline" onclick="moveDailyScheduleOrder(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Geser ke Atas">▲</button>
                    <button type="button" class="btn btn-xs btn-outline" onclick="moveDailyScheduleOrder(${idx}, 1)" ${idx === schedules.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Geser ke Bawah">▼</button>
                  </div>
                </td>
                <td style="text-align:center; padding:12px 8px;">
                  <div style="display:inline-flex; gap:6px;">
                    <button type="button" class="btn btn-primary btn-xs" onclick="openDailyScheduleModal('${item.id}')" title="Edit Jadwal" style="padding:4px 8px;">✏️ Edit</button>
                    <button type="button" class="btn btn-danger btn-xs" onclick="deleteDailySchedule('${item.id}')" title="Hapus Jadwal" style="padding:4px 8px; background:#EF4444; border-color:#EF4444; color:#FFF;">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openDailyScheduleModal = function(scheduleId = null) {
  const db = getDB();
  const schedules = db.dailySchedules || [];
  let item = null;
  let isEdit = false;

  if (scheduleId) {
    item = schedules.find(s => s.id === scheduleId);
    if (item) isEdit = true;
  }

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'admin-modal-overlay';
  modalOverlay.id = 'modalDailySchedule';
  modalOverlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(10,37,64,0.65); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';

  modalOverlay.innerHTML = `
    <div class="admin-modal-card" style="background:#FFFFFF; border-radius:16px; width:100%; max-width:540px; box-shadow:0 20px 48px rgba(0,0,0,0.25); overflow:hidden; border:1.5px solid #0F4C81;">
      <div style="background:linear-gradient(135deg, #0A2540 0%, #0F4C81 100%); color:#FFFFFF; padding:18px 24px; display:flex; align-items:center; justify-content:space-between;">
        <h4 style="margin:0; font-size:1.1rem; color:#FFFFFF; font-weight:800; display:flex; align-items:center; gap:8px;">
          <span>⏰</span> ${isEdit ? 'Edit Sesi Jadwal Santri' : 'Tambah Sesi Jadwal Baru'}
        </h4>
        <button type="button" onclick="closeDailyScheduleModal()" style="background:transparent; border:none; color:#FFFFFF; font-size:1.4rem; cursor:pointer; line-height:1;">&times;</button>
      </div>
      <form id="formDailyScheduleModal" onsubmit="handleSaveDailySchedule(event, '${scheduleId || ''}')" style="padding:24px;">
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:0.84rem; font-weight:700; color:#1E293B; margin-bottom:6px;">Waktu Kegiatan (WIB) *</label>
          <input type="text" id="modalSchedTime" class="form-input" style="width:100%; padding:10px 12px; border:1px solid #CBD5E1; border-radius:8px; font-weight:700;" placeholder="Contoh: 04.30 – 05.15" value="${item ? escapeHTML(item.time || '') : ''}" required>
          <span style="font-size:0.75rem; color:#64748B; margin-top:3px; display:block;">Format disarankan: JJ.MM – JJ.MM (WIB)</span>
        </div>
        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:0.84rem; font-weight:700; color:#1E293B; margin-bottom:6px;">Deskripsi Kegiatan & Rutinitas Santri *</label>
          <textarea id="modalSchedActivity" class="form-input" rows="4" style="width:100%; padding:10px 12px; border:1px solid #CBD5E1; border-radius:8px; resize:vertical; font-size:0.9rem;" placeholder="Tuliskan rutinitas santri pada jam ini (misal: Sholat Subuh berjamaah, sorogan tajwid, dsb)..." required>${item ? escapeHTML(item.activity || '') : ''}</textarea>
          <span style="font-size:0.75rem; color:#64748B; margin-top:3px; display:block;">Gunakan kalimat resmi. Untuk tempat ibadah utama, gunakan "Mushola Pondok Pesantren Putra" (tidak ada masjid jami').</span>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn btn-outline" onclick="closeDailyScheduleModal()" style="padding:10px 18px;">Batal</button>
          <button type="submit" class="btn btn-primary" style="padding:10px 22px; font-weight:700; background:#0F4C81; border-color:#0F4C81;">
            💾 Simpan Jadwal
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalOverlay);
  document.getElementById('modalSchedTime')?.focus();
};

window.closeDailyScheduleModal = function() {
  const modal = document.getElementById('modalDailySchedule');
  if (modal) modal.remove();
};

window.handleSaveDailySchedule = function(e, scheduleId) {
  e.preventDefault();
  const time = document.getElementById('modalSchedTime')?.value.trim();
  const activity = document.getElementById('modalSchedActivity')?.value.trim();

  if (!time || !activity) {
    alert('Waktu dan Deskripsi Kegiatan wajib diisi.');
    return;
  }

  const db = getDB();
  if (!db.dailySchedules) db.dailySchedules = [];

  if (scheduleId) {
    const item = db.dailySchedules.find(s => s.id === scheduleId);
    if (item) {
      item.time = time;
      item.activity = activity;
    }
  } else {
    const newId = 'sched-' + Date.now();
    const newOrder = db.dailySchedules.length + 1;
    db.dailySchedules.push({
      id: newId,
      time: time,
      activity: activity,
      order: newOrder
    });
  }

  saveDB(db);
  closeDailyScheduleModal();
  loadCurrentTab();
  if (typeof showToast === 'function') {
    showToast('Jadwal rutin santri berhasil disimpan!', 'success');
  } else {
    alert('Jadwal rutin santri berhasil disimpan!');
  }
};

window.deleteDailySchedule = function(scheduleId) {
  if (!confirm('Apakah Anda yakin ingin menghapus sesi jadwal ini?')) return;
  const db = getDB();
  if (!db.dailySchedules) return;
  db.dailySchedules = db.dailySchedules.filter(s => s.id !== scheduleId);
  // Re-index order
  db.dailySchedules.forEach((s, idx) => { s.order = idx + 1; });
  saveDB(db);
  loadCurrentTab();
  if (typeof showToast === 'function') {
    showToast('Sesi jadwal berhasil dihapus.', 'info');
  }
};

window.moveDailyScheduleOrder = function(idx, direction) {
  const db = getDB();
  const schedules = db.dailySchedules || [];
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= schedules.length) return;

  const temp = schedules[idx];
  schedules[idx] = schedules[targetIdx];
  schedules[targetIdx] = temp;

  schedules.forEach((s, i) => { s.order = i + 1; });
  db.dailySchedules = schedules;
  saveDB(db);
  loadCurrentTab();
};

window.resetDailySchedule = function() {
  if (!confirm('Kembalikan seluruh daftar jadwal santri 24 jam ke pengaturan awal (19 sesi baku)?')) return;
  const db = getDB();
  db.dailySchedules = JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.dailySchedules));
  saveDB(db);
  loadCurrentTab();
  if (typeof showToast === 'function') {
    showToast('Jadwal santri berhasil direset ke standar baku!', 'success');
  } else {
    alert('Jadwal santri berhasil direset ke standar baku!');
  }
};

/* --- TAB 4B: PROGRAM UNGGULAN & KHIDMAH SANTRI (FULL CRUD) --- */
function renderTabPrograms(db, container) {
  const programs = db.programs || [];
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 style="font-size:1.15rem; color:#1E293B; margin:0 0 6px;">Daftar Program Unggulan & Khidmah Santri (${programs.length} Program)</h3>
          <p style="font-size:0.85rem; color:#64748B; margin:0;">Kelola program pembinaan tahfidz 30 juz berbeasiswa, PKMS, bahasa asing, pendalaman kitab, pengabdian, dan kepemimpinan santri.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalProgram()">+ Tambah Program Baru</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:22px;">
        ${programs.map((prog, idx) => `
          <div style="border:1px solid #E2E8F0; border-radius:8px; overflow:hidden; background:#fff; box-shadow:0 3px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column;">
            <div style="position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; background:#0F172A;">
              <img src="${prog.image}" alt="${prog.title}" style="width:100%; height:100%; object-fit:cover; object-position:center; display:block;">
              <span style="position:absolute; top:12px; left:12px; background:rgba(15,76,129,0.92); color:#fff; font-size:0.75rem; font-weight:700; padding:4px 10px; border-radius:4px;">${prog.category}</span>
              ${prog.badge ? `<span style="position:absolute; top:12px; right:12px; background:rgba(16,185,129,0.92); color:#fff; font-size:0.72rem; font-weight:700; padding:4px 8px; border-radius:4px;">${prog.badge}</span>` : ''}
            </div>
            <div style="padding:18px; display:flex; flex-direction:column; flex:1;">
              <h4 style="font-size:1.02rem; font-weight:700; color:#1E293B; margin:0 0 6px;">${prog.title}</h4>
              <div style="font-size:0.8rem; color:#0F4C81; font-weight:600; margin-bottom:10px;">🎯 Sasaran: ${prog.target}</div>
              <p style="font-size:0.84rem; color:#475569; line-height:1.55; margin:0 0 14px; flex:1;">${prog.desc}</p>
              <div style="border-top:1px dashed #E2E8F0; padding-top:12px; font-size:0.78rem; color:#334155;">
                ${(prog.features || []).map(f => `<div style="margin-bottom:4px; display:flex; align-items:center; gap:6px;"><span style="color:#10B981; font-weight:bold;">✓</span> ${f}</div>`).join('')}
              </div>
              <div style="display:flex; gap:8px; margin-top:16px; padding-top:12px; border-top:1px solid #E2E8F0;">
                <button class="btn-action-edit" onclick="openModalProgram(${idx})" style="flex:1; padding:7px 12px; font-size:0.82rem; border-radius:6px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                  ✏️ Edit Program
                </button>
                <button class="btn-action-delete" onclick="deleteProgram(${idx})" style="padding:7px 12px; font-size:0.82rem; border-radius:6px; background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                  🗑️ Hapus
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openModalProgram = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const p = isEdit ? db.programs[editIndex] : {
    title: '',
    category: 'Tahfidz & Beasiswa',
    badge: 'Program Baru',
    tag: 'Program Unggulan',
    target: 'Santri Putra & Putri',
    image: 'assets/program_1_tahfidz.jpg',
    desc: '',
    features: ['Beasiswa pembinaan khusus', 'Setoran hafalan / materi teruji', 'Sertifikat kelulusan resmi']
  };

  const featuresText = Array.isArray(p.features) ? p.features.join('\n') : (p.features || '');

  openAdminModal(isEdit ? 'Edit Program Unggulan' : 'Tambah Program Unggulan Baru', `
    <form onsubmit="saveProgram(event, ${editIndex})">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Nama Program Unggulan *</label>
        <input type="text" id="progTitle" class="form-input" value="${p.title || ''}" placeholder="Contoh: Program Unggulan Tahfidz MI RM" required>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Kategori Program *</label>
          <input type="text" id="progCategory" class="form-input" value="${p.category || ''}" placeholder="Contoh: Tahfidz & Beasiswa, Bahasa, Kitab" required>
        </div>
        <div class="form-group">
          <label class="form-label">Badge Label (Pojok Kanan)</label>
          <input type="text" id="progBadge" class="form-input" value="${p.badge || ''}" placeholder="Contoh: Juz 3 / 30 Juz, Bilingual Aktif">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Sasaran Jenjang / Peserta *</label>
          <input type="text" id="progTarget" class="form-input" value="${p.target || ''}" placeholder="Contoh: MI, MTs, SMP, MA, dan SMA" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tag Tambahan</label>
          <input type="text" id="progTag" class="form-input" value="${p.tag || ''}" placeholder="Contoh: Beasiswa Tahfidz 30 Juz">
        </div>
      </div>

      ${renderImageUploadWidget('progImg', 'Foto Sampul Program', p.image, 1000, 'landscape')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi Lengkap Program *</label>
        <textarea id="progDesc" class="form-textarea" rows="3" placeholder="Tuliskan deskripsi lengkap mengenai tujuan dan pelaksanaan program..." required>${p.desc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Poin Keunggulan / Fitur Program (Satu poin per baris) *</label>
        <textarea id="progFeatures" class="form-textarea" rows="3" placeholder="Beasiswa penuh santri berprestasi&#10;Setoran hafalan bersanad&#10;Terbuka untuk semua jenjang" required>${featuresText}</textarea>
        <span style="font-size:0.75rem; color:#64748B;">Pisahkan setiap poin keunggulan dengan menekan Enter (baris baru).</span>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Program</button>
      </div>
    </form>
  `);
};

window.saveProgram = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.programs) db.programs = [];

  const rawFeatures = document.getElementById('progFeatures').value;
  const features = rawFeatures.split('\n').map(s => s.trim()).filter(Boolean);

  const newObj = {
    id: editIndex !== null && db.programs[editIndex] ? db.programs[editIndex].id : 'prog-' + Date.now(),
    title: document.getElementById('progTitle').value.trim(),
    category: document.getElementById('progCategory').value.trim() || 'Program Unggulan',
    badge: document.getElementById('progBadge').value.trim(),
    tag: document.getElementById('progTag').value.trim(),
    target: document.getElementById('progTarget').value.trim() || 'Semua Jenjang',
    image: document.getElementById('progImg').value.trim() || 'assets/program_1_tahfidz.jpg',
    desc: document.getElementById('progDesc').value.trim(),
    features: features.length > 0 ? features : ['Program pembinaan santri unggulan']
  };

  if (editIndex !== null) {
    db.programs[editIndex] = newObj;
  } else {
    db.programs.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteProgram = function(index) {
  const db = getDB();
  const prog = db.programs && db.programs[index];
  const title = prog ? prog.title : 'program ini';

  if (confirm(`Apakah Anda yakin ingin menghapus program "${title}"?`)) {
    db.programs.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 5: DEWAN PIMPINAN & SAMBUTAN --- */
function renderTabLeadership(db, container) {
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#0A2540;">Dewan Pimpinan & Dewan Pengasuh</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Kelola profil, amanah kepemimpinan, dan framing foto tokoh yang tampil di podium eksekutif website.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalLeader()">+ Tambah Tokoh</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:115px;">Foto <span class="table-ratio-hint">Rasio 3:4 • 600×800 px</span></th>
            <th>Nama Lengkap & Gelar</th>
            <th>Jabatan / Amanah</th>
            <th>Bidang Khusus</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${db.leadership.map((l, index) => `
            <tr>
              <td>
                <div style="width:52px; height:65px; border-radius:8px; overflow:hidden; border:1.5px solid #CBD5E1; background:#0A2540; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                  <img src="${l.photo}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:center top; transform:scale(${l.photoScale || 1}) translateY(${l.photoOffsetY || 0}%); transform-origin:center top;">
                </div>
              </td>
              <td><strong>${l.name}</strong></td>
              <td>${l.role}</td>
              <td>${l.specialty}</td>
              <td style="text-align:center; vertical-align:middle;">
                <div class="admin-table-actions">
                  <button type="button" class="btn-action-edit" onclick="openModalLeader(${index})" title="Edit Profil & Sambutan">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-action-delete" onclick="deleteLeader(${index})" title="Hapus Data">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.updateLeaderLiveFraming = function() {
  const scaleInput = document.getElementById('leadPhotoScale');
  const offsetInput = document.getElementById('leadPhotoOffsetY');
  const preview = document.getElementById('leadPreviewFramed');
  const labelScale = document.getElementById('labelLeadScale');
  const labelOffset = document.getElementById('labelLeadOffsetY');

  if (!scaleInput || !offsetInput || !preview) return;

  const scale = parseFloat(scaleInput.value) || 1;
  const offset = parseInt(offsetInput.value) || 0;

  preview.style.transform = `scale(${scale}) translateY(${offset}%)`;
  preview.style.transformOrigin = 'center top';

  if (labelScale) labelScale.innerText = Math.round(scale * 100) + '%';
  if (labelOffset) labelOffset.innerText = (offset > 0 ? '+' : '') + offset + '%';
};

window.resetLeaderFramingControls = function() {
  const scaleInput = document.getElementById('leadPhotoScale');
  const offsetInput = document.getElementById('leadPhotoOffsetY');
  if (scaleInput) scaleInput.value = 1.0;
  if (offsetInput) offsetInput.value = 0;
  window.updateLeaderLiveFraming();
};

window.openModalLeader = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const l = isEdit ? db.leadership[editIndex] : { name: '', role: 'Dewan Pembina', specialty: 'Bidang Keilmuan', photo: 'assets/leader_ketua.jpg', photoScale: 1.0, photoOffsetY: 0, rating: 'Amanah Kepemimpinan', speechTitle: '', speechContent: '', digitalSign: '' };

  openAdminModal(isEdit ? 'Edit Pimpinan, Sambutan & Framing Foto' : 'Tambah Tokoh Pimpinan', `
    <form onsubmit="saveLeader(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap & Gelar *</label>
          <input type="text" id="leadName" class="form-input" value="${l.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jabatan *</label>
          <input type="text" id="leadRole" class="form-input" value="${l.role}" required>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Fokus / Bidang Khusus *</label>
        <input type="text" id="leadSpec" class="form-input" value="${l.specialty}" required>
      </div>
      
      <!-- UPLOAD WIDGET FOTO RESMI (RASIO 3:4 • 600x800 px) -->
      ${renderImageUploadWidget('leadPhoto', 'Foto Resmi Tokoh / Dewan Pimpinan', l.photo, 800, 'portrait', '3:4', '600 × 800 px')}

      <!-- KONTROL PEMBESARAN / SCALE & FOKUS Y OLEH ADMIN -->
      <div class="photo-framing-box" style="background:linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%); border:1.5px solid #CBD5E1; border-radius:14px; padding:14px 16px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:0.86rem; font-weight:800; color:#0A2540; display:flex; align-items:center; gap:6px;">
              <span>🔍 Penyetelan Skala & Posisi Foto (Scale / Zoom & Focus Y)</span>
            </div>
            <div style="font-size:0.75rem; color:#64748B;">Atur pembesaran dan posisi tinggi/rendah foto agar proporsi kepala dan badan tokoh pas dengan kartu web publik.</div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:3px 10px; background:#FFFFFF;" onclick="resetLeaderFramingControls()">
            ↺ Reset Normal
          </button>
        </div>

        <div style="display:grid; grid-template-columns: 120px 1fr; gap:16px; align-items:center;">
          <!-- Live Arch Frame Box -->
          <div style="text-align:center;">
            <div style="width:110px; height:130px; border-radius:14px; overflow:hidden; position:relative; border:3px solid #FFFFFF; box-shadow:0 6px 16px rgba(10,37,64,0.18), 0 0 0 1px rgba(197,155,39,0.35); background:#0A2540; margin:0 auto;">
              <img id="leadPreviewFramed" src="${l.photo}" alt="" style="width:100%; height:100%; object-fit:cover; object-position:center top; transform:scale(${l.photoScale || 1}) translateY(${l.photoOffsetY || 0}%); transform-origin:center top; transition:transform 0.08s ease;">
            </div>
            <span style="display:inline-block; font-size:0.68rem; font-weight:700; color:#0F4C81; background:#DBEAFE; padding:1px 6px; border-radius:4px; margin-top:5px;">Live Preview Web</span>
          </div>

          <!-- Controls -->
          <div>
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:3px;">
                <span>Perbesaran / Scale (Zoom):</span>
                <span id="labelLeadScale" style="color:#0F4C81; font-weight:800;">${Math.round((l.photoScale || 1) * 100)}%</span>
              </div>
              <input type="range" id="leadPhotoScale" min="0.70" max="2.00" step="0.02" value="${l.photoScale || 1}" style="width:100%; cursor:pointer;" oninput="updateLeaderLiveFraming()">
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#94A3B8;">
                <span>Jauh (70%)</span>
                <span>Normal (100%)</span>
                <span>Besar / Dekat (200%)</span>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; color:#334155; margin-bottom:3px;">
                <span>Posisi Vertikal Y (Geser Atas/Bawah):</span>
                <span id="labelLeadOffsetY" style="color:#0F4C81; font-weight:800;">${l.photoOffsetY || 0}%</span>
              </div>
              <input type="range" id="leadPhotoOffsetY" min="-30" max="30" step="1" value="${l.photoOffsetY || 0}" style="width:100%; cursor:pointer;" oninput="updateLeaderLiveFraming()">
              <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#94A3B8;">
                <span>▲ Geser ke Atas (-30%)</span>
                <span>Tengah (0%)</span>
                <span>▼ Geser ke Bawah (+30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Judul Sambutan Resmi *</label>
        <input type="text" id="leadTitle" class="form-input" value="${l.speechTitle}" required>
      </div>
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Naskah Sambutan Lengkap *</label>
        <textarea id="leadContent" class="form-textarea" rows="5" required>${l.speechContent}</textarea>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Teks Tanda Tangan Digital *</label>
        <input type="text" id="leadSign" class="form-input" value="${l.digitalSign || l.name}" required>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Tokoh</button>
      </div>
    </form>
  `);
};

window.saveLeader = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const photoScaleVal = parseFloat(document.getElementById('leadPhotoScale')?.value) || 1.0;
  const photoOffsetYVal = parseInt(document.getElementById('leadPhotoOffsetY')?.value) || 0;

  let photoVal = document.getElementById('leadPhoto')?.value?.trim();
  if (!photoVal) {
    const preview = document.getElementById('preview_leadPhoto');
    if (preview && preview.src && !preview.src.includes('placehold.co')) {
      photoVal = preview.src;
    }
  }

  const existing = editIndex !== null ? db.leadership[editIndex] : {};

  const newObj = {
    ...existing,
    id: editIndex !== null ? db.leadership[editIndex].id : 'lead-' + Date.now(),
    name: document.getElementById('leadName').value.trim(),
    role: document.getElementById('leadRole').value.trim(),
    specialty: document.getElementById('leadSpec').value.trim(),
    photo: photoVal || existing.photo || 'assets/leader_ketua.jpg',
    photoScale: photoScaleVal,
    photoOffsetY: photoOffsetYVal,
    rating: 'Amanah Kepemimpinan',
    speechTitle: document.getElementById('leadTitle').value.trim(),
    speechContent: document.getElementById('leadContent').value.trim(),
    digitalSign: document.getElementById('leadSign').value.trim()
  };

  if (editIndex !== null) {
    db.leadership[editIndex] = newObj;
  } else {
    db.leadership.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteLeader = function(index) {
  if (confirm('Hapus tokoh pimpinan ini?')) {
    const db = getDB();
    db.leadership.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 5B: MAJELIS MUASSIS & MASYAYIKH PENDIRI (1984) --- */
function renderTabMuassis(db, container) {
  if (!db.muassis || !Array.isArray(db.muassis)) {
    db.muassis = (DEFAULT_YAYASAN_DATA && DEFAULT_YAYASAN_DATA.muassis) ? JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.muassis)) : [];
  }

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <h3 style="margin:0; font-size:1.15rem; color:#0A2540;">Muassis & Masyayikh Pendiri (1984)</h3>
            <span style="font-size:0.7rem; font-weight:800; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:999px; border:1px solid #FCD34D;">EST. 1984</span>
          </div>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Kelola profil, gelar kehormatan, arsip potret, dan rekaman biografi para alim ulama perintis pesantren. Perubahan akan langsung disinkronkan ke halaman web publik <code>sejarah.html</code>.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalMuassis()">+ Tambah Tokoh Muassis</button>
      </div>

      <div style="background:#FFFDF7; border:1px solid rgba(245, 158, 11, 0.35); border-radius:10px; padding:12px 16px; margin-bottom:18px; display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.5rem;">📜</span>
        <div style="font-size:0.82rem; color:#78350F; line-height:1.45;">
          <strong>Kurasi Terbuka:</strong> Jika terdapat tokoh muassis atau sesepuh lain yang belum memiliki foto atau data biografi lengkap, Anda dapat menambahkannya nanti kapan saja via panel ini. Slot arsip di halaman sejarah akan otomatis menyesuaikan jumlah tokoh yang tersimpan.
        </div>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:90px;">Arsip Foto <span class="table-ratio-hint">3:4</span></th>
              <th style="width:140px;">Gelar Kehormatan</th>
              <th>Nama Lengkap & Gelar</th>
              <th>Peran Sejarah & Periode</th>
              <th>Catatan Biografi & Khidmah</th>
              <th style="text-align:center; width:130px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${db.muassis.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align:center; padding:30px; color:#64748B;">
                  Belum ada data tokoh muassis. Klik tombol <strong>+ Tambah Tokoh Muassis</strong> untuk menambahkan tokoh perintis pertama.
                </td>
              </tr>
            ` : db.muassis.map((m, index) => `
              <tr>
                <td>
                  <div style="width:58px; height:76px; border-radius:8px; overflow:hidden; border:2px solid #C59B27; background:#0A2540; box-shadow:0 3px 8px rgba(10,37,64,0.18);">
                    <img src="${m.photo || 'assets/leader_ketua.jpg'}" alt="${m.name}" style="width:100%; height:100%; object-fit:cover; object-position:center top;" onerror="this.onerror=null;this.src='assets/leader_ketua.jpg';">
                  </div>
                </td>
                <td>
                  <span style="font-size:0.72rem; font-weight:800; background:#FFFDF5; color:#92400E; border:1px solid rgba(251,191,36,0.55); padding:3px 8px; border-radius:999px; display:inline-block; white-space:nowrap;">
                    ${m.honorific || 'Muassis Pesantren'}
                  </span>
                </td>
                <td>
                  <strong style="color:#0A2540; font-size:0.92rem;">${m.name}</strong>
                  ${m.period ? `<div style="font-size:0.74rem; color:#64748B; margin-top:2px;">Era: ${m.period}</div>` : ''}
                </td>
                <td>
                  <div style="font-weight:700; color:#B45309; font-size:0.84rem;">${m.role || 'Perintis & Sesepuh'}</div>
                </td>
                <td style="min-width:260px; max-width:380px;">
                  <div class="muassis-note-card" onclick="openModalEditMuassisDesc(${index})" title="Klik untuk mengubah catatan biografi tokoh ini" style="cursor:pointer; background:#F8FAFC; border:1.5px dashed #CBD5E1; border-radius:8px; padding:9px 12px; transition:all 0.2s;" onmouseover="this.style.borderColor='#0284C7'; this.style.backgroundColor='#F0F9FF'; this.style.boxShadow='0 2px 8px rgba(2,132,199,0.12)';" onmouseout="this.style.borderColor='#CBD5E1'; this.style.backgroundColor='#F8FAFC'; this.style.boxShadow='none';">
                    <p style="margin:0 0 8px; font-size:0.81rem; color:#334155; line-height:1.5;">${m.desc || '<em style="color:#94A3B8;">Belum ada catatan biografi. Klik untuk menambahkan...</em>'}</p>
                    <div style="display:inline-flex; align-items:center; gap:6px; font-size:0.72rem; font-weight:700; color:#0284C7; background:rgba(2,132,199,0.08); padding:3px 8px; border-radius:5px; border:1px solid rgba(2,132,199,0.25);">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      <span>Ubah Catatan Biografi ✎</span>
                    </div>
                  </div>
                </td>
                <td style="text-align:center; vertical-align:middle;">
                  <div class="admin-table-actions" style="justify-content:center; flex-direction:column; gap:5px;">
                    <button type="button" class="btn btn-sm" onclick="openModalEditMuassisDesc(${index})" title="Ubah Catatan Khusus" style="font-size:0.72rem; padding:4px 8px; background:#F0FDF4; border:1px solid #86EFAC; color:#166534; font-weight:700; border-radius:6px; display:inline-flex; align-items:center; gap:4px; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      <span>Ubah Catatan</span>
                    </button>
                    <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                      <button type="button" class="btn-action-edit" onclick="openModalMuassis(${index})" title="Edit Semua Data Tokoh">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Edit Profil</span>
                      </button>
                      <button type="button" class="btn-action-delete" onclick="deleteMuassis(${index})" title="Hapus Tokoh">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.openModalMuassis = function(editIndex = null) {
  const db = getDB();
  if (!db.muassis || !Array.isArray(db.muassis)) {
    db.muassis = (DEFAULT_YAYASAN_DATA && DEFAULT_YAYASAN_DATA.muassis) ? JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.muassis)) : [];
  }
  const isEdit = editIndex !== null;
  const m = isEdit ? db.muassis[editIndex] : {
    name: '',
    honorific: 'Muassis Pesantren',
    role: 'Perintis & Sesepuh Pendiri (1984)',
    photo: 'assets/leader_ketua.jpg',
    period: '1984 - Perintis Awal',
    desc: ''
  };

  openAdminModal(isEdit ? 'Edit Tokoh Muassis & Masyayikh (1984)' : 'Tambah Tokoh Muassis & Masyayikh', `
    <form onsubmit="saveMuassis(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap & Gelar Ulama *</label>
          <input type="text" id="muassisName" class="form-input" value="${m.name}" placeholder="Contoh: KH. Sholeh Al-Ayyubi" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gelar Kehormatan / Status *</label>
          <input type="text" id="muassisHonorific" class="form-input" list="honorificOptions" value="${m.honorific || 'Muassis Pesantren'}" placeholder="Pilih atau ketik sendiri..." required>
          <datalist id="honorificOptions">
            <option value="Muassis Pesantren">
            <option value="Al-Maghfurlah">
            <option value="Masyayikh Sepuh">
            <option value="Ulama Perintis (1984)">
            <option value="Tokoh Pendiri Yayasan">
          </datalist>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.3fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Peran / Amanah Sejarah *</label>
          <input type="text" id="muassisRole" class="form-input" value="${m.role || ''}" placeholder="Contoh: Perintis & Sesepuh Pendiri (1984)" required>
        </div>
        <div class="form-group">
          <label class="form-label">Masa / Era Perjuangan</label>
          <input type="text" id="muassisPeriod" class="form-input" value="${m.period || '1984 - Perintis Awal'}" placeholder="Contoh: 1984 - Perintis Awal">
        </div>
      </div>

      <!-- UPLOAD WIDGET FOTO MUASSIS (RASIO 3:4 • 600x800 px) -->
      ${renderImageUploadWidget('muassisPhoto', 'Potret Resmi / Arsip Foto Muassis (Rasio 3:4)', m.photo || 'assets/leader_ketua.jpg', 800, 'portrait', '3:4', '600 × 800 px')}

      <div class="form-group" style="margin-bottom:18px;">
        <label class="form-label">Catatan Biografi & Jejak Khidmah Sejarah *</label>
        <textarea id="muassisDesc" class="form-textarea" rows="4" placeholder="Tuliskan peran keteladanan, sanad keilmuan, dan amanah perjuangan tokoh dalam perintisan pesantren..." required>${m.desc || ''}</textarea>
        <div style="font-size:0.74rem; color:#64748B; margin-top:4px;">Teks biografi ini akan ditampilkan pada kartu kehormatan di bab sejarah web publik.</div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #E2E8F0; padding-top:14px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Tokoh Muassis</button>
      </div>
    </form>
  `);
};

window.saveMuassis = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.muassis || !Array.isArray(db.muassis)) {
    db.muassis = (DEFAULT_YAYASAN_DATA && DEFAULT_YAYASAN_DATA.muassis) ? JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.muassis)) : [];
  }

  let photoVal = document.getElementById('muassisPhoto')?.value?.trim();
  if (!photoVal) {
    const preview = document.getElementById('preview_muassisPhoto');
    if (preview && preview.src && !preview.src.includes('placehold.co')) {
      photoVal = preview.src;
    }
  }

  const existing = editIndex !== null ? db.muassis[editIndex] : {};

  const newObj = {
    ...existing,
    id: editIndex !== null ? db.muassis[editIndex].id : 'muassis-' + Date.now(),
    name: document.getElementById('muassisName').value.trim(),
    honorific: document.getElementById('muassisHonorific').value.trim() || 'Muassis Pesantren',
    role: document.getElementById('muassisRole').value.trim() || 'Perintis & Sesepuh Pendiri',
    period: document.getElementById('muassisPeriod').value.trim() || '1984 - Perintis Awal',
    photo: photoVal || existing.photo || 'assets/leader_ketua.jpg',
    desc: document.getElementById('muassisDesc').value.trim()
  };

  if (editIndex !== null) {
    db.muassis[editIndex] = newObj;
  } else {
    db.muassis.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteMuassis = function(index) {
  if (confirm('Hapus tokoh muassis ini dari galeri sejarah?')) {
    const db = getDB();
    if (db.muassis && Array.isArray(db.muassis)) {
      db.muassis.splice(index, 1);
      saveDB(db);
      loadCurrentTab();
    }
  }
};

/* MODAL KHUSUS EDIT CATATAN BIOGRAFI & KHIDMAH MUASSIS */
window.openModalEditMuassisDesc = function(index) {
  const db = getDB();
  if (!db.muassis || !Array.isArray(db.muassis) || !db.muassis[index]) {
    alert('Data tokoh muassis tidak ditemukan.');
    return;
  }
  const m = db.muassis[index];
  const safeDesc = (m.desc || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  openAdminModal(`Ubah Catatan Biografi & Khidmah`, `
    <form onsubmit="saveModalMuassisDesc(event, ${index})">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="width:48px; height:62px; border-radius:8px; overflow:hidden; border:2px solid #C59B27; background:#0A2540; flex-shrink:0;">
          <img src="${m.photo || 'assets/leader_ketua.jpg'}" alt="${m.name}" style="width:100%; height:100%; object-fit:cover; object-position:center top;" onerror="this.onerror=null;this.src='assets/leader_ketua.jpg';">
        </div>
        <div>
          <div style="font-weight:800; color:#0A2540; font-size:0.96rem;">${m.name}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap;">
            <span style="font-size:0.7rem; font-weight:700; background:#FFFDF5; color:#92400E; border:1px solid rgba(251,191,36,0.5); padding:1px 7px; border-radius:999px;">${m.honorific || 'Muassis Pesantren'}</span>
            <span style="font-size:0.73rem; color:#64748B;">${m.role || 'Perintis & Sesepuh (1984)'}</span>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:16px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <label class="form-label" style="font-weight:700; color:#0A2540; margin-bottom:0;">Catatan Biografi, Rekaman Khidmah & Sanad Perjuangan *</label>
          <span id="muassisDescCharCount" style="font-size:0.72rem; color:#64748B; font-weight:600;">${(m.desc || '').length} karakter</span>
        </div>
        <textarea id="modalMuassisDescInput" class="form-textarea" rows="6" style="width:100%; font-size:0.86rem; line-height:1.55; padding:12px; border:1.5px solid #0284C7; border-radius:8px; box-shadow:0 0 0 3px rgba(2,132,199,0.12);" placeholder="Tuliskan peran keteladanan, sanad keilmuan, dan amanah perjuangan tokoh dalam perintisan pesantren..." oninput="document.getElementById('muassisDescCharCount').textContent = this.value.length + ' karakter';" required>${safeDesc}</textarea>
        <div style="font-size:0.75rem; color:#64748B; margin-top:6px; line-height:1.4;">
          💡 <em>Catatan ini akan langsung diperbarui di kartu kehormatan pada bab sejarah di website publik (<code>sejarah.html</code>).</em>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E2E8F0; padding-top:14px; margin-top:18px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm" style="background:#0F4C81; border-color:#FBBF24; font-weight:700; box-shadow:0 2px 6px rgba(15,76,129,0.25);">
          <span>✓ Simpan Perubahan Catatan</span>
        </button>
      </div>
    </form>
  `);
  setTimeout(() => {
    const input = document.getElementById('modalMuassisDescInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 100);
};

window.saveModalMuassisDesc = function(e, index) {
  e.preventDefault();
  const db = getDB();
  if (!db.muassis || !Array.isArray(db.muassis) || !db.muassis[index]) {
    alert('Gagal menyimpan: data tokoh tidak ditemukan.');
    return;
  }

  const inputEl = document.getElementById('modalMuassisDescInput');
  if (!inputEl) return;

  const newDesc = inputEl.value.trim();
  db.muassis[index].desc = newDesc;

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

/* --- TAB 6: FASILITAS YAYASAN & PESANTREN --- */
function renderTabFacilities(db, container) {
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#0A2540;">Fasilitas Yayasan & Pesantren</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Kelola foto dokumentasi dan spesifikasi sarana prasarana penunjang santri.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalFac()">+ Tambah Fasilitas</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:115px;">Foto <span class="table-ratio-hint">Rasio 3:2 • 800×533 px</span></th>
            <th>Nama Sarana</th>
            <th>Keterangan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${db.facilities.map((f, index) => `
            <tr>
              <td><img src="${f.image}" alt="" style="width:70px; height:45px; object-fit:cover; border-radius:6px;"></td>
              <td><strong>${f.name}</strong></td>
              <td>${f.desc}</td>
              <td style="text-align:center; vertical-align:middle;">
                <div class="admin-table-actions">
                  <button type="button" class="btn-action-edit" onclick="openModalFac(${index})" title="Edit Fasilitas">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-action-delete" onclick="deleteFac(${index})" title="Hapus Fasilitas">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.openModalFac = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const f = isEdit ? db.facilities[editIndex] : {
    name: '',
    category: 'Fasilitas Unggulan',
    capacity: 'Kapasitas Representatif',
    target: 'Santri Putra & Putri',
    operational: 'Sesuai Jadwal Kegiatan',
    desc: '',
    fullDesc: '',
    features: ['Sarana terawat dan higienis', 'Pengawasan pembina asrama'],
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=85'
  };

  const featuresText = Array.isArray(f.features) ? f.features.join('\n') : (f.features || '');

  openAdminModal(isEdit ? 'Edit Fasilitas Pesantren' : 'Tambah Fasilitas Baru', `
    <form onsubmit="saveFac(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Fasilitas *</label>
          <input type="text" id="facName" class="form-input" value="${f.name || ''}" placeholder="Contoh: Kompleks Asrama Santri & Sarana Olahraga" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Sarana</label>
          <input type="text" id="facCategory" class="form-input" value="${f.category || ''}" placeholder="Contoh: Asrama Mukim & Kebugaran">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Kapasitas Sarana</label>
          <input type="text" id="facCapacity" class="form-input" value="${f.capacity || ''}" placeholder="Contoh: 1.200+ Santri Mukim">
        </div>
        <div class="form-group">
          <label class="form-label">Peruntukan Santri / Pengguna</label>
          <input type="text" id="facTarget" class="form-input" value="${f.target || ''}" placeholder="Contoh: Santri Mukim Putra & Putri">
        </div>
      </div>

      ${renderImageUploadWidget('facImg', 'Foto Sarana Fasilitas Yayasan', f.image, 1200, 'facility', '3:2', '800 × 533 px')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Ringkasan Singkat (Tampil di Kartu Depan) *</label>
        <textarea id="facDesc" class="form-textarea" rows="2" placeholder="Ringkasan fungsi dan keunggulan sarana..." required>${f.desc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Narasi Lengkap & Dinamika Santri (Tampil di Dialog Detail)</label>
        <textarea id="facFullDesc" class="form-textarea" rows="3" placeholder="Penjelasan lengkap tentang pemanfaatan sarana dalam kehidupan harian pesantren...">${f.fullDesc || f.desc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Daftar Sarana & Kelengkapan Penunjang (1 per baris)</label>
        <textarea id="facFeatures" class="form-textarea" rows="3" placeholder="Contoh:\nKamar mandi higienis\nLapangan futsal sintetis\nPengawasan 24 jam">${featuresText}</textarea>
        <small style="color:#64748B; font-size:0.78rem;">Tuliskan tiap kelengkapan atau spesifikasi pada baris baru.</small>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Fasilitas</button>
      </div>
    </form>
  `);
};

window.saveFac = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const existing = editIndex !== null ? db.facilities[editIndex] : {};

  const rawFeatures = document.getElementById('facFeatures').value.trim();
  const featuresList = rawFeatures ? rawFeatures.split('\n').map(s => s.trim()).filter(Boolean) : (existing.features || []);

  const newObj = {
    id: editIndex !== null ? existing.id : 'fac-' + Date.now(),
    name: document.getElementById('facName').value.trim(),
    category: document.getElementById('facCategory').value.trim() || 'Fasilitas Unggulan',
    capacity: document.getElementById('facCapacity').value.trim() || 'Kapasitas Representatif',
    target: document.getElementById('facTarget').value.trim() || 'Santri Putra & Putri',
    operational: existing.operational || 'Sesuai Jadwal Kegiatan Pesantren',
    image: document.getElementById('facImg').value.trim() || existing.image || 'assets/pesantren_gedung.jpg',
    desc: document.getElementById('facDesc').value.trim(),
    fullDesc: document.getElementById('facFullDesc').value.trim(),
    features: featuresList
  };

  if (editIndex !== null) {
    db.facilities[editIndex] = newObj;
  } else {
    db.facilities.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteFac = function(index) {
  if (confirm('Hapus fasilitas ini?')) {
    const db = getDB();
    db.facilities.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 6.5: EKSTRAKURIKULER & KEGIATAN SANTRI (CRUD LENGKAP) --- */
function renderTabEkskul(db, container) {
  if (!db.extracurriculars || !Array.isArray(db.extracurriculars)) {
    db.extracurriculars = (DEFAULT_YAYASAN_DATA && DEFAULT_YAYASAN_DATA.extracurriculars) ? JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.extracurriculars)) : [];
  }

  container.innerHTML = `
    <div class="admin-card" style="padding:18px 22px; border:1.5px solid #CBD5E1; background:#FFFFFF;">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:1.08rem; font-weight:800; color:#0A2540;">Ekstrakurikuler & Foto Kegiatan Santri</h3>
            <span style="font-size:0.72rem; font-weight:800; background:#EFF6FF; color:#1D4ED8; padding:2px 8px; border-radius:4px; border:1px solid #BFDBFE;">${db.extracurriculars.length} Kegiatan</span>
          </div>
          <p style="margin:2px 0 0; font-size:0.78rem; color:#64748B;">Kelola foto dokumentasi kegiatan, nama ekstrakurikuler, pembina, jadwal latihan, dan capaian bakat santri.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalEkskul()" style="font-size:0.78rem; font-weight:700; padding:6px 14px; display:inline-flex; align-items:center; gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>+ Tambah Kegiatan Baru</span>
        </button>
      </div>

      <!-- Desktop View: Sleek Table with Image Thumbnail -->
      <div class="desktop-only-table" style="overflow-x:auto;">
        <table class="admin-table table-compact">
          <thead>
            <tr>
              <th style="width:110px; text-align:center;">Foto Kegiatan</th>
              <th style="min-width:210px;">Nama Kegiatan & Kategori</th>
              <th style="min-width:200px;">Pembina & Jadwal</th>
              <th style="min-width:180px;">Keunggulan / Fitur</th>
              <th style="width:120px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${db.extracurriculars.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748B;">Belum ada kegiatan/ekstrakurikuler santri yang ditambahkan.</td></tr>' : ''}
            ${db.extracurriculars.map((e, index) => {
              const feats = Array.isArray(e.features) ? e.features : [];
              return `
                <tr>
                  <td style="vertical-align:middle; text-align:center;">
                    <div style="width:84px; height:56px; border-radius:6px; overflow:hidden; border:1.5px solid #CBD5E1; background:#0A2540; margin:0 auto; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
                      <img src="${e.image || 'assets/hero_santri.jpg'}" alt="${e.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='assets/hero_santri.jpg';">
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                      <strong style="color:#0A2540; font-size:0.88rem; font-weight:800; line-height:1.25;">${e.name}</strong>
                      <span style="font-size:0.68rem; font-weight:700; padding:1px 7px; border-radius:4px; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE;">${e.category || 'Kepesantrenan'}</span>
                      ${e.badge ? `<span style="font-size:0.66rem; font-weight:700; padding:1px 6px; border-radius:4px; background:#FEF3C7; color:#92400E; border:1px solid #FCD34D;">${e.badge}</span>` : ''}
                    </div>
                    ${e.desc ? `<small style="color:#64748B; font-size:0.75rem; display:block; margin-top:3px; line-height:1.3;">${e.desc}</small>` : ''}
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="display:inline-flex; align-items:center; gap:4px; font-weight:700; font-size:0.78rem; color:#0A2540;">
                      <span style="font-size:0.8rem;">👤</span>
                      <span>${e.pembina || '-'}</span>
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:4px; font-size:0.74rem; color:#475569; margin-top:2px;">
                      <span style="color:#D97706; font-size:0.8rem; flex-shrink:0;">⏰</span>
                      <span style="line-height:1.3;">${e.schedule || '-'}</span>
                    </div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                      ${feats.slice(0, 2).map(f => `<span style="font-size:0.68rem; background:#F8FAFC; color:#334155; border:1px solid #E2E8F0; padding:1px 6px; border-radius:3px;">${f}</span>`).join('')}
                      ${feats.length > 2 ? `<span style="font-size:0.68rem; color:#64748B;">+${feats.length - 2} lagi</span>` : ''}
                    </div>
                  </td>
                  <td style="text-align:center; vertical-align:middle;">
                    <div class="admin-table-actions">
                      <button type="button" class="btn-action-edit" onclick="openModalEkskul(${index})" title="Edit Kegiatan">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Edit</span>
                      </button>
                      <button type="button" class="btn-action-delete" onclick="deleteEkskul(${index})" title="Hapus Kegiatan">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile View: Clean Card Layout -->
      <div class="mobile-only-cards" style="display:none; flex-direction:column; gap:10px; margin-top:10px;">
        ${db.extracurriculars.map((e, index) => `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <img src="${e.image || 'assets/hero_santri.jpg'}" alt="${e.name}" style="width:72px; height:48px; object-fit:cover; border-radius:5px; flex-shrink:0; border:1px solid #CBD5E1;">
              <div style="flex:1; min-width:0;">
                <div style="font-weight:800; font-size:0.86rem; color:#0A2540;">${e.name}</div>
                <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">${e.category} • ${e.schedule || '-'}</div>
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:6px; border-top:1px solid #E2E8F0; padding-top:6px;">
              <button type="button" class="btn btn-outline btn-xs" onclick="openModalEkskul(${index})">Edit</button>
              <button type="button" class="btn btn-danger btn-xs" onclick="deleteEkskul(${index})">Hapus</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openModalEkskul = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const e = isEdit ? db.extracurriculars[editIndex] : {
    name: '',
    category: 'Kepanduan & Karakter',
    badge: 'Karakter Santri',
    pembina: '',
    schedule: '',
    desc: '',
    features: ['Disiplin dan kemandirian santri', 'Pembinaan akhlak mulia', 'Penguatan ukhuwah'],
    image: 'assets/kegiatan_roan_santri.jpg'
  };

  const featsText = Array.isArray(e.features) ? e.features.join('\n') : (e.features || '');

  openAdminModal(isEdit ? 'Edit Kegiatan & Ekstrakurikuler Santri' : 'Tambah Kegiatan Santri Baru', `
    <form onsubmit="saveEkskul(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Kegiatan / Ekstrakurikuler *</label>
          <input type="text" id="ekskulName" class="form-input" value="${e.name || ''}" placeholder="Contoh: Gerakan Pramuka Gudep Pesantren" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Kegiatan *</label>
          <select id="ekskulCategory" class="form-input" required>
            <option value="Kepanduan & Karakter" ${e.category === 'Kepanduan & Karakter' ? 'selected' : ''}>Kepanduan & Karakter</option>
            <option value="Seni Musik Islami" ${e.category === 'Seni Musik Islami' ? 'selected' : ''}>Seni Musik Islami (Hadrah/Banjari)</option>
            <option value="Tilawah & Nagham Qur'an" ${e.category === "Tilawah & Nagham Qur'an" ? 'selected' : ''}>Tilawah & Nagham Qur'an (MTQ)</option>
            <option value="Keolahragaan Santri" ${e.category === 'Keolahragaan Santri' ? 'selected' : ''}>Keolahragaan Santri (Futsal & Voli)</option>
            <option value="Teknologi & Dakwah Kreatif" ${e.category === 'Teknologi & Dakwah Kreatif' ? 'selected' : ''}>Teknologi & Dakwah Kreatif (Multimedia)</option>
            <option value="Karakter & Kebersihan Pesantren" ${e.category === 'Karakter & Kebersihan Pesantren' ? 'selected' : ''}>Karakter & Kebersihan Pesantren (Ro'an)</option>
            <option value="Organisasi & Kepemimpinan" ${e.category === 'Organisasi & Kepemimpinan' ? 'selected' : ''}>Organisasi & Kepemimpinan (IPNU/IPPNU)</option>
            <option value="Olahraga & Kebugaran" ${e.category === 'Olahraga & Kebugaran' ? 'selected' : ''}>Olahraga & Kebugaran</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Lencana / Badge Unggulan</label>
          <input type="text" id="ekskulBadge" class="form-input" value="${e.badge || ''}" placeholder="Contoh: Karakter Mandiri / Juara Jatim">
        </div>
        <div class="form-group">
          <label class="form-label">Nama Pembina / Asatidz *</label>
          <input type="text" id="ekskulPembina" class="form-input" value="${e.pembina || ''}" placeholder="Contoh: Ustadz M. Ridwan" required>
        </div>
        <div class="form-group">
          <label class="form-label">Jadwal Rutin Kegiatan *</label>
          <input type="text" id="ekskulSchedule" class="form-input" value="${e.schedule || ''}" placeholder="Contoh: Setiap Sabtu Sore (15.30 - 17.00 WIB)" required>
        </div>
      </div>

      ${renderImageUploadWidget('ekskulImg', 'Foto Dokumentasi Kegiatan Santri (Biasa, Rasio 3:2)', e.image || 'assets/kegiatan_roan_santri.jpg', 800, 'activity', '3:2', '720 × 483 px')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Deskripsi / Sasaran Pembinaan Kegiatan *</label>
        <textarea id="ekskulDesc" class="form-textarea" rows="3" placeholder="Jelaskan tujuan kegiatan, metode latihan, dan dampak pembentukan karakter santri..." required>${e.desc || ''}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Poin Keunggulan / Pembinaan Bakat (1 per baris)</label>
        <textarea id="ekskulFeatures" class="form-textarea" rows="3" placeholder="Contoh:\nPioneering & Tali-Temali\nKemah Akbar Berkala\nKader Tanggap Bencana">${featsText}</textarea>
        <small style="color:#64748B; font-size:0.78rem;">Tuliskan setiap materi keahlian atau pencapaian pada baris baru.</small>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Kegiatan Santri</button>
      </div>
    </form>
  `);
};

window.saveEkskul = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.extracurriculars || !Array.isArray(db.extracurriculars)) {
    db.extracurriculars = [];
  }

  const existing = editIndex !== null ? db.extracurriculars[editIndex] : {};
  const rawFeatures = document.getElementById('ekskulFeatures').value.trim();
  const featuresList = rawFeatures ? rawFeatures.split('\n').map(s => s.trim()).filter(Boolean) : (existing.features || []);

  const newObj = {
    id: editIndex !== null ? existing.id : 'ekskul-' + Date.now(),
    name: document.getElementById('ekskulName').value.trim(),
    category: document.getElementById('ekskulCategory').value.trim() || 'Kepesantrenan',
    badge: document.getElementById('ekskulBadge').value.trim(),
    pembina: document.getElementById('ekskulPembina').value.trim(),
    schedule: document.getElementById('ekskulSchedule').value.trim(),
    image: document.getElementById('ekskulImg').value.trim() || existing.image || 'assets/kegiatan_roan_santri.jpg',
    desc: document.getElementById('ekskulDesc').value.trim(),
    features: featuresList
  };

  if (editIndex !== null) {
    db.extracurriculars[editIndex] = newObj;
  } else {
    db.extracurriculars.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteEkskul = function(index) {
  if (confirm('Hapus kegiatan/ekstrakurikuler santri ini?')) {
    const db = getDB();
    if (db.extracurriculars && Array.isArray(db.extracurriculars)) {
      db.extracurriculars.splice(index, 1);
      saveDB(db);
      loadCurrentTab();
    }
  }
};

/* --- TAB 7: PRESTASI SANTRI --- */
function renderTabAchievements(db, container) {
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 style="margin:0;">Etalase Prestasi Santri & Lembaga</h3>
        <button class="btn btn-primary btn-sm" onclick="openModalAch()">+ Tambah Prestasi</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:75px;">Foto</th>
            <th>Nama Kejuaraan / Prestasi</th>
            <th>Pemenang / Kontingen</th>
            <th>Asal Unit</th>
            <th>Kategori</th>
            <th>Tahun</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${db.achievements.map((a, index) => `
            <tr>
              <td>
                <img src="${a.image || 'assets/hero_santri.jpg'}" alt="${a.title}" style="width:62px; height:42px; border-radius:6px; object-fit:cover; border:1px solid #E2E8F0; display:block;" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
              </td>
              <td class="cell-main-title">
                <div style="font-weight:700; color:#0A2540; font-size:0.92rem;">${a.title}</div>
                <div style="font-size:0.75rem; color:#64748B; margin-top:2px;">🏆 ${a.winner}</div>
              </td>
              <td class="cell-sub-info">
                <span class="cell-mobile-label">Asal Lembaga:</span>
                <span style="font-weight:600; color:#1E293B;">${a.unit}</span>
              </td>
              <td class="cell-sub-badge">
                <span class="cell-mobile-label">Kategori:</span>
                <span class="badge-status badge-verified">${a.category}</span>
              </td>
              <td class="cell-sub-meta">
                <span class="cell-mobile-label">Tahun:</span>
                <span style="font-weight:700; color:#475569;">${a.year}</span>
              </td>
              <td class="cell-actions" style="text-align:center; vertical-align:middle;">
                <div class="admin-table-actions">
                  <button type="button" class="btn-action-edit" onclick="openModalAch(${index})" title="Edit Prestasi">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-action-delete" onclick="deleteAch(${index})" title="Hapus Prestasi">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.openModalAch = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const a = isEdit ? db.achievements[editIndex] : { title: '', winner: '', unit: 'Madrasah Aliyah', category: 'Akademik', year: '2026', image: 'assets/hero_santri.jpg' };

  const stdAchCategories = ['Akademik', 'Seni Islami', 'Tahfidz', 'Kitab Kuning', 'Bahasa', 'Kepanduan', 'Olahraga', 'Robotika', 'Internasional'];
  const isCustom = isEdit && a.category && !stdAchCategories.includes(a.category);

  openAdminModal(isEdit ? 'Edit Prestasi' : 'Tambah Prestasi Baru', `
    <form onsubmit="saveAch(event, ${editIndex})">
      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Nama Kejuaraan / Prestasi *</label>
        <input type="text" id="achTitle" class="form-input" value="${a.title}" required placeholder="Contoh: Medali Emas Olimpiade Sains Nasional">
      </div>
      
      ${renderImageUploadWidget('achImg', 'Foto Dokumentasi Prestasi / Piagam / Medali', a.image || 'assets/hero_santri.jpg', 1200, 'landscape')}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Santri Pemenang *</label>
          <input type="text" id="achWinner" class="form-input" value="${a.winner}" required placeholder="Nama santri atau kontingen">
        </div>
        <div class="form-group">
          <label class="form-label">Asal Unit Satuan *</label>
          <input type="text" id="achUnit" class="form-input" value="${a.unit}" required placeholder="Contoh: MA Raudlatul Muta'allimin">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group">
          <label class="form-label">Pilihan Kategori Kejuaraan *</label>
          <select id="achCategorySelect" class="form-select" onchange="handleCategorySelectChange(this, 'achCustomCatWrapper', 'achCategoryCustom')" required>
            <option value="Akademik" ${a.category === 'Akademik' ? 'selected' : ''}>🔬 Akademik & Sains</option>
            <option value="Seni Islami" ${a.category === 'Seni Islami' ? 'selected' : ''}>📖 Seni Islami, MTQ & Hadrah</option>
            <option value="Tahfidz" ${a.category === 'Tahfidz' ? 'selected' : ''}>⭐ Tahfidzul Qur'an & MHQ</option>
            <option value="Kitab Kuning" ${a.category === 'Kitab Kuning' ? 'selected' : ''}>📚 MQK & Kitab Kuning Turats</option>
            <option value="Bahasa" ${a.category === 'Bahasa' ? 'selected' : ''}>🗣️ Bahasa Asing Arab & Inggris</option>
            <option value="Kepanduan" ${a.category === 'Kepanduan' ? 'selected' : ''}>⛺ Kepanduan & Pramuka Garuda</option>
            <option value="Olahraga" ${a.category === 'Olahraga' ? 'selected' : ''}>🥋 Olahraga & Pencak Silat</option>
            <option value="Robotika" ${a.category === 'Robotika' ? 'selected' : ''}>💻 Robotika, Coding & IT</option>
            <option value="Internasional" ${a.category === 'Internasional' ? 'selected' : ''}>🌍 Tingkat Internasional</option>
            <option value="CUSTOM" ${isCustom ? 'selected' : ''}>✏️ + Kategori Kustom (Ketik Sendiri)...</option>
          </select>
          <div id="achCustomCatWrapper" style="margin-top:8px; display:${isCustom ? 'block' : 'none'};">
            <input type="text" id="achCategoryCustom" class="form-input" value="${isCustom ? a.category : ''}" placeholder="Ketik nama kategori prestasi baru...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tahun Kejuaraan *</label>
          <input type="text" id="achYear" class="form-input" value="${a.year}" required placeholder="2026">
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Prestasi</button>
      </div>
    </form>
  `);
};

window.saveAch = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const imgInput = document.getElementById('achImg');
  const catSelect = document.getElementById('achCategorySelect');
  const catCustom = document.getElementById('achCategoryCustom');

  let category = catSelect ? catSelect.value : 'Akademik';
  if (category === 'CUSTOM') {
    category = (catCustom && catCustom.value.trim()) ? catCustom.value.trim() : 'Prestasi';
  }

  const newObj = {
    id: editIndex !== null ? db.achievements[editIndex].id : 'ach-' + Date.now(),
    title: document.getElementById('achTitle').value,
    winner: document.getElementById('achWinner').value,
    unit: document.getElementById('achUnit').value,
    category: category,
    year: document.getElementById('achYear').value,
    image: imgInput ? imgInput.value : 'assets/hero_santri.jpg'
  };

  if (editIndex !== null) {
    db.achievements[editIndex] = newObj;
  } else {
    db.achievements.push(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteAch = function(index) {
  if (confirm('Hapus prestasi ini?')) {
    const db = getDB();
    db.achievements.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB: GALERI KEHORMATAN TASMIK 5 JUZ AL-QUR'AN --- */
function renderTabTasmik(db, container) {
  const list = db.tasmikRecords || [];
  const parentCount = list.filter(r => r.accompaniment === 'parent').length;
  const independentCount = list.filter(r => r.accompaniment === 'independent').length;

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:12px;">
        <div>
          <h3 style="margin:0 0 6px 0; color:#0A2540;">Galeri Kehormatan Tasmik 5 Juz Al-Qur'an (${list.length} Santri)</h3>
          <p style="margin:0; font-size:0.85rem; color:#64748B;">
            Kelola data kelulusan ujian tasmik 5 juz bil-ghaib: 
            <strong style="color:#059669;">${parentCount} Didampingi Orang Tua</strong> &bull; 
            <strong style="color:#0F4C81;">${independentCount} Mandiri Asrama</strong>.
          </p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModalTasmik()">+ Tambah Santri Tasmik</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:70px; text-align:center;">Foto</th>
            <th>Nama Santri & Satuan</th>
            <th>Rentang Juz</th>
            <th>Status Pendampingan</th>
            <th>Wali / Pendamping</th>
            <th>Dewan Penguji</th>
            <th>Predikat</th>
            <th style="width:120px; text-align:center;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${list.length === 0 ? `
            <tr><td colspan="8" style="text-align:center; padding:30px; color:#94A3B8;">Belum ada data santri tasmik 5 juz. Klik tombol "+ Tambah Santri Tasmik" untuk menambahkan.</td></tr>
          ` : list.map((t, index) => {
            const isParent = t.accompaniment === 'parent';
            const badgeBg = isParent ? '#ECFDF5' : '#F1F5F9';
            const badgeColor = isParent ? '#065F46' : '#1E293B';
            const badgeBorder = isParent ? '#A7F3D0' : '#CBD5E1';
            const badgeText = isParent ? '👨‍👩‍👦 Didampingi Orang Tua' : '🏢 Mandiri (Santri Asrama)';

            return `
              <tr>
                <td style="text-align:center;">
                  <img src="${t.image || 'assets/tahfidz_quran_pesantren.jpg'}" alt="${t.name}" style="width:52px; height:42px; border-radius:6px; object-fit:cover; border:1.5px solid ${isParent ? '#10B981' : '#0F4C81'};">
                </td>
                <td>
                  <strong style="color:#0A2540; font-size:0.92rem;">${t.name}</strong>
                  <div style="font-size:0.75rem; color:#64748B;">${t.unit}</div>
                </td>
                <td>
                  <span style="display:inline-block; font-size:0.75rem; font-weight:700; color:#B45309; background:#FEF3C7; padding:2px 8px; border-radius:4px; border:1px solid #FDE68A;">
                    📖 ${t.juz || '5 Juz'}
                  </span>
                  <div style="font-size:0.70rem; color:#64748B; margin-top:2px;">${t.date || ''}</div>
                </td>
                <td>
                  <span style="display:inline-block; font-size:0.75rem; font-weight:700; color:${badgeColor}; background:${badgeBg}; padding:3px 8px; border-radius:6px; border:1px solid ${badgeBorder}; white-space:nowrap;">
                    ${badgeText}
                  </span>
                </td>
                <td style="font-size:0.82rem; color:#334155;">
                  ${t.parentInfo || '-'}
                </td>
                <td style="font-size:0.80rem; color:#475569;">
                  ${t.tester || '-'}
                </td>
                <td>
                  <span style="display:inline-block; font-size:0.72rem; font-weight:800; color:#0A2540; background:#FEF9C3; padding:2px 6px; border-radius:4px; border:1px solid #FDE047;">
                    ${t.predicate || 'Mumtaz'}
                  </span>
                </td>
                <td style="text-align:center; vertical-align:middle;">
                  <div class="admin-table-actions">
                    <button type="button" class="btn-action-edit" onclick="openModalTasmik(${index})" title="Edit Data Tasmik">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      <span>Edit</span>
                    </button>
                    <button type="button" class="btn-action-delete" onclick="deleteTasmik(${index})" title="Hapus Data Tasmik">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      <span>Hapus</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.openModalTasmik = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const list = db.tasmikRecords || [];
  const t = isEdit ? list[editIndex] : {
    name: '',
    unit: 'MTs Raudlatul Muta\'allimin • Pondok Putra',
    juz: 'Juz 1 – 5 Bil Ghaib',
    juzRange: '1-5',
    accompaniment: 'parent',
    accompanimentLabel: 'Didampingi Orang Tua',
    parentInfo: '',
    tester: 'Ustadz H. Ahmad Muzammil, Al-Hafidz',
    predicate: 'Mumtaz (Istimewa)',
    date: 'September 2026',
    image: 'assets/tahfidz_quran_pesantren.jpg',
    notes: 'Ujian Tasmik 5 Juz sekali duduk bil-ghaib dengan fashohah dan tajwid makharijul huruf yang sangat baik.'
  };

  openAdminModal(isEdit ? 'Edit Data Santri Tasmik 5 Juz' : 'Tambah Santri Tasmik 5 Juz Baru', `
    <form onsubmit="saveTasmik(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.6fr 1.2fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap Santri / Hafidz *</label>
          <input type="text" id="tasmikName" class="form-input" value="${t.name || ''}" placeholder="Contoh: Muhammad Nabil Al-Faruq" required>
        </div>
        <div class="form-group">
          <label class="form-label">Satuan Pendidikan & Asrama *</label>
          <input type="text" id="tasmikUnit" class="form-input" value="${t.unit || ''}" placeholder="Contoh: MTs Raudlatul Muta'allimin • Pondok Putra" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Rentang Juz Tasmik *</label>
          <input type="text" id="tasmikJuz" class="form-input" value="${t.juz || 'Juz 1 – 5 Bil Ghaib'}" placeholder="Contoh: Juz 1 – 5 Bil Ghaib" required>
        </div>
        <div class="form-group">
          <label class="form-label">Status Pendampingan *</label>
          <select id="tasmikAccompaniment" class="form-select" onchange="document.getElementById('tasmikParentInfo').placeholder = this.value === 'parent' ? 'Nama Orang Tua (Bpk & Ibu)...' : 'Keterangan Asrama / Pembina...';" required>
            <option value="parent" ${t.accompaniment === 'parent' ? 'selected' : ''}>👨‍👩‍👦 Didampingi Orang Tua</option>
            <option value="independent" ${t.accompaniment === 'independent' ? 'selected' : ''}>🏢 Mandiri (Santri Asrama)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Predikat Syahadah *</label>
          <select id="tasmikPredicate" class="form-select" required>
            <option value="Mumtaz (Istimewa)" ${t.predicate.includes('Mumtaz') ? 'selected' : ''}>🌟 Mumtaz (Istimewa)</option>
            <option value="Jayyid Jiddan (Sangat Baik)" ${t.predicate.includes('Jayyid Jiddan') ? 'selected' : ''}>✨ Jayyid Jiddan (Sangat Baik)</option>
            <option value="Jayyid (Baik)" ${t.predicate === 'Jayyid (Baik)' ? 'selected' : ''}>👍 Jayyid (Baik)</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.3fr 1.3fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Orang Tua / Wali / Pendamping Asrama *</label>
          <input type="text" id="tasmikParentInfo" class="form-input" value="${t.parentInfo || ''}" placeholder="${t.accompaniment === 'parent' ? 'Contoh: Bpk. H. Sukardi & Ibu Siti Aminah' : 'Contoh: Didampingi Musyrif Asrama Pondok Putra'}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Dewan Penguji Sanad *</label>
          <input type="text" id="tasmikTester" class="form-input" value="${t.tester || ''}" placeholder="Contoh: Ustadz H. Ahmad Muzammil, Al-Hafidz" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tanggal Ujian Setoran *</label>
          <input type="text" id="tasmikDate" class="form-input" value="${t.date || ''}" placeholder="Contoh: 14 September 2026" required>
        </div>
      </div>

      ${renderImageUploadWidget('tasmikImg', 'Foto Dokumentasi Tasmik & Penyerahan Syahadah', t.image, 1000, 'landscape')}

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Catatan & Kesaksian Dewan Penguji *</label>
        <textarea id="tasmikNotes" class="form-textarea" rows="3" placeholder="Catatan fashohah, kelancaran tajwid sekali duduk, atau keharuan orang tua saat mendampingi..." required>${t.notes || ''}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">${isEdit ? 'Simpan Perubahan' : 'Tambahkan Santri Tasmik'}</button>
      </div>
    </form>
  `);
};

window.saveTasmik = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.tasmikRecords) db.tasmikRecords = [];

  const accompanimentVal = document.getElementById('tasmikAccompaniment').value;
  const accompanimentLabel = accompanimentVal === 'parent' ? 'Didampingi Orang Tua' : 'Mandiri (Santri Asrama)';
  const imgInput = document.getElementById('tasmikImg');

  const newObj = {
    id: editIndex !== null && db.tasmikRecords[editIndex] ? db.tasmikRecords[editIndex].id : 'tasmik-' + Date.now(),
    name: document.getElementById('tasmikName').value.trim(),
    unit: document.getElementById('tasmikUnit').value.trim(),
    juz: document.getElementById('tasmikJuz').value.trim(),
    juzRange: document.getElementById('tasmikJuz').value.replace(/[^0-9\-]/g, '') || '5',
    accompaniment: accompanimentVal,
    accompanimentLabel: accompanimentLabel,
    parentInfo: document.getElementById('tasmikParentInfo').value.trim(),
    tester: document.getElementById('tasmikTester').value.trim(),
    predicate: document.getElementById('tasmikPredicate').value.trim(),
    date: document.getElementById('tasmikDate').value.trim(),
    image: (imgInput && imgInput.value.trim()) ? imgInput.value.trim() : 'assets/tahfidz_quran_pesantren.jpg',
    notes: document.getElementById('tasmikNotes').value.trim()
  };

  if (editIndex !== null) {
    db.tasmikRecords[editIndex] = newObj;
  } else {
    db.tasmikRecords.unshift(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteTasmik = function(index) {
  if (confirm('Yakin ingin menghapus data santri tasmik ini?')) {
    const db = getDB();
    if (db.tasmikRecords) {
      db.tasmikRecords.splice(index, 1);
      saveDB(db);
      loadCurrentTab();
    }
  }
};

/* --- TAB: KARYA & KREATIVITAS SANTRI --- */
function renderTabWorks(db, container) {
  const works = db.studentWorks || [];
  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 style="margin:0;">Ruang Karya & Kreativitas Santri (Film, Musik, Sastra, Seni)</h3>
        <button class="btn btn-primary btn-sm" onclick="openModalWork()">+ Tambah Karya Santri</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Thumbnail</th>
            <th>Judul Karya</th>
            <th>Kategori</th>
            <th>Kreator / Santri</th>
            <th>Asal Satuan</th>
            <th>Apresiasi</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${works.map((w, index) => `
            <tr>
              <td><img src="${w.thumbnail}" alt="" style="width:60px; height:42px; border-radius:6px; object-fit:cover;"></td>
              <td><strong>${w.title}</strong><div style="font-size:0.75rem; color:#64748B;">⏱️ ${w.duration || '-'}</div></td>
              <td><span style="font-size:0.75rem; background:#EFF6FF; color:#1D4ED8; padding:3px 8px; border-radius:4px; font-weight:700;">${w.categoryLabel || w.category}</span></td>
              <td>${w.creator}</td>
              <td style="font-size:0.8rem;">${w.unit}</td>
              <td>❤️ ${w.likes || 0}</td>
              <td style="text-align:center; vertical-align:middle;">
                <div class="admin-table-actions">
                  <button type="button" class="btn-action-edit" onclick="openModalWork(${index})" title="Edit Karya Santri">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-action-delete" onclick="deleteWork(${index})" title="Hapus Karya">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.openModalWork = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const works = db.studentWorks || [];
  const w = isEdit ? works[editIndex] : {
    title: '',
    category: 'Film',
    categoryLabel: '🎬 Film Pendek & Sinema',
    creator: '',
    unit: 'Pondok Pesantren Putra',
    date: 'September 2026',
    duration: '10:00 Menit',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    mediaUrl: '',
    synopsis: '',
    crew: '',
    content: '',
    tags: ['SantriKreatif', 'KaryaSantri'],
    likes: 50
  };

  const stdWorkCategories = ['Film', 'Musik', 'Tulisan', 'Seni', 'Riset', 'Dakwah', 'Podcast'];
  const isCustom = isEdit && w.category && !stdWorkCategories.includes(w.category);

  openAdminModal(isEdit ? 'Edit Karya Santri' : 'Tambah Karya Santri Baru', `
    <form onsubmit="saveWork(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.8fr 1.2fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Judul Karya *</label>
          <input type="text" id="workTitle" class="form-input" value="${w.title}" placeholder="Contoh: Cover Sholawat Mughrom / Film Pendek" required>
        </div>
        <div class="form-group">
          <label class="form-label">Pilihan Kategori Karya *</label>
          <select id="workCategorySelect" class="form-select" onchange="handleCategorySelectChange(this, 'workCustomCatWrapper', 'workCategoryCustom')" required>
            <option value="Film" ${w.category === 'Film' ? 'selected' : ''}>🎬 Film Pendek & Sinematografi</option>
            <option value="Musik" ${w.category === 'Musik' ? 'selected' : ''}>🎵 Musik & Cover Sholawat</option>
            <option value="Tulisan" ${w.category === 'Tulisan' ? 'selected' : ''}>✍️ Sastra, Puisi, Cerpen & Esai</option>
            <option value="Seni" ${w.category === 'Seni' ? 'selected' : ''}>🎨 Kaligrafi, Lukis & Seni Rupa</option>
            <option value="Riset" ${w.category === 'Riset' ? 'selected' : ''}>🔬 Inovasi Sains & Robotika</option>
            <option value="Dakwah" ${w.category === 'Dakwah' ? 'selected' : ''}>📱 Dakwah Digital & Multimedia</option>
            <option value="Podcast" ${w.category === 'Podcast' ? 'selected' : ''}>🎙️ Podcast & Wawancara Santri</option>
            <option value="CUSTOM" ${isCustom ? 'selected' : ''}>✏️ + Kategori Kustom (Ketik Sendiri)...</option>
          </select>
          <div id="workCustomCatWrapper" style="margin-top:8px; display:${isCustom ? 'block' : 'none'};">
            <input type="text" id="workCategoryCustom" class="form-input" value="${isCustom ? w.category : ''}" placeholder="Ketik nama kategori karya baru...">
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.5fr 1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Siswa / Santri Kreator *</label>
          <input type="text" id="workCreator" class="form-input" value="${w.creator}" placeholder="Contoh: Ahmad & Tim Sinema MA" required>
        </div>
        <div class="form-group">
          <label class="form-label">Asal Satuan / Asrama *</label>
          <input type="text" id="workUnit" class="form-input" value="${w.unit}" placeholder="Contoh: Ponpes Putra / MA" required>
        </div>
        <div class="form-group">
          <label class="form-label">Durasi / Estimasi *</label>
          <input type="text" id="workDuration" class="form-input" value="${w.duration}" placeholder="Contoh: 04:30 Menit / 3 Menit Baca" required>
        </div>
      </div>

      ${renderImageUploadWidget('workThumb', 'Foto Thumbnail / Poster Karya', w.thumbnail, 1200, 'landscape')}

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Tautan Media (URL YouTube Embed / Audio Stream / Link File)</label>
        <input type="text" id="workMediaUrl" class="form-input" value="${w.mediaUrl || ''}" placeholder="https://www.youtube-nocookie.com/embed/... atau link audio/video">
        <span style="font-size:0.75rem; color:#64748B;">Opsional: Untuk video, tempel link embed YouTube. Untuk tulisan/sastra, dapat dikosongkan.</span>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Sinopsis / Deskripsi Ringkas *</label>
        <textarea id="workSynopsis" class="form-textarea" rows="2" placeholder="Ringkasan isi karya untuk kartu pratinjau..." required>${w.synopsis}</textarea>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label class="form-label">Isi Narasi Tulisan / Bait Lirik Lagu / Makna Filosofis Karya</label>
        <textarea id="workContent" class="form-textarea" rows="5" placeholder="Tuliskan naskah puisi, cerpen, esai lengkap, lirik sholawat, atau filosofi lukisan...">${w.content || ''}</textarea>
      </div>

      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group">
          <label class="form-label">Kredit Kru / Pembimbing (Opsional)</label>
          <input type="text" id="workCrew" class="form-input" value="${w.crew || ''}" placeholder="Contoh: Sutradara: Fulan • Pembina: Ustadz ...">
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Apresiasi (Likes Awal)</label>
          <input type="number" id="workLikes" class="form-input" value="${w.likes || 100}">
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Karya</button>
      </div>
    </form>
  `);
};

window.saveWork = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  if (!db.studentWorks) db.studentWorks = [];

  const catSelect = document.getElementById('workCategorySelect');
  const catCustom = document.getElementById('workCategoryCustom');
  let cat = catSelect ? catSelect.value : 'Film';
  if (cat === 'CUSTOM') {
    cat = (catCustom && catCustom.value.trim()) ? catCustom.value.trim() : 'Karya Santri';
  }

  let catLabel = '🎨 Karya Santri';
  if (cat === 'Film') catLabel = '🎬 Film Pendek & Sinema';
  else if (cat === 'Musik') catLabel = '🎵 Musik & Cover Sholawat';
  else if (cat === 'Tulisan') catLabel = '✍️ Tulisan & Sastra';
  else if (cat === 'Seni') catLabel = '🎨 Kaligrafi & Seni Rupa';
  else if (cat === 'Riset') catLabel = '🔬 Inovasi Sains & Robotika';
  else if (cat === 'Dakwah') catLabel = '📱 Dakwah Digital & Multimedia';
  else if (cat === 'Podcast') catLabel = '🎙️ Podcast & Wawancara Santri';
  else catLabel = `✨ ${cat}`;

  const newObj = {
    id: editIndex !== null ? db.studentWorks[editIndex].id : 'karya-' + Date.now(),
    title: document.getElementById('workTitle').value,
    category: cat,
    categoryLabel: catLabel,
    creator: document.getElementById('workCreator').value,
    unit: document.getElementById('workUnit').value,
    date: editIndex !== null ? db.studentWorks[editIndex].date : 'September 2026',
    duration: document.getElementById('workDuration').value,
    thumbnail: document.getElementById('workThumb').value,
    mediaUrl: document.getElementById('workMediaUrl').value,
    synopsis: document.getElementById('workSynopsis').value,
    content: document.getElementById('workContent').value,
    crew: document.getElementById('workCrew').value,
    likes: parseInt(document.getElementById('workLikes').value) || 0,
    tags: editIndex !== null && db.studentWorks[editIndex].tags ? db.studentWorks[editIndex].tags : ['KaryaSantri', 'Kreatif']
  };

  if (editIndex !== null) {
    db.studentWorks[editIndex] = newObj;
  } else {
    db.studentWorks.unshift(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteWork = function(index) {
  if (confirm('Hapus karya santri ini?')) {
    const db = getDB();
    db.studentWorks.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 8: TESTIMONI SANTRI, ALUMNI & WALI (SISTEM MODERASI & CRUD LENGKAP) --- */
let adminTestiActiveFilter = 'all';

function renderTabTestimonials(db, container) {
  const testimonials = db.testimonials || [];
  
  // Normalisasi data jika status belum didefinisikan (legacy data default 'approved')
  testimonials.forEach(t => {
    if (!t.status) t.status = 'approved';
    if (!t.category) {
      const roleLow = (t.role || '').toLowerCase();
      if (roleLow.includes('wali')) t.category = 'wali';
      else if (roleLow.includes('santri') && !roleLow.includes('wali')) t.category = 'santri';
      else t.category = 'alumni';
    }
  });

  const totalCount = testimonials.length;
  const pendingList = testimonials.filter(t => t.status === 'pending');
  const approvedList = testimonials.filter(t => t.status === 'approved');
  const pendingCount = pendingList.length;
  const approvedCount = approvedList.length;

  // Update badge indikator pada sidebar menu tree admin
  const sidebarTestiItem = document.querySelector('.tree-item[data-tab="testimonials"]');
  if (sidebarTestiItem) {
    let badge = sidebarTestiItem.querySelector('.testi-sidebar-badge');
    if (pendingCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tree-badge testi-sidebar-badge';
        badge.style.cssText = 'background:#F59E0B; color:#FFFFFF; font-weight:800; font-size:0.62rem; padding:1px 6px; border-radius:999px; margin-left:auto;';
        sidebarTestiItem.appendChild(badge);
      }
      badge.textContent = `${pendingCount} Baru`;
      badge.style.display = 'inline-block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  // Filter daftar ulasan sesuai tab admin
  let displayList = testimonials;
  if (adminTestiActiveFilter === 'pending') displayList = pendingList;
  else if (adminTestiActiveFilter === 'approved') displayList = approvedList;

  container.innerHTML = `
    <!-- Top Summary Stat Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:16px; margin-bottom:22px;">
      <div class="admin-stat-card" style="cursor:pointer;" onclick="setAdminTestiFilter('all')">
        <div class="admin-stat-icon-wrap" style="background:#EFF6FF; color:#1D4ED8;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <div class="admin-stat-val">${totalCount}</div>
          <div class="admin-stat-title">Total Seluruh Ulasan</div>
        </div>
      </div>

      <div class="admin-stat-card" style="cursor:pointer; border:1.5px solid ${pendingCount > 0 ? '#F59E0B' : '#E2E8F0'};" onclick="setAdminTestiFilter('pending')">
        <div class="admin-stat-icon-wrap" style="background:#FFFBEB; color:#D97706;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div>
          <div class="admin-stat-val" style="color:${pendingCount > 0 ? '#D97706' : '#1E293B'};">${pendingCount} ${pendingCount > 0 ? '<small style="font-size:0.75rem; color:#D97706; font-weight:700;">(Perlu Ditinjau)</small>' : ''}</div>
          <div class="admin-stat-title">Menunggu Moderasi Humas</div>
        </div>
      </div>

      <div class="admin-stat-card" style="cursor:pointer;" onclick="setAdminTestiFilter('approved')">
        <div class="admin-stat-icon-wrap" style="background:#ECFDF5; color:#059669;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div>
          <div class="admin-stat-val" style="color:#059669;">${approvedCount}</div>
          <div class="admin-stat-title">Tayang di Website Publik</div>
        </div>
      </div>
    </div>

    <!-- Main Card & Moderation Table -->
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:12px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.15rem; color:#0A2540;">Manajemen & Moderasi Testimoni</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">
            Tinjau ulasan publik sebelum tayang. Ulasan berstatus <strong>Menunggu Moderasi</strong> tidak akan tampil di website publik sebelum Anda menyetujuinya.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="openModalTest()">+ Tambah Testimoni Resmi</button>
        </div>
      </div>

      <!-- Moderation Filter Tabs -->
      <div style="display:flex; align-items:center; gap:8px; margin:0 0 18px 0; border-bottom:1px solid #E2E8F0; padding-bottom:12px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm ${adminTestiActiveFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="setAdminTestiFilter('all')" style="border-radius:999px; padding:5px 14px; font-size:0.78rem;">
          Semua Ulasan (${totalCount})
        </button>
        <button type="button" class="btn btn-sm ${adminTestiActiveFilter === 'pending' ? 'btn-primary' : 'btn-outline'}" onclick="setAdminTestiFilter('pending')" style="border-radius:999px; padding:5px 14px; font-size:0.78rem; position:relative;">
          ⏳ Menunggu Moderasi (${pendingCount})
          ${pendingCount > 0 ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#EF4444; margin-left:4px;"></span>' : ''}
        </button>
        <button type="button" class="btn btn-sm ${adminTestiActiveFilter === 'approved' ? 'btn-primary' : 'btn-outline'}" onclick="setAdminTestiFilter('approved')" style="border-radius:999px; padding:5px 14px; font-size:0.78rem;">
          ✓ Ditayangkan (${approvedCount})
        </button>
      </div>

      ${displayList.length === 0 ? `
        <div style="text-align:center; padding:44px 20px; color:#64748B;">
          <div style="font-size:2rem; margin-bottom:8px;">☕</div>
          <h4 style="margin:0 0 4px; color:#0A2540; font-size:1rem;">Tidak Ada Data di Kategori Ini</h4>
          <p style="margin:0; font-size:0.84rem;">
            ${adminTestiActiveFilter === 'pending' ? 'Bagus! Seluruh antrean ulasan telah selesai dimoderasi.' : 'Belum ada data ulasan testimoni.'}
          </p>
        </div>
      ` : `
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width:65px;">Avatar</th>
                <th>Pengirim & Kategori</th>
                <th>Status / Profesi</th>
                <th style="width:130px;">Kontak Verifikasi</th>
                <th style="min-width:240px;">Kutipan Pengalaman</th>
                <th style="width:140px; text-align:center;">Status Moderasi</th>
                <th style="width:110px;">Tanggal Masuk</th>
                <th style="width:145px; text-align:center;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${displayList.map((t) => {
                const actualIndex = db.testimonials.findIndex(item => item.id === t.id);
                const isPending = t.status === 'pending';
                const cleanPhone = (t.whatsapp || '').replace(/[^0-9]/g, '');
                let waLink = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone) : '';

                // Category styling tag
                let catBadge = `<span style="display:inline-block; font-size:0.68rem; font-weight:800; background:#EFF6FF; color:#1E40AF; padding:1px 7px; border-radius:999px; margin-top:3px;">Alumni</span>`;
                if (t.category === 'wali') {
                  catBadge = `<span style="display:inline-block; font-size:0.68rem; font-weight:800; background:#FEF3C7; color:#92400E; padding:1px 7px; border-radius:999px; margin-top:3px;">Wali Santri</span>`;
                } else if (t.category === 'santri') {
                  catBadge = `<span style="display:inline-block; font-size:0.68rem; font-weight:800; background:#ECFDF5; color:#065F46; padding:1px 7px; border-radius:999px; margin-top:3px;">Santri Aktif</span>`;
                } else if (t.category === 'masyarakat') {
                  catBadge = `<span style="display:inline-block; font-size:0.68rem; font-weight:800; background:#F1F5F9; color:#475569; padding:1px 7px; border-radius:999px; margin-top:3px;">Masyarakat</span>`;
                }

                // Avatar fallback
                const initialLetter = (t.name || 'S').trim().charAt(0).toUpperCase();
                const avatarImg = (t.avatar && !t.avatar.includes('placehold.co'))
                  ? `<img src="${t.avatar}" alt="" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:1.5px solid #CBD5E1;">`
                  : `<div style="width:42px; height:42px; border-radius:50%; background:#0A2540; color:#FBBF24; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:0.95rem; border:1.5px solid #FBBF24;">${initialLetter}</div>`;

                return `
                  <tr style="${isPending ? 'background:#FFFDF7;' : ''}">
                    <td style="vertical-align:middle; text-align:center;">
                      ${avatarImg}
                    </td>
                    <td>
                      <div style="font-weight:800; color:#0A2540; font-size:0.9rem;">${t.name}</div>
                      ${catBadge}
                    </td>
                    <td>
                      <div style="font-size:0.83rem; color:#0F4C81; font-weight:600;">${t.role}</div>
                      <div style="color:#C59B27; font-size:0.76rem; margin-top:2px;">${'★'.repeat(t.rating || 5)}</div>
                    </td>
                    <td>
                      ${cleanPhone ? `
                        <a href="https://wa.me/${waLink}?text=Halo%20Bpk/Ibu/Sdr%20${encodeURIComponent(t.name)},%20kami%20dari%20Humas%20YTPAI%20Raudlatul%20Mutaallimin%20Lamongan%20ingin%20mengonfirmasi%20terkait%20testimoni%20yang%20Anda%20kirimkan..." target="_blank" style="display:inline-flex; align-items:center; gap:4px; font-size:0.78rem; color:#059669; font-weight:700; text-decoration:underline;" title="Klik untuk verifikasi via WhatsApp">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.04 2c-5.464 0-9.914 4.45-9.914 9.914 0 1.745.455 3.447 1.319 4.953L2 22l5.253-1.378a9.86 9.86 0 0 0 4.787 1.226h.004c5.464 0 9.914-4.45 9.914-9.914 0-2.648-1.031-5.137-2.9-7.006A9.82 9.82 0 0 0 12.04 2zm5.432 12.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                          <span>${t.whatsapp}</span>
                        </a>
                      ` : `<span style="font-size:0.75rem; color:#94A3B8;">-</span>`}
                    </td>
                    <td style="font-size:0.83rem; color:#334155; line-height:1.55; max-width:320px;">
                      &ldquo;${t.quote}&rdquo;
                    </td>
                    <td style="text-align:center; vertical-align:middle;">
                      ${isPending ? `
                        <span class="badge-testi-status badge-testi-pending">
                          <span>⏳ Menunggu</span>
                        </span>
                      ` : `
                        <span class="badge-testi-status badge-testi-approved">
                          <span>✓ Ditayangkan</span>
                        </span>
                      `}
                    </td>
                    <td style="font-size:0.75rem; color:#64748B;">
                      ${t.submittedAt || 'Data Utama'}
                    </td>
                    <td style="text-align:center; vertical-align:middle;">
                      <div class="admin-table-actions" style="justify-content:center; gap:6px;">
                        ${isPending ? `
                          <button type="button" class="btn-quick-approve" onclick="approveTestimonial('${t.id}')" title="Setujui dan Tayangkan ke Website Publik">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Setujui</span>
                          </button>
                        ` : ''}
                        <button type="button" class="btn-action-edit" onclick="openModalTest(${actualIndex})" title="Edit Rincian Ulasan">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          <span>Edit</span>
                        </button>
                        <button type="button" class="btn-action-delete" onclick="deleteTest(${actualIndex})" title="Hapus Ulasan Ini">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

window.setAdminTestiFilter = function(filter) {
  adminTestiActiveFilter = filter;
  loadCurrentTab();
};

window.approveTestimonial = function(id) {
  const db = getDB();
  const found = (db.testimonials || []).find(t => t.id === id);
  if (!found) return;

  if (confirm(`Setujui ulasan dari "${found.name}" untuk ditayangkan resmi di website publik?`)) {
    found.status = 'approved';
    saveDB(db);
    loadCurrentTab();
  }
};

window.openModalTest = function(editIndex = null) {
  const db = getDB();
  const isEdit = editIndex !== null;
  const t = isEdit ? db.testimonials[editIndex] : {
    name: '',
    category: 'alumni',
    role: 'Alumni SMA (2022) / Mahasiswa PTN',
    whatsapp: '',
    rating: 5,
    status: 'approved',
    quote: '',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80'
  };

  openAdminModal(isEdit ? `Edit Ulasan Testimoni: ${t.name}` : 'Tambah Testimoni Resmi Baru', `
    <form onsubmit="saveTest(event, ${editIndex})">
      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Nama Lengkap & Gelar *</label>
          <input type="text" id="testName" class="form-input" value="${t.name || ''}" placeholder="Contoh: Muhammad Ilham, S.Ked" required>
        </div>
        <div class="form-group">
          <label class="form-label">Kategori Submitter *</label>
          <select id="testCategory" class="form-select" required>
            <option value="alumni" ${t.category === 'alumni' ? 'selected' : ''}>🎓 Alumni</option>
            <option value="wali" ${t.category === 'wali' ? 'selected' : ''}>👨‍👩‍👦 Wali Santri</option>
            <option value="santri" ${t.category === 'santri' ? 'selected' : ''}>🕌 Santri Aktif</option>
            <option value="masyarakat" ${t.category === 'masyarakat' ? 'selected' : ''}>🤝 Tokoh / Mitra Masyarakat</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Status, Profesi atau Asal Unit *</label>
          <input type="text" id="testRole" class="form-input" value="${t.role || ''}" placeholder="Contoh: Alumni MA (2020) - Lulusan Al-Azhar Kairo" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nomor WhatsApp (Verifikasi)</label>
          <input type="tel" id="testWhatsapp" class="form-input" value="${t.whatsapp || ''}" placeholder="08xxxxxxxxxx">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Status Moderasi *</label>
          <select id="testStatus" class="form-select" style="font-weight:700; color:${t.status === 'approved' ? '#059669' : '#D97706'};">
            <option value="approved" ${t.status === 'approved' ? 'selected' : ''}>✓ Ditayangkan (Approved)</option>
            <option value="pending" ${t.status === 'pending' ? 'selected' : ''}>⏳ Menunggu Moderasi (Pending)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Rating Kepuasan (Bintang)</label>
          <select id="testRating" class="form-select">
            <option value="5" ${t.rating == 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5 Bintang - Sangat Puas)</option>
            <option value="4" ${t.rating == 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4 Bintang - Baik Sekali)</option>
            <option value="3" ${t.rating == 3 ? 'selected' : ''}>⭐⭐⭐ (3 Bintang - Cukup)</option>
          </select>
        </div>
      </div>

      <!-- Widget Upload Foto Avatar -->
      ${renderImageUploadWidget('testAvatar', 'Foto Santri / Alumni / Wali (Rasio 1:1 Persegi)', t.avatar, 600, 'avatar', '1:1', '500 × 500 px')}

      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Kutipan Pesan, Kesan & Pengalaman Belajar *</label>
        <textarea id="testQuote" class="form-textarea" rows="4" required placeholder="Tuliskan isi ulasan pengalaman nyata...">${t.quote || ''}</textarea>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminModal()">Batal</button>
        <button type="submit" class="btn btn-primary btn-sm">Simpan Data Testimoni</button>
      </div>
    </form>
  `);
};

window.saveTest = function(e, editIndex) {
  e.preventDefault();
  const db = getDB();
  const catVal = document.getElementById('testCategory').value;

  let verifiedText = 'Terverifikasi Alumni';
  if (catVal === 'wali') verifiedText = 'Terverifikasi Wali Santri';
  else if (catVal === 'santri') verifiedText = 'Terverifikasi Santri';
  else if (catVal === 'masyarakat') verifiedText = 'Mitra Masyarakat';

  let avatarVal = document.getElementById('testAvatar')?.value?.trim();
  if (!avatarVal) {
    const preview = document.getElementById('preview_testAvatar');
    if (preview && preview.src && !preview.src.includes('placehold.co')) {
      avatarVal = preview.src;
    }
  }

  const existing = editIndex !== null ? db.testimonials[editIndex] : {};

  const newObj = {
    ...existing,
    id: editIndex !== null ? db.testimonials[editIndex].id : 'test-' + Date.now(),
    name: document.getElementById('testName').value.trim(),
    category: catVal,
    role: document.getElementById('testRole').value.trim(),
    whatsapp: document.getElementById('testWhatsapp').value.trim(),
    status: document.getElementById('testStatus').value,
    rating: parseInt(document.getElementById('testRating').value, 10) || 5,
    verifiedText: verifiedText,
    avatar: avatarVal || existing.avatar || '',
    quote: document.getElementById('testQuote').value.trim(),
    submittedAt: existing.submittedAt || new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
  };

  if (editIndex !== null) {
    db.testimonials[editIndex] = newObj;
  } else {
    if (!db.testimonials) db.testimonials = [];
    db.testimonials.unshift(newObj);
  }

  saveDB(db);
  closeAdminModal();
  loadCurrentTab();
};

window.deleteTest = function(index) {
  const db = getDB();
  const item = db.testimonials && db.testimonials[index];
  const name = item ? item.name : 'ulasan ini';

  if (confirm(`Yakin ingin menghapus ulasan dari "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
    db.testimonials.splice(index, 1);
    saveDB(db);
    loadCurrentTab();
  }
};

/* --- TAB 9: PENGATURAN YAYASAN & BACKUP (EXECUTIVE COMMAND CENTER) --- */
function renderTabSettings(db, container) {
  // Ensure Gemini API key and active model are always ready out-of-the-box
  if (!db.meta.geminiApiKey) {
    db.meta.geminiApiKey = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.meta && DEFAULT_YAYASAN_DATA.meta.geminiApiKey)
      ? DEFAULT_YAYASAN_DATA.meta.geminiApiKey
      : '';
  }
  if (!db.meta.chatbotModel || db.meta.chatbotModel === 'gemini-3.6-flash') {
    db.meta.chatbotModel = 'gemini-3.1-flash-lite';
    saveDB(db);
  }

  container.innerHTML = `
    <!-- ===================================================================
         1. EXECUTIVE HERO COMMAND BANNER
         =================================================================== -->
    <div class="settings-exec-hero">
      <div class="settings-exec-hero-main">
        <div class="settings-exec-badge">
          <span>⚙️ PUSAT KENDALI UTAMA</span>
          <span class="settings-exec-badge-dot"></span>
          <span>YTPAI RAUDLATUL MUTA'ALLIMIN</span>
        </div>
        <h2 class="settings-exec-title">Konfigurasi Identitas & Sistem Yayasan</h2>
        <p class="settings-exec-desc">
          Kelola profil legalitas, saluran kontak publik, narasi filosofis visi-misi, metrik statistik beranda, integrasi asisten cerdas AI, serta pencadangan data secara terpadu.
        </p>
      </div>
      <div class="settings-exec-actions">
        <button type="button" class="btn-settings-save-hero" onclick="saveSettingsForm()">
          <span>💾</span>
          <span>Simpan Perubahan</span>
        </button>
        <a href="index.html" target="_blank" class="btn-settings-view-site">
          <span>🌐</span>
          <span>Buka Portal Publik ↗</span>
        </a>
      </div>
    </div>

    <!-- ===================================================================
         2. QUICK ANCHOR PILLS (NAVIGASI SEKSI CEPAT)
         =================================================================== -->
    <div class="settings-quick-nav">
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-profile')">
        <span>🏛️</span><span>Identitas Lembaga</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-contacts')">
        <span>📍</span><span>Kontak & Lokasi</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-marquee')">
        <span>📢</span><span>Siaran Marquee</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-vision')">
        <span>📜</span><span>Visi & 5 Pilar Misi</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-stats')">
        <span>📊</span><span>Statistik Beranda</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-ai')">
        <span>🤖</span><span>RAUDLY Neural Studio</span>
      </button>
      <button type="button" class="settings-nav-chip" onclick="scrollToSettingsSection('sec-backup')">
        <span>💾</span><span>Integrasi & Cadangan</span>
      </button>
    </div>

    <!-- ===================================================================
         3. SECTION 1: PROFIL & IDENTITAS LEGALITAS (BENTO 2 COLS)
         =================================================================== -->
    <div class="settings-section-card" id="sec-profile">
      <div class="settings-card-header">
        <div class="settings-header-left">
          <div class="settings-header-icon gold-theme">🏛️</div>
          <div>
            <h3 class="settings-header-title">Identitas Resmi & Legalitas Yayasan</h3>
            <p class="settings-header-sub">Nama resmi badan hukum yayasan dan slogan lembaga yang tampil pada kop resmi, meta SEO, header, dan footer.</p>
          </div>
        </div>
        <span style="font-size:0.7rem; font-weight:800; background:#FFFBEB; color:#92400E; padding:3px 10px; border-radius:6px; border:1px solid #FDE68A;">
          LEGAL METADATA
        </span>
      </div>

      <div class="settings-grid-2col">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.84rem; display:flex; align-items:center; gap:6px;">
            <span>🏛️</span>
            <span>Nama Resmi Lembaga Yayasan</span>
          </label>
          <input type="text" id="setLegal" class="form-input" value="${db.meta.legal}" style="font-weight:700; color:#0A2540;" placeholder="Nama resmi badan hukum yayasan...">
          <small style="color:#64748B; font-size:0.75rem; margin-top:4px; display:block;">Contoh: Yayasan Taman Pendidikan Agama Islam Raudlatul Muta'allimin</small>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.84rem; display:flex; align-items:center; gap:6px;">
            <span>✨</span>
            <span>Slogan / Motto Institusi</span>
          </label>
          <input type="text" id="setSlogan" class="form-input" value="${db.meta.slogan}" style="font-weight:700; color:#0A2540;" placeholder="Slogan utama yayasan...">
          <small style="color:#64748B; font-size:0.75rem; margin-top:4px; display:block;">Tampil di bawah logo navbar dan pada kartu sambutan beranda.</small>
        </div>
      </div>
    </div>

    <!-- ===================================================================
         4. SECTION 2: PUSAT KOMUNIKASI & LOKASI RESMI (BENTO 3 COLS + MAPS)
         =================================================================== -->
    <div class="settings-section-card" id="sec-contacts">
      <div class="settings-card-header">
        <div class="settings-header-left">
          <div class="settings-header-icon blue-theme">📍</div>
          <div>
            <h3 class="settings-header-title">Saluran Komunikasi Publik & Lokasi Pesantren</h3>
            <p class="settings-header-sub">Nomor hotline resmi sekretariat, WhatsApp layanan PPDB, email resmi, dan integrasi titik peta Google Maps.</p>
          </div>
        </div>
        <span style="font-size:0.7rem; font-weight:800; background:#EFF6FF; color:#1E40AF; padding:3px 10px; border-radius:6px; border:1px solid #BFDBFE;">
          PUBLIC CHANNELS
        </span>
      </div>

      <!-- 3 Kontak Utama -->
      <div class="settings-grid-3col">
        <div class="settings-contact-box">
          <div class="settings-contact-box-header">
            <span>☎️</span>
            <span class="settings-contact-box-title">Telepon Kantor / Sekretariat</span>
          </div>
          <input type="text" id="setPhone" class="form-input" value="${db.meta.phone}" placeholder="0856-4884-7070" style="font-weight:700;">
          <small style="color:#64748B; font-size:0.72rem; margin-top:4px; display:block;">Buka Sabtu s.d. Kamis 07.00 - 14.00 WIB</small>
        </div>

        <div class="settings-contact-box" style="background:#F0FDF4; border-color:#DCFCE7;">
          <div class="settings-contact-box-header">
            <span>💬</span>
            <span class="settings-contact-box-title" style="color:#166534;">Hotline WhatsApp PPDB</span>
          </div>
          <input type="text" id="setWA" class="form-input" value="${db.meta.whatsapp}" placeholder="+62 857-0433-2952" style="font-weight:700; color:#15803D;">
          <small style="color:#64748B; font-size:0.72rem; margin-top:4px; display:block;">Digunakan pada floating WhatsApp & CTA santri baru</small>
        </div>

        <div class="settings-contact-box">
          <div class="settings-contact-box-header">
            <span>✉️</span>
            <span class="settings-contact-box-title">Alamat Email Resmi</span>
          </div>
          <input type="email" id="setEmail" class="form-input" value="${db.meta.email}" placeholder="sekretariat@..." style="font-weight:700;">
          <small style="color:#64748B; font-size:0.72rem; margin-top:4px; display:block;">Korespondensi resmi & surat masuk lembaga</small>
        </div>
      </div>

      <!-- Alamat Lengkap -->
      <div class="form-group" style="margin-bottom:18px;">
        <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.84rem; display:flex; align-items:center; gap:6px;">
          <span>📌</span>
          <span>Alamat Kompleks Yayasan & Pondok Pesantren</span>
        </label>
        <input type="text" id="setAddress" class="form-input" value="${db.meta.address}" style="font-weight:600;" placeholder="Alamat lengkap yayasan...">
        <small style="color:#64748B; font-size:0.74rem; margin-top:4px; display:block;">
          Wajib mencantumkan: Dusun Tegalrejo, Desa Datinawong, Kec. Babat, Kab. Lamongan, Jawa Timur.
        </small>
      </div>

      <!-- Google Maps Integration -->
      <div class="settings-grid-maps">
        <div class="form-group" style="margin-bottom:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
            <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.8rem; margin:0;">
              Tautan Langsung Google Maps (Share Link)
            </label>
            ${db.meta.mapsUrl ? `<a href="${db.meta.mapsUrl}" target="_blank" style="font-size:0.72rem; font-weight:800; color:#0284C7; text-decoration:underline;">Uji Rute ↗</a>` : ''}
          </div>
          <input type="url" id="setMapsUrl" class="form-input" value="${db.meta.mapsUrl || 'https://maps.app.goo.gl/ePeaKwX8PnkgPYGy9'}" placeholder="https://maps.app.goo.gl/..." style="font-size:0.8rem;">
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.8rem; margin-bottom:5px;">
            URL Sematan Peta Interaktif (Google Maps Embed)
          </label>
          <input type="text" id="setMapsEmbed" class="form-input" value="${db.meta.mapsEmbedUrl || ''}" placeholder="https://www.google.com/maps/embed?pb=..." style="font-size:0.8rem; font-family:monospace;">
        </div>
      </div>
    </div>

    <!-- ===================================================================
         5. SECTION 3: SIARAN PENGUMUMAN BERJALAN (MARQUEE & LIVE PREVIEW)
         =================================================================== -->
    <div class="settings-section-card" id="sec-marquee">
      <div class="settings-card-header">
        <div class="settings-header-left">
          <div class="settings-header-icon green-theme">📢</div>
          <div>
            <h3 class="settings-header-title">Teks Siaran Berjalan (Running Text / Marquee)</h3>
            <p class="settings-header-sub">Pesan pengumuman penting yang berputar otomatis di bilah atas portal publik untuk seluruh pengunjung.</p>
          </div>
        </div>
        <span style="font-size:0.7rem; font-weight:800; background:#ECFDF5; color:#047857; padding:3px 10px; border-radius:6px; border:1px solid #A7F3D0;">
          BROADCAST TICKER
        </span>
      </div>

      <!-- Live Marquee Simulator Strip -->
      <div class="settings-marquee-live-preview">
        <span class="settings-marquee-tag">LIVE PREVIEW</span>
        <div class="settings-marquee-scroll-area">
          <marquee id="marqueeLivePreviewText" scrollamount="6" onmouseover="this.stop();" onmouseout="this.start();">
            ${db.meta.runningText || "⭐ Penerimaan Santri Baru (PPDB) 2026/2027 Telah Dibuka • 🎓 Pendaftaran Online 24 Jam via Portal Web Resmi & Sekretariat Yayasan"}
          </marquee>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label class="form-label" style="margin:0; font-weight:700; color:#0F4C81; font-size:0.82rem;">
            Konten Teks Siaran (Pisahkan setiap berita dengan simbol •)
          </label>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="insertMarqueeTag('•')" style="font-size:0.72rem; padding:2px 8px; border-color:#CBD5E1;">
              + Sisipkan Poin ( • )
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="insertMarqueeTag('⭐ Penerimaan Santri Baru (PPDB) 2026/2027 Telah Dibuka •')" style="font-size:0.72rem; padding:2px 8px; border-color:#FBBF24; color:#B45309; background:#FFFBEB;">
              + Poin PPDB
            </button>
          </div>
        </div>
        <textarea id="setRunningText" class="form-textarea" rows="3" style="font-size:0.84rem; line-height:1.5;" oninput="updateMarqueeLivePreview()" placeholder="Tuliskan pengumuman berjalan. Pisahkan setiap poin dengan tanda titik bulat ( • ).">${db.meta.runningText || "⭐ Penerimaan Santri Baru (PPDB) 2026/2027 Telah Dibuka • 🎓 Pendaftaran Online 24 Jam via Portal Web Resmi & Sekretariat Yayasan • 📖 Program Unggulan: Tahfidzul Qur'an 30 Juz Bersanad & Kajian Kitab Kuning Turats Salaf • 🚀 Bimbingan Intensif LBB Sukses PTN, SNBT, Kedinasan & Simulasi CBT • 🕋 Pelayanan Bimbingan Ibadah Haji & Umrah KBIHU Resmi Kemenag RI"}</textarea>
        <small style="color:#64748B; font-size:0.74rem; margin-top:4px; display:block;">
          Tips: Gunakan emoji yang relevan (⭐, 🎓, 📖, 🚀, 🕋) agar bilah pengumuman terlihat dinamis dan menarik perhatian santri baru.
        </small>
      </div>
    </div>

    <!-- ===================================================================
         6. SECTION 4: LANDASAN FILOSOFIS (VISI & 5 PILAR MISI)
         =================================================================== -->
    <div class="settings-section-card" id="sec-vision">
      <div class="settings-card-header">
        <div class="settings-header-left">
          <div class="settings-header-icon gold-theme">📜</div>
          <div>
            <h3 class="settings-header-title">Landasan Filosofis: Visi Resmi & 5 Pilar Misi</h3>
            <p class="settings-header-sub">Teks visi dan 5 butir misi yang tampil secara seimbang pada profil resmi yayasan (#tentang).</p>
          </div>
        </div>
        <span style="font-size:0.7rem; font-weight:800; background:#FFFBEB; color:#92400E; padding:3px 10px; border-radius:6px; border:1px solid #FDE68A;">
          GOLDEN BENCHMARK
        </span>
      </div>

      <div class="settings-grid-vision">
        <!-- Kolom Kiri: Visi Resmi -->
        <div style="display:flex; flex-direction:column; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px 20px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:1.1rem; color:#B45309;">❝</span>
            <label class="form-label" style="margin:0; font-weight:800; color:#0F4C81; font-size:0.86rem;">
              Visi Resmi Lembaga
            </label>
          </div>
          <p style="font-size:0.74rem; color:#64748B; margin:0 0 10px; line-height:1.4;">
            Menjadi arah kiblat pendidikan terpadu dalam mencetak generasi muslim berilmu, bertakwa, dan berdaya saing global.
          </p>
          <textarea id="setVision" class="form-textarea" rows="8" style="font-size:0.84rem; flex:1; resize:none; line-height:1.5; font-weight:600;" placeholder="Visi resmi lembaga...">${db.meta.vision || ''}</textarea>
        </div>

        <!-- Kolom Kanan: 5 Pilar Misi -->
        <div style="display:flex; flex-direction:column; background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px 20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">🎯</span>
              <label class="form-label" style="margin:0; font-weight:800; color:#0F4C81; font-size:0.86rem;">
                5 Pilar Misi Yayasan (Tulis 1 Poin Per Baris)
              </label>
            </div>
            <span style="font-size:0.68rem; font-weight:800; background:#E0F2FE; color:#0369A1; padding:2px 8px; border-radius:4px;">
              5 POIN TERSTRUKTUR
            </span>
          </div>
          <p style="font-size:0.74rem; color:#64748B; margin:0 0 10px; line-height:1.4;">
            Sistem otomatis menyusun butir-butir misi dengan nomor indeks di kartu misi profil yayasan.
          </p>
          <textarea id="setMission" class="form-textarea" rows="8" style="font-size:0.84rem; flex:1; resize:none; line-height:1.5;" placeholder="Tuliskan tiap butir misi pada baris baru...">${Array.isArray(db.meta.missionList) ? db.meta.missionList.join('\n') : (db.meta.mission || '')}</textarea>
        </div>
      </div>
    </div>

    <!-- ===================================================================
         7. SECTION 5: METRIK STATISTIK TERAPUNG BERANDA (4-KPI GRID)
         =================================================================== -->
    <div class="settings-section-card" id="sec-stats">
      <div class="settings-card-header">
        <div class="settings-header-left">
          <div class="settings-header-icon purple-theme">📊</div>
          <div>
            <h3 class="settings-header-title">Metrik Statistik Terapung Beranda (Hero KPI)</h3>
            <p class="settings-header-sub">Empat kartu angka statistik capaian yang melayang di banner hero halaman beranda portal web.</p>
          </div>
        </div>
        <span style="font-size:0.7rem; font-weight:800; background:#FAF5FF; color:#7E22CE; padding:3px 10px; border-radius:6px; border:1px solid #E9D5FF;">
          HERO STATS
        </span>
      </div>

      <div class="settings-kpi-grid">
        <!-- KPI 1 -->
        <div class="settings-kpi-card">
          <div class="settings-kpi-top">
            <span class="settings-kpi-title">Total Santri Aktif</span>
            <div class="settings-kpi-icon" style="background:#EFF6FF; border-color:#BFDBFE; color:#1D4ED8;">👨‍🎓</div>
          </div>
          <input type="text" id="setStatSantri" class="settings-kpi-input" value="${db.meta.stats.santri}" placeholder="2.500+">
          <small style="color:#64748B; font-size:0.72rem;">Santri mukim & siswa formal</small>
        </div>

        <!-- KPI 2 -->
        <div class="settings-kpi-card">
          <div class="settings-kpi-top">
            <span class="settings-kpi-title">Asatidz & Guru Master</span>
            <div class="settings-kpi-icon" style="background:#FFFBEB; border-color:#FDE68A; color:#B45309;">👨‍🏫</div>
          </div>
          <input type="text" id="setStatTeachers" class="settings-kpi-input" value="${db.meta.stats.teachers}" placeholder="150+">
          <small style="color:#64748B; font-size:0.72rem;">Pendidik berkualifikasi</small>
        </div>

        <!-- KPI 3 -->
        <div class="settings-kpi-card">
          <div class="settings-kpi-top">
            <span class="settings-kpi-title">Satuan Unit Formal</span>
            <div class="settings-kpi-icon" style="background:#ECFDF5; border-color:#A7F3D0; color:#047857;">🏫</div>
          </div>
          <input type="text" id="setStatUnits" class="settings-kpi-input" value="${db.meta.stats.units}" placeholder="7 Unit Formal">
          <small style="color:#64748B; font-size:0.72rem;">Jenjang KB sampai SMA</small>
        </div>

        <!-- KPI 4 -->
        <div class="settings-kpi-card">
          <div class="settings-kpi-top">
            <span class="settings-kpi-title">Status Akreditasi</span>
            <div class="settings-kpi-icon" style="background:#FEF2F2; border-color:#FECACA; color:#DC2626;">🏆</div>
          </div>
          <input type="text" id="setStatAccred" class="settings-kpi-input" value="${db.meta.stats.accreditation}" placeholder="A (Unggul)">
          <small style="color:#64748B; font-size:0.72rem;">Standar BAN-SM & Kemenag</small>
        </div>
      </div>
    </div>

    <!-- ===================================================================
         8. SECTION 6: MAXIMIZED AI ASSISTANT & RAUDLY NEURAL STUDIO
         =================================================================== -->
    <div id="sec-ai"></div>
    <div class="admin-ai-studio-card">
      <div class="admin-ai-header">
        <div class="admin-ai-header-left">
          <div class="admin-ai-header-icon" style="padding:0; overflow:hidden; border:2px solid #FBBF24; background:#FFFFFF; display:flex; align-items:center; justify-content:center;">
            <img id="adminAiHeaderMascot" src="${db.meta.chatbotMascot || 'assets/raudly_avatar_v2.jpg'}" alt="Maskot RAUDLY" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">
          </div>
          <div>
            <h3 class="admin-ai-header-title">Integrasi Asisten Cerdas Santri (RAUDLY Neural Studio)</h3>
            <p class="admin-ai-header-sub">Pusat kendali kecerdasan buatan mandiri, kustomisasi avatar maskot, dual-key gotong royong, dan simulator langsung</p>
          </div>
        </div>
        <div>
            ${(() => {
              const hasPrimary = db.meta && (db.meta.geminiApiKey || db.meta.raudlyApiKey) && (db.meta.geminiApiKey || db.meta.raudlyApiKey).trim();
              const hasSecondary = db.meta && db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim();
              if (hasPrimary && hasSecondary) {
                return `
                  <span class="admin-ai-status-pill active" id="adminAiStatusBadge" style="background:#ECFDF5; border-color:#10B981; color:#047857;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; animation:pulse 1.8s infinite;"></span>
                    <span>⚡ Gotong Royong Aktif (Dual-Engine: 3.000 Chat/Hari)</span>
                  </span>
                `;
              } else if (hasPrimary || hasSecondary) {
                return `
                  <span class="admin-ai-status-pill active" id="adminAiStatusBadge">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34D399; animation:pulse 1.8s infinite;"></span>
                    <span>🟢 RAUDLY Neural Engine Aktif (v3-Pro Online)</span>
                  </span>
                `;
              } else {
                return `
                  <span class="admin-ai-status-pill" id="adminAiStatusBadge" style="background:#FEF3C7; border-color:#FCD34D; color:#92400E;">
                    <span>🟡 Mode Basis Data Lokal</span>
                  </span>
                `;
              }
            })()}
          </div>
        </div>

        <div class="admin-ai-body">
          <div class="admin-ai-grid">
            <!-- Left Column: Otentikasi & Pengaturan Model AI -->
            <div class="admin-ai-subcard">
              <h4 class="admin-ai-subcard-title">
                <span>🔑</span>
                <span>Koneksi Mesin Kecerdasan & Multi-Key Gateway</span>
              </h4>

              <!-- ENGINE 0: Groq LPU (Ultra-Fast Turbo Engine ~0,2s) -->
              <div class="admin-engine-card status-${(db.meta && db.meta.groqApiKey && db.meta.groqApiKey.trim()) || localStorage.getItem('ytpai_groq_api_key_backup') ? (localStorage.getItem('ytpai_groq_status') || 'connected') : 'empty'}" id="engineCardGroq">
                <div class="engine-card-header">
                  <div class="engine-card-title-group">
                    <h5 class="engine-card-title">
                      <span>⚡ Mesin Akselerator LPU (Groq Cloud)</span>
                    </h5>
                    <span class="engine-type-tag" style="background:#059669; color:#FFFFFF;">TURBO 0,2s</span>
                    <span style="font-size:0.65rem; background:#D1FAE5; color:#065F46; padding:1px 6px; border-radius:10px; font-weight:800;">100% GRATIS</span>
                  </div>
                  <span class="engine-badge-status" id="engineBadgeGroq">
                    <span class="engine-pulse-dot"></span>
                    <span>${((db.meta && db.meta.groqApiKey && db.meta.groqApiKey.trim()) || localStorage.getItem('ytpai_groq_api_key_backup')) ? (localStorage.getItem('ytpai_groq_status') === 'error' ? 'GAGAL KONEKSI' : 'TERHUBUNG (~180ms)') : 'KOSONG / STANDBY'}</span>
                  </span>
                </div>

                <div class="admin-key-input-group">
                  <input type="password" id="setGroqApiKey" class="form-input" style="background:#FFFFFF; font-size:0.82rem;" 
                    value="${(db.meta && db.meta.groqApiKey && db.meta.groqApiKey.trim()) ? db.meta.groqApiKey : (localStorage.getItem('ytpai_groq_api_key_backup') || '')}" 
                    placeholder="Masukkan Kunci Akses Groq (contoh: gsk_...)..."
                    oninput="autoPersistGroqKey(this.value)">
                  <button type="button" class="admin-btn-toggle-eye" onclick="toggleApiKeyVisibility('setGroqApiKey')" title="Tampilkan / Sembunyikan Kunci Groq" aria-label="Toggle Password Visibility">
                    👁️
                  </button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; flex-wrap:wrap; gap:6px;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="testGroqApiKeyAdmin()" style="font-size:0.75rem; padding:5px 12px; border-color:#059669; color:#059669; font-weight:800; background:#FFFFFF;">
                    🧪 Uji Kunci Groq (Ping ~0,2s)
                  </button>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="font-size:0.73rem; color:#065F46; font-weight:800; text-decoration:underline;">
                    Ambil Kunci Gratis di console.groq.com ↗
                  </a>
                </div>
                <div id="adminPingFeedbackGroq" class="admin-ping-feedback"></div>

                <div style="margin-top:8px; display:flex; gap:10px; align-items:center;">
                  <label style="font-size:0.75rem; font-weight:700; color:#065F46; margin:0; white-space:nowrap;">Model Groq:</label>
                  <select id="setGroqModel" class="form-select" style="font-size:0.78rem; padding:4px 8px; border-color:#A7F3D0; background:#FFFFFF;" onchange="autoPersistGroqModel(this.value)">
                    <option value="qwen/qwen3.8-27b" ${(db.meta.groqModel === 'qwen/qwen3.8-27b' || !db.meta.groqModel || db.meta.groqModel === 'llama-3.1-8b-instant' || db.meta.groqModel === 'llama-3.3-70b-versatile') ? 'selected' : ''}>
                      ⚡ Qwen 3.8 27B (Direkomendasikan: Super Cerdas, Fasih Bahasa Indonesia & Pesantren)
                    </option>
                    <option value="groq/compound-mini" ${(db.meta.groqModel === 'groq/compound-mini') ? 'selected' : ''}>
                      🚀 Groq Compound Mini (Agen Ringan & Ultra Cepat)
                    </option>
                    <option value="openai/gpt-oss-20b" ${(db.meta.groqModel === 'openai/gpt-oss-20b') ? 'selected' : ''}>
                      🧠 OpenAI GPT-OSS 20B (High Precision)
                    </option>
                    <option value="allam-2-7b" ${(db.meta.groqModel === 'allam-2-7b') ? 'selected' : ''}>
                      📖 Allam 2 7B (Model Bahasa Arab & Nilai Pesantren)
                    </option>
                  </select>
                </div>
                <small style="color:#047857; font-size:0.72rem; margin-top:6px; display:block; line-height:1.4;">
                  💡 <strong>Keunggulan Turbo:</strong> Jawaban keluar seketika dalam ~0,2 detik. Jika kuota harian habis, sistem otomatis beralih ke Engine 1 (Google Gemini).
                </small>
              </div>

              <!-- ENGINE 1: Google Gemini Neural (Primary Key) -->
              <div class="admin-engine-card status-${(db.meta && db.meta.geminiApiKey && db.meta.geminiApiKey.trim()) ? (localStorage.getItem('ytpai_gemini1_status') || 'connected') : 'empty'}" id="engineCardGemini1">
                <div class="engine-card-header">
                  <div class="engine-card-title-group">
                    <h5 class="engine-card-title">
                      <span>🌐 Mesin Neural Utama (Google Gemini)</span>
                    </h5>
                    <span class="engine-type-tag" style="background:#0F4C81; color:#FFFFFF;">ENGINE 1</span>
                    <span style="font-size:0.65rem; background:#E0F2FE; color:#0369A1; padding:1px 6px; border-radius:10px; font-weight:800;">PRIMARY</span>
                  </div>
                  <span class="engine-badge-status" id="engineBadgeGemini1">
                    <span class="engine-pulse-dot"></span>
                    <span>${(localStorage.getItem('ytpai_gemini1_status') === 'error') ? 'GAGAL KONEKSI' : 'AKTIF (SIAP PAKAI)'}</span>
                  </span>
                </div>

                <div class="admin-key-input-group">
                  <input type="password" id="setGeminiApiKey" class="form-input" style="background:#FFFFFF; font-size:0.82rem;" 
                    value="${(db.meta && db.meta.geminiApiKey && db.meta.geminiApiKey.trim()) ? db.meta.geminiApiKey : ''}" 
                    placeholder="Masukkan Kunci Akses Resmi Mesin Kecerdasan..."
                    oninput="if(!this.value.trim()) updateEngineCardUI('Gemini1','empty');">
                  <button type="button" class="admin-btn-toggle-eye" onclick="toggleApiKeyVisibility('setGeminiApiKey')" title="Tampilkan / Sembunyikan API Key" aria-label="Toggle Password Visibility">
                    👁️
                  </button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; flex-wrap:wrap; gap:6px;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="testGeminiApiKeyAdmin('primary')" style="font-size:0.75rem; padding:5px 12px; border-color:#0F4C81; color:#0F4C81; font-weight:800; background:#FFFFFF;">
                    🧪 Uji Kunci Utama (Ping)
                  </button>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="font-size:0.73rem; color:#0F4C81; font-weight:800; text-decoration:underline;">
                    Panduan Token Akses Resmi ↗
                  </a>
                </div>
                <div id="adminPingFeedback" class="admin-ping-feedback"></div>
              </div>

              <!-- ENGINE 2: Google Gemini Cadangan (Gotong Royong 50:50) -->
              <div class="admin-engine-card status-${(db.meta && db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim()) ? (localStorage.getItem('ytpai_gemini2_status') || 'connected') : 'empty'}" id="engineCardGemini2">
                <div class="engine-card-header">
                  <div class="engine-card-title-group">
                    <h5 class="engine-card-title">
                      <span>🤝 Mesin Cadangan Gotong Royong (Opsional)</span>
                    </h5>
                    <span class="engine-type-tag" style="background:#475569; color:#FFFFFF;">ENGINE 2</span>
                    <span style="font-size:0.65rem; background:#F1F5F9; color:#475569; padding:1px 6px; border-radius:10px; font-weight:800;">50:50 SHARING</span>
                  </div>
                  <span class="engine-badge-status" id="engineBadgeGemini2">
                    <span class="engine-pulse-dot"></span>
                    <span>${(db.meta && db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim()) ? (localStorage.getItem('ytpai_gemini2_status') === 'error' ? 'GAGAL KONEKSI' : 'TERPASANG (AKTIF)') : 'OPSIONAL (KOSONG)'}</span>
                  </span>
                </div>

                <div class="admin-key-input-group">
                  <input type="password" id="setGeminiApiKeySecondary" class="form-input" style="background:#FFFFFF; font-size:0.82rem;" 
                    value="${(db.meta && db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim()) ? db.meta.geminiApiKeySecondary : ''}" 
                    placeholder="Kosongkan jika belum punya (bisa menyusul)..."
                    oninput="if(!this.value.trim()) updateEngineCardUI('Gemini2','empty');">
                  <button type="button" class="admin-btn-toggle-eye" onclick="toggleApiKeyVisibility('setGeminiApiKeySecondary')" title="Tampilkan / Sembunyikan API Key Cadangan" aria-label="Toggle Password Visibility">
                    👁️
                  </button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; flex-wrap:wrap; gap:6px;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="testGeminiApiKeyAdmin('secondary')" style="font-size:0.75rem; padding:5px 12px; border-color:#059669; color:#059669; font-weight:800; background:#FFFFFF;">
                    🧪 Uji Kunci Cadangan (Ping)
                  </button>
                  <span style="font-size:0.72rem; color:#64748B; font-weight:600;">Status: ${(db.meta && db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim()) ? '✅ Terpasang' : '⚪ Opsional (Belum diisi)'}</span>
                </div>
                <div id="adminPingFeedbackSecondary" class="admin-ping-feedback"></div>
                
                <div style="margin-top:8px; padding:7px 10px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; font-size:0.72rem; color:#166534; line-height:1.45;">
                  💡 <strong>Sistem Gotong Royong Otomatis:</strong><br>
                  • <strong>1 Kunci Terpasang:</strong> Kapasitas standar normal (~1.500 respons/hari).<br>
                  • <strong>2 Kunci Terpasang:</strong> Beban dibagi 50:50 melipatgandakan kuota menjadi ~<strong>3.000 respons/hari</strong> dan auto-failover otomatis jika salah satu kunci mencapai limit.
                </div>
              </div>

              <!-- AI Model Selection -->
              <div class="form-group" style="margin-bottom:14px;">
                <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.82rem; margin-bottom:6px;">
                  Pilihan Arsitektur Mesin Kecerdasan
                </label>
                <select id="setChatbotModel" class="form-select" style="font-size:0.84rem; padding:8px 12px;">
                  <option value="gemini-3.1-flash-lite" ${(!db.meta.chatbotModel || db.meta.chatbotModel === 'gemini-3.1-flash-lite') ? 'selected' : ''}>
                    🚀 Raudly Neural 3.1 Lite (Direkomendasikan: Super Cepat & Kuota Efisien)
                  </option>
                  <option value="gemini-3.6-flash" ${(db.meta.chatbotModel === 'gemini-3.6-flash') ? 'selected' : ''}>
                    ⚡ Raudly Neural 3.6 Pro (Cerdas & Analitis)
                  </option>
                  <option value="gemini-3.5-flash" ${(db.meta.chatbotModel === 'gemini-3.5-flash') ? 'selected' : ''}>
                    🎯 Raudly Neural 3.5 Core (Stabil & Presisi)
                  </option>
                  <option value="gemini-flash-latest" ${(db.meta.chatbotModel === 'gemini-flash-latest') ? 'selected' : ''}>
                    🌟 Raudly Neural Latest Edition (Versi Mutakhir)
                  </option>
                </select>
                <small style="color:#64748B; font-size:0.74rem; margin-top:4px; display:block;">
                  Jika kuota koneksi habis atau offline, asisten cerdas otomatis beralih ke <strong>Mesin Pencarian Semantik Lokal</strong> tanpa hambatan.
                </small>
              </div>

              <!-- Assistant Name & Custom System Instructions -->
              <div class="form-group" style="margin-bottom:14px;">
                <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.82rem; margin-bottom:6px;">
                  Nama Karakter & Persona Asisten
                </label>
                <input type="text" id="setChatbotName" class="form-input" value="${db.meta.chatbotName || 'RAUDLY - Asisten Santri Digital'}" placeholder="Contoh: RAUDLY - Asisten Santri Digital">
              </div>

              <div class="form-group" style="margin-bottom:14px;">
                <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.82rem; margin-bottom:6px;">
                  Pesan Sambutan Awal (Welcome Greeting)
                </label>
                <textarea id="setChatbotGreeting" class="form-textarea" rows="2" style="font-size:0.8rem; resize:vertical;" placeholder="Biarkan kosong untuk menggunakan sapaan default ramah & islami">${db.meta.chatbotGreeting || ''}</textarea>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.82rem; margin-bottom:6px;">
                  Memo Pengetahuan Khusus / Promo Tambahan (Opsional)
                </label>
                <textarea id="setChatbotInstructions" class="form-textarea" rows="2" style="font-size:0.8rem; resize:vertical;" placeholder="Contoh: Selama bulan Ramadhan ada diskon formulir PPDB 50%, atau informasi manasik haji KBIHU Sabtu depan...">${db.meta.chatbotInstructions || ''}</textarea>
                <small style="color:#64748B; font-size:0.74rem; margin-top:4px; display:block;">
                  Teks ini langsung diintegrasikan ke memori konteks asisten agar dapat menyampaikan info terkini secara presisi.
                </small>
              </div>
            </div>

            <!-- Right Column: Studio Maskot & Avatar Karakter -->
            <div class="admin-ai-subcard">
              <h4 class="admin-ai-subcard-title">
                <span>🎨</span>
                <span>Studio Maskot & Avatar Karakter</span>
              </h4>

              <!-- Visual Avatar Showcase -->
              <div class="admin-mascot-showcase">
                <div class="admin-mascot-avatar-lg">
                  <img id="mascotPreviewImg" src="${db.meta.chatbotMascot || 'assets/raudly_avatar_v2.jpg'}" alt="Maskot RAUDLY" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';">
                  <span style="display:none; font-size:1.8rem; color:#FFFFFF;">🕌</span>
                </div>
                <div>
                  <div style="font-size:0.92rem; font-weight:800; color:#0F4C81;">
                    ${db.meta.chatbotName || 'RAUDLY'}
                  </div>
                  <div style="font-size:0.75rem; color:#059669; font-weight:700; margin-top:2px;">
                    ✓ Format Gambar Santri Didukung Penuh
                  </div>
                  <div style="font-size:0.72rem; color:#64748B; margin-top:4px;">
                    Avatar ini akan menyapa santri dan wali murid pada floating widget & gelembung chat.
                  </div>
                </div>
              </div>

              <!-- Pilihan Maskot Preset Cepat -->
              <div style="margin-bottom:14px; padding:10px 12px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px;">
                <div style="font-size:0.75rem; font-weight:800; color:#0F4C81; margin-bottom:8px;">🌟 Koleksi Karakter Maskot Santri Resmi:</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline btn-sm" onclick="setPresetMascot('assets/raudly_avatar_v2.jpg')" style="padding:5px 12px; font-size:0.75rem; border-color:#059669; color:#065F46; font-weight:800; background:#ECFDF5; border-radius:8px;">
                    🌿 Maskot Santri Baru 2026 (Hijau-Emas)
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" onclick="setPresetMascot('assets/raudly_avatar_hd.png')" style="padding:5px 12px; font-size:0.75rem; border-color:#0F4C81; color:#0F4C81; font-weight:800; background:#F0F9FF; border-radius:8px;">
                    🎓 Maskot Santri Cilik (Peci Hitam)
                  </button>
                </div>
              </div>

              <!-- Avatar Toolset -->
              <div class="form-group" style="margin-bottom:14px;">
                <label class="form-label" style="font-weight:700; color:#0F4C81; font-size:0.82rem; margin-bottom:6px;">
                  Path Berkas / Data URI Maskot
                </label>
                <input type="text" id="setChatbotMascot" class="form-input" value="${db.meta.chatbotMascot || 'assets/raudly_avatar_v2.jpg'}" placeholder="assets/raudly_avatar_v2.jpg atau Data URI" style="font-size:0.8rem; font-family:monospace;" oninput="const img=document.getElementById('mascotPreviewImg'); if(img){ img.src=this.value; img.style.display='block'; } const hImg=document.getElementById('adminAiHeaderMascot'); if(hImg){ hImg.src=this.value; }">
              </div>

              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
                <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('mascotFileInput').click()" style="padding:6px 14px; font-size:0.78rem;">
                  📁 Unggah Maskot Baru (PNG/JPG)
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="openImageCropper('setChatbotMascot', document.getElementById('setChatbotMascot').value, 'avatar')" style="padding:6px 14px; font-size:0.78rem; border-color:#FBBF24; color:#B45309; font-weight:700;">
                  ✂️ Sesuaikan Crop & Zoom
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="resetMascotDefault()" style="padding:6px 12px; font-size:0.78rem; color:#64748B;">
                  ↺ Reset Maskot Default
                </button>
                <input type="file" id="mascotFileInput" style="display:none;" accept="image/*" onchange="handleMascotUpload(event)">
              </div>

              <!-- Quick Save Button for Settings Section -->
              <div style="margin-top:auto; padding-top:14px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:0.76rem; color:#64748B;">
                  Klik simpan untuk menerapkan seluruh konfigurasi ke portal publik.
                </span>
                <button type="button" class="btn btn-primary btn-sm" onclick="saveSettingsForm()" style="padding:6px 16px; font-size:0.8rem; font-weight:800;">
                  💾 Simpan Seluruh Pengaturan AI
                </button>
              </div>
            </div>
          </div>

          <!-- ===================================================================
               LIVE CHATBOT SIMULATOR PLAYGROUND (INTERACTIVE TEST BENCH)
               =================================================================== -->
          <div class="admin-sim-container">
            <div class="admin-sim-header">
              <div class="admin-sim-header-info">
                <div class="admin-sim-avatar-sm">
                  <img id="adminSimAvatar" src="${db.meta.chatbotMascot || 'assets/mascot.png'}" alt="Simulator Mascot" onerror="this.src='assets/mascot.png'">
                </div>
                <div>
                  <div class="admin-sim-title">
                    <span id="adminSimBotName">${db.meta.chatbotName || 'RAUDLY'}</span>
                    <span style="font-size:0.72rem; font-weight:normal; opacity:0.85;">— Live Chatbot Preview & Simulator</span>
                  </div>
                  <div class="admin-sim-sub">
                    <span>🟢</span>
                    <span id="adminSimEngineStatus">
                      ${(db.meta.geminiApiKey && db.meta.geminiApiKey.trim()) ? 'Terhubung ke Gateway Neural Mandiri (Online Aktif)' : 'Mode Pencarian Semantik Lokal Aktif'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <button type="button" class="btn btn-outline btn-sm" onclick="clearAdminSimulatorChat()" style="background:rgba(255,255,255,0.15); border-color:rgba(255,255,255,0.3); color:#FFFFFF; font-size:0.74rem; padding:4px 10px;">
                  🔄 Bersihkan Sesi Uji Coba
                </button>
              </div>
            </div>

            <!-- Simulator Chat Message Window -->
            <div class="admin-sim-body" id="adminSimChatBody">
              <!-- Initial Welcome Message dynamically injected on init -->
            </div>

            <!-- Quick Scenario Simulator Chips -->
            <div class="admin-sim-scenarios">
              <span style="font-size:0.74rem; font-weight:800; color:#0F4C81; display:inline-flex; align-items:center; margin-right:4px;">
                💡 Skenario Cepat:
              </span>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Kenalan dengan RAUDLY')" style="border-color:#FBBF24; color:#B45309; font-weight:800; background:#FFFBEB;">
                👋 Kenalan dengan RAUDLY
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Siapa ketua Bimbingan Belajar LBB dan siapa saja tentor masternya?')">
                🚀 Ketua & Tentor Bimbel LBB
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Bagaimana alur dan syarat pendaftaran santri baru PPDB 2026?')">
                📋 Alur & Biaya PPDB 2026
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Sebutkan 7 unit pendidikan formal dari KB sampai SMA di YTPAI Lamongan!')">
                🏫 7 Satuan Pendidikan Formal
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Bagaimana sistem asrama mukim dan kurikulum pondok pesantren putra putri?')">
                🕌 Pondok Pesantren Mukim
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Informasi bimbingan manasik haji dan umrah KBIHU')">
                🕋 Manasik Haji & Umrah KBIHU
              </button>
              <button type="button" class="admin-sim-chip" onclick="sendAdminSimQuickQuery('Di mana alamat lengkap, maps, dan nomor kontak resmi yayasan?')">
                📍 Lokasi & Kontak Resmi
              </button>
            </div>

            <!-- Simulator Input Footer -->
            <div class="admin-sim-footer">
              <input type="text" id="adminSimInput" class="admin-sim-input" placeholder="Ketik pertanyaan untuk menguji respons RAUDLY (contoh: 'Halo', 'Berapa biaya asrama?', 'Siapa pimpinan yayasan?')..." onkeydown="if(event.key === 'Enter') handleAdminSimulatorSend();">
              <button type="button" class="btn btn-primary btn-md" onclick="handleAdminSimulatorSend()" style="padding:8px 18px; font-weight:800; white-space:nowrap; display:inline-flex; align-items:center; gap:6px;">
                <span>Kirim</span>
                <span>🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           7. SECTION 7: INTEGRASI GA4 & CADANGAN BASIS DATA (BENTO 2 COLS)
           =================================================================== -->
      <div class="settings-section-card" id="sec-backup" style="margin-top:24px;">
        <div class="settings-card-header">
          <div class="settings-header-left">
            <div class="settings-header-icon blue-theme">💾</div>
            <div>
              <h3 class="settings-header-title">Integrasi Sistem Eksternal & Cadangan Basis Data</h3>
              <p class="settings-header-sub">Pelacakan global Google Analytics 4 (GA4) dan pemulihan data berkas JSON yayasan.</p>
            </div>
          </div>
          <span style="font-size:0.7rem; font-weight:800; background:#EFF6FF; color:#1E40AF; padding:3px 10px; border-radius:6px; border:1px solid #BFDBFE;">
            SYSTEM & ARCHIVE
          </span>
        </div>

        <div class="settings-grid-backup" style="align-items:stretch;">
          <!-- Left Col: GA4 Integration -->
          <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px 20px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.1rem;">📈</span>
                  <label class="form-label" style="margin:0; font-weight:800; color:#0F4C81; font-size:0.86rem;">
                    Google Analytics 4 (GA4)
                  </label>
                </div>
                ${db.meta.gaId ? '<span style="font-size:0.7rem; font-weight:800; background:#ECFDF5; color:#047857; padding:2px 8px; border-radius:4px; border:1px solid #A7F3D0;">🟢 Terhubung</span>' : '<span style="font-size:0.7rem; color:#64748B;">⚪ Opsional</span>'}
              </div>
              <p style="font-size:0.74rem; color:#64748B; margin:0 0 10px; line-height:1.4;">
                Masukkan Measurement ID dari dashboard Google Analytics (Admin &gt; Data Streams) untuk merekam statistik global.
              </p>
              <input type="text" id="setGaId" class="form-input" value="${db.meta.gaId || ''}" placeholder="Contoh: G-XXXXXXXXXX" style="font-family:monospace; font-weight:700;">
            </div>
            <div style="margin-top:14px; padding-top:12px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.72rem; color:#64748B;">Analitik Kunjungan Live</span>
              <button type="button" class="btn btn-outline btn-sm" onclick="switchToTab('analytics')" style="font-size:0.74rem; padding:4px 10px; font-weight:700;">
                Buka Dasbor Analitik ↗
              </button>
            </div>
          </div>

          <!-- Right Col: Backup & Restore -->
          <div style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:14px; padding:18px 20px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-size:1.1rem;">🗂️</span>
                <label class="form-label" style="margin:0; font-weight:800; color:#0F4C81; font-size:0.86rem;">
                  Cadangan & Pemulihan Basis Data
                </label>
              </div>
              <p style="font-size:0.74rem; color:#64748B; margin:0 0 12px; line-height:1.4;">
                Unduh seluruh data (berita, unit, pimpinan, data pendaftar) ke dalam berkas JSON mandiri agar aman dan dapat dipindahkan.
              </p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary btn-sm" onclick="downloadBackupJSON()" style="font-size:0.76rem; padding:6px 14px; font-weight:800;">
                  💾 Unduh JSON
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('importFileInput').click()" style="font-size:0.76rem; padding:6px 14px; font-weight:700;">
                  📂 Impor Data
                </button>
                <input type="file" id="importFileInput" style="display:none;" accept=".json" onchange="importBackupJSON(event)">
              </div>
            </div>
            <div style="margin-top:14px; padding-top:12px; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.7rem; color:#DC2626; font-weight:600;">Zona Tindakan Kritis</span>
              <button type="button" class="btn btn-outline btn-sm" style="color:#DC2626; border-color:#FCA5A5; font-size:0.72rem; padding:3px 10px;" onclick="triggerFactoryReset()">
                ⚠️ Reset Default
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           STATIC CLEAN FOOTER SAVE CARD (NON-STICKY, ZERO INTRUSION)
           =================================================================== -->
      <div class="settings-footer-save-card">
        <div class="settings-footer-info">
          <span class="settings-footer-icon">⚡</span>
          <div>
            <strong class="settings-footer-title">Pusat Kontrol Identitas Yayasan</strong>
            <p class="settings-footer-sub">Seluruh pembaruan langsung disinkronisasi ke portal publik dan widget santri.</p>
          </div>
        </div>
        <button type="button" class="settings-footer-btn" onclick="saveSettingsForm()">
          <span>💾</span>
          <span>Simpan Seluruh Pengaturan</span>
        </button>
      </div>
    `;

    // Helper: Scroll to settings section smoothly
    window.scrollToSettingsSection = function(id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Helper: Insert Marquee Tag
    window.insertMarqueeTag = function(tag) {
      const t = document.getElementById('setRunningText');
      if (t) {
        t.value += ' ' + tag + ' ';
        window.updateMarqueeLivePreview();
      }
    };

    // Helper: Live preview marquee
    window.updateMarqueeLivePreview = function() {
      const t = document.getElementById('setRunningText');
      const p = document.getElementById('marqueeLivePreviewText');
      if (t && p) {
        p.textContent = t.value || 'Belum ada teks pengumuman.';
      }
    };

    // Initialize Simulator Messages
    setTimeout(() => {
      initAdminSimulatorChat();
    }, 50);
  }

  /* ===================================================================
     SUPER ADMIN AI CHATBOT CONTROLLER & SIMULATOR METHODS
     =================================================================== */

  // Toggle API Key Masking (supports custom target element ID)
  window.toggleApiKeyVisibility = function(inputId = 'setGeminiApiKey') {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = (input.type === 'password') ? 'text' : 'password';
  };

  // Reset Mascot to Default
  window.resetMascotDefault = function() {
    if (confirm('Kembalikan maskot avatar ke gambar default resmi (RAUDLY Santri)?')) {
      const defaultMascot = 'assets/raudly_avatar_v2.jpg';
      const input = document.getElementById('setChatbotMascot');
      const preview = document.getElementById('mascotPreviewImg');
      const simAvatar = document.getElementById('adminSimAvatar');
      const headerMascot = document.getElementById('adminAiHeaderMascot');
      if (input) input.value = defaultMascot;
      if (preview) { preview.src = defaultMascot; preview.style.display = 'block'; }
      if (simAvatar) simAvatar.src = defaultMascot;
      if (headerMascot) headerMascot.src = defaultMascot;
    }
  };

  // Set Preset Mascot Quickly
  window.setPresetMascot = function(path) {
    const input = document.getElementById('setChatbotMascot');
    const preview = document.getElementById('mascotPreviewImg');
    const simAvatar = document.getElementById('adminSimAvatar');
    const headerMascot = document.getElementById('adminAiHeaderMascot');
    if (input) input.value = path;
    if (preview) { preview.src = path; preview.style.display = 'block'; }
    if (simAvatar) simAvatar.src = path;
    if (headerMascot) headerMascot.src = path;
  };

  // Dynamic Engine Card Status Manager (🟢 HIJAU, 🔴 MERAH, ⚪ ABU-ABU)
  window.updateEngineCardUI = function(engineId, status, latencyOrMsg = '') {
    const card = document.getElementById('engineCard' + engineId);
    const badge = document.getElementById('engineBadge' + engineId);
    if (!card || !badge) return;

    card.classList.remove('status-connected', 'status-error', 'status-empty');

    if (status === 'connected') {
      card.classList.add('status-connected');
      const timeStr = latencyOrMsg ? ` (${latencyOrMsg})` : '';
      badge.innerHTML = `<span class="engine-pulse-dot"></span> <span>TERHUBUNG${timeStr}</span>`;
      try { localStorage.setItem('ytpai_' + engineId.toLowerCase() + '_status', 'connected'); } catch(e) {}
    } else if (status === 'error') {
      card.classList.add('status-error');
      const errStr = latencyOrMsg ? ` (${latencyOrMsg})` : '';
      badge.innerHTML = `<span class="engine-pulse-dot"></span> <span>GAGAL KONEKSI${errStr}</span>`;
      try { localStorage.setItem('ytpai_' + engineId.toLowerCase() + '_status', 'error'); } catch(e) {}
    } else {
      card.classList.add('status-empty');
      badge.innerHTML = `<span class="engine-pulse-dot"></span> <span>KOSONG / STANDBY</span>`;
      try { localStorage.setItem('ytpai_' + engineId.toLowerCase() + '_status', 'empty'); } catch(e) {}
    }
  };

  // Test Gateway connectivity from Admin (supports primary & secondary keys)
  window.testGeminiApiKeyAdmin = async function(target = 'primary') {
    const isSecondary = (target === 'secondary');
    const inputId = isSecondary ? 'setGeminiApiKeySecondary' : 'setGeminiApiKey';
    const feedbackId = isSecondary ? 'adminPingFeedbackSecondary' : 'adminPingFeedback';
    const engineKey = isSecondary ? 'Gemini2' : 'Gemini1';
    const keyInput = document.getElementById(inputId);
    const modelInput = document.getElementById('setChatbotModel');
    const feedback = document.getElementById(feedbackId);
    if (!keyInput || !feedback) return;

    const apiKey = keyInput.value.trim();
    const model = modelInput ? modelInput.value : 'gemini-3.1-flash-lite';
    const label = isSecondary ? 'Kunci Cadangan' : 'Kunci Utama';

    if (!apiKey) {
      window.updateEngineCardUI(engineKey, 'empty');
      feedback.className = 'admin-ping-feedback error';
      feedback.innerHTML = `<span>⚠️ Masukkan ${label} terlebih dahulu sebelum melakukan uji coba.</span>`;
      feedback.style.display = 'flex';
      return;
    }

    // Set badge to testing
    const badge = document.getElementById('engineBadge' + engineKey);
    if (badge) {
      badge.innerHTML = `<span class="engine-pulse-dot" style="background:#3B82F6;"></span> <span>MENGUJI PING...</span>`;
    }

    feedback.className = 'admin-ping-feedback testing';
    feedback.innerHTML = `<span>⏳ Mengirim sinyal uji coba (ping) menggunakan ${label}...</span>`;
    feedback.style.display = 'flex';

    const testFn = (window.YtpaiAi && (window.YtpaiAi.testRaudlyApi || window.YtpaiAi.testGeminiApiKey));
    if (testFn) {
      const res = await testFn(apiKey, model, (currentModel) => {
        feedback.innerHTML = `<span>⏳ Menguji gateway arsitektur <strong>${currentModel}</strong> (maks. 4 dtk)...</span>`;
      });
      if (res.success) {
        window.updateEngineCardUI(engineKey, 'connected', res.latencyMs + 'ms');

        if (res.autoSwitched && modelInput && !isSecondary) {
          let optExists = false;
          for (let opt of modelInput.options) {
            if (opt.value === res.model) { optExists = true; break; }
          }
          if (!optExists) {
            const newOpt = document.createElement('option');
            newOpt.value = res.model;
            newOpt.textContent = `🚀 ${res.model} (Arsitektur Aktif)`;
            modelInput.appendChild(newOpt);
          }
          modelInput.value = res.model;
          const db = getDB();
          db.meta.chatbotModel = res.model;
          saveDB(db);
        }

        feedback.className = 'admin-ping-feedback success';
        const switchNote = res.autoSwitched 
          ? `<br><small style="display:block; margin-top:5px; opacity:0.92; font-size:0.78rem;">💡 <em>Arsitektur otomatis dialihkan ke <strong>${res.model}</strong>.</em></small>`
          : '';
        feedback.innerHTML = `
          <span>✅ <strong>${label} Terhubung!</strong> Gateway merespons dalam <strong>${res.latencyMs}ms</strong>. Status mesin: <em>"${res.reply}"</em>${switchNote}</span>
        `;
      } else {
        window.updateEngineCardUI(engineKey, 'error', res.status || 'Error');
        feedback.className = 'admin-ping-feedback error';
        feedback.innerHTML = `
          <span>❌ <strong>${label} Gagal:</strong> ${res.error} (Status: ${res.status || 'Jaringan'})</span>
        `;
      }
    } else {
      feedback.className = 'admin-ping-feedback error';
      feedback.innerHTML = '<span>⚠️ Modul AI Chatbot belum siap. Muat ulang halaman lalu coba kembali.</span>';
    }
  };

  // Real-time auto-persist for Groq API key so it stays permanently without manual save
  window.autoPersistGroqKey = function(val) {
    const clean = (val || '').trim().replace(/^['"]|['"]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    try {
      localStorage.setItem('ytpai_groq_api_key_backup', clean);
      if (typeof getDB === 'function' && typeof saveDB === 'function') {
        const db = getDB();
        if (db && db.meta) {
          db.meta.groqApiKey = clean;
          saveDB(db);
        }
      }
      if (!clean) {
        window.updateEngineCardUI('Groq', 'empty');
      }
    } catch(e) {}
  };

  // Real-time auto-persist for Groq selected model
  window.autoPersistGroqModel = function(val) {
    const clean = (val || '').trim();
    try {
      localStorage.setItem('ytpai_groq_model_backup', clean);
      if (typeof getDB === 'function' && typeof saveDB === 'function') {
        const db = getDB();
        if (db && db.meta) {
          db.meta.groqModel = clean;
          saveDB(db);
        }
      }
    } catch(e) {}
  };

  // Test Groq Gateway connectivity from Admin (~0,2s ultra-fast ping)
  window.testGroqApiKeyAdmin = async function() {
    const keyInput = document.getElementById('setGroqApiKey');
    const modelInput = document.getElementById('setGroqModel');
    const feedback = document.getElementById('adminPingFeedbackGroq');
    if (!keyInput || !feedback) return;

    const apiKey = keyInput.value.trim().replace(/^['"]|['"]$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    const model = modelInput ? modelInput.value : 'qwen/qwen3.8-27b';

    if (!apiKey) {
      window.updateEngineCardUI('Groq', 'empty');
      feedback.className = 'admin-ping-feedback error';
      feedback.innerHTML = `<span>⚠️ Masukkan Kunci Akses Groq (gsk_...) terlebih dahulu sebelum melakukan uji coba.</span>`;
      feedback.style.display = 'flex';
      return;
    }

    // Set badge to testing
    const badge = document.getElementById('engineBadgeGroq');
    if (badge) {
      badge.innerHTML = `<span class="engine-pulse-dot" style="background:#3B82F6;"></span> <span>MENGUJI PING...</span>`;
    }

    // Auto-persist immediately so user never loses it on refresh
    window.autoPersistGroqKey(apiKey);
    window.autoPersistGroqModel(model);

    feedback.className = 'admin-ping-feedback testing';
    feedback.innerHTML = `<span>⏳ Mengirim sinyal uji coba kilat (ping) ke Groq LPU Cloud...</span>`;
    feedback.style.display = 'flex';

    if (window.YtpaiAi && typeof window.YtpaiAi.testGroqApiKey === 'function') {
      const res = await window.YtpaiAi.testGroqApiKey(apiKey, model);
      
      // If Groq provided its actual live model list, dynamically populate dropdown
      if (res.availableModels && res.availableModels.length > 0 && modelInput) {
        const chatModels = res.availableModels.filter(m => {
          const l = m.toLowerCase();
          return !l.includes('guard') && !l.includes('whisper') && !l.includes('vision') && !l.includes('audio') && !l.includes('orpheus') && !l.includes('canopylabs');
        });
        const currentVal = res.model || modelInput.value;
        if (chatModels.length > 0) {
          modelInput.innerHTML = chatModels.map(m => {
            const isSel = (m === currentVal) ? 'selected' : '';
            const isRec = m.includes('8b') ? '⚡ ' : '🚀 ';
            return `<option value="${m}" ${isSel}>${isRec}${m}</option>`;
          }).join('');
          modelInput.value = currentVal;
        }
      }

      if (res.success) {
        window.updateEngineCardUI('Groq', 'connected', res.latencyMs + 'ms');
        feedback.className = 'admin-ping-feedback success';
        feedback.innerHTML = `
          <span>🚀 <strong>Groq LPU Terhubung Kilat!</strong> Gateway merespons dalam <strong>${res.latencyMs}ms</strong> via model <strong>${res.model}</strong>. Status mesin: <em>"${res.reply}"</em></span>
        `;
      } else {
        window.updateEngineCardUI('Groq', 'error', res.status || 'Error');
        feedback.className = 'admin-ping-feedback error';
        feedback.innerHTML = `
          <span>❌ <strong>Groq Gagal:</strong> ${res.error} (Status: ${res.status || 'Jaringan'})</span>
        `;
      }
    } else {
      feedback.className = 'admin-ping-feedback error';
      feedback.innerHTML = '<span>⚠️ Modul AI Chatbot belum siap. Muat ulang halaman lalu coba kembali.</span>';
    }
  };

  // Initialize Simulator Messages
  window.initAdminSimulatorChat = function() {
    const container = document.getElementById('adminSimChatBody');
    if (!container) return;

    const db = getDB();
    const meta = db.meta || {};
    const botName = meta.chatbotName || 'RAUDLY';
    const mascot = meta.chatbotMascot || 'assets/mascot.png';
    const randomGreeting = (window.YtpaiAi && window.YtpaiAi.getRandomSantriWelcomeGreeting) 
      ? window.YtpaiAi.getRandomSantriWelcomeGreeting(botName)
      : `Assalamu'alaikum Warahmatullahi Wabarakatuh! 🌿✨\n\nHalo Ayah, Bunda, dan Sahabat Santri tercinta! Kenalin, aku **${botName}**—santri cilik cerdas asisten resmi **YTPAI Raudlatul Muta'allimin Lamongan** 😊\n\nAda yang bisa ${botName} bantu seputar pendaftaran santri baru (PPDB 2026), 7 sekolah formal (KB–SMA), pondok pesantren mukim, bimbel LBB, atau manasik haji KBIHU? Silakan pilih menu cepat di bawah atau langsung ketikkan pertanyaan Anda ya! 👇`;
    
    const customGreeting = (meta.chatbotGreeting && meta.chatbotGreeting.trim()) ? meta.chatbotGreeting.trim() : randomGreeting;
    const stickerCaption = (window.YtpaiAi && window.YtpaiAi.getRandomSantriStickerCaption)
      ? window.YtpaiAi.getRandomSantriStickerCaption()
      : "👋 Assalamu'alaikum! Senang banget ketemu hari ini! ✨";

    const formattedText = (window.YtpaiAi && window.YtpaiAi.formatMarkdown) ? window.YtpaiAi.formatMarkdown(customGreeting) : customGreeting.replace(/\n/g, '<br>');

    container.innerHTML = `
      <div class="admin-sim-msg ai welcome-msg" style="width:100%; max-width:100%; margin-bottom:12px;">
        <div style="width:100%;">
          <!-- RAUDLY Comic Dialogue Welcome with Animated Waving Hand Mascot -->
          <div class="raudly-comic-dialog" style="max-width:100%;">
            <div class="raudly-comic-mascot">
              <div class="raudly-comic-mascot-figure">
                <img src="assets/raudly_body_still.png?v=3" alt="${botName}" class="raudly-comic-body" onerror="this.src='${mascot}'">
                <img src="assets/raudly_arm_wave.png?v=3" alt="Lambaian Tangan RAUDLY" class="raudly-comic-arm" onerror="this.style.display='none'">
              </div>
            </div>
            <div class="raudly-comic-balloon">
              <div class="raudly-comic-balloon-tail">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                  <path d="M12 0C12 0 3 6 0 8C3 10 12 16 12 16V0Z" fill="#0A2540"/>
                </svg>
              </div>
              <div class="raudly-comic-text">
                ${formattedText}
              </div>
            </div>
          </div>

          <!-- Quick Action Menu Pills (100% Identik Front-End) -->
          <div class="ai-quick-menu" style="margin-top:10px;">
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Kenalan dengan RAUDLY')">
              <span class="ai-menu-icon">👋</span>
              <span class="ai-menu-text">Kenalan dengan RAUDLY</span>
            </button>
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Bagaimana alur dan syarat PPDB online?')">
              <span class="ai-menu-icon">📋</span>
              <span class="ai-menu-text">Alur & Biaya PPDB 2026</span>
            </button>
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Siapa ketua dan tentor bimbingan belajar LBB?')">
              <span class="ai-menu-icon">🚀</span>
              <span class="ai-menu-text">Bimbel LBB Sukses PTN</span>
            </button>
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Apa saja 7 unit sekolah formal di yayasan?')">
              <span class="ai-menu-icon">🏫</span>
              <span class="ai-menu-text">7 Satuan Pendidikan Formal</span>
            </button>
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Bagaimana fasilitas pondok pesantren mukim?')">
              <span class="ai-menu-icon">🕌</span>
              <span class="ai-menu-text">Pondok Pesantren Mukim</span>
            </button>
            <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('Apa saja fasilitas dan bimbingan haji KBIHU?')">
              <span class="ai-menu-icon">🕋</span>
              <span class="ai-menu-text">Manasik Haji & Umrah KBIHU</span>
            </button>
          </div>

          <div class="admin-sim-meta" style="margin-top:8px;">
            <span>Baru saja</span>
            <span class="admin-sim-tag">Pesan Sambutan Awal (Kondisi Real Front-End)</span>
          </div>
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  };

  // Clear Simulator Chat
  window.clearAdminSimulatorChat = function() {
    initAdminSimulatorChat();
  };

  // Quick scenario click
  window.sendAdminSimQuickQuery = function(queryText) {
    const input = document.getElementById('adminSimInput');
    if (input) {
      input.value = queryText;
      handleAdminSimulatorSend();
    }
  };

  // Handle send message inside Admin Simulator
  window.handleAdminSimulatorSend = async function() {
    const input = document.getElementById('adminSimInput');
    const container = document.getElementById('adminSimChatBody');
    if (!input || !container) return;

    const userText = input.value.trim();
    if (!userText) return;

    input.value = '';
    if (window.YtpaiAi && typeof window.YtpaiAi.playSendSound === 'function') {
      window.YtpaiAi.playSendSound();
    }
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // 1. Render User Bubble
    const userMsgHtml = `
      <div class="admin-sim-msg user">
        <div style="flex-grow:1; max-width:85%;">
          <div class="admin-sim-bubble">
            ${userText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          <div class="admin-sim-meta">
            <span>${timeNow} • Anda (Super Admin)</span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', userMsgHtml);

    // 2. Render Typing Indicator
    const typingId = 'adminSimTyping_' + Date.now();
    const db = getDB();
    const meta = db.meta || {};
    const botName = meta.chatbotName || 'RAUDLY';
    const mascot = meta.chatbotMascot || 'assets/mascot.png';

    const typingHtml = `
      <div class="admin-sim-msg ai" id="${typingId}">
        <div class="admin-sim-avatar-sm" style="width:32px; height:32px;">
          <img src="${mascot}" alt="${botName}" onerror="this.src='assets/mascot.png'">
        </div>
        <div>
          <div class="admin-sim-typing">
            <span>⚡ ${botName} sedang merangkai jawaban...</span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', typingHtml);
    container.scrollTop = container.scrollHeight;

    // 3. Query Engine
    const apiKey = (document.getElementById('setGeminiApiKey') ? document.getElementById('setGeminiApiKey').value.trim() : (meta.geminiApiKey || ''));
    const model = (document.getElementById('setChatbotModel') ? document.getElementById('setChatbotModel').value : (meta.chatbotModel || 'gemini-2.0-flash'));

    let aiResult;
    const t0 = Date.now();
    if (window.YtpaiAi && typeof window.YtpaiAi.queryGeminiApi === 'function') {
      aiResult = await window.YtpaiAi.queryGeminiApi(userText, apiKey, model);
    } else {
      await new Promise(r => setTimeout(r, 600));
      aiResult = {
        text: `Assalamu'alaikum! Pertanyaan Anda mengenai "${userText}" telah diterima. Silakan simpan pengaturan untuk mengaktifkan mesin penuh.`,
        engine: 'fallback'
      };
    }
    const latency = Date.now() - t0;

    // Remove typing indicator
    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();

    // 4. Render AI Bubble
    const formattedReply = (window.YtpaiAi && window.YtpaiAi.formatMarkdown) ? window.YtpaiAi.formatMarkdown(aiResult.text) : aiResult.text.replace(/\n/g, '<br>');
    const isNeural = aiResult.engine === 'raudly_neural_engine' || aiResult.engine === 'gemini_api';
    const engineTag = isNeural ? `⚡ RAUDLY Neural Engine • ${latency}ms` : `🟡 Basis Data Lokal (RAG) • ${latency}ms`;
    const isStickerQuery = aiResult.isSticker || userText.toLowerCase().includes('stiker') || userText.toLowerCase().includes('sticker') || userText.toLowerCase().includes('maskot');

    const stickerCardHtml = isStickerQuery ? `
      <div class="ai-wa-sticker-card" style="margin-bottom:8px;">
        <div class="ai-wa-sticker-badge">
          <span class="ai-wa-sticker-badge-icon">✦</span>
          <span class="ai-wa-sticker-badge-text">MASKOT RESMI SANTRI • RAUDLY</span>
        </div>
        <div class="ai-wa-sticker-stage">
          <div class="ai-wa-sticker-halo"></div>
          <div class="ai-wa-sticker-figure">
            <img src="assets/raudly_body_still.png?v=3" alt="${botName}" class="ai-wa-character-body" onerror="this.src='assets/raudly_mascot_perfect_hd.png'">
            <img src="assets/raudly_arm_wave.png?v=3" alt="Lambaian Tangan RAUDLY" class="ai-wa-character-arm" onerror="this.style.display='none'">
          </div>
          <div class="ai-wa-sticker-pedestal"></div>
        </div>
        <div class="ai-wa-sticker-speech-balloon">
          <span class="sticker-speech-text">${aiResult.stickerCaption || ((window.YtpaiAi && window.YtpaiAi.getRandomSantriStickerCaption) ? window.YtpaiAi.getRandomSantriStickerCaption() : "👋 Semangat belajar bareng RAUDLY! 🎒✨")}</span>
        </div>
      </div>
    ` : '';

    const actionsHtml = (aiResult.actions && Array.isArray(aiResult.actions) && aiResult.actions.length > 0) ? `
      <div class="ai-quick-menu" style="margin-top:8px;">
        ${aiResult.actions.map(act => {
          const icon = act.icon || (act.url ? '🔗' : '📌');
          if (act.url) {
            return `
              <a href="${act.url}" target="_blank" class="ai-menu-item">
                <span class="ai-menu-icon">${icon}</span>
                <span class="ai-menu-text">${act.text}</span>
              </a>
            `;
          } else {
            return `
              <button type="button" class="ai-menu-item" onclick="window.sendAdminSimQuickQuery('${(act.query || act.text).replace(/'/g, "\\'")}')">
                <span class="ai-menu-icon">${icon}</span>
                <span class="ai-menu-text">${act.text}</span>
              </button>
            `;
          }
        }).join('')}
      </div>
    ` : '';

    const aiMsgHtml = `
      <div class="admin-sim-msg ai">
        <div class="admin-sim-avatar-sm" style="width:34px; height:34px;">
          <img src="${mascot}" alt="${botName}" onerror="this.src='assets/mascot.png'">
        </div>
        <div style="flex-grow:1; max-width:85%;">
          <div class="admin-sim-bubble">
            ${stickerCardHtml}
            ${formattedReply}
            ${actionsHtml}
          </div>
          <div class="admin-sim-meta">
            <span>${timeNow}</span>
            <span class="admin-sim-tag ${isNeural ? 'active' : ''}">${engineTag}</span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', aiMsgHtml);
    container.scrollTop = container.scrollHeight;
    if (window.YtpaiAi && typeof window.YtpaiAi.playReceiveSound === 'function') {
      window.YtpaiAi.playReceiveSound();
    }
  };

  window.handleMascotUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const input = document.getElementById('setChatbotMascot');
      const preview = document.getElementById('mascotPreviewImg');
      const simAvatar = document.getElementById('adminSimAvatar');
      if (input) input.value = dataUrl;
      if (preview) {
        preview.src = dataUrl;
        preview.style.display = 'block';
      }
      if (simAvatar) simAvatar.src = dataUrl;
      // Launch interactive cropper studio immediately!
      openImageCropper('setChatbotMascot', dataUrl, 'avatar');
    };
    reader.readAsDataURL(file);
  };

  window.saveSettingsForm = function() {
    const db = getDB();
    db.meta.legal = document.getElementById('setLegal').value.trim();
    db.meta.slogan = document.getElementById('setSlogan').value.trim();
    db.meta.phone = document.getElementById('setPhone').value.trim();
    db.meta.whatsapp = document.getElementById('setWA').value.trim();
    db.meta.email = document.getElementById('setEmail').value.trim();
    db.meta.address = document.getElementById('setAddress').value.trim();

    const runningTextInput = document.getElementById('setRunningText');
    if (runningTextInput) db.meta.runningText = runningTextInput.value.trim();

    const mapsUrlInput = document.getElementById('setMapsUrl');
    if (mapsUrlInput) db.meta.mapsUrl = mapsUrlInput.value.trim();

    const mapsEmbedInput = document.getElementById('setMapsEmbed');
    if (mapsEmbedInput) db.meta.mapsEmbedUrl = mapsEmbedInput.value.trim();

    const visionInput = document.getElementById('setVision');
    if (visionInput) db.meta.vision = visionInput.value.trim();

    const missionInput = document.getElementById('setMission');
    if (missionInput) {
      const rawMission = missionInput.value.trim();
      const list = rawMission.split('\n').map(s => s.trim().replace(/^\d+[\.\)]\s*/, '')).filter(Boolean);
      db.meta.missionList = list;
      db.meta.mission = list.map((item, i) => `${i + 1}. ${item}`).join('\n');
    }

    db.meta.stats.santri = document.getElementById('setStatSantri').value.trim();
    db.meta.stats.teachers = document.getElementById('setStatTeachers').value.trim();
    db.meta.stats.units = document.getElementById('setStatUnits').value.trim();
    db.meta.stats.accreditation = document.getElementById('setStatAccred').value.trim();

    const gaInput = document.getElementById('setGaId');
    if (gaInput) db.meta.gaId = gaInput.value.trim();

    const groqApiKeyInput = document.getElementById('setGroqApiKey');
    if (groqApiKeyInput) db.meta.groqApiKey = groqApiKeyInput.value.trim();

    const groqModelInput = document.getElementById('setGroqModel');
    if (groqModelInput) db.meta.groqModel = groqModelInput.value.trim();

    const geminiApiKeyInput = document.getElementById('setGeminiApiKey');
    if (geminiApiKeyInput) db.meta.geminiApiKey = geminiApiKeyInput.value.trim();

    const geminiApiKeySecondaryInput = document.getElementById('setGeminiApiKeySecondary');
    if (geminiApiKeySecondaryInput) db.meta.geminiApiKeySecondary = geminiApiKeySecondaryInput.value.trim();

    const chatbotModelInput = document.getElementById('setChatbotModel');
    if (chatbotModelInput) db.meta.chatbotModel = chatbotModelInput.value.trim();

    const chatbotNameInput = document.getElementById('setChatbotName');
    if (chatbotNameInput) db.meta.chatbotName = chatbotNameInput.value.trim();

    const chatbotGreetingInput = document.getElementById('setChatbotGreeting');
    if (chatbotGreetingInput) db.meta.chatbotGreeting = chatbotGreetingInput.value.trim();

    const chatbotInstructionsInput = document.getElementById('setChatbotInstructions');
    if (chatbotInstructionsInput) db.meta.chatbotInstructions = chatbotInstructionsInput.value.trim();

    const mascotInput = document.getElementById('setChatbotMascot');
    if (mascotInput) db.meta.chatbotMascot = mascotInput.value.trim();

    saveDB(db);
    alert('Pengaturan identitas yayasan, maskot, serta integrasi Asisten Cerdas Santri berhasil disimpan!');
    
    // Update live simulator status badge
    const statusBadge = document.getElementById('adminAiStatusBadge');
    if (statusBadge) {
      const hasGroq = db.meta.groqApiKey && db.meta.groqApiKey.trim();
      const hasPrimary = db.meta.geminiApiKey && db.meta.geminiApiKey.trim();
      const hasSecondary = db.meta.geminiApiKeySecondary && db.meta.geminiApiKeySecondary.trim();
      if (hasGroq) {
        statusBadge.className = 'admin-ai-status-pill active';
        statusBadge.style = 'background:#ECFDF5; border-color:#10B981; color:#047857;';
        statusBadge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; animation:pulse 1.8s infinite;"></span><span>⚡ Groq Turbo LPU Aktif (~0,3s) + Failover Gemini</span>`;
      } else if (hasPrimary && hasSecondary) {
        statusBadge.className = 'admin-ai-status-pill active';
        statusBadge.style = 'background:#ECFDF5; border-color:#10B981; color:#047857;';
        statusBadge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; animation:pulse 1.8s infinite;"></span><span>⚡ Gotong Royong Aktif (Dual-Engine: 3.000 Chat/Hari)</span>`;
      } else if (hasPrimary || hasSecondary) {
        statusBadge.className = 'admin-ai-status-pill active';
        statusBadge.style = '';
        statusBadge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34D399; animation:pulse 1.8s infinite;"></span><span>🟢 RAUDLY Neural Engine Aktif (v3-Pro Online)</span>`;
      } else {
        statusBadge.className = 'admin-ai-status-pill';
        statusBadge.style = 'background:#FEF3C7; border-color:#FCD34D; color:#92400E;';
        statusBadge.innerHTML = `<span>🟡 Mode Basis Data Lokal</span>`;
      }
    }
  };


window.downloadBackupJSON = function() {
  const db = getDB();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `Backup_YTPAI_Lamongan_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.importBackupJSON = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.meta && parsed.units && parsed.news) {
        saveDB(parsed);
        alert('Data berhasil dipulihkan dari file backup!');
        location.reload();
      } else {
        alert('Format file JSON tidak valid.');
      }
    } catch (err) {
      alert('Gagal membaca file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
};

window.triggerFactoryReset = function() {
  if (confirm('PERINGATAN: Seluruh data perubahan dan pendaftar akan direset ke kondisi awal mula. Lanjutkan?')) {
    resetDB();
    alert('Basis data telah direset ke bawaan awal.');
    location.reload();
  }
};

/* --- MODAL DIALOG UTILITY --- */
function openAdminModal(title, htmlBody) {
  const modal = document.getElementById('adminModal');
  document.getElementById('adminModalTitle').textContent = title;
  document.getElementById('adminModalBody').innerHTML = htmlBody;
  modal.classList.add('active');
}

window.closeAdminModal = function() {
  const modal = document.getElementById('adminModal');
  if (modal) modal.classList.remove('active');
};

/* ===================================================================
   TAB 11: KELOLA AKUN PENGELOLA & HAK AKSES (ROLE-BASED ACCESS CONTROL)
   =================================================================== */

function renderTabUsers(db, container) {
  const users = db.adminUsers || [];
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';
  const totalUsers = users.length;

  container.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header" style="flex-wrap:wrap; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.18rem; color:#0A2540;">Daftar Akun Pengelola & Hak Akses RBAC (${totalUsers} Akun)</h3>
          <p style="margin:0; font-size:0.84rem; color:#64748B;">Kelola hak akses staf agar masing-masing admin hanya dapat mengedit portal dan unit yang menjadi kewenangannya.</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          ${isSuperAdmin ? `
            <button class="btn btn-primary btn-sm" onclick="openModalAdminUser()" style="font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Tambah Akun Admin Baru</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; padding:12px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:0.8rem; font-weight:700; color:#475569; margin-right:4px;">Filter Peran:</span>
          <select id="filterRoleAdminUser" onchange="filterAdminUsersTable()" style="padding:6px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.82rem; font-weight:600; background:#FFF; color:#0A2540;">
            <option value="ALL">Semua Hak Akses (${totalUsers})</option>
            <option value="superadmin">👑 Super Admin (Yayasan)</option>
            <option value="kbihu">🕋 Admin KBIHU Haji & Umrah</option>
            <option value="lbb">🚀 Admin LBB & Bimbel TKA</option>
            <option value="units">🏫 Admin Satuan Formal (KB–SMA)</option>
            <option value="nonformal">📜 Admin Non-Formal / Ponpes</option>
          </select>
        </div>

        <div style="position:relative; width:100%; max-width:280px;">
          <input type="text" id="searchAdminUser" placeholder="Cari nama, username, atau email..." oninput="filterAdminUsersTable()" style="width:100%; padding:7px 12px 7px 32px; font-size:0.82rem; border-radius:8px; border:1px solid #CBD5E1; background:#FFF;">
          <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:0.85rem; color:#94A3B8;">🔍</span>
        </div>
      </div>

      <!-- Interactive Table & Mobile Cards -->
      <div class="crm-users-desktop-table" style="overflow-x:auto;">
        <table class="admin-table" id="adminUsersTable">
          <thead>
            <tr>
              <th style="width:45px; text-align:center;">No</th>
              <th style="min-width:180px;">Akun / Username</th>
              <th style="min-width:220px;">Nama Lengkap & Kontak</th>
              <th style="min-width:190px;">Peran & Hak Kelola</th>
              <th style="width:110px; text-align:center;">Status</th>
              <th style="width:170px; text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody id="adminUsersTableBody">
            <!-- Rendered by renderAdminUsersList() -->
          </tbody>
        </table>
      </div>
      <div class="mobile-users-list" id="mobileUsersList">
        <!-- Rendered by renderAdminUsersList() -->
      </div>
    </div>
  `;

  renderAdminUsersList();
}

window.renderAdminUsersList = function() {
  const tbody = document.getElementById('adminUsersTableBody');
  const mobileList = document.getElementById('mobileUsersList');
  if (!tbody && !mobileList) return;

  const db = getDB();
  const users = db.adminUsers || [];
  const activeUser = getActiveAdminUser();
  const isSuperAdmin = !activeUser || activeUser.role === 'superadmin';

  if (users.length === 0) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:32px; text-align:center; color:#64748B;">Belum ada data akun pengelola.</td></tr>`;
    if (mobileList) mobileList.innerHTML = `<div style="padding:24px; text-align:center; color:#64748B; background:#FFF; border:1px solid #E2E8F0; border-radius:10px;">Belum ada data akun pengelola.</div>`;
    return;
  }

  const rows = [];
  const cards = [];

  users.forEach((u, i) => {
    let roleBadgeStyle = 'background:#F1F5F9; color:#475569; border:1px solid #CBD5E1;';

    if (u.role === 'superadmin') {
      roleBadgeStyle = 'background:#FEF3C7; color:#92400E; border:1px solid #FCD34D; font-weight:800;';
    } else if (u.role === 'kbihu') {
      roleBadgeStyle = 'background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700;';
    } else if (u.role === 'lbb') {
      roleBadgeStyle = 'background:#E0F2FE; color:#0369A1; border:1px solid #BAE6FD; font-weight:700;';
    } else if (u.role.startsWith('unit_')) {
      roleBadgeStyle = 'background:#EEF2FF; color:#3730A3; border:1px solid #C7D2FE; font-weight:700;';
    }

    const isMaster = u.username === 'admin';

    // Desktop Table Row
    rows.push(`
      <tr class="admin-user-row" data-role="${u.role}" data-username="${u.username}" data-name="${(u.name || '').toLowerCase()}" data-email="${(u.email || '').toLowerCase()}">
        <td style="text-align:center; font-weight:700; color:#64748B; vertical-align:middle;">${i + 1}</td>
        <td style="vertical-align:middle;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:#F8FAFC; display:flex; align-items:center; justify-content:center; font-size:1.1rem; border:1px solid #CBD5E1; flex-shrink:0;">
              ${u.avatar || '👤'}
            </div>
            <div>
              <strong style="color:#0A2540; font-size:0.9rem;">${u.username}</strong>
              <small style="color:#64748B; display:block; font-size:0.75rem;">ID: ${u.id}</small>
            </div>
          </div>
        </td>
        <td style="vertical-align:middle;">
          <strong style="color:#1E293B; font-size:0.88rem;">${u.name || '-'}</strong>
          <small style="color:#64748B; display:block; font-size:0.78rem;">${u.email || '-'}</small>
        </td>
        <td style="vertical-align:middle;">
          <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:6px; font-size:0.78rem; ${roleBadgeStyle}">
            <span>${u.avatar || '👤'}</span>
            <span>${u.roleName || u.role}</span>
          </span>
        </td>
        <td style="text-align:center; vertical-align:middle;">
          <span class="badge-status ${u.status === 'active' ? 'badge-verified' : 'badge-inactive'}" style="font-size:0.75rem; padding:2px 8px;">
            ${u.status === 'active' ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td style="text-align:center; vertical-align:middle;">
          <div class="admin-table-actions">
            ${isSuperAdmin ? `
              <button type="button" class="btn-action-edit" onclick="openModalAdminUser('${u.id}')" title="Edit Akun">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit</span>
              </button>
              <button type="button" class="btn-action-edit" onclick="resetAdminPassword('${u.id}')" style="background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE;" title="Ganti Kata Sandi">
                <span>🔑 Sandi</span>
              </button>
              ${!isMaster ? `
                <button type="button" class="btn-action-delete" onclick="deleteAdminUser('${u.id}')" title="Hapus Akun">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              ` : `
                <span style="font-size:0.72rem; color:#94A3B8; font-style:italic;" title="Akun Master Utama">Master</span>
              `}
            ` : `
              <span style="font-size:0.75rem; color:#94A3B8;">Read Only</span>
            `}
          </div>
        </td>
      </tr>
    `);

    // Mobile Touch Card
    cards.push(`
      <div class="crm-user-card-mobile" data-role="${u.role}" data-username="${u.username}" data-name="${(u.name || '').toLowerCase()}" data-email="${(u.email || '').toLowerCase()}">
        <div class="crm-user-card-top">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <div style="width:34px; height:34px; border-radius:50%; background:#F8FAFC; display:flex; align-items:center; justify-content:center; font-size:1.1rem; border:1px solid #CBD5E1; flex-shrink:0;">
              ${u.avatar || '👤'}
            </div>
            <div style="min-width:0;">
              <strong style="color:#0A2540; font-size:0.88rem; display:block; word-break:break-all;">${u.username}</strong>
              <small style="color:#64748B; font-size:0.72rem;">ID: ${u.id}</small>
            </div>
          </div>
          <span class="badge-status ${u.status === 'active' ? 'badge-verified' : 'badge-inactive'}" style="font-size:0.72rem; padding:2px 8px; flex-shrink:0;">
            ${u.status === 'active' ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <div style="font-size:0.84rem; font-weight:700; color:#1E293B;">${u.name || '-'}</div>
          <div style="font-size:0.76rem; color:#64748B;">${u.email || '-'}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:6px; font-size:0.75rem; ${roleBadgeStyle}">
            <span>${u.avatar || '👤'}</span>
            <span>${u.roleName || u.role}</span>
          </span>
        </div>
        <div class="crm-user-card-actions">
          ${isSuperAdmin ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="openModalAdminUser('${u.id}')" style="font-size:0.76rem; padding:6px 10px; display:inline-flex; align-items:center; justify-content:center; gap:4px; font-weight:700; min-height:36px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="resetAdminPassword('${u.id}')" style="font-size:0.76rem; padding:6px 10px; background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE; font-weight:700; min-height:36px;">
              <span>🔑 Sandi</span>
            </button>
            ${!isMaster ? `
              <button type="button" class="btn btn-danger btn-sm" onclick="deleteAdminUser('${u.id}')" style="font-size:0.76rem; padding:6px 10px; min-height:36px;" title="Hapus Akun">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            ` : `
              <div style="display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:#94A3B8; font-style:italic;">Master</div>
            `}
          ` : `
            <span style="font-size:0.75rem; color:#94A3B8;">Read Only</span>
          `}
        </div>
      </div>
    `);
  });

  if (tbody) tbody.innerHTML = rows.join('');
  if (mobileList) mobileList.innerHTML = cards.join('');
};

window.filterAdminUsersTable = function() {
  const searchVal = (document.getElementById('searchAdminUser')?.value || '').toLowerCase();
  const roleVal = document.getElementById('filterRoleAdminUser')?.value || 'ALL';

  const filterItem = (el) => {
    const role = el.getAttribute('data-role') || '';
    const username = (el.getAttribute('data-username') || '').toLowerCase();
    const name = (el.getAttribute('data-name') || '').toLowerCase();
    const email = (el.getAttribute('data-email') || '').toLowerCase();

    let matchSearch = !searchVal || username.includes(searchVal) || name.includes(searchVal) || email.includes(searchVal);
    let matchRole = true;

    if (roleVal === 'superadmin') matchRole = (role === 'superadmin');
    else if (roleVal === 'kbihu') matchRole = (role === 'kbihu');
    else if (roleVal === 'lbb') matchRole = (role === 'lbb');
    else if (roleVal === 'units') matchRole = role.startsWith('unit_') && !['unit_madin', 'unit_lpba', 'unit_boarding'].includes(role);
    else if (roleVal === 'nonformal') matchRole = ['unit_madin', 'unit_lpba', 'unit_boarding'].includes(role);

    el.style.display = (matchSearch && matchRole) ? '' : 'none';
  };

  document.querySelectorAll('.admin-user-row').forEach(filterItem);
  document.querySelectorAll('.crm-user-card-mobile').forEach(filterItem);
};

window.openModalAdminUser = function(userId = null) {
  const db = getDB();
  const users = db.adminUsers || [];
  const user = userId ? users.find(u => u.id === userId) : null;
  const isEdit = !!user;

  const roles = [
    { value: 'superadmin', label: '👑 Super Admin (Akses Penuh Seluruh Modul)', avatar: '👑', unitId: null },
    { value: 'kbihu', label: '🕋 Admin KBIHU Haji & Umrah (Modul KBIHU)', avatar: '🕋', unitId: 'kbihu' },
    { value: 'lbb', label: '🚀 Admin LBB Sukses PTN (Modul LBB & Jadwal TKA)', avatar: '🚀', unitId: 'lbb' },
    { value: 'unit_mts', label: '📖 Admin MTs Raudlatul Muta\'allimin', avatar: '📖', unitId: 'mts' },
    { value: 'unit_smp', label: '🔬 Admin SMP Raudlatul Muta\'allimin', avatar: '🔬', unitId: 'smp' },
    { value: 'unit_ma', label: '🕌 Admin MA Raudlatul Muta\'allimin', avatar: '🕌', unitId: 'ma' },
    { value: 'unit_sma', label: '🎓 Admin SMA Raudlatul Muta\'allimin', avatar: '🎓', unitId: 'sma' },
    { value: 'unit_mi', label: '🎒 Admin MI Raudlatul Muta\'allimin', avatar: '🎒', unitId: 'mi' },
    { value: 'unit_tk', label: '🎈 Admin TK Raudlatul Muta\'allimin', avatar: '🎈', unitId: 'tk' },
    { value: 'unit_kb', label: '👶 Admin KB Raudlatul Muta\'allimin', avatar: '👶', unitId: 'kb' },
    { value: 'unit_madin', label: '📜 Admin Madrasah Diniyah Takmiliyah', avatar: '📜', unitId: 'madin' },
    { value: 'unit_lpba', label: '🌐 Admin LPBA Bahasa Asing', avatar: '🌐', unitId: 'lpba' },
    { value: 'unit_boarding', label: '🏰 Admin Pondok Pesantren Putra-Putri', avatar: '🏰', unitId: 'boarding' }
  ];

  const html = `
    <form onsubmit="saveAdminUser(event, '${userId || ''}')" style="display:flex; flex-direction:column; gap:16px;">
      <div>
        <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Nama Lengkap Pengelola / Staf</label>
        <input type="text" id="usrFullName" class="form-control" value="${user ? user.name : ''}" placeholder="Contoh: Ust. Ahmad Shodiq, M.Ag" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div>
          <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Nama Akun (Username Login)</label>
          <input type="text" id="usrUsername" class="form-control" value="${user ? user.username : ''}" placeholder="huruf_kecil_tanpa_spasi" ${isEdit && user.username === 'admin' ? 'readonly' : 'required'} style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;">
          <small style="color:#64748B; font-size:0.72rem;">Gunakan huruf kecil & tanpa spasi</small>
        </div>
        <div>
          <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Kata Sandi / PIN</label>
          <input type="text" id="usrPassword" class="form-control" value="${user ? user.password : ''}" placeholder="Minimal 6 karakter" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;">
          <small style="color:#64748B; font-size:0.72rem;">Sandi login ke sistem</small>
        </div>
      </div>

      <div>
        <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Peran & Batasan Hak Akses (Role Scope)</label>
        <select id="usrRole" class="form-control" required style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;" ${isEdit && user.username === 'admin' ? 'disabled' : ''}>
          ${roles.map(r => `
            <option value="${r.value}" data-avatar="${r.avatar}" data-unit="${r.unitId || ''}" ${(user && user.role === r.value) ? 'selected' : ''}>
              ${r.label}
            </option>
          `).join('')}
        </select>
        <small style="color:#0284C7; font-size:0.74rem; margin-top:4px; display:block;">ℹ️ Staf hanya dapat melihat dan mengedit tab/unit yang sesuai dengan perannya.</small>
      </div>

      <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:14px;">
        <div>
          <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Email Kontak (Opsional)</label>
          <input type="email" id="usrEmail" class="form-control" value="${user ? (user.email || '') : ''}" placeholder="nama@ytpai-lamongan.sch.id" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;">
        </div>
        <div>
          <label style="font-size:0.82rem; font-weight:700; color:#0A2540; display:block; margin-bottom:6px;">Status Akun</label>
          <select id="usrStatus" class="form-control" style="width:100%; padding:9px 12px; border:1px solid #CBD5E1; border-radius:8px;">
            <option value="active" ${(!user || user.status === 'active') ? 'selected' : ''}>Aktif</option>
            <option value="inactive" ${(user && user.status === 'inactive') ? 'selected' : ''}>Nonaktif</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; padding-top:14px; border-top:1px solid #F1F5F9;">
        <button type="button" onclick="closeAdminModal()" class="btn btn-outline" style="padding:8px 16px;">Batal</button>
        <button type="submit" class="btn btn-primary" style="padding:8px 20px; font-weight:700;">Simpan Akun</button>
      </div>
    </form>
  `;

  openAdminModal(isEdit ? '✏️ Edit Akun Pengelola' : '➕ Tambah Akun Admin Baru', html);
};

window.saveAdminUser = function(event, userId) {
  event.preventDefault();
  const db = getDB();
  if (!db.adminUsers) db.adminUsers = [];

  const name = document.getElementById('usrFullName').value.trim();
  const username = document.getElementById('usrUsername').value.trim().toLowerCase();
  const password = document.getElementById('usrPassword').value.trim();
  const roleSelect = document.getElementById('usrRole');
  const role = roleSelect ? roleSelect.value : 'superadmin';
  const roleOpt = roleSelect ? roleSelect.options[roleSelect.selectedIndex] : null;
  const avatar = roleOpt ? roleOpt.getAttribute('data-avatar') || '👤' : '👤';
  const unitId = roleOpt ? roleOpt.getAttribute('data-unit') || null : null;
  const roleName = roleOpt ? roleOpt.text.replace(/^[^\s]+\s*/, '').replace(/\(.*\)/, '').trim() : role;
  const email = document.getElementById('usrEmail').value.trim();
  const status = document.getElementById('usrStatus').value;

  // Cek duplikasi username untuk akun baru
  if (!userId) {
    if (db.adminUsers.some(u => u.username.toLowerCase() === username)) {
      alert('Username "' + username + '" sudah digunakan oleh akun lain. Silakan pilih username yang berbeda.');
      return;
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      username,
      password,
      name,
      role,
      roleName,
      avatar,
      unitId,
      email,
      status,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    db.adminUsers.push(newUser);
  } else {
    const idx = db.adminUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      // Jika akun master admin, kunci role tetap superadmin
      const isMaster = db.adminUsers[idx].username === 'admin';
      db.adminUsers[idx].name = name;
      db.adminUsers[idx].password = password;
      db.adminUsers[idx].email = email;
      db.adminUsers[idx].status = status;
      if (!isMaster) {
        db.adminUsers[idx].username = username;
        db.adminUsers[idx].role = role;
        db.adminUsers[idx].roleName = roleName;
        db.adminUsers[idx].avatar = avatar;
        db.adminUsers[idx].unitId = unitId;
      }
    }
  }

  saveDB(db);
  closeAdminModal();
  renderTabUsers(db, document.getElementById('adminContentArea'));
  alert('Akun pengelola berhasil disimpan!');
};

window.resetAdminPassword = function(userId) {
  const db = getDB();
  const users = db.adminUsers || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const newPass = prompt(`Masukkan kata sandi baru untuk akun "${user.username}" (${user.name}):`, user.password || '');
  if (newPass && newPass.trim()) {
    user.password = newPass.trim();
    saveDB(db);
    renderTabUsers(db, document.getElementById('adminContentArea'));
    alert(`Kata sandi untuk ${user.username} berhasil diperbarui menjadi: ${user.password}`);
  }
};

window.deleteAdminUser = function(userId) {
  const db = getDB();
  const users = db.adminUsers || [];
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (user.username === 'admin') {
    alert('Akun Master Super Admin tidak dapat dihapus.');
    return;
  }

  if (confirm(`Yakin ingin menghapus akun admin "${user.username}" (${user.name})? Staf ini tidak akan dapat login lagi.`)) {
    db.adminUsers = users.filter(u => u.id !== userId);
    saveDB(db);
    renderTabUsers(db, document.getElementById('adminContentArea'));
    alert('Akun berhasil dihapus dari sistem.');
  }
};

/* ==========================================================================
   POP-UP PENGUMUMAN & INFORMASI WEBSITE CMS (FULL CRUD & LIVE PREVIEW)
   ========================================================================== */

function escapePopupHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTabPopup(db, container) {
  if (!db.popupAnnouncement) {
    db.popupAnnouncement = (typeof DEFAULT_YAYASAN_DATA !== 'undefined' && DEFAULT_YAYASAN_DATA.popupAnnouncement)
      ? JSON.parse(JSON.stringify(DEFAULT_YAYASAN_DATA.popupAnnouncement))
      : {
          enabled: true,
          mode: "auto",
          badge: "INFORMASI & WARTA UTAMA",
          category: "Akademik",
          title: "Santri MA Raudlatul Muta'allimin Raih Medali Emas Olimpiade Sains Nasional 2026",
          date: "10 September 2026",
          image: "assets/berita_santri_prestasi.jpg",
          excerpt: "Prestasi gemilang diraih kontingen santri jurusan IPA dalam ajang kompetisi sains terintegrasi keagamaan tingkat nasional.",
          actionText: "Baca Selengkapnya",
          actionLink: "#berita",
          newsId: 1,
          tag1: "PSB 2026/2027 Terbuka",
          tag2: "Tahfidz & Sains Unggul"
        };
  }

  const p = db.popupAnnouncement;
  const isEnabled = p.enabled !== false;
  const isAuto = p.mode !== 'custom';

  // Synchronize sidebar badge
  const navBadge = document.getElementById('navPopupStatus');
  if (navBadge) {
    navBadge.textContent = isEnabled ? 'ON' : 'OFF';
    navBadge.style.background = isEnabled ? '#10B981' : '#64748B';
  }

  const newsList = Array.isArray(db.news) ? db.news : [];
  const latestNews = newsList[0] || {
    id: 1,
    title: "Santri MA Raudlatul Muta'allimin Raih Medali Emas Olimpiade Sains Nasional 2026",
    category: "Akademik",
    date: "10 September 2026",
    image: "assets/berita_santri_prestasi.jpg",
    excerpt: "Prestasi gemilang diraih kontingen santri jurusan IPA dalam ajang kompetisi sains terintegrasi keagamaan tingkat nasional."
  };

  container.innerHTML = `
    <!-- Executive Banner -->
    <div class="settings-exec-hero" style="margin-bottom: 24px;">
      <div class="settings-exec-hero-main">
        <div class="settings-exec-badge">
          <span>✨ MODUL INTERAKSI & HUMAS</span>
          <span class="settings-exec-badge-dot"></span>
          <span>YTPAI RAUDLATUL MUTA'ALLIMIN</span>
        </div>
        <h2 class="settings-exec-title">Manajemen Pop-Up Pengumuman & Informasi Website</h2>
        <p class="settings-exec-desc">
          Kelola jendela pop-up sambutan informasi bagi pengunjung website. Anda dapat mengaktifkan/menonaktifkan, memilih mode otomatis warta terkini atau membuat pengumuman khusus mandiri (misal: pengumuman kelulusan, seleksi PSB, atau agenda akbar yayasan).
        </p>
      </div>
      <div class="settings-exec-actions" style="display:flex; flex-wrap:wrap; gap:10px;">
        <button type="button" class="btn-settings-save-hero" onclick="savePopupAnnouncementSettings()" style="background: linear-gradient(135deg, #FBBF24, #D97706); color:#0A2540; font-weight:700;">
          <span>💾</span>
          <span>Simpan Konfigurasi</span>
        </button>
        <button type="button" class="btn-settings-view-site" onclick="resetPopup24hCookie()" style="background:#0F4C81; color:#fff; border-color:#38BDF8;">
          <span>🔄</span>
          <span>Reset Cookie 24 Jam</span>
        </button>
        <a href="index.html" target="_blank" class="btn-settings-view-site">
          <span>🌐</span>
          <span>Uji di Beranda ↗</span>
        </a>
      </div>
    </div>

    <!-- Main Workspace: Form & Live Preview -->
    <div class="popup-admin-layout" style="display:grid; grid-template-columns: minmax(0, 1.25fr) minmax(360px, 440px); gap: 24px; align-items: start;">
      
      <!-- Left Column: Settings Form -->
      <div class="popup-admin-form-col" style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Section 1: Activation & Mode Selection -->
        <div class="admin-card" style="background:#fff; border-radius:16px; padding:22px; border:1px solid #E2E8F0; box-shadow:0 4px 16px rgba(10,37,64,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #F1F5F9; padding-bottom:14px;">
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; color:#0A2540; margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
                <span>📢</span> Status & Mode Penayangan Pop-Up
              </h3>
              <p style="font-size:0.82rem; color:#64748B; margin:0;">Tentukan apakah pop-up aktif dan sumber konten yang disajikan.</p>
            </div>
            
            <!-- Master Toggle Switch -->
            <label style="display:inline-flex; align-items:center; cursor:pointer; gap:10px; background:#F8FAFC; border:1px solid #CBD5E1; padding:6px 14px; border-radius:30px;">
              <input type="checkbox" id="popupEnabledSwitch" ${isEnabled ? 'checked' : ''} onchange="togglePopupEnabled(this.checked)" style="width:18px; height:18px; accent-color:#10B981; cursor:pointer;">
              <span id="popupEnabledLabel" style="font-size:0.85rem; font-weight:700; color:${isEnabled ? '#059669' : '#64748B'};">
                ${isEnabled ? '● AKTIF TAYANG' : '○ NONAKTIF'}
              </span>
            </label>
          </div>

          <!-- Mode Radio Cards -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div onclick="switchPopupMode('auto')" id="modeCardAuto" style="border:2px solid ${isAuto ? '#0F4C81' : '#E2E8F0'}; background:${isAuto ? '#F0F9FF' : '#F8FAFC'}; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.2s ease;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <input type="radio" name="popupModeRadio" id="radioModeAuto" value="auto" ${isAuto ? 'checked' : ''} style="accent-color:#0F4C81;">
                <strong style="color:#0A2540; font-size:0.92rem;">⚡ Mode Otomatis</strong>
              </div>
              <p style="font-size:0.78rem; color:#475569; margin:0 0 8px 0; line-height:1.4;">
                Otomatis menampilkan <strong>warta berita terbaru</strong> yang baru diunggah humas.
              </p>
              <div style="font-size:0.72rem; background:#E0F2FE; color:#0369A1; padding:4px 8px; border-radius:6px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                Terkoneksi: "${escapePopupHtml(latestNews.title.substring(0, 32))}..."
              </div>
            </div>

            <div onclick="switchPopupMode('custom')" id="modeCardCustom" style="border:2px solid ${!isAuto ? '#0F4C81' : '#E2E8F0'}; background:${!isAuto ? '#F0F9FF' : '#F8FAFC'}; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.2s ease;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <input type="radio" name="popupModeRadio" id="radioModeCustom" value="custom" ${!isAuto ? 'checked' : ''} style="accent-color:#0F4C81;">
                <strong style="color:#0A2540; font-size:0.92rem;">✍️ Mode Kustom</strong>
              </div>
              <p style="font-size:0.78rem; color:#475569; margin:0 0 8px 0; line-height:1.4;">
                Tulis <strong>pengumuman khusus mandiri</strong> (PSB, kelulusan, brosur, atau agenda akbar).
              </p>
              <div style="font-size:0.72rem; background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:6px; font-weight:600;">
                Konten Khusus Mandiri
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Content Form (Custom / Editable) -->
        <div class="admin-card" id="popupContentFormCard" style="background:#fff; border-radius:16px; padding:22px; border:1px solid #E2E8F0; box-shadow:0 4px 16px rgba(10,37,64,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid #F1F5F9; padding-bottom:14px;">
            <h3 style="font-size:1.05rem; font-weight:700; color:#0A2540; margin:0; display:flex; align-items:center; gap:8px;">
              <span>📝</span> Detail Konten Pengumuman Pop-Up
            </h3>
            <span id="popupModeNotice" style="font-size:0.75rem; font-weight:600; padding:4px 10px; border-radius:20px; background:${isAuto ? '#E0F2FE' : '#FEF3C7'}; color:${isAuto ? '#0369A1' : '#92400E'};">
              ${isAuto ? 'Mode Otomatis Aktif (Form Siap Kustom)' : 'Mode Kustom Aktif'}
            </span>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Row: Kategori & Tanggal -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
              <div>
                <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                  Kategori
                </label>
                <input type="text" id="popupCategoryInput" class="admin-form-input" value="${escapePopupHtml(p.category || 'Akademik')}" oninput="updatePopupLivePreview()" placeholder="Contoh: PSB 2026/2027 / Akademik" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem;">
              </div>
              <div>
                <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                  Tanggal
                </label>
                <input type="text" id="popupDateInput" class="admin-form-input" value="${escapePopupHtml(p.date || '10 September 2026')}" oninput="updatePopupLivePreview()" placeholder="Contoh: 10 September 2026" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem;">
              </div>
            </div>

            <!-- Judul Pengumuman -->
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                Judul Pengumuman
              </label>
              <input type="text" id="popupTitleInput" class="admin-form-input" value="${escapePopupHtml(p.title || '')}" oninput="updatePopupLivePreview()" placeholder="Judul warta atau pengumuman penting..." style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem; font-weight:600;">
            </div>

            <!-- Foto / Media Banner -->
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                Foto Banner Pop-Up (Format Landscape 16:9)
              </label>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="text" id="popupImageInput" class="admin-form-input" value="${escapePopupHtml(p.image || 'assets/berita_santri_prestasi.jpg')}" oninput="updatePopupLivePreview()" placeholder="URL atau assets/..." style="flex:1; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem;">
                <label class="btn-file-upload" style="background:#0F4C81; color:#fff; padding:10px 16px; border-radius:8px; font-size:0.82rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;">
                  <span>📁 Unggah Foto</span>
                  <input type="file" accept="image/*" onchange="handlePopupImageUpload(event)" style="display:none;">
                </label>
              </div>
              <p style="font-size:0.75rem; color:#64748B; margin:4px 0 0 0;">Format disarankan landscape rasio 16:9 (seperti 1280x720 atau 1920x1080).</p>
            </div>

            <!-- Ringkasan Deskripsi -->
            <div>
              <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                Ringkasan Pesan / Deskripsi
              </label>
              <textarea id="popupExcerptInput" rows="3" class="admin-form-input" oninput="updatePopupLivePreview()" placeholder="Tuliskan 1-3 kalimat ringkas pengumuman yang mengundang perhatian pengunjung..." style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem; resize:vertical; line-height:1.5;">${escapePopupHtml(p.excerpt || '')}</textarea>
            </div>

            <!-- Action Button & Link Target -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
              <div>
                <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                  Teks Tombol Aksi
                </label>
                <input type="text" id="popupActionTextInput" class="admin-form-input" value="${escapePopupHtml(p.actionText || 'Baca Selengkapnya')}" oninput="updatePopupLivePreview()" placeholder="Contoh: Baca Selengkapnya / Daftar Sekarang" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem; font-weight:600;">
              </div>
              <div>
                <label style="display:block; font-size:0.82rem; font-weight:700; color:#1E293B; margin-bottom:6px;">
                  Tautan Aksi (Link / Anchor)
                </label>
                <input type="text" id="popupActionLinkInput" class="admin-form-input" value="${escapePopupHtml(p.actionLink || '#berita')}" oninput="updatePopupLivePreview()" placeholder="Contoh: #berita, #psb, #agenda atau URL eksternal" style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #CBD5E1; font-size:0.88rem;">
              </div>
            </div>

            <!-- Quick Link Chips -->
            <div>
              <span style="font-size:0.75rem; color:#64748B; margin-right:8px;">Pilihan Cepat Target:</span>
              <div style="display:inline-flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
                <button type="button" onclick="applyQuickActionLink('#berita', 'Baca Selengkapnya')" class="settings-nav-chip" style="font-size:0.72rem; padding:3px 8px;">📰 Modal Warta (#berita)</button>
                <button type="button" onclick="applyQuickActionLink('#psb', 'Daftar PSB Sekarang')" class="settings-nav-chip" style="font-size:0.72rem; padding:3px 8px;">🎓 Formulir PSB (#psb)</button>
                <button type="button" onclick="applyQuickActionLink('#agenda', 'Lihat Jadwal Agenda')" class="settings-nav-chip" style="font-size:0.72rem; padding:3px 8px;">📅 Agenda Santri (#agenda)</button>
                <button type="button" onclick="applyQuickActionLink('#tentang', 'Profil Yayasan')" class="settings-nav-chip" style="font-size:0.72rem; padding:3px 8px;">🏛️ Visi Misi (#tentang)</button>
              </div>
            </div>

          </div>

          <!-- Bottom Save Action -->
          <div style="margin-top:24px; padding-top:16px; border-top:1px solid #F1F5F9; display:flex; justify-content:flex-end; gap:12px;">
            <button type="button" class="btn-settings-save-hero" onclick="savePopupAnnouncementSettings()" style="background: linear-gradient(135deg, #0A2540, #0F4C81); color:#fff; font-weight:700; padding:10px 24px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
              <span>💾 Simpan & Perbarui Pop-Up</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Live Preview (Mirrors Visitor Screen) -->
      <div class="popup-admin-preview-col" style="position:sticky; top:84px;">
        <div style="background:#fff; border-radius:16px; padding:20px; border:1px solid #E2E8F0; box-shadow:0 8px 30px rgba(10,37,64,0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #F1F5F9;">
            <span style="font-size:0.85rem; font-weight:700; color:#0A2540; display:flex; align-items:center; gap:6px;">
              <span>👁️</span> Pratinjau Tampilan Pengunjung
            </span>
            <span id="previewStatusBadge" style="font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:12px; background:${isEnabled ? '#ECFDF5' : '#FEF2F2'}; color:${isEnabled ? '#059669' : '#DC2626'};">
              ${isEnabled ? '● TAYANG AKTIF' : '○ NONAKTIF'}
            </span>
          </div>

          <!-- Card Simulation Frame -->
          <div style="background:#0a192f15; padding:12px; border-radius:8px; border:1px dashed #CBD5E1;">
            
            <div class="popup-info-card" id="adminPopupLiveCard" style="margin:0 auto; transform:none; max-width:100%; box-shadow:0 12px 36px rgba(10,37,64,0.18);">
              <!-- Top Gold Filigree Line -->
              <div class="popup-gold-filigree-topline"></div>

              <!-- Media Frame (Pure 16:9 Landscape - Unobstructed) -->
              <div class="popup-info-media-frame">
                <img id="previewMediaImg" src="${escapePopupHtml(p.image || 'assets/berita_santri_prestasi.jpg')}" alt="Banner" onerror="this.onerror=null; this.src='assets/hero_santri.jpg';">
              </div>

              <!-- Body Info -->
              <div class="popup-info-body">
                <div class="popup-meta-row">
                  <span class="popup-pill-category" id="previewCatText">${escapePopupHtml(p.category || 'Akademik')}</span>
                  <span class="popup-meta-bullet">&bull;</span>
                  <span class="popup-pill-date-clean" id="previewDateText">${escapePopupHtml(p.date || '10 September 2026')}</span>
                </div>
                <h3 class="popup-info-headline" id="previewTitleText">
                  ${escapePopupHtml(p.title || 'Judul Pengumuman Utama')}
                </h3>
                <p class="popup-info-excerpt" id="previewExcerptText">
                  ${escapePopupHtml(p.excerpt || 'Deskripsi singkat pengumuman yang informatif dan elegan.')}
                </p>

                <!-- Single Action Button -->
                <button type="button" class="popup-btn-read" style="pointer-events:none;">
                  <span id="previewActionBtnText">${escapePopupHtml(p.actionText || 'Baca Selengkapnya')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>

                <!-- Footer Utility Simulation -->
                <div class="popup-info-footer-compact">
                  <label class="popup-dont-show-label" style="pointer-events:none;">
                    <input type="checkbox">
                    <span>Jangan tampilkan lagi hari ini</span>
                  </label>
                  <span style="font-size:0.74rem; color:#64748B;">Tutup</span>
                </div>
              </div>
            </div>

          </div>

          <div style="margin-top:14px; background:#F8FAFC; border-radius:10px; padding:10px 14px; font-size:0.75rem; color:#64748B; border:1px solid #E2E8F0; line-height:1.4;">
            💡 <strong>Desain Ramping & Rapi:</strong> Format baru ini 45% lebih ringkas, elegan, dan proporsional untuk kenyamanan membaca di layar ponsel maupun desktop.
          </div>
        </div>
      </div>

    </div>
  `;

  // Update live preview initial values
  updatePopupLivePreview();
}

window.togglePopupEnabled = function(enabled) {
  const lbl = document.getElementById('popupEnabledLabel');
  if (lbl) {
    lbl.textContent = enabled ? '● AKTIF TAYANG' : '○ NONAKTIF';
    lbl.style.color = enabled ? '#059669' : '#64748B';
  }
  const badge = document.getElementById('previewStatusBadge');
  if (badge) {
    badge.textContent = enabled ? '● TAYANG AKTIF' : '○ NONAKTIF';
    badge.style.background = enabled ? '#ECFDF5' : '#FEF2F2';
    badge.style.color = enabled ? '#059669' : '#DC2626';
  }
  const navBadge = document.getElementById('navPopupStatus');
  if (navBadge) {
    navBadge.textContent = enabled ? 'ON' : 'OFF';
    navBadge.style.background = enabled ? '#10B981' : '#64748B';
  }
};

window.switchPopupMode = function(mode) {
  const radioAuto = document.getElementById('radioModeAuto');
  const radioCustom = document.getElementById('radioModeCustom');
  const cardAuto = document.getElementById('modeCardAuto');
  const cardCustom = document.getElementById('modeCardCustom');
  const notice = document.getElementById('popupModeNotice');

  if (mode === 'auto') {
    if (radioAuto) radioAuto.checked = true;
    if (cardAuto) {
      cardAuto.style.border = '2px solid #0F4C81';
      cardAuto.style.background = '#F0F9FF';
    }
    if (cardCustom) {
      cardCustom.style.border = '2px solid #E2E8F0';
      cardCustom.style.background = '#F8FAFC';
    }
    if (notice) {
      notice.textContent = 'Mode Otomatis Aktif (Form Siap Kustom)';
      notice.style.background = '#E0F2FE';
      notice.style.color = '#0369A1';
    }

    // Auto-populate from latest news
    const db = getDB();
    const newsList = Array.isArray(db.news) ? db.news : [];
    if (newsList.length > 0) {
      const topNews = newsList[0];
      const titleInput = document.getElementById('popupTitleInput');
      const catInput = document.getElementById('popupCategoryInput');
      const dateInput = document.getElementById('popupDateInput');
      const imgInput = document.getElementById('popupImageInput');
      const excerptInput = document.getElementById('popupExcerptInput');
      const linkInput = document.getElementById('popupActionLinkInput');

      if (titleInput) titleInput.value = topNews.title || '';
      if (catInput) catInput.value = topNews.category || 'Akademik';
      if (dateInput) dateInput.value = topNews.date || 'Terkini';
      if (imgInput) imgInput.value = topNews.image || 'assets/berita_santri_prestasi.jpg';
      if (excerptInput) excerptInput.value = topNews.excerpt || (topNews.content ? topNews.content.substring(0, 160) + '...' : '');
      if (linkInput) linkInput.value = '#berita';
    }
  } else {
    if (radioCustom) radioCustom.checked = true;
    if (cardCustom) {
      cardCustom.style.border = '2px solid #0F4C81';
      cardCustom.style.background = '#F0F9FF';
    }
    if (cardAuto) {
      cardAuto.style.border = '2px solid #E2E8F0';
      cardAuto.style.background = '#F8FAFC';
    }
    if (notice) {
      notice.textContent = 'Mode Kustom Aktif';
      notice.style.background = '#FEF3C7';
      notice.style.color = '#92400E';
    }
  }

  updatePopupLivePreview();
};

window.handlePopupImageUpload = function(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const input = document.getElementById('popupImageInput');
    if (input) input.value = dataUrl;
    updatePopupLivePreview();
  };
  reader.readAsDataURL(file);
};

window.applyQuickActionLink = function(link, defaultText) {
  const linkInput = document.getElementById('popupActionLinkInput');
  const textInput = document.getElementById('popupActionTextInput');
  if (linkInput) linkInput.value = link;
  if (textInput && defaultText) textInput.value = defaultText;
  updatePopupLivePreview();
};

window.resetPopup24hCookie = function() {
  try {
    localStorage.removeItem('ytpai_popup_dismissed_until');
    alert('✅ Cookie pembatasan penayangan 24 jam berhasil dibersihkan!\n\nSekarang Anda dapat membuka portal web (index.html), dan jendela pop-up akan langsung muncul kembali.');
  } catch (e) {
    alert('Gagal membersihkan cookie lokal.');
  }
};

window.updatePopupLivePreview = function() {
  const badgeVal = document.getElementById('popupBadgeInput')?.value || 'WARTA UTAMA';
  const catVal = document.getElementById('popupCategoryInput')?.value || 'Akademik';
  const dateVal = document.getElementById('popupDateInput')?.value || '10 September 2026';
  const titleVal = document.getElementById('popupTitleInput')?.value || 'Judul Pengumuman Utama';
  const excerptVal = document.getElementById('popupExcerptInput')?.value || 'Deskripsi singkat pengumuman yang informatif dan elegan.';
  const actionTextVal = document.getElementById('popupActionTextInput')?.value || 'Baca Selengkapnya';
  const imageVal = document.getElementById('popupImageInput')?.value || 'assets/berita_santri_prestasi.jpg';

  const badgeEl = document.getElementById('previewBadgeText');
  const catEl = document.getElementById('previewCatText');
  const dateEl = document.getElementById('previewDateText');
  const titleEl = document.getElementById('previewTitleText');
  const excerptEl = document.getElementById('previewExcerptText');
  const actionBtnEl = document.getElementById('previewActionBtnText');
  const mediaImg = document.getElementById('previewMediaImg');

  if (badgeEl) badgeEl.textContent = badgeVal;
  if (catEl) catEl.textContent = catVal;
  if (dateEl) dateEl.textContent = dateVal;
  if (titleEl) titleEl.textContent = titleVal;
  if (excerptEl) excerptEl.textContent = excerptVal;
  if (actionBtnEl) actionBtnEl.textContent = actionTextVal;
  if (mediaImg && imageVal) mediaImg.src = imageVal;
};

window.savePopupAnnouncementSettings = function() {
  const db = getDB();
  const enabled = document.getElementById('popupEnabledSwitch')?.checked !== false;
  const isAuto = document.getElementById('radioModeAuto')?.checked === true;

  const newsList = Array.isArray(db.news) ? db.news : [];
  const latestNews = newsList[0] || {};

  db.popupAnnouncement = {
    enabled: enabled,
    mode: isAuto ? 'auto' : 'custom',
    badge: '',
    category: document.getElementById('popupCategoryInput')?.value.trim() || 'Akademik',
    title: document.getElementById('popupTitleInput')?.value.trim() || (latestNews.title || 'Pengumuman Resmi'),
    date: document.getElementById('popupDateInput')?.value.trim() || (latestNews.date || 'Terkini'),
    image: document.getElementById('popupImageInput')?.value.trim() || (latestNews.image || 'assets/berita_santri_prestasi.jpg'),
    excerpt: document.getElementById('popupExcerptInput')?.value.trim() || (latestNews.excerpt || ''),
    actionText: document.getElementById('popupActionTextInput')?.value.trim() || 'Baca Selengkapnya',
    actionLink: document.getElementById('popupActionLinkInput')?.value.trim() || '#berita',
    newsId: latestNews.id || 1
  };

  saveDB(db);

  // Update sidebar badge
  const navBadge = document.getElementById('navPopupStatus');
  if (navBadge) {
    navBadge.textContent = enabled ? 'ON' : 'OFF';
    navBadge.style.background = enabled ? '#10B981' : '#64748B';
  }

  // Trigger cross-tab sync event
  try {
    window.dispatchEvent(new CustomEvent('ytpai_db_updated', { detail: { tab: 'popup' } }));
  } catch (e) {}

  alert('✅ Konfigurasi Pop-Up Pengumuman Website Berhasil Disimpan!\n\nPerubahan kini telah aktif dan akan langsung tampil bagi pengunjung website.');
};


