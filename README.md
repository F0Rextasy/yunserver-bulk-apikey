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

**Bulk-create YunServer API accounts with API keys — OpenAI-compatible inference + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-3-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

YunServer runs a **new-api fork with `turnstile_check: false`**, so the sign-up gate is an e-mail address, a password and the 6-character code the panel mails you — no captcha, no browser. On top of the sign-up credit the panel pays a **daily check-in**, which this tool claims before the key is proved, so every key is born funded; and the model answers **tool calls** (measured `tool_calls` with real arguments), so the keys work with agent-style clients, not just plain chat.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Plan | free account, one per minted key |
| Quota at sign-up | ~**10,000** panel units on the account (measured on the two pre-existing accounts: 11,030 / 11,044) |
| Daily check-in | **on** — the tool calls `POST /api/user/checkin` before the gate, so the key starts funded |
| What a call costs | the live gate runs on `deepseek-v4.1-flash` (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| Keys per account | any number (`POST /api/token/`), but every key on an account draws the same account quota — which is exactly why this tool mints **one account per key** |

> 💡 The free tier is set by YunServer API and can change. Check the live numbers at [yunserver.cn](https://yunserver.cn) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 3 of them

`GET https://api.yunserver.cn/v1/models` returned the panel's DeepSeek family (the exact count per key varies between 3 and 6 ids — the panel filters the catalogue per account):

| Model ID | Chat | Tools |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — the gate model for every key this tool writes | **200**, `finish_reason: tool_calls` with arguments |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — same endpoint, same key | inherits the same tool support |

> The gate walks a short candidate list, not one id: a channel can be down for a single model while the account is fine.

## 🧪 How to use the API

Base URL **`https://api.yunserver.cn/v1`** — OpenAI-compatible.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

Tool calling works the same way — pass a normal `tools` array and read `choices[0].message.tool_calls`.

## 🛠 Quick start

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings
# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

The mailbox rail is **Emailnator**, which hands out a plain `@gmail.com` per account — the panel enforces a domain/syntax policy server-side (measured: `EMAIL_ADDRESS_REJECTED` for `user@example.com`, dotted gmails, and outlook/hotmail/mailtrap) so a plain gmail is the only address family it takes. The panel has **no captcha**, so no token or solver is ever needed, and the rail call rides the same exit pool as the panel calls.

### 🖱️ The launcher

The launcher asks for the proxy list (optional), the count and the gate model, remembers them in `launcher.config.json`, and runs the CLI — mint, verify, screen exits, settings, help, Connect to 9Router.

## ✅ Verified working — every key is tested

| Check | Result |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · check-in on |
| `GET /api/verification?email=…` | **200** `{"success":true}` — the panel mails a 6-character code |
| `POST /api/user/register` | **200** with the same cookie jar that asked for the code |
| `POST /api/user/login` | **200** → `access_token`; every later call also carries `New-Api-User: <id>` |
| `POST /api/user/checkin` | **200** — the daily grant lands on the account before the key is proved |
| `POST /api/token/` then `POST /api/token/<id>/key` | the token list masks the key; the reveal endpoint returns the plaintext |
| `POST /v1/chat/completions` | **200** with real content — a key reaches `keys.txt` only after this |
| `tools` probe (`get_time` schema) | **200** `finish_reason: tool_calls`, one call with real arguments |

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| mailbox | Emailnator `POST /api/generate-email` | a fresh plain `@gmail.com` per account — the panel's policy rejects aliases with `+`/dots and every other rail's domain |
| code | `GET /api/verification?email=…` | the code mail arrives from the panel's own relay domain |
| register | `POST /api/user/register` | `{username,password,email,verification_code}` — same cookie jar as the code request |
| session | `POST /api/user/login` | `access_token` + the account id; `/api/*` also wants `New-Api-User: <id>` |
| check-in | `POST /api/user/checkin` | funds the account before the gate |
| token | `POST /api/token/` → `POST /api/token/<id>/key` | the list is masked, the reveal endpoint is the only plaintext source |
| gate | `POST /v1/chat/completions` | 200 with real content = keep; a closed group is re-tried on another group from `/api/pricing` |

## ⚙️ CLI options

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| Env | Default | Meaning |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | exit pool, one line per proxy — optional: without a pool the CLI connects directly |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | model for the live verification |

| Flag | Meaning |
| --- | --- |
| `--pool <file>` | proxy list (wins over the env) |
| `--proxy <url>` | pin one exit for every panel call |
| `--group <name>` | token group (default `default`) |
| `--exits K` | exit candidates tried per account (default 6) |

## 🛰️ Behind a proxy

**Optional — recommended (the sign-up limit is per exit IP).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `YUNSERVER_PROXIES`) and every request goes through an exit from that list; a dead line fails that attempt and the next exit is tried.
- **Without a pool:** the CLI prints `DIRECT (no proxy)` and connects directly. Sign-up, key minting and the chat gate are unchanged — only where the packets leave from.
- Run `--screen` first: it tests every exit in your list against `api.yunserver.cn/api/status` and prints OK/DEAD per line.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified key per line — git-ignored |
| `accounts.json` | email / username / password / group / gate status — git-ignored |
| `proxies.txt` | your exits — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Models are served as `yunserver/<model id>`.

## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Models are served as `yunserver/<model id>`.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 What the provider gives | a free account with sign-up quota **plus a daily check-in** (no captcha gate) |
| 🔑 What one key gets you | one key on its own account: the DeepSeek ids of `https://api.yunserver.cn/v1`, chat- and tool-verified |
| 🌐 API shape | OpenAI-compatible: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 Your data | only `yunserver.cn` / `api.yunserver.cn`, Emailnator and the inbox backend you configure are contacted |

## 🐞 Issues

If YunServer changes its sign-up endpoints, adds Turnstile, tightens the mailbox policy or moves the working group, the tool stops at that step and says so. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>
