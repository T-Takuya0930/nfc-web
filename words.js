(function(){
  const items = [
    // Lightweight client-side helper: show incorrect modal when server redirects with error
    (function(){
      function showIncorrectModal(msg){
        const modal = document.createElement('div');
        modal.className = 'incorrect-modal';
        modal.innerHTML = `
          <div class="incorrect-overlay"></div>
          <div class="incorrect-box">
            <h3>不正解</h3>
            <p>${msg}</p>
            <button class="incorrect-close">閉じる</button>
          </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.incorrect-close').addEventListener('click', ()=>modal.remove());
      }

      const params = new URLSearchParams(location.search);
      if(params.get('error') === 'wrong'){
        const m = params.get('message') || '入力されたキーワードは正しくありません。';
        if(document.readyState === 'loading'){
          document.addEventListener('DOMContentLoaded', ()=>showIncorrectModal(m));
        } else showIncorrectModal(m);
      }
    })()
    ol.appendChild(li);
})();