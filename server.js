const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// サーバー側で正解キーワードを管理（8個）
// 必要に応じてこの配列を編集してください。keyword はサーバー側のみで保持されます。
const pages = [
  { id: '1', keyword: process.env.KW1 || 'りんご', title: 'ページ 1 - りんご', body: 'りんごに関するページです。' },
  { id: '2', keyword: process.env.KW2 || 'みかん', title: 'ページ 2 - みかん', body: 'みかんに関するページです。' },
  { id: '3', keyword: process.env.KW3 || 'ぶどう', title: 'ページ 3 - ぶどう', body: 'ぶどうに関するページです。' },
  { id: '4', keyword: process.env.KW4 || 'もも', title: 'ページ 4 - もも', body: 'ももに関するページです。' },
  { id: '5', keyword: process.env.KW5 || 'いちご', title: 'ページ 5 - いちご', body: 'いちごに関するページです。' },
  { id: '6', keyword: process.env.KW6 || 'ばなな', title: 'ページ 6 - ばなな', body: 'ばななに関するページです。' },
  { id: '7', keyword: process.env.KW7 || 'キウイ', title: 'ページ 7 - キウイ', body: 'キウイに関するページです。' },
  { id: '8', keyword: process.env.KW8 || 'メロン', title: 'ページ 8 - メロン', body: 'メロンに関するページです。' }
];

app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000 }
}));

// 公開静的アセットは public フォルダのみ
app.use(express.static(path.join(__dirname, 'public')));

// フォーム送信の処理: 正解ならセッションにフラグを立て /success へ
app.post('/check', (req, res) => {
  const kw = (req.body.keyword || '').trim();
  if (!kw) return res.redirect('/?error=empty');
  // キーワードが8個のいずれかに一致するか確認
  const matched = pages.find(p => p.keyword === kw);
  if (matched) {
    // セッションにどのページへ行くかを保存する
    req.session.pageId = matched.id;
    return res.redirect(`/page/${matched.id}`);
  }
  return res.redirect('/?error=wrong');
});

// /success はセッションがある場合のみ表示。直接アクセス不可。
// ページをセッションチェックして表示する
app.get('/page/:id', (req, res) => {
  const id = req.params.id;
  if (req.session && req.session.pageId === id) {
    // セッションの表示フラグを消す（1回のみ閲覧可能）
    req.session.pageId = null;
    const page = pages.find(p => p.id === id);
    if (!page) return res.redirect('/');
    return res.send(`<!doctype html><html lang="ja"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${page.title}</title><link rel="stylesheet" href="/style.css"></head><body><main><h1>${page.title}</h1><p>${page.body}</p><p><a href="/">メインページに戻る</a></p></main></body></html>`);
  }
  return res.redirect('/');
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
