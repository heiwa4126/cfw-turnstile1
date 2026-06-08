# cfw-turnstile1

Cloudflare Turnstile の練習。

## 準備

```sh
cp .env.example .env
cp .env.example .env.production
```

`.env.production` を編集する。`.env` のほうはたぶんそのまま使える。

開発時(dev)はサイトキーは
`1x00000000000000000000AA`
に固定。シークレットキーは環境変数 TURNSTILE_SECRET_KEY を使う。

参照: <https://developers.cloudflare.com/turnstile/troubleshooting/testing/#testing-scenarios>

デプロイ時(production)のみ
`data-sitekey="1x00000000000000000000AA"` を書き換え、
デプロイ終了後、もとへ戻す。
[scripts/inject-sitekey.mjs](scripts/inject-sitekey.mjs) 参照

CLOUDFLARE_API_TOKEN は `wrangler login` が難しい環境で、
`.env.production` に対してのみ設定。
"Cloudflare Workers を編集する API トークン" を設定

## 開発

```sh
pnpm i
pnpm run dev
```

ローカルでテスト

```sh
pnpm run deploy
```

Cloudflare でテスト
