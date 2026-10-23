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

**批量创建带 API 密钥的 YunServer API 账户 — 兼容 OpenAI 的推理 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-3-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

YunServer 运行的是一个 **`turnstile_check: false` 的 new-api 分支**，因此注册门槛只是一个电子邮箱地址、一个密码，以及面板发给你的 6 位验证码 — 没有验证码，也不需要浏览器。除了注册额度外，面板还会发放**每日签到**奖励，本工具会在验证密钥之前先领取签到，因此每个密钥一出生就是有额度的；而且模型能够响应**工具调用**（实测 `tool_calls` 带有真实参数），所以这些密钥可用于 agent 类客户端，而不仅仅是普通聊天。

## 🎁 免费额度 — 你能获得多少

| 项目 | 值 |
| --- | --- |
| 套餐 | 免费账户，每个铸造的密钥对应一个 |
| 注册时额度 | 账户上约 **10,000** 面板单位（在两个已有账户上实测：11,030 / 11,044） |
| 每日签到 | **开启** — 工具会在验证前调用 `POST /api/user/checkin`，因此密钥一开始就有额度 |
| 一次调用消耗 | 实时验证运行在 `deepseek-v4.1-flash` 上（`ratio 0.15`、`completion 4`、`quota_type 0`） |
| 每账户密钥数 | 任意数量（`POST /api/token/`），但一个账户上的每个密钥都消耗同一账户额度 — 这正是本工具**每个密钥铸造一个账户**的原因 |

