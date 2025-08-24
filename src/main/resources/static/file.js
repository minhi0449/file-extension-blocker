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

// 예: 사용자가 "sh" 추가
// document.getElementById('chipArea').appendChild(createChip("sh"));

// 사용자가 +추가 버튼을 눌렀을 때 입력값으로 칩 생성
document.getElementById('btnAddCustom').addEventListener('click', () => {
    const input = document.getElementById('customExtInput');          // 입력창
    let ext = (input.value || '').trim().toLowerCase();               // 소문자/공백제거
    if (ext.startsWith('.')) ext = ext.slice(1);                      // 앞의 점(.) 제거

    if (!ext) return;                                                 // 빈값이면 무시
    // (필요시) 아주 간단한 형식검사만 추가 — 원치 않으면 이 줄 지워도 됩니다.
    if (!/^[a-z0-9][a-z0-9._-]{0,19}$/.test(ext)) return;             // 1~20자, 영숫자 시작

    const chipArea = document.getElementById('chipArea');
    chipArea.appendChild(createChip(ext));                            // 칩 추가
    input.value = '';                                                 // 입력창 비우기

    // 카운터도 함께 갱신
    const cntEl = document.getElementById('chipCount');
    if (cntEl) cntEl.textContent = String(chipArea.querySelectorAll('.chip').length);
});


// 삭제(X) 동작: 이벤트 위임
document.getElementById('chipArea').addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.chip__close');
    if (!closeBtn) return;
    const chipArea = document.getElementById('chipArea');
    closeBtn.closest('.chip')?.remove();

    // 칩 삭제 후 카운터 갱신
    const cntEl = document.getElementById('chipCount');
    if (cntEl) cntEl.textContent = String(chipArea.querySelectorAll('.chip').length);
});

