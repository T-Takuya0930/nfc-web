# キーワードで別ページへ移動するサンプル

使い方:

- ブラウザで `index.html` を開くか、ローカルサーバーで表示します。

ローカルで簡単に動かすコマンド:

```bash
# 1) npm を使って Express サーバーで起動する (推奨)
cd /Users/tamuratakuya/Workspace/nfc-web
npm install
npm start
# ブラウザで http://localhost:3000/index.html を開く

# 2) 静的サーバーで簡易確認する場合
python3 -m http.server 8000
# ブラウザで http://localhost:8000/index.html を開く
```

デフォルトのキーワードはサーバーの `CORRECT_KEYWORD` 環境変数、未設定時は `秘密` です。

セッション用の秘密鍵を設定してください（本番環境では必須）:

```bash
export SESSION_SECRET="任意の長いランダム文字列"
export CORRECT_KEYWORD="正解のキーワード"
npm start
複数ページ設定:
- デフォルトで8個のキーワードを `server.js` 内の `pages` 配列で定義しています。
- 環境変数 `KW1` ... `KW8` を設定するとそれぞれのキーワードを上書きできます。

例:
```bash
export KW1="りんご"
export KW2="みかん"
export KW3="ぶどう"
export KW4="もも"
export KW5="いちご"
export KW6="ばなな"
export KW7="キウイ"
export KW8="メロン"
npm start
```
```
