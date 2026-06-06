import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Use cookie parser to read HTTP-only cookies (access tokens)
app.use(cookieParser());

// Hints stored only on server (these are the characters shown when a page is unlocked)
const HINTS = [
  '店名3文字をひらがなにした1文字目',
  '店名をひらがなにした2文字目の1つ前',
  '店名2文字をひらがなにした1文字目',
  '店名の1文字目から濁点を抜いた文字',
  '店名をひらがなにした1文字目',
  '店名をひらがなにした1文字目',
  '店名をひらがなにした1文字目',
  '店名5文字の3文字目'
];

// Map submitted keyword (single character) to page number (1-8)
// Here we map the same characters to their page index so submitting the character
// redirects to the corresponding hint page.
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

app.use(express.urlencoded({extended:false}));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Handle keyword submission
app.post('/check', (req, res) => {
  const kw = (req.body.keyword || '').trim();
  if(!kw){
    return res.redirect('/?error=empty');
  }
  const page = KEY_TO_PAGE[kw];
  console.log('[POST /check] received keyword:', JSON.stringify(kw), '-> page:', page);
  if(page && page >=1 && page <= HINTS.length){
    // Issue a short-lived HTTP-only cookie that grants access to the target hint page.
    // Cookie is not readable by client JS and expires after 30 seconds.
    res.cookie('allowed_page', String(page), { httpOnly: true, maxAge: 30 * 1000, sameSite: 'Lax' });
    // redirect to server-rendered hint page (no hint exposed elsewhere)
    return res.redirect(303, `/hint/${page}`);
  }
  return res.redirect('/?error=wrong');
});

// Render hint page server-side so hint text is not present in client files
app.get('/hint/:n', (req, res) => {
  const n = parseInt(req.params.n || '', 10);
  if(!n || n < 1 || n > HINTS.length) return res.status(404).send('Not found');
  // Only allow access if the client presents the short-lived cookie set by POST /check
  const allowed = req.cookies && req.cookies.allowed_page;
  if(String(allowed) !== String(n)){
    // Deny direct URL access
    return res.redirect('/?error=forbidden');
  }
  // Clear the cookie immediately after checking so the URL cannot be reused.
  res.clearCookie('allowed_page');
  const hint = HINTS[n-1];
  // Render a simple page: heading plus hint paragraph (matches requested layout)
  res.send(`<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ページ${n} - ラーメンナゾトキ</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body style="background:#bd3131;">
  <main>
    <header class="site-header" style="text-align:center;"><h1>答えの ${n}文字目は</h1></header>
    <section style="text-align:center;padding:40px;">
      <p style="color:#111;background:transparent;font-size:29px;">${hint}</p>
      <p style="margin-top:18px;"><a href="/" style="color:#0b5394;text-decoration:underline">メインページに戻る</a></p>
    </section>
  </main>
</body>
</html>`);
});

// Compute default answer from KEY_TO_PAGE ordering if not provided via env
const computeDefaultAnswer = () => {
  const arr = new Array(HINTS.length);
  for (const [k, v] of Object.entries(KEY_TO_PAGE)) {
    if (typeof v === 'number' && v >= 1 && v <= HINTS.length) arr[v - 1] = k;
  }
  return arr.join('');
};

// Hardcoded answer inside the server file (do not rely on dev vars)
// Change this string if you want a custom correct answer.
const ANSWER = computeDefaultAnswer();

// Handle final answer submission
app.post('/answer', (req, res) => {
  const submitted = (req.body.answer || '').trim();
  if (!submitted) return res.redirect('/?error=empty');

  // Normalize inputs: NFKC, remove whitespace, convert Katakana to Hiragana, lowercase
  const normalize = (s) => {
    if (!s) return '';
    const n = s.normalize('NFKC').replace(/\s+/g, '');
    // convert Katakana range to Hiragana by codepoint offset
    const converted = n.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
    return converted.toLowerCase();
  };

  const normSubmitted = normalize(submitted);
  const normAnswer = normalize(ANSWER);
  console.log('[POST /answer] submitted=%s norm=%s answer=%s normAnswer=%s', submitted, normSubmitted, ANSWER, normAnswer);

  if (normSubmitted === normAnswer) {
    // Show success page (keep it simple and server-rendered)
    return res.send(`<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>正解！</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main style="text-align:center;padding:40px;">
    <h1 style="color:#111;background:transparent;font-size:29px;">正解！おめでとうございます</h1>
    <p><a href="/">メインページに戻る</a></p>
  </main>
</body>
</html>`);
  }

  return res.redirect('/?error=wrong');
});

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
