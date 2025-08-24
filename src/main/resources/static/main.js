/* ============================================================
 * 파일 확장자 차단 (DB 연동 버전)
 * - 페이지 로드시 서버에서 정책/목록 조회 → UI 렌더
 * - 체크박스 변경 시 PATCH /api/fixed/toggle
 * - 커스텀 +추가 시 POST /api/custom
 * - 칩 X 클릭 시 DELETE /api/custom/{ext}
 * - 업로드 테스트 화면: 저장된 정책으로 차단/허용 판정 + 최근 업로드 테이블 갱신
 * ============================================================ */

/* =============== 공통: 헬퍼 =============== */
const FIXED_SET = new Set(["bat", "cmd", "com", "cpl", "exe", "scr", "js"]); // 고정 7종

function $(sel, root=document) { return root.querySelector(sel); }
function $all(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

function toast(msg) { console.log(msg); alert(msg); } // 심플 얼럿(원하면 토스트로 교체)

function extractExtFromFilename(name) {
    if (!name) return "";
    const last = name.split('/').pop().split('\\').pop();
    const i = last.lastIndexOf('.');
    if (i <= 0 || i === last.length-1) return "";
    return last.slice(i+1).toLowerCase();
}

/* 유효성: 영문 소문자 1~20자, 숫자/점/하이픈/언더스코어 불가 (요구사항대로 엄격)
   -> /^[a-z]{1,20}$/ */
function isValidCustomExt(ext) {
    return /^[a-z]{1,20}$/.test(ext);
}

/* =============== 파일 확장자 차단 페이지 =============== */
async function initBlockPage() {
    if (document.title !== "파일 확장자 차단") return;

    const inputEl   = $("#customExtInput");
    const addBtn    = $("#btnAddCustom");
    const chipArea  = $("#chipArea");
    const chipCount = $("#chipCount");
    const saveBtn   = $(".actions .btn-primary"); // 지금은 별도 '저장' 필요 없음(즉시 반영). 남겨두기만.
    const cancelBtn = $(".actions .btn-ghost");

    // 1) 정책/목록 로드
    const policy = await fetchJson("/api/policy");
    if (!policy?.success) { toast("정책 조회 실패"); return; }
    const { maxExtensionLength, maxCustomExtensions } = policy.data;

    // 2) 고정 확장자 상태 로드 → 체크박스 반영
    const fixedRes = await fetchJson("/api/fixed");
    if (!fixedRes?.success) { toast("고정 확장자 조회 실패"); return; }
    const fixedList = fixedRes.data || [];
    // 페이지의 체크박스들
    const checkboxes = $all('input[type="checkbox"][name="fixedExt"]');

    // [중요] value 오타 주의(cpl). 서버 목록 기준으로 반영
    const blockedMap = new Map(fixedList.map(it => [it.extension, !!it.blocked]));
    checkboxes.forEach(cb => {
        const ext = cb.value.toLowerCase();
        cb.checked = !!blockedMap.get(ext);
        cb.addEventListener("change", async () => {
            // PATCH /api/fixed/toggle {extension, blocked}
            const body = { extension: ext, blocked: cb.checked };
            const res = await fetchJson("/api/fixed/toggle", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!res?.success) {
                toast(res?.message || "저장 실패");
                cb.checked = !cb.checked; // 롤백
            }
        });
    });

    // 3) 커스텀 확장자 로드 → 칩 렌더
    const customRes = await fetchJson("/api/custom");
    if (!customRes?.success) { toast("커스텀 확장자 조회 실패"); return; }
    renderChips(customRes.data || []);

    // 칩 렌더러
    function renderChips(list) {
        chipArea.innerHTML = "";
        for (const item of list) appendChip(item.extension);
        updateCount();
    }

    // 칩 생성 + DOM 추가
    function appendChip(ext) {
        const chip = document.createElement("div");
        chip.className = "chip"; chip.setAttribute("role","listitem");
        chip.innerHTML = `
      <span class="chip__text">${ext}</span>
      <button type="button" class="chip__close" aria-label="${ext} 삭제">×</button>
    `;
        chipArea.appendChild(chip);
    }

    function collectExts() {
        return $all(".chip__text", chipArea).map(el => el.textContent);
    }

    function updateCount() { chipCount.textContent = String(collectExts().length); }

    // 4) +추가 버튼
    addBtn?.addEventListener("click", async () => {
        let ext = (inputEl.value || "").trim().toLowerCase();
        if (ext.startsWith(".")) ext = ext.slice(1);

        // 4-1) 프론트 유효성
        if (!isValidCustomExt(ext)) {
            toast("영문 소문자 1~20자만 허용(숫자/점/기호 불가)");
            inputEl.focus(); return;
        }
        // 4-2) 고정 확장자 중복 금지
        if (FIXED_SET.has(ext)) {
            toast(`'${ext}'는 고정 확장자라 추가할 수 없어요.`);
            inputEl.focus(); return;
        }
        // 4-3) 현재 칩 중복 체크
        const cur = new Set(collectExts());
        if (cur.has(ext)) { toast("이미 추가된 확장자입니다."); inputEl.focus(); return; }

        // 4-4) 최대 개수
        if (cur.size >= (maxCustomExtensions ?? 200)) {
            toast(`커스텀 확장자는 최대 ${(maxCustomExtensions ?? 200)}개까지 가능합니다.`);
            return;
        }

        // 4-5) 서버 저장
        const res = await fetchJson("/api/custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ extension: ext })
        });
        if (!res?.success) {
            toast(res?.message || "추가 실패(형식/중복/최대개수 확인)");
            return;
        }

        // 성공 시 칩 추가
        appendChip(ext);
        updateCount();
        inputEl.value = ""; inputEl.focus();
    });

    // 5) 칩 영역 X 클릭 → 서버 삭제
    chipArea.addEventListener("click", async (e) => {
        const btn = e.target.closest(".chip__close"); if (!btn) return;
        const chip = btn.closest(".chip");
        const ext = chip.querySelector(".chip__text").textContent;

        const res = await fetchJson(`/api/custom/${encodeURIComponent(ext)}`, { method: "DELETE" });
        if (!res?.success) { toast(res?.message || "삭제 실패"); return; }

        chip.remove(); updateCount();
    });

    // [옵션] 취소 버튼: 화면 리셋
    cancelBtn?.addEventListener("click", () => window.location.reload());
}

