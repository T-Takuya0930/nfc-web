(function () {
  function showIncorrectModal(message) {
    const modal = document.createElement('div');
    modal.className = 'incorrect-modal';
    modal.innerHTML = `
      <div class="incorrect-overlay"></div>
      <div class="incorrect-box">
        <h3>不正解</h3>
        <p>${message}</p>
        <button class="incorrect-close" type="button">閉じる</button>
      </div>`;

    document.body.appendChild(modal);
    modal.querySelector('.incorrect-close').addEventListener('click', () => modal.remove());
  }

  const params = new URLSearchParams(location.search);
  if (params.get('error') !== 'wrong') {
    return;
  }

  const message = params.get('message') || '入力されたキーワードは正しくありません。';
  const mount = () => showIncorrectModal(message);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();