> 💡 免费额度由 YunServer API 设定，可能会变化。请在 [yunserver.cn](https://yunserver.cn) 查看实时数字 — 并让工具自身的验证来决定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 — 全部 3 个

`GET https://api.yunserver.cn/v1/models` 返回了面板的 DeepSeek 系列（每个密钥的确切数量在 3 到 6 个 id 之间变化 — 面板会按账户过滤目录）：

| 模型 ID | 聊天 | 工具 |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — 本工具写入的每个密钥的验证模型 | **200**，`finish_reason: tool_calls` 带参数 |
| `deepseek-v4-pro`、`deepseek-v4-pro-0813` | 200 — 相同端点、相同密钥 | 继承相同的工具支持 |

> 验证会遍历一个简短的候选列表，而不是单个 id：某个渠道可能对单个模型不可用，而账户本身没问题。

## 🧪 如何使用 API

基础 URL **`https://api.yunserver.cn/v1`** — 兼容 OpenAI。

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

工具调用用法相同 — 传入普通的 `tools` 数组并读取 `choices[0].message.tool_calls`。

## 🛠 快速开始

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

邮箱通道是 **Emailnator**，它为每个账户提供一个普通的 `@gmail.com` — 面板在服务端强制执行域名/语法策略（实测：`user@example.com`、带点的 gmail 以及 outlook/hotmail/mailtrap 都会返回 `EMAIL_ADDRESS_REJECTED`），因此普通 gmail 是它唯一接受的地址类型。面板**没有验证码**，因此永远不需要 token 或求解器，而且邮箱通道调用与面板调用使用同一个出口池。

### 🖱️ 启动器

启动器会询问代理列表（可选）、数量和验证模型，将它们记住在 `launcher.config.json` 中，并运行 CLI — 铸造、验证、筛选出口、设置、帮助、连接到 9Router。

## ✅ 已验证可用 — 每个密钥都经过测试

| 检查 | 结果 |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · 签到开启 |
| `GET /api/verification?email=…` | **200** `{"success":true}` — 面板会发送 6 位验证码 |
| `POST /api/user/register` | **200**，使用与请求验证码相同的 cookie jar |
| `POST /api/user/login` | **200** → `access_token`；之后每次调用还会携带 `New-Api-User: <id>` |
| `POST /api/user/checkin` | **200** — 每日奖励在密钥验证之前就发放到账户 |
| `POST /api/token/` 然后 `POST /api/token/<id>/key` | token 列表会掩码显示密钥；reveal 端点返回明文 |
| `POST /v1/chat/completions` | **200** 且返回真实内容 — 只有通过这一步的密钥才会写入 `keys.txt` |
| `tools` 探测（`get_time` schema） | **200** `finish_reason: tool_calls`，一次带真实参数的调用 |

> **质量门禁。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （绝不交付失效密钥）。路由器组合在模型层面遵循同样的规则：只有当模型能返回 `chat-200`
> 且能调用工具时，才会添加条目 — 不支持工具的模型、失效的密钥或失效的提供商会
> 被丢弃而不是添加。可随时重新运行验证步骤；失败会被报告，绝不隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 说明 |
| --- | --- | --- |
| 邮箱 | Emailnator `POST /api/generate-email` | 每个账户一个全新的普通 `@gmail.com` — 面板的策略会拒绝带 `+`/点的别名以及所有其他通道的域名 |
| 验证码 | `GET /api/verification?email=…` | 验证码邮件来自面板自己的中继域名 |
| 注册 | `POST /api/user/register` | `{username,password,email,verification_code}` — 与请求验证码相同的 cookie jar |
| 会话 | `POST /api/user/login` | `access_token` + 账户 id；`/api/*` 还需要 `New-Api-User: <id>` |
| 签到 | `POST /api/user/checkin` | 在验证前为账户充值 |
| token | `POST /api/token/` → `POST /api/token/<id>/key` | 列表是掩码的，reveal 端点是唯一的明文来源 |
| 验证 | `POST /v1/chat/completions` | 200 且返回真实内容 = 保留；关闭的分组会在 `/api/pricing` 中的另一个分组上重试 |

## ⚙️ CLI 选项

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | 出口池，每行一个代理 — 可选：没有池时 CLI 直接连接 |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | 用于实时验证的模型 |

| 标志 | 含义 |
| --- | --- |
| `--pool <file>` | 代理列表（优先于环境变量） |
| `--proxy <url>` | 为每次面板调用固定一个出口 |
| `--group <name>` | token 分组（默认 `default`） |
| `--exits K` | 每个账户尝试的出口候选数（默认 6） |

## 🛰️ 在代理后面

**可选 — 推荐（注册限制是按出口 IP 计算的）。** 本工具在没有代理的情况下也能工作。

- **有池时：** 传入 `--pool <file>`（或设置 `YUNSERVER_PROXIES`），每个请求都会经过该列表中的一个出口；失效线路会使该次尝试失败并尝试下一个出口。
- **没有池时：** CLI 会打印 `DIRECT (no proxy)` 并直接连接。注册、密钥铸造和聊天验证不变 — 只是数据包发出的位置不同。
- 先运行 `--screen`：它会针对 `api.yunserver.cn/api/status` 测试你列表中的每个出口，并逐行打印 OK/DEAD。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个实时验证过的密钥 — 已被 git 忽略 |
| `accounts.json` | 邮箱 / 用户名 / 密码 / 分组 / 验证状态 — 已被 git 忽略 |
| `proxies.txt` | 你的出口 — 已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix yunserver`、`--base-url https://api.yunserver.cn/v1`、`--model deepseek-v4.1-flash`。模型以 `yunserver/<model id>` 形式提供。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix yunserver`、`--base-url https://api.yunserver.cn/v1`、`--model deepseek-v4.1-flash`。模型以 `yunserver/<model id>` 形式提供。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供商 | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 提供商提供什么 | 一个免费账户，带注册额度**外加每日签到**（无验证码门槛） |
| 🔑 一个密钥能给你什么 | 一个独立账户上的一个密钥：`https://api.yunserver.cn/v1` 的 DeepSeek id，经过聊天和工具验证 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 你的数据 | 仅会联系 `yunserver.cn` / `api.yunserver.cn`、Emailnator 以及你配置的邮箱后端 |

## 🐞 问题反馈

如果 YunServer 更改其注册端点、添加 Turnstile、收紧邮箱策略或更换可用分组，工具会在该步骤停止并说明原因。请**[提交 issue](../../issues)**，附上命令和确切输出。

## 📄 许可证

MIT © 2026 — 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>