/* =============== 업로드 테스트 페이지 =============== */
async function initUploadTestPage() {
    if (document.title !== "업로드 테스트") return;

    // DOM 캐시
    const form        = document.getElementById("uploadForm") || document.querySelector(".form-table");
    const fileInput   = document.getElementById("file") || form?.querySelector('input[type="file"]');
    const submitBtn   = (form && (form.querySelector('button[type="submit"]') || document.querySelector('button[form="uploadForm"][type="submit"]'))) || document.querySelector('.actions .btn-primary');
    const resultModal = document.getElementById("resultModal");
    const modalTitle  = document.getElementById("rTitle");
    const modalDesc   = resultModal?.querySelector(".modal__desc");
    const modalOkBtn  = document.getElementById("modalOk");
    const tbody       = document.getElementById("recentTbody") || document.querySelector(".data-table tbody");

    // 진입 시 최근 업로드 목록 렌더
    await loadRecent();

    // 업로드 처리
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 파일 유무 체크
        const file = fileInput?.files?.[0];
        if (!file) {
            modalTitle.textContent = "업로드 실패";
            modalDesc.textContent  = "파일이 선택되지 않았습니다.";
            openModal(resultModal);
            // OK 누르면 표만 갱신 & 모달 닫기
            modalOkBtn?.addEventListener('click', async () => {
                await loadRecent();
                closeModal(resultModal);
            }, { once:true });
            return;
        }

        // 중복제출 방지
        if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.loading = "1"; }

        try {
            // 서버에 멀티파트 업로드(판정 + DB 이력 저장)
            const fd   = new FormData(form); // name="title", name="file" 필요
            const res  = await fetch("/api/upload-test", { method: "POST", body: fd });
            const json = await res.json().catch(() => null);

            if (!json || !json.success) {
                modalTitle.textContent = "업로드 실패";
                modalDesc.textContent  = (json && json.message) ? json.message : "서버 오류가 발생했습니다.";
                openModal(resultModal);
                modalOkBtn?.addEventListener('click', async () => {
                    await loadRecent();
                    closeModal(resultModal);
                }, { once:true });
                return;
            }

            const r = json.data; // { fileName, extension, allowed }
            if (r.allowed) {
                modalTitle.textContent = "업로드 성공";
                modalDesc.textContent  = `허용된 파일입니다 (.${r.extension ?? "-" }).`;
            } else {
                modalTitle.textContent = "차단됨";
                modalDesc.textContent  = `정책에 의해 금지된 확장자(.${r.extension ?? "-"})입니다.`;
            }

            openModal(resultModal);

            // OK 누르면 표만 갱신 & 모달 닫기 (한 번만 바인딩)
            modalOkBtn?.addEventListener('click', async () => {
                await loadRecent();
                closeModal(resultModal);
            }, { once:true });

        } catch (err) {
            console.error(err);
            modalTitle.textContent = "업로드 실패";
            modalDesc.textContent  = "네트워크 또는 서버 오류가 발생했습니다.";
            openModal(resultModal);
            modalOkBtn?.addEventListener('click', async () => {
                await loadRecent();
                closeModal(resultModal);
            }, { once:true });

        } finally {
            if (submitBtn) { submitBtn.disabled = false; delete submitBtn.dataset.loading; }
            // 파일 입력은 선택 유지(사용자 확인 후 테이블만 갱신하는 UX)
        }
    });

    // ===== 내부 유틸 =====
    async function loadRecent() {
        try {
            const res  = await fetch("/api/upload-history");
            const json = await res.json().catch(() => null);

            if (!json || !json.success) {
                tbody.innerHTML = "";
                return;
            }

            const rows = (json.data || []).map(it => {
                const badge = it.allowed
                    ? `<span class="badge badge--allow">허용</span>`
                    : `<span class="badge badge--block">차단</span>`;
                const ext  = it.extension || "-";
                const time = formatKST(it.uploadTime);
                return `
          <tr>
            <td>${esc(it.fileName || "")}</td>
            <td>${esc(ext)}</td>
            <td>${badge}</td>
            <td>${esc(time)}</td>
          </tr>
        `;
            }).join("");

            tbody.innerHTML = rows || "";
        } catch (e) {
            console.error(e);
            tbody.innerHTML = "";
        }
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    // 서버에서 ISO string이 오면 로컬(KST) 기준으로 보기 좋게 포맷
    function formatKST(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const yy = d.getFullYear();
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        const HH = String(d.getHours()).padStart(2,'0');
        const MM = String(d.getMinutes()).padStart(2,'0');
        return `${yy}-${mm}-${dd} ${HH}:${MM}`;
    }
}


// 문자열 이스케이프 & 시간 포맷 유틸(없으면 추가)
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function formatKST(iso){
    if(!iso) return "";
    const d=new Date(iso);
    const pad=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



/* =============== 공통: 모달/시간 유틸 =============== */
function openModal(modal) { if (modal) { modal.classList.add("is-open"); document.documentElement.style.overflow="hidden"; } }
function closeModal(modal){ if (modal) { modal.classList.remove("is-open"); document.documentElement.style.overflow=""; } }
function attachModalClose(modal){
    if (!modal) return;
    $(".modal__backdrop", modal)?.addEventListener("click", () => closeModal(modal));
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape"&&modal.classList.contains("is-open")) closeModal(modal); });
}
function pad2(n){ return n<10?("0"+n):(""+n); }
function formatNow(){
    const d=new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* =============== 공통: fetch 래퍼 =============== */
async function fetchJson(url, opts) {
    try {
        const res = await fetch(url, opts);
        return await res.json();
    } catch (e) {
        console.error("fetchJson error:", e);
        return null;
    }
}

/* =============== 부트스트랩 =============== */
document.addEventListener("DOMContentLoaded", () => {
    initBlockPage();
    initUploadTestPage();
});