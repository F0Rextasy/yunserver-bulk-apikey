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

**Массовое создание аккаунтов YunServer API с API-ключами — OpenAI-совместимый инференс + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-3-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

YunServer использует **форк new-api с `turnstile_check: false`**, поэтому для регистрации нужны только адрес электронной почты, пароль и 6-символьный код, который панель присылает вам на почту — никакой капчи, никакого браузера. Помимо бонуса за регистрацию панель начисляет **ежедневную отметку**, которую этот инструмент получает до проверки ключа, поэтому каждый ключ создаётся уже с балансом; а модель отвечает на **вызовы инструментов** (измеренные `tool_calls` с реальными аргументами), поэтому ключи работают с клиентами агентного типа, а не только с обычным чатом.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Тариф | бесплатный аккаунт, по одному на каждый созданный ключ |
| Квота при регистрации | ~**10 000** единиц панели на аккаунте (измерено на двух существующих аккаунтах: 11 030 / 11 044) |
| Ежедневная отметка | **включена** — инструмент вызывает `POST /api/user/checkin` до проверки, поэтому ключ стартует с балансом |
| Сколько стоит вызов | живая проверка выполняется на `deepseek-v4.1-flash` (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| Ключей на аккаунт | любое количество (`POST /api/token/`), но каждый ключ на аккаунте расходует одну и ту же квоту аккаунта — именно поэтому этот инструмент создаёт **один аккаунт на ключ** |

> 💡 Бесплатный тариф устанавливается YunServer API и может измениться. Проверяйте актуальные цифры на [yunserver.cn](https://yunserver.cn) — и пусть решает собственная проверка инструмента:

```bash
node src/cli.js --verify-only     # каждый ключ в keys.txt повторно тестируется реальным вызовом чата
```

## 🤖 Модели — все 3 из них

`GET https://api.yunserver.cn/v1/models` вернул семейство DeepSeek панели (точное количество id на ключ варьируется от 3 до 6 — панель фильтрует каталог для каждого аккаунта):

| ID модели | Чат | Инструменты |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — модель проверки для каждого ключа, создаваемого этим инструментом | **200**, `finish_reason: tool_calls` с аргументами |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — тот же эндпоинт, тот же ключ | наследует ту же поддержку инструментов |

> Проверка перебирает короткий список кандидатов, а не один id: канал может быть недоступен для одной модели, пока аккаунт в порядке.

## 🧪 Как использовать API

Базовый URL **`https://api.yunserver.cn/v1`** — OpenAI-совместимый.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

Вызов инструментов работает так же — передайте обычный массив `tools` и читайте `choices[0].message.tool_calls`.

## 🛠 Быстрый старт

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

Почтовый канал — это **Emailnator**, который выдаёт обычный `@gmail.com` на каждый аккаунт — панель применяет политику домена/синтаксиса на стороне сервера (измерено: `EMAIL_ADDRESS_REJECTED` для `user@example.com`, gmail с точками и outlook/hotmail/mailtrap), поэтому обычный gmail — единственное семейство адресов, которое она принимает. В панели **нет капчи**, поэтому токен или решатель никогда не нужны, а вызов почтового канала использует тот же пул выходов, что и вызовы панели.

### 🖱️ Лаунчер

Лаунчер запрашивает список прокси (необязательно), количество и модель проверки, запоминает их в `launcher.config.json` и запускает CLI — создание, проверка, отбор выходов, настройки, справка, подключение к 9Router.

## ✅ Проверено в работе — каждый ключ протестирован

| Проверка | Результат |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · отметка включена |
| `GET /api/verification?email=…` | **200** `{"success":true}` — панель присылает 6-символьный код |
| `POST /api/user/register` | **200** с той же банкой cookie, что запрашивала код |
| `POST /api/user/login` | **200** → `access_token`; каждый последующий вызов также несёт `New-Api-User: <id>` |
| `POST /api/user/checkin` | **200** — ежедневное начисление поступает на аккаунт до проверки ключа |
| `POST /api/token/` затем `POST /api/token/<id>/key` | список токенов маскирует ключ; эндпоинт раскрытия возвращает открытый текст |
| `POST /v1/chat/completions` | **200** с реальным содержимым — ключ попадает в `keys.txt` только после этого |
| Проверка `tools` (схема `get_time`) | **200** `finish_reason: tool_calls`, один вызов с реальными аргументами |

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200` до того, как был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Повторяйте шаг проверки в любое время;
> сбои сообщаются, а не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| почтовый ящик | Emailnator `POST /api/generate-email` | свежий обычный `@gmail.com` на каждый аккаунт — политика панели отклоняет псевдонимы с `+`/точками и домены всех других каналов |
| код | `GET /api/verification?email=…` | письмо с кодом приходит с собственного домена-ретранслятора панели |
| регистрация | `POST /api/user/register` | `{username,password,email,verification_code}` — та же банка cookie, что и у запроса кода |
| сессия | `POST /api/user/login` | `access_token` + id аккаунта; `/api/*` также требует `New-Api-User: <id>` |
| отметка | `POST /api/user/checkin` | пополняет аккаунт до проверки |
| токен | `POST /api/token/` → `POST /api/token/<id>/key` | список маскируется, эндпоинт раскрытия — единственный источник открытого текста |
| проверка | `POST /v1/chat/completions` | 200 с реальным содержимым = оставить; закрытая группа повторяется на другой группе из `/api/pricing` |

## ⚙️ Опции CLI

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| Переменная окружения | По умолчанию | Значение |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | пул выходов, по одной строке на прокси — необязательно: без пула CLI подключается напрямую |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | модель для живой проверки |

| Флаг | Значение |
| --- | --- |
| `--pool <file>` | список прокси (имеет приоритет над переменной окружения) |
| `--proxy <url>` | закрепить один выход для всех вызовов панели |
| `--group <name>` | группа токенов (по умолчанию `default`) |
| `--exits K` | количество кандидатов выходов, перебираемых на аккаунт (по умолчанию 6) |

## 🛰️ За прокси

**Необязательно — рекомендуется (лимит регистраций привязан к IP выхода).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `YUNSERVER_PROXIES`), и каждый запрос пойдёт через выход из этого списка; мёртвая линия проваливает эту попытку, и пробуется следующий выход.
- **Без пула:** CLI выводит `DIRECT (no proxy)` и подключается напрямую. Регистрация, создание ключей и проверка чата не меняются — меняется только то, откуда уходят пакеты.
- Сначала запустите `--screen`: он тестирует каждый выход из вашего списка против `api.yunserver.cn/api/status` и выводит OK/DEAD для каждой строки.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | по одному проверенному в работе ключу на строку — игнорируется git |
| `accounts.json` | email / имя пользователя / пароль / группа / статус проверки — игнорируется git |
| `proxies.txt` | ваши выходы — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый OpenAI-совместимый роутер:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Модели предоставляются как `yunserver/<model id>`.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый OpenAI-совместимый роутер:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Модели предоставляются как `yunserver/<model id>`.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 Что даёт провайдер | бесплатный аккаунт с квотой за регистрацию **плюс ежедневная отметка** (без капчи) |
| 🔑 Что даёт один ключ | один ключ на собственном аккаунте: id DeepSeek из `https://api.yunserver.cn/v1`, проверенные для чата и инструментов |
| 🌐 Форма API | OpenAI-совместимый: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 Ваши данные | контакт только с `yunserver.cn` / `api.yunserver.cn`, Emailnator и настроенным вами почтовым бэкендом |

## 🐞 Проблемы

Если YunServer изменит свои эндпоинты регистрации, добавит Turnstile, ужесточит политику почтовых ящиков или переместит рабочую группу, инструмент остановится на этом шаге и сообщит об этом. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>