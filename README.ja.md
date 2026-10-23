<div align="center">

```
██╗   ██╗██╗   ██╗███╗   ██╗███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗
╚██╗ ██╔╝██║   ██║████╗  ██║██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
 ╚████╔╝ ██║   ██║██╔██╗ ██║███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
  ╚██╔╝  ██║   ██║██║╚██╗██║╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
   ██║   ╚██████╔╝██║ ╚████║███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
```

# yunserver-bulk-apikey

**YunServer API アカウントを API キー付きで一括作成 — OpenAI 互換の推論 + 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-3-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題報告](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

YunServer は **`turnstile_check: false` の new-api フォーク**を運用しているため、登録の関門はメールアドレス、パスワード、そしてパネルが送信してくる 6 文字のコードだけです — キャプチャもブラウザも不要です。登録時のクレジットに加えて、パネルは**毎日のチェックイン**を付与し、このツールはキーが検証される前にそれを受け取るため、すべてのキーは資金を持った状態で生まれます。さらにモデルは**ツール呼び出し**に応答するため（実際の引数を伴う `tool_calls` を計測済み）、キーは単なるチャットだけでなくエージェント型クライアントでも機能します。

## 🎁 無料枠 — どれだけ得られるか

| 項目 | 値 |
| --- | --- |
| プラン | 無料アカウント、発行されたキーごとに 1 つ |
| 登録時のクォータ | アカウントに約 **10,000** パネル単位（既存の 2 アカウントで計測: 11,030 / 11,044） |
| 毎日のチェックイン | **オン** — ツールは関門の前に `POST /api/user/checkin` を呼び出すため、キーは資金を持った状態で開始します |
| 呼び出しのコスト | ライブ関門は `deepseek-v4.1-flash` で実行されます（`ratio 0.15`、`completion 4`、`quota_type 0`） |
| アカウントあたりのキー数 | 任意の数（`POST /api/token/`）ですが、1 つのアカウント上のすべてのキーは同じアカウントクォータを消費します — だからこそこのツールは**キーごとに 1 アカウント**を発行します |

> 💡 無料枠は YunServer API によって設定され、変更される可能性があります。最新の数値は [yunserver.cn](https://yunserver.cn) で確認してください — そしてツール自身の関門に判断を委ねてください:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — そのすべて 3 つ

`GET https://api.yunserver.cn/v1/models` はパネルの DeepSeek ファミリーを返しました（キーごとの正確な数は 3 から 6 の id の間で変動します — パネルはアカウントごとにカタログをフィルタリングします）:

| モデル ID | チャット | ツール |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — このツールが書き込むすべてのキーの関門モデル | **200**、引数を伴う `finish_reason: tool_calls` |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — 同じエンドポイント、同じキー | 同じツールサポートを継承 |

> 関門は 1 つの id ではなく、短い候補リストを辿ります: アカウントが正常でも、単一のモデルでチャネルがダウンしていることがあります。

## 🧪 API の使い方

ベース URL **`https://api.yunserver.cn/v1`** — OpenAI 互換。

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

ツール呼び出しも同じように機能します — 通常の `tools` 配列を渡し、`choices[0].message.tool_calls` を読み取ります。

## 🛠 クイックスタート

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

メールボックスのレールは **Emailnator** で、アカウントごとにプレーンな `@gmail.com` を発行します — パネルはサーバー側でドメイン/構文ポリシーを強制するため（計測済み: `user@example.com`、ドット付き gmail、outlook/hotmail/mailtrap に対して `EMAIL_ADDRESS_REJECTED`）、プレーンな gmail が唯一受け入れられるアドレスファミリーです。パネルには**キャプチャがありません**ので、トークンやソルバーは一切不要で、レールの呼び出しはパネルの呼び出しと同じ出口プールを利用します。

### 🖱️ ランチャー

ランチャーはプロキシリスト（任意）、カウント、関門モデルを尋ね、それらを `launcher.config.json` に記憶し、CLI を実行します — mint、verify、screen exits、settings、help、Connect to 9Router。

## ✅ 検証済み — すべてのキーがテストされています

| チェック | 結果 |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · チェックイン オン |
| `GET /api/verification?email=…` | **200** `{"success":true}` — パネルが 6 文字のコードを送信します |
| `POST /api/user/register` | **200** — コードを要求したのと同じ Cookie ジャーで |
| `POST /api/user/login` | **200** → `access_token`; 以降のすべての呼び出しは `New-Api-User: <id>` も伴います |
| `POST /api/user/checkin` | **200** — 毎日の付与がキーの検証前にアカウントに反映されます |
| `POST /api/token/` の後に `POST /api/token/<id>/key` | トークンリストはキーをマスクします; reveal エンドポイントが平文を返します |
| `POST /v1/chat/completions` | **200** で実際のコンテンツ — キーはこれを通った後にのみ `keys.txt` に到達します |
| `tools` プローブ（`get_time` スキーマ） | **200** `finish_reason: tool_calls`、実際の引数を伴う 1 回の呼び出し |

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブの `chat-200` を通過しています
> （死んだキーは決して出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います: エントリは
> **モデルが `chat-200` に応答し、ツールを呼び出せる場合にのみ**追加されます — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダーは追加されずに除外されます。検証ステップはいつでも再実行できます;
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| メールボックス | Emailnator `POST /api/generate-email` | アカウントごとに新しいプレーンな `@gmail.com` — パネルのポリシーは `+`/ドット付きのエイリアスや他のすべてのレールのドメインを拒否します |
| コード | `GET /api/verification?email=…` | コードメールはパネル自身のリレードメインから届きます |
| 登録 | `POST /api/user/register` | `{username,password,email,verification_code}` — コード要求と同じ Cookie ジャー |
| セッション | `POST /api/user/login` | `access_token` + アカウント id; `/api/*` は `New-Api-User: <id>` も要求します |
| チェックイン | `POST /api/user/checkin` | 関門の前にアカウントに資金を供給します |
| トークン | `POST /api/token/` → `POST /api/token/<id>/key` | リストはマスクされ、reveal エンドポイントが唯一の平文ソースです |
| 関門 | `POST /v1/chat/completions` | 実際のコンテンツを伴う 200 = 保持; 閉じたグループは `/api/pricing` の別のグループで再試行されます |

## ⚙️ CLI オプション

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| 環境変数 | デフォルト | 意味 |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | 出口プール、1 行につき 1 プロキシ — 任意: プールがなければ CLI は直接接続します |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | ライブ検証用のモデル |

| フラグ | 意味 |
| --- | --- |
| `--pool <file>` | プロキシリスト（環境変数より優先） |
| `--proxy <url>` | すべてのパネル呼び出しに対して 1 つの出口を固定 |
| `--group <name>` | トークングループ（デフォルト `default`） |
| `--exits K` | アカウントごとに試行する出口候補（デフォルト 6） |

## 🛰️ プロキシの背後で

**任意 — 推奨（登録制限は出口 IP ごとです）。** このツールはプロキシなしでも動作します。

- **プールあり:** `--pool <file>` を渡す（または `YUNSERVER_PROXIES` を設定する）と、すべてのリクエストがそのリストの出口を経由します; 死んだ回線はその試行を失敗させ、次の出口が試されます。
- **プールなし:** CLI は `DIRECT (no proxy)` と表示し、直接接続します。登録、キー発行、チャット関門は変わりません — パケットが出ていく場所だけが異なります。
- まず `--screen` を実行してください: リスト内のすべての出口を `api.yunserver.cn/api/status` に対してテストし、行ごとに OK/DEAD を表示します。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | ライブ検証済みのキーが 1 行に 1 つ — git 無視 |
| `accounts.json` | メール / ユーザー名 / パスワード / グループ / 関門ステータス — git 無視 |
| `proxies.txt` | あなたの出口 — git 無視 |

## 🔌 9Router に接続

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix yunserver`、`--base-url https://api.yunserver.cn/v1`、`--model deepseek-v4.1-flash`。モデルは `yunserver/<model id>` として提供されます。

## 🔌 OmniRoute に接続

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix yunserver`、`--base-url https://api.yunserver.cn/v1`、`--model deepseek-v4.1-flash`。モデルは `yunserver/<model id>` として提供されます。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 プロバイダーが提供するもの | 登録クォータ付きの無料アカウント **+ 毎日のチェックイン**（キャプチャ関門なし） |
| 🔑 1 つのキーで得られるもの | 独自のアカウント上の 1 つのキー: `https://api.yunserver.cn/v1` の DeepSeek id、チャットおよびツール検証済み |
| 🌐 API の形式 | OpenAI 互換: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 あなたのデータ | `yunserver.cn` / `api.yunserver.cn`、Emailnator、および設定した受信トレイバックエンドのみが接触されます |

## 🐞 問題報告

YunServer が登録エンドポイントを変更したり、Turnstile を追加したり、メールボックスポリシーを厳格化したり、動作するグループを移動したりした場合、ツールはそのステップで停止し、その旨を報告します。コマンドと正確な出力を添えて **[issue を作成してください](../../issues)**。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>