/* ============================================================
 * 파일 확장자 차단 데모용 JS (프론트 전용)
 * - 모달 열기/닫기
 * - '파일 확장자 차단' 페이지: 저장 → 로컬스토리지 저장 → 모달 표시
 * - 커스텀 확장자 칩 추가/삭제 (간단 검증 포함)
 * - '업로드 테스트' 페이지: 업로드 시 정책 적용(차단/허용) → 모달 표시 + 리스트 추가
 * ------------------------------------------------------------
 * ⚠️ 실제 서비스에서는 서버 검증이 최종 권한자입니다. (프론트는 보조 수단)
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

/** 파일명에서 확장자 추출 + 정규화 (소문자, 선행 '.' 제거) */
function normalizeExt(filename) {
    if (!filename) return '';
    const last = filename.split('/').pop().split('\\').pop(); // mac/win 경로 대비
    const parts = last.split('.');
    if (parts.length <= 1) return ''; // 확장자 없음
    let ext = parts.pop().toLowerCase().trim();
    if (ext.startsWith('.')) ext = ext.slice(1);
    return ext;
}

/** 로컬스토리지 키 */
const LS_KEY = 'extPolicyDemo';

/** 정책 저장 */
function savePolicyToLS(policy) {
    // 한국어 로그 요청: 콘솔 한글 출력
    console.log('[정책 저장] 고정:', policy.fixed, '커스텀:', policy.custom);
    localStorage.setItem(LS_KEY, JSON.stringify(policy));
}

/** 정책 로드 (없으면 기본 빈 셋) */
function loadPolicyFromLS() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { fixed: [], custom: [] };
    try {
        const p = JSON.parse(raw);
        return {
            fixed: Array.isArray(p.fixed) ? p.fixed : [],
            custom: Array.isArray(p.custom) ? p.custom : [],
        };
    } catch (e) {
        console.warn('정책 파싱 실패. 초기화합니다.');
        return { fixed: [], custom: [] };
    }
}

/** 확장자 정규화(입력창에서 값 받을 때) */
function normalizeInputExt(value) {
    if (!value) return '';
    let v = value.trim().toLowerCase();
    if (v.startsWith('.')) v = v.slice(1);
    return v;
}

/** 간단 형식 검증: 영숫자 시작, 총 1~20자, -, _, . 허용 */
function isValidExt(ext) {
    if (!ext) return false;
    if (ext.length > 20) return false;
    return /^[a-z0-9][a-z0-9._-]{0,19}$/.test(ext);
}

