// متغيرات عامة
let currentLang = 'ar';
let allPlayers = []; // نخزن فيها كل اللاعبين (للـ search)

// تشغيل أول ما الصفحة تجهز
document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    initLang();
    applySettingsFromStorage();
});

// ========== نظام اللغة ==========
function initLang() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });

    applyLang('ar'); // افتراضي عربي
}

function applyLang(lang) {
    currentLang = lang;

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const elements = document.querySelectorAll('[data-ar]');
    elements.forEach(el => {
        const arText = el.getAttribute('data-ar');
        const enText = el.getAttribute('data-en') || arText;
        if (lang === 'ar') {
            el.innerHTML = arText;
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
        } else {
            el.innerHTML = enText;
            document.documentElement.lang = 'en';
            document.documentElement.dir = 'ltr';
        }
    });

    // إعادة تطبيق الإعدادات (لأن النصوص تتغيّر حسب اللغة)
    applySettingsFromStorage();
}

// ========== إعدادات لوحة التحكم (localStorage) ==========
function getSettings() {
    const raw = localStorage.getItem('ll_settings');
    if (!raw) return { status: '', announcement: '' };
    try {
        return JSON.parse(raw);
    } catch {
        return { status: '', announcement: '' };
    }
}

function saveSettings(newData) {
    const current = getSettings();
    const merged = { ...current, ...newData };
    localStorage.setItem('ll_settings', JSON.stringify(merged));
    applySettingsFromStorage();
}

function applySettingsFromStorage() {
    const s = getSettings();

    // حالة السيرفر في الهيرو
    const statusEl = document.getElementById('server-status-text');
    if (statusEl) {
        statusEl.textContent = s.status || (currentLang === 'ar'
            ? 'Online - السيرفر شغّال'
            : 'Online - Server stable');
    }

    // بانر الإعلان في الرئيسية
    const annEl = document.getElementById('announcement-text');
    if (annEl) {
        annEl.textContent = s.announcement || (currentLang === 'ar'
            ? 'مرحباً بك في Last Law RP'
            : 'Welcome to Last Law RP');
    }

    // تعبئة حقول لوحة التحكم
    const admStatusInput = document.getElementById('admin-status-input');
    const admAnnInput = document.getElementById('admin-ann-input');
    if (admStatusInput) admStatusInput.value = s.status || '';
    if (admAnnInput) admAnnInput.value = s.announcement || '';
}

// يتم استدعاؤها من admin.html عند الضغط على زر "حفظ الإعدادات"
function handleAdminSaveSettings() {
    const statusVal = document.getElementById('admin-status-input').value;
    const annVal = document.getElementById('admin-ann-input').value;
    saveSettings({ status: statusVal, announcement: annVal });
    const msg = document.getElementById('admin-msg');
    if (msg) {
        msg.textContent = currentLang === 'ar'
            ? 'تم حفظ الإعدادات محلياً (localStorage).'
            : 'Settings saved locally (localStorage).';
    }
}

// ========== إحصائيات اللاعبين (داتا تجريبية + Search) ==========
async function loadPlayers(tableId = 'players-table', statusId = 'stats-status') {
    const status = document.getElementById(statusId);
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (status) {
        status.textContent = currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...';
    }

    // TODO: حالياً بيانات تجريبية، لاحقاً تربطها على API حقيقي
    allPlayers = [
        { citizenid: 'LL-1001', name: 'Khaled Law',   money: 250000, job: 'police' },
        { citizenid: 'LL-1002', name: 'M7mad Ghost', money: 180000, job: 'gang' },
        { citizenid: 'LL-1003', name: 'Moez Taxi',   money:  90000, job: 'taxi' },
        { citizenid: 'LL-1004', name: 'Sara EMS',    money: 150000, job: 'ambulance' }
    ];

    renderPlayersTable(allPlayers, tableId);

    if (status) {
        status.textContent = currentLang === 'ar'
            ? 'هذه بيانات تجريبية، يمكن ربطها بقاعدة البيانات لاحقاً.'
            : 'Demo data. You can connect this to your real DB later.';
    }

    // لو في input بحث، نظّفه
    const searchInput = document.getElementById('player-search');
    if (searchInput) searchInput.value = '';
}

// رسم الجدول حسب مصفوفة لاعبين
function renderPlayersTable(players, tableId = 'players-table') {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!players || players.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.style.textAlign = 'center';
        td.textContent = currentLang === 'ar'
            ? 'لا يوجد لاعبين مطابقين.'
            : 'No matching players.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    players.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.citizenid || ''}</td>
            <td>${p.name || ''}</td>
            <td>${p.money || ''}</td>
            <td>${p.job || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// البحث عن اللاعبين
function searchPlayers(tableId = 'players-table', inputId = 'player-search') {
    const input = document.getElementById(inputId);
    if (!input) return;

    const q = input.value.toLowerCase().trim();

    if (!q) {
        renderPlayersTable(allPlayers, tableId);
        return;
    }

    const filtered = allPlayers.filter(p => {
        const cid  = String(p.citizenid || '').toLowerCase();
        const name = String(p.name || '').toLowerCase();
        const job  = String(p.job || '').toLowerCase();
        return cid.includes(q) || name.includes(q) || job.includes(q);
    });

    renderPlayersTable(filtered, tableId);
}
