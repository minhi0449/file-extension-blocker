/* ============================================================
 * 파일 확장자 차단 - 프런트 전용 main.js (단일 스크립트)
 * 요구:
 *   - 점(.) 금지
 *   - 숫자 금지
 *   - 1~20자
 *   - 영문 소문자/하이픈만 허용
 *   - 고정 확장자 7개(bat, cmd, com, cp, exe, scr, js) 커스텀에 추가 금지
 * ============================================================ */

/* =============== 공통 유틸 =============== */

/** 모달 열기 */
function openModal(modal) {
    if (!modal) return;
    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
}

/** 모달 닫기 */
function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.style.overflow = '';
}

/** 업로드 파일명에서 확장자 추출 (소문자) */
function extractExtFromFilename(filename) {
    if (!filename) return '';
    const last = filename.split('/').pop().split('\\').pop();
    const idx = last.lastIndexOf('.');
    if (idx <= 0 || idx === last.length - 1) return '';
    return last.slice(idx + 1).toLowerCase().trim();
}

/** 로컬스토리지 키 */
const LS_KEY = 'extPolicyDemo';

/** 정책 저장 */
function savePolicyToLS(policy) {
    localStorage.setItem(LS_KEY, JSON.stringify(policy));
}

/** 정책 로드 */
function loadPolicyFromLS() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { fixed: [], custom: [] };
    try {
        const p = JSON.parse(raw);
        return {
            fixed: Array.isArray(p.fixed) ? p.fixed : [],
            custom: Array.isArray(p.custom) ? p.custom : [],
        };
    } catch {
        return { fixed: [], custom: [] };
    }
}

/* =============== 파일 확장자 차단(관리) 페이지 =============== */
function initAdminExtPolicyPage() {
    const isAdminPage = document.title.includes('파일 확장자 차단');
    if (!isAdminPage) return;

    const inputEl   = document.getElementById('customExtInput');
    const addBtn    = document.getElementById('btnAddCustom');
    const chipArea  = document.getElementById('chipArea');
    const countEl   = document.getElementById('chipCount');
    const saveBtn   = document.querySelector('.actions .btn-primary');
    const cancelBtn = document.querySelector('.actions .btn-ghost');
    const saveModal = document.getElementById('saveModal');

    const fixedChecks = Array.from(document.querySelectorAll('input[type="checkbox"][name="fixedExt"]'));

    // 🔒 고정 확장자 (커스텀으로 추가 금지)
    const FIXED_BLOCKED_EXTS = ['bat', 'cmd', 'com', 'cpl', 'exe', 'scr', 'js'];

    // 검증 규칙
    function validateExt(ext) {
        if (!ext) return [false, '확장자를 입력해 주세요.'];
        if (ext.includes('.')) return [false, '확장자에는 점(.)을 포함할 수 없습니다.'];
        if (/[0-9]/.test(ext)) return [false, '확장자에는 숫자를 포함할 수 없습니다.'];
        if (!/^[a-z-]{1,20}$/.test(ext)) {
            return [false, '확장자는 1~20자의 영문 소문자와 하이픈(-)만 허용됩니다.'];
        }
        if (FIXED_BLOCKED_EXTS.includes(ext)) {
            return [false, `"${ext}" 는 고정 확장자로 이미 관리되고 있습니다.`];
        }
        return [true, ''];
    }

    // 칩 DOM 생성
    function createChip(ext) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.setAttribute('role', 'listitem');

        const span = document.createElement('span');
        span.className = 'chip__text';
        span.textContent = ext;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip__close';
        btn.setAttribute('aria-label', `${ext} 삭제`);
        btn.textContent = '×';

        chip.append(span, btn);
        return chip;
    }

    function collectCustomExts() {
        return Array.from(chipArea.querySelectorAll('.chip__text')).map(el => el.textContent);
    }

    function updateCount() {
        if (!countEl) return;
        const n = chipArea.querySelectorAll('.chip').length;
        countEl.textContent = String(n);
    }

    function tryAddChip() {
        let ext = (inputEl?.value || '').trim().toLowerCase();

        const [ok, msg] = validateExt(ext);
        if (!ok) {
            alert(msg);
            inputEl?.focus();
            return false;
        }

        const exists = collectCustomExts().some(v => v === ext);
        if (exists) {
            alert('이미 추가된 확장자입니다.');
            inputEl?.focus();
            return false;
        }

        const currentCount = chipArea.querySelectorAll('.chip').length;
        if (currentCount >= 200) {
            alert('커스텀 확장자는 최대 200개까지 가능합니다.');
            return false;
        }

        chipArea.appendChild(createChip(ext));
        inputEl.value = '';
        updateCount();
        return true;
    }

    chipArea?.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip__close');
        if (!btn) return;
        btn.closest('.chip')?.remove();
        updateCount();
    });

    addBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tryAddChip();
    });

    inputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            tryAddChip();
        }
    });

    const existing = loadPolicyFromLS();
    const fixedSet = new Set(existing.fixed || []);
    fixedChecks.forEach(cb => { cb.checked = fixedSet.has(cb.value); });

    chipArea.innerHTML = '';
    (existing.custom || []).forEach(ext => chipArea.appendChild(createChip(ext)));
    updateCount();

    saveBtn?.addEventListener('click', () => {
        const fixed = fixedChecks.filter(cb => cb.checked).map(cb => cb.value);
        const custom = collectCustomExts();
        savePolicyToLS({ fixed, custom });
        openModal(saveModal);
    });

    cancelBtn?.addEventListener('click', () => {
        window.location.reload();
    });

    attachModalClose(saveModal);
}