/* =============== 파일 확장자 차단 페이지 전용 =============== */
function initAdminExtPolicyPage() {
    const isAdminPage = document.title.includes('파일 확장자 차단');
    if (!isAdminPage) return;

    const saveBtn = document.querySelector('.actions .actions__right .btn-primary');
    const cancelBtn = document.querySelector('.actions .actions__right .btn-ghost');
    const goTestBtn = document.querySelector('.actions .actions__left a');
    const saveModal = document.getElementById('saveModal');

    // 체크박스/칩 DOM
    const fixedChecks = Array.from(document.querySelectorAll('input[type="checkbox"][name="fixed"]'));
    const inputEl = document.querySelector('.custom-input-row .input');
    const addBtn = document.querySelector('.custom-input-row .btn-secondary');
    const chipArea = document.querySelector('.chip-area');
    const counterEl = document.querySelector('.chip-counter strong');

    // 로컬스토리지 정책을 화면에 반영
    const existing = loadPolicyFromLS();
    // 1) 고정 확장자 체크 반영
    const existingFixedSet = new Set(existing.fixed);
    fixedChecks.forEach(cb => {
        cb.checked = existingFixedSet.has(cb.value);
    });

    // 2) 커스텀 칩 렌더 (현재 칩들 제거 후 로드)
    function renderChips(list) {
        chipArea.innerHTML = '';
        list.forEach(ext => {
            chipArea.appendChild(makeChip(ext));
        });
        updateCount();
    }

    // 칩 엘리먼트 생성
    function makeChip(ext) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.setAttribute('role', 'listitem');
        const text = document.createElement('span');
        text.className = 'chip__text';
        text.textContent = ext;
        const close = document.createElement('button');
        close.className = 'chip__close';
        close.setAttribute('aria-label', `${ext} 삭제`);
        close.textContent = '×';
        close.addEventListener('click', () => {
            chip.remove();
            updateCount();
        });
        chip.appendChild(text);
        chip.appendChild(close);
        return chip;
    }

    // 현재 칩 목록 수집
    function collectCustomExts() {
        return Array.from(chipArea.querySelectorAll('.chip__text')).map(el => el.textContent);
    }

    // 카운터 업데이트
    function updateCount() {
        const count = chipArea.querySelectorAll('.chip').length;
        if (counterEl) counterEl.textContent = String(count);
    }

    // 초기 칩: 로컬스토리지 값으로 덮어씀
    if (existing.custom?.length) {
        renderChips(existing.custom);
    } else {
        updateCount(); // 기본 샘플이 있다면 카운터만 갱신
    }

    // [추가] 버튼: 칩 추가
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const raw = inputEl?.value ?? '';
            const ext = normalizeInputExt(raw);
            if (!isValidExt(ext)) {
                console.warn('유효하지 않은 확장자입니다. (1~20자, 영숫자 시작, -, _, . 허용)');
                inputEl?.focus();
                inputEl?.classList.add('input--error');
                setTimeout(() => inputEl?.classList.remove('input--error'), 600);
                return;
            }
            // 중복 검사 (현재 칩 기준)
            const current = new Set(collectCustomExts());
            if (current.has(ext)) {
                console.warn('이미 추가된 확장자입니다:', ext);
                inputEl?.focus();
                return;
            }
            // 최대 200 제한
            if (current.size >= 200) {
                console.warn('커스텀 확장자는 최대 200개까지 가능합니다.');
                return;
            }
            chipArea.appendChild(makeChip(ext));
            updateCount();
            inputEl.value = '';
            inputEl.focus();
        });
    }

    // [저장] 버튼: 정책 저장 → 모달 열기
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const fixed = fixedChecks.filter(cb => cb.checked).map(cb => cb.value);
            const custom = collectCustomExts();

            savePolicyToLS({ fixed, custom });

            // 저장 완료 모달 열기
            openModal(saveModal);
        });
    }

    // [취소] 버튼: 로컬 변경 무시하고 리프레시(데모용)
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // 모달 닫기(배경 클릭/ESC)
    attachModalClose(saveModal);
}

/* =============== 업로드 테스트 페이지 전용 =============== */
function initTestUploadPage() {
    const isTestPage = document.title.includes('업로드 테스트');
    if (!isTestPage) return;

    const form = document.querySelector('form.form-table');
    const fileInput = form?.querySelector('input[type="file"]');
    const resultModal = document.getElementById('resultModal');
    const modalTitle = resultModal?.querySelector('h3#rTitle');
    const modalDesc = resultModal?.querySelector('.modal__desc');
    const tableBody = document.querySelector('.table tbody');

    // 정책 로드
    const policy = loadPolicyFromLS();
    const blockedSet = new Set([...(policy.fixed || []), ...(policy.custom || [])]);

    // 제출 핸들러(서버 없이 데모)
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const file = fileInput?.files?.[0];
            if (!file) {
                if (modalTitle) modalTitle.textContent = '업로드 실패';
                if (modalDesc) modalDesc.textContent = '파일이 선택되지 않았습니다.';
                openModal(resultModal);
                return;
            }

            const ext = normalizeExt(file.name);
            const isBlocked = blockedSet.has(ext);

            // 결과 모달 문구
            if (isBlocked) {
                if (modalTitle) modalTitle.textContent = '차단됨';
                if (modalDesc) modalDesc.textContent = `정책에 의해 금지된 확장자(.${ext})입니다.`;
            } else {
                if (modalTitle) modalTitle.textContent = '업로드 성공';
                if (modalDesc) modalDesc.textContent = `허용된 파일입니다 (.${ext}).`;
            }

            // 최근 업로드 테이블에 한 줄 추가(데모)
            if (tableBody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${file.name}</td>
            <td>${ext || '-'}</td>
            <td><span class="badge ${isBlocked ? 'block' : 'ok'}">${isBlocked ? 'BLOCK' : 'ALLOW'}</span></td>
            <td>${formatNow()}</td>
          `;
                tableBody.prepend(tr); // 최신이 위로 오도록
            }

            openModal(resultModal);
        });
    }

    // 모달 닫기(배경 클릭/ESC)
    attachModalClose(resultModal);
}

/* =============== 모달 공통 닫기 바인딩 =============== */
function attachModalClose(modal) {
    if (!modal) return;

    // 배경 클릭 시 닫기
    const backdrop = modal.querySelector('.modal__backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => closeModal(modal));
    }

    // ESC 닫기
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