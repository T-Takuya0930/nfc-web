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
    <header class="site-header"><h1>ページ ${n}</h1></header>
    <section style="text-align:center;padding:40px;">
      <p style="color:#111;background:transparent;font-size:29px;">${hint}</p>
      <p style="margin-top:18px;"><a href="/" style="color:#0b5394;text-decoration:underline">メインページに戻る</a></p>
    </section>
  </main>
</body>
</html>`);
});

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