/* =============== 업로드 테스트 페이지 =============== */
function initTestUploadPage() {
    const isTestPage = document.title.includes('업로드 테스트');
    if (!isTestPage) return;

    const form       = document.querySelector('form.form-table');
    const fileInput  = form?.querySelector('input[type="file"]');
    const resultModal= document.getElementById('resultModal');
    const modalTitle = resultModal?.querySelector('#rTitle');
    const modalDesc  = resultModal?.querySelector('.modal__desc');
    const tableBody  = document.querySelector('.table tbody');

    const policy = loadPolicyFromLS();
    const blockedSet = new Set([...(policy.fixed || []), ...(policy.custom || [])]);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const file = fileInput?.files?.[0];
        if (!file) {
            if (modalTitle) modalTitle.textContent = '업로드 실패';
            if (modalDesc)  modalDesc.textContent  = '파일이 선택되지 않았습니다.';
            openModal(resultModal);
            return;
        }

        const ext = extractExtFromFilename(file.name);
        const isBlocked = blockedSet.has(ext);

        if (isBlocked) {
            if (modalTitle) modalTitle.textContent = '차단됨';
            if (modalDesc)  modalDesc.textContent  = `정책에 의해 금지된 확장자(.${ext})입니다.`;
        } else {
            if (modalTitle) modalTitle.textContent = '업로드 성공';
            if (modalDesc)  modalDesc.textContent  = `허용된 파일입니다 (.${ext}).`;
        }

        if (tableBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${file.name}</td>
        <td>${ext || '-'}</td>
        <td><span class="badge ${isBlocked ? 'block' : 'ok'}">${isBlocked ? 'BLOCK' : 'ALLOW'}</span></td>
        <td>${formatNow()}</td>
      `;
            tableBody.prepend(tr);
        }

        openModal(resultModal);
    });

    attachModalClose(resultModal);
}

/* =============== 모달 공통 닫기 =============== */
function attachModalClose(modal) {
    if (!modal) return;
    modal.querySelector('.modal__backdrop')?.addEventListener('click', () => closeModal(modal));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal(modal);
        }
    });
}

/* =============== 포맷 유틸 =============== */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function formatNow() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const MM = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}

/* =============== 초기화 =============== */
document.addEventListener('DOMContentLoaded', () => {
    initAdminExtPolicyPage();
    initTestUploadPage();
});