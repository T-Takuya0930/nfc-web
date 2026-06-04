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
