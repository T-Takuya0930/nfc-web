export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Hints and keys (server-side only)
    const HINTS = ['麺','末','鶏','デ','一','俺','つ','博'];
    const KEY_TO_PAGE = { '麺':1,'末':2,'鶏':3,'デ':4,'一':5,'俺':6,'つ':7,'博':8 };

    // Helper: parse cookies
    const parseCookies = (cookieHeader) => {
      const obj = {};
      if(!cookieHeader) return obj;
      cookieHeader.split(';').forEach(pair =>{
        const idx = pair.indexOf('=');
        if(idx===-1) return;
        const k = pair.slice(0,idx).trim();
        const v = pair.slice(idx+1).trim();
        obj[k]=v;
      });
      return obj;
    };

    // POST /check -> validate keyword and set httpOnly cookie, redirect to /hint/:n
    if(request.method === 'POST' && pathname === '/check'){
      try{
        const form = await request.formData();
        const kw = (form.get('keyword') || '').toString().trim();
        if(!kw) return Response.redirect('/?error=empty', 303);
        const page = KEY_TO_PAGE[kw];
        if(page && page>=1 && page<=HINTS.length){
          // set httpOnly cookie, short lived
          const cookie = `allowed_page=${page}; Max-Age=30; Path=/; HttpOnly; SameSite=Lax`;
          return new Response('See Other. Redirecting', { status:303, headers: { 'Location': `/hint/${page}`, 'Set-Cookie': cookie } });
        }
        return Response.redirect('/?error=wrong', 303);
      } catch(e){
        return new Response('Bad Request', { status:400 });
      }
    }

    // GET /hint/:n -> check cookie and render hint, clear cookie
    if(request.method === 'GET' && pathname.startsWith('/hint/')){
      const parts = pathname.split('/');
      const n = parseInt(parts[2],10);
      if(!n || n<1 || n>HINTS.length) return new Response('Not found', { status:404 });
      const cookies = parseCookies(request.headers.get('cookie'));
      if(String(cookies.allowed_page) !== String(n)){
        return Response.redirect('/?error=forbidden', 303);
      }
      // clear cookie
      const clear = 'allowed_page=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      const hint = HINTS[n-1];
      const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ページ${n} - ラーメンナゾトキ</title><link rel="stylesheet" href="/style.css"></head><body style="background:#bd3131;"><main><header class="site-header"><h1>ページ ${n}</h1></header><section style="text-align:center;padding:40px;"><p style="color:#111;background:transparent;font-size:29px;">${hint}</p><p style="margin-top:18px;"><a href="/" style="color:#0b5394;text-decoration:underline">メインページに戻る</a></p></section></main></body></html>`;
      return new Response(html, { status:200, headers: { 'Content-Type':'text/html; charset=utf-8', 'Set-Cookie': clear } });
    }

    // Fallback: serve static assets via ASSETS binding
    try{
      const assetResp = await env.ASSETS.fetch(request);
      // If asset found, return it
      if(assetResp && assetResp.status !== 404) return assetResp;
    } catch(e){
      // fallthrough
    }

    return new Response('Not found', { status:404 });
  }
};
const PAGE_CONFIG = [
  { id: '1', title: 'ページ 1', body: 'ページ 1 の内容です。', keywordEnv: 'KW1' },
  { id: '2', title: 'ページ 2', body: 'ページ 2 の内容です。', keywordEnv: 'KW2' },
  { id: '3', title: 'ページ 3', body: 'ページ 3 の内容です。', keywordEnv: 'KW3' },
  { id: '4', title: 'ページ 4', body: 'ページ 4 の内容です。', keywordEnv: 'KW4' },
  { id: '5', title: 'ページ 5', body: 'ページ 5 の内容です。', keywordEnv: 'KW5' },
  { id: '6', title: 'ページ 6', body: 'ページ 6 の内容です。', keywordEnv: 'KW6' },
  { id: '7', title: 'ページ 7', body: 'ページ 7 の内容です。', keywordEnv: 'KW7' },
  { id: '8', title: 'ページ 8', body: 'ページ 8 の内容です。', keywordEnv: 'KW8' }
];

function htmlResponse(html, status = 200, headers = {}) {
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...headers
    }
  });
}

function buildCookieAttributes(url, maxAgeSeconds) {
  const attributes = [`Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=${maxAgeSeconds}`];
  if (url.protocol === 'https:') {
    attributes.push('Secure');
  }
  return attributes.join('; ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf('=');
      if (index === -1) return [part, ''];
      return [part.slice(0, index), part.slice(index + 1)];
    })
  );
  return cookies[name];
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncode(signature);
}

async function createAccessToken(secret, pageId, ttlSeconds = 300) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${pageId}.${expiresAt}`;
  const signature = await hmacSign(secret, payload);
  return `${payload}.${signature}`;
}

async function verifyAccessToken(secret, token, expectedPageId) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [pageId, expiresAtString, signature] = parts;
  if (pageId !== expectedPageId) return false;
  const expiresAt = Number(expiresAtString);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  const payload = `${pageId}.${expiresAtString}`;
  const expectedSignature = await hmacSign(secret, payload);
  const expectedBytes = base64UrlDecode(expectedSignature);
  const actualBytes = base64UrlDecode(signature);
  if (expectedBytes.length !== actualBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedBytes.length; i += 1) diff |= expectedBytes[i] ^ actualBytes[i];
  return diff === 0;
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

function renderPage(page) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(page.title)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main>
    <h1>${escapeHtml(page.title)}</h1>
    <p>${escapeHtml(page.body)}</p>
    <p><a class="back-link" href="/">メインページに戻る</a></p>
  </main>
</body>
</html>`;
}

function findPageById(id) {
  return PAGE_CONFIG.find((page) => page.id === id);
}

function findMatch(env, submittedKeyword) {
  return PAGE_CONFIG.find((page) => {
    const configured = env[page.keywordEnv];
    return configured && configured === submittedKeyword;
  });
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
          : '';
      return htmlResponse(renderIndex(message));
    }

    if (request.method === 'POST' && url.pathname === '/check') {
      const formData = await request.formData();
      const submitted = String(formData.get('keyword') || '').trim();
      if (!submitted) {
        return Response.redirect(new URL('/?error=empty', url).toString(), 302);
      }

      const matchedPage = findMatch(env, submitted);
      if (!matchedPage) {
        return Response.redirect(new URL('/?error=wrong', url).toString(), 302);
      }

      const token = await createAccessToken(env.SESSION_SECRET || 'change-this-secret', matchedPage.id, 300);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/page/${matchedPage.id}`,
          'Set-Cookie': `page_access=${token}; ${buildCookieAttributes(url, 300)}`
        }
      });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/page/')) {
      const id = url.pathname.split('/').pop();
      const page = findPageById(id);
      if (!page) return Response.redirect(new URL('/', url).toString(), 302);

      const token = getCookie(request, 'page_access');
      const ok = await verifyAccessToken(env.SESSION_SECRET || 'change-this-secret', token, id);
      if (!ok) return Response.redirect(new URL('/', url).toString(), 302);

      return new Response(renderPage(page), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'Set-Cookie': `page_access=; ${buildCookieAttributes(url, 0)}`
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
