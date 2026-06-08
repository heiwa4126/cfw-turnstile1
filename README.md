# cfw-turnstile1

Cloudflare Turnstile の練習。

開発時(dev)はサイトキーは
1x00000000000000000000AA
に固定。シークレットキーは環境変数 TURNSTILE_SECRET_KEY を使う。

参照: <https://developers.cloudflare.com/turnstile/troubleshooting/testing/#testing-scenarios>

デプロイ時(production)のみ
`data-sitekey="1x00000000000000000000AA"` を書き換え、
デプロイ終了後、もとへ戻す。
