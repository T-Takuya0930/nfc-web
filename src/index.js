const HINTS = [
  '店名3文字をひらがなにした1文字目',
  '店名をひらがなにした2文字目の1つ前 (例: 「い」の1つ前は「あ」)',
  '店名2文字をひらがなにした1文字目',
  '店名カタカナの5文字目',
  '店名をひらがなにした4文字目',
  '店名をひらがなにした1文字目',
  '店名をひらがなにした1文字目',
  '店名5文字の3文字目'
];

const KEY_TO_PAGE = {
  '麺': 1,
  '末': 2,
  '鶏': 3,
  'デ': 4,
  '一': 5,
  '俺': 6,
  'つ': 7,
  '博': 8
};

function htmlResponse(html, status = 200, headers = {}) {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...headers
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderIndex(errorMessage = '') {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>キーワード入力</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main>
    <h1>キーワード入力</h1>
    <form method="POST" action="/check">
      <input name="keyword" placeholder="キーワードを入力" autocomplete="off" />
      <button type="submit">送信</button>
      <p id="msg" class="${errorMessage ? '' : 'hidden'}">${escapeHtml(errorMessage)}</p>
    </form>
  </main>
</body>
</html>`;
}

function renderHintPage(pageNumber) {
  const hint = HINTS[pageNumber - 1];
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ページ${pageNumber} - ラーメンナゾトキ</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body style="background:#bd3131;">
  <main>
    <header class="site-header" style="text-align:center;padding:40px;"><h1>答えの ${pageNumber}文字目は</h1></header>
    <section style="text-align:center;padding:40px;">
      <p style="color:#111;background:transparent;font-size:29px;">${escapeHtml(hint)}</p>
      <p style="margin-top:18px;"><a href="/" style="color:#0b5394;text-decoration:underline">メインページに戻る</a></p>
    </section>
  </main>
</body>
</html>`;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = value;
  }

  return cookies;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      const error = url.searchParams.get('error');
      const message = error === 'empty'
        ? 'キーワードを入力してください'
        : error === 'wrong'
          ? 'キーワードが違います'
          : error === 'forbidden'
            ? 'このページには直接アクセスできません'
            : '';
      return htmlResponse(renderIndex(message));
    }

    if (request.method === 'POST' && url.pathname === '/check') {
      const formData = await request.formData();
      const submitted = String(formData.get('keyword') || '').trim();

      if (!submitted) {
        return Response.redirect(new URL('/?error=empty', url).toString(), 302);
      }

      const page = KEY_TO_PAGE[submitted];
      if (!page) {
        return Response.redirect(new URL('/?error=wrong', url).toString(), 302);
      }

      const cookie = `allowed_page=${page}; Max-Age=30; Path=/; HttpOnly; SameSite=Lax`;
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/hint/${page}`,
          'Set-Cookie': cookie
        }
      });
    }

    // Final answer submission (POST /answer)
    if (request.method === 'POST' && url.pathname === '/answer') {
      const formData = await request.formData();
      const submitted = String(formData.get('answer') || '').trim();
      if (!submitted) return Response.redirect(new URL('/?error=empty', url).toString(), 302);

      // compute default answer if not provided via env
      const computeDefaultAnswer = () => {
        const arr = new Array(HINTS.length);
        for (const k of Object.keys(KEY_TO_PAGE)) {
          const v = KEY_TO_PAGE[k];
          if (typeof v === 'number' && v >= 1 && v <= HINTS.length) arr[v - 1] = k;
        }
        return arr.join('');
      };

      const correct = "ようかいうおつち"

      // Normalize both sides: NFKC, remove whitespace, convert Katakana to Hiragana, lowercase
      const normalize = (s) => {
        if (!s) return '';
        const n = s.normalize('NFKC').replace(/\s+/g, '');
        const converted = n.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
        return converted.toLowerCase();
      };

      const normSubmitted = normalize(submitted);
      const normCorrect = normalize(correct);
      console.log('answer check', submitted, normSubmitted, correct, normCorrect);

      if (submitted === correct) {
        const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>正解！</title><link rel="stylesheet" href="/style.css"></head><body><main style="text-align:center;padding:40px;font-size:18px"><h1>正解！おめでとうございます</h1><h2>この結果を303のブースに見せに来てください！</h2><p><a href="/">メインページに戻る</a></p></main></body></html>`;
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      return Response.redirect(new URL('/?error=wrong', url).toString(), 302);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/hint/')) {
      const pageNumber = Number.parseInt(url.pathname.split('/')[2] || '', 10);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > HINTS.length) {
        return new Response('Not found', { status: 404 });
      }

      const cookies = parseCookies(request.headers.get('Cookie'));
      if (String(cookies.allowed_page) !== String(pageNumber)) {
        return Response.redirect(new URL('/?error=forbidden', url).toString(), 303);
      }

      return new Response(renderHintPage(pageNumber), {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'Set-Cookie': 'allowed_page=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
