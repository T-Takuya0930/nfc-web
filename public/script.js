// クライアント側に正解を置かない。サーバーのリダイレクトで成功表示を行う。
const msg = document.getElementById('msg');
const params = new URLSearchParams(location.search);
if (params.get('error')) {
  const e = params.get('error');
  if (e === 'empty') msg.textContent = 'キーワードを入力してください';
  else if (e === 'wrong') msg.textContent = 'キーワードが違います';
  else msg.textContent = 'エラーが発生しました';
  msg.classList.remove('hidden');
}

// Answer modal handling (open/close, focus)
const answerBtn = document.getElementById('answerBtn');
const answerModal = document.getElementById('answerModal');
const answerClose = document.getElementById('answerClose');
const answerInput = document.getElementById('answerInput');

if (answerBtn && answerModal) {
  answerBtn.addEventListener('click', () => {
    answerModal.style.display = 'flex';
    if (answerInput) answerInput.focus();
  });
}

if (answerClose && answerModal) {
  answerClose.addEventListener('click', () => {
    answerModal.style.display = 'none';
  });
}
