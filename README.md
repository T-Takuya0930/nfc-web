# Cloudflare Workers 版 キーワードで別ページへ移動するサンプル

使い方:

- ブラウザで `wrangler dev` が表示するローカルURLを開きます。

ローカルで簡単に動かすコマンド:

```bash
cd /Users/tamuratakuya/Workspace/nfc-web
npm install
npm run dev
# ブラウザで wrangler が表示するローカルURLを開く
```

8個のキーワードは Cloudflare Workers の環境変数で管理します。コードには正解文字列を置いていません。

ローカル開発時は `.dev.vars` に以下を設定してください。

```bash
SESSION_SECRET=任意の長いランダム文字列
KW1=りんご
KW2=みかん
KW3=ぶどう
KW4=もも
KW5=いちご
KW6=ばなな
KW7=キウイ
KW8=メロン
```

GitHub 経由のデプロイには、リポジトリ Secrets に次を設定してください。

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SESSION_SECRET`
- `KW1` ... `KW8`

ワークフローは `.github/workflows/deploy.yml` にあります。
