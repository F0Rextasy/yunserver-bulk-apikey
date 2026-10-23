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

**YunServer-API-Konten mit API-Schlüsseln in großen Mengen erstellen — OpenAI-kompatible Inferenz + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-3-of-them) · [🧪 Die API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

YunServer betreibt einen **new-api-Fork mit `turnstile_check: false`**, daher besteht die Registrierungshürde nur aus einer E-Mail-Adresse, einem Passwort und dem 6-stelligen Code, den das Panel dir per E-Mail schickt — kein Captcha, kein Browser. Zusätzlich zum Registrierungsguthaben zahlt das Panel einen **täglichen Check-in** aus, den dieses Tool beansprucht, bevor der Schlüssel geprüft wird, sodass jeder Schlüssel bereits mit Guthaben ausgestattet zur Welt kommt; und das Modell beantwortet **Tool-Aufrufe** (gemessene `tool_calls` mit echten Argumenten), sodass die Schlüssel mit agentenartigen Clients funktionieren, nicht nur mit einfachem Chat.

## 🎁 Kostenlose Stufe — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Tarif | kostenloses Konto, eines pro erzeugtem Schlüssel |
| Guthaben bei der Registrierung | ~**10.000** Panel-Einheiten auf dem Konto (gemessen an den beiden bereits vorhandenen Konten: 11.030 / 11.044) |
| Täglicher Check-in | **an** — das Tool ruft `POST /api/user/checkin` vor der Prüfung auf, sodass der Schlüssel mit Guthaben startet |
| Was ein Aufruf kostet | die Live-Prüfung läuft auf `deepseek-v4.1-flash` (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| Schlüssel pro Konto | beliebig viele (`POST /api/token/`), aber jeder Schlüssel eines Kontos zieht dasselbe Kontoguthaben — genau deshalb erzeugt dieses Tool **ein Konto pro Schlüssel** |

> 💡 Die kostenlose Stufe wird von YunServer API festgelegt und kann sich ändern. Prüfe die Live-Zahlen auf [yunserver.cn](https://yunserver.cn) — und lass die Prüfung des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 3 davon

`GET https://api.yunserver.cn/v1/models` gab die DeepSeek-Familie des Panels zurück (die genaue Anzahl pro Schlüssel variiert zwischen 3 und 6 IDs — das Panel filtert den Katalog pro Konto):

| Modell-ID | Chat | Tools |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — das Prüfmodell für jeden Schlüssel, den dieses Tool schreibt | **200**, `finish_reason: tool_calls` mit Argumenten |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — derselbe Endpunkt, derselbe Schlüssel | erbt dieselbe Tool-Unterstützung |

> Die Prüfung durchläuft eine kurze Kandidatenliste, nicht eine einzige ID: Ein Kanal kann für ein einzelnes Modell ausgefallen sein, während das Konto in Ordnung ist.

## 🧪 So verwendest du die API

Basis-URL **`https://api.yunserver.cn/v1`** — OpenAI-kompatibel.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

Tool-Aufrufe funktionieren genauso — übergib ein normales `tools`-Array und lies `choices[0].message.tool_calls`.

## 🛠 Schnellstart

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

Die Mailbox-Schiene ist **Emailnator**, die pro Konto eine einfache `@gmail.com`-Adresse ausgibt — das Panel erzwingt serverseitig eine Domain-/Syntaxrichtlinie (gemessen: `EMAIL_ADDRESS_REJECTED` für `user@example.com`, gmails mit Punkten und outlook/hotmail/mailtrap), daher ist eine einfache gmail die einzige Adressfamilie, die es akzeptiert. Das Panel hat **kein Captcha**, daher wird nie ein Token oder Solver benötigt, und der Mailbox-Aufruf läuft über denselben Exit-Pool wie die Panel-Aufrufe.

### 🖱️ Der Launcher

Der Launcher fragt nach der Proxy-Liste (optional), der Anzahl und dem Prüfmodell, merkt sie sich in `launcher.config.json` und führt die CLI aus — mint, verify, screen exits, settings, help, Connect to 9Router.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

| Prüfung | Ergebnis |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · Check-in an |
| `GET /api/verification?email=…` | **200** `{"success":true}` — das Panel schickt einen 6-stelligen Code per E-Mail |
| `POST /api/user/register` | **200** mit demselben Cookie-Jar, der den Code angefordert hat |
| `POST /api/user/login` | **200** → `access_token`; jeder spätere Aufruf trägt außerdem `New-Api-User: <id>` |
| `POST /api/user/checkin` | **200** — die tägliche Gutschrift landet auf dem Konto, bevor der Schlüssel geprüft wird |
| `POST /api/token/` dann `POST /api/token/<id>/key` | die Token-Liste maskiert den Schlüssel; der Reveal-Endpunkt gibt den Klartext zurück |
| `POST /v1/chat/completions` | **200** mit echtem Inhalt — ein Schlüssel erreicht `keys.txt` erst danach |
| `tools`-Probe (`get_time`-Schema) | **200** `finish_reason: tool_calls`, ein Aufruf mit echten Argumenten |

> **Qualitätsschranken.** Jeder Schlüssel hier hat ein Live-`chat-200` bestanden, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Anbieter wird verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, nie verborgen.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| Mailbox | Emailnator `POST /api/generate-email` | eine frische einfache `@gmail.com` pro Konto — die Richtlinie des Panels lehnt Aliase mit `+`/Punkten und die Domain jeder anderen Schiene ab |
| Code | `GET /api/verification?email=…` | die Code-Mail kommt von der eigenen Relay-Domain des Panels |
| Registrierung | `POST /api/user/register` | `{username,password,email,verification_code}` — derselbe Cookie-Jar wie bei der Code-Anforderung |
| Sitzung | `POST /api/user/login` | `access_token` + die Konto-ID; `/api/*` will außerdem `New-Api-User: <id>` |
| Check-in | `POST /api/user/checkin` | lädt das Konto vor der Prüfung auf |
| Token | `POST /api/token/` → `POST /api/token/<id>/key` | die Liste ist maskiert, der Reveal-Endpunkt ist die einzige Klartextquelle |
| Prüfung | `POST /v1/chat/completions` | 200 mit echtem Inhalt = behalten; eine geschlossene Gruppe wird auf einer anderen Gruppe aus `/api/pricing` erneut versucht |

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| Env | Standard | Bedeutung |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | Exit-Pool, eine Zeile pro Proxy — optional: ohne Pool verbindet sich die CLI direkt |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | Modell für die Live-Verifizierung |

| Flag | Bedeutung |
| --- | --- |
| `--pool <file>` | Proxy-Liste (gewinnt gegenüber der Env) |
| `--proxy <url>` | einen Exit für jeden Panel-Aufruf festlegen |
| `--group <name>` | Token-Gruppe (Standard `default`) |
| `--exits K` | pro Konto versuchte Exit-Kandidaten (Standard 6) |

## 🛰️ Hinter einem Proxy

**Optional — empfohlen (das Registrierungslimit gilt pro Exit-IP).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** übergib `--pool <file>` (oder setze `YUNSERVER_PROXIES`), und jede Anfrage läuft über einen Exit aus dieser Liste; eine tote Leitung lässt diesen Versuch scheitern und der nächste Exit wird versucht.
- **Ohne einen Pool:** die CLI gibt `DIRECT (no proxy)` aus und verbindet sich direkt. Registrierung, Schlüsselerzeugung und Chat-Prüfung bleiben unverändert — nur der Ort, von dem die Pakete ausgehen, ändert sich.
- Führe zuerst `--screen` aus: Es testet jeden Exit in deiner Liste gegen `api.yunserver.cn/api/status` und gibt pro Zeile OK/DEAD aus.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live-verifizierter Schlüssel pro Zeile — von git ignoriert |
| `accounts.json` | E-Mail / Benutzername / Passwort / Gruppe / Prüfstatus — von git ignoriert |
| `proxies.txt` | deine Exits — von git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Modelle werden als `yunserver/<model id>` bereitgestellt.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Modelle werden als `yunserver/<model id>` bereitgestellt.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 Was der Anbieter gibt | ein kostenloses Konto mit Registrierungsguthaben **plus einem täglichen Check-in** (keine Captcha-Hürde) |
| 🔑 Was ein Schlüssel dir bringt | ein Schlüssel auf seinem eigenen Konto: die DeepSeek-IDs von `https://api.yunserver.cn/v1`, chat- und tool-verifiziert |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 Deine Daten | nur `yunserver.cn` / `api.yunserver.cn`, Emailnator und das von dir konfigurierte Mailbox-Backend werden kontaktiert |

## 🐞 Probleme

Wenn YunServer seine Registrierungs-Endpunkte ändert, Turnstile hinzufügt, die Mailbox-Richtlinie verschärft oder die funktionierende Gruppe verschiebt, stoppt das Tool an diesem Schritt und sagt es dir. **[Öffne ein Issue](../../issues)** mit dem Befehl und der exakten Ausgabe.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>