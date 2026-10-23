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

**API 키로 YunServer API 계정을 대량 생성 — OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-3-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 이 도구가 존재하는 이유

YunServer는 **`turnstile_check: false`인 new-api 포크**를 운영하므로, 가입 관문은 이메일 주소, 비밀번호, 그리고 패널이 보내주는 6자리 코드뿐입니다 — 캡차도, 브라우저도 필요 없습니다. 가입 크레딧에 더해 패널은 **일일 출석 체크**를 지급하는데, 이 도구는 키를 검증하기 전에 이를 수령하므로 모든 키가 자금이 채워진 상태로 태어납니다. 또한 모델이 **도구 호출**에 응답하므로(실제 인자를 담은 `tool_calls`가 측정됨), 이 키들은 단순 채팅뿐 아니라 에이전트 스타일 클라이언트에서도 작동합니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 플랜 | 무료 계정, 발급된 키당 하나 |
| 가입 시 할당량 | 계정에 약 **10,000** 패널 단위 (기존 두 계정에서 측정: 11,030 / 11,044) |
| 일일 출석 체크 | **켜짐** — 도구가 관문 전에 `POST /api/user/checkin`을 호출하므로 키가 자금이 채워진 상태로 시작 |
| 호출 비용 | 라이브 관문은 `deepseek-v4.1-flash`에서 실행됨 (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| 계정당 키 수 | 임의 개수 (`POST /api/token/`), 하지만 한 계정의 모든 키는 동일한 계정 할당량을 소모 — 바로 이 때문에 이 도구는 **키당 하나의 계정**을 발급 |

> 💡 무료 티어는 YunServer API가 설정하며 변경될 수 있습니다. 실시간 수치는 [yunserver.cn](https://yunserver.cn)에서 확인하세요 — 그리고 도구 자체의 관문이 판단하게 하세요:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 모델 — 전부 3개

`GET https://api.yunserver.cn/v1/models`는 패널의 DeepSeek 패밀리를 반환했습니다(키당 정확한 개수는 3~6개 id 사이에서 달라짐 — 패널이 계정별로 카탈로그를 필터링함):

| 모델 ID | 채팅 | 도구 |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — 이 도구가 작성하는 모든 키의 관문 모델 | **200**, 인자를 담은 `finish_reason: tool_calls` |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — 동일 엔드포인트, 동일 키 | 동일한 도구 지원을 상속 |

> 관문은 하나의 id가 아니라 짧은 후보 목록을 순회합니다: 계정은 멀쩡한데 특정 모델의 채널만 다운될 수 있기 때문입니다.

## 🧪 API 사용 방법

베이스 URL **`https://api.yunserver.cn/v1`** — OpenAI 호환.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

도구 호출도 동일하게 작동합니다 — 일반적인 `tools` 배열을 전달하고 `choices[0].message.tool_calls`를 읽으세요.

## 🛠 빠른 시작

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

메일함 레일은 **Emailnator**로, 계정당 일반 `@gmail.com` 하나를 제공합니다 — 패널은 도메인/구문 정책을 서버 측에서 강제하므로(측정됨: `user@example.com`, 점이 들어간 gmail, outlook/hotmail/mailtrap에 대해 `EMAIL_ADDRESS_REJECTED`) 일반 gmail이 유일하게 받아들이는 주소 계열입니다. 패널에는 **캡차가 없으므로** 토큰이나 솔버가 전혀 필요 없으며, 레일 호출은 패널 호출과 동일한 출구 풀을 사용합니다.

### 🖱️ 런처

런처는 프록시 목록(선택 사항), 개수, 관문 모델을 묻고 이를 `launcher.config.json`에 기억한 뒤 CLI를 실행합니다 — 발급, 검증, 출구 스크린, 설정, 도움말, 9Router 연결.

## ✅ 검증됨 — 모든 키가 테스트됨

| 확인 | 결과 |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · 출석 체크 켜짐 |
| `GET /api/verification?email=…` | **200** `{"success":true}` — 패널이 6자리 코드를 메일로 발송 |
| `POST /api/user/register` | **200** — 코드를 요청한 것과 동일한 쿠키 jar 사용 |
| `POST /api/user/login` | **200** → `access_token`; 이후 모든 호출은 `New-Api-User: <id>`도 함께 전달 |
| `POST /api/user/checkin` | **200** — 키가 검증되기 전에 일일 지급이 계정에 들어옴 |
| `POST /api/token/` 후 `POST /api/token/<id>/key` | 토큰 목록은 키를 마스킹하고, 공개 엔드포인트가 평문을 반환 |
| `POST /v1/chat/completions` | **200** 실제 콘텐츠 포함 — 키는 이 단계를 통과한 후에만 `keys.txt`에 도달 |
| `tools` 프로브 (`get_time` 스키마) | **200** `finish_reason: tool_calls`, 실제 인자를 담은 호출 하나 |

> **품질 관문.** 여기의 모든 키는 `keys.txt`에 기록되기 전에 라이브 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 콤보도 모델 수준에서 동일한 규칙을 따릅니다: 항목은
> **모델이 `chat-200`에 응답하고 도구를 호출할 수 있는 경우에만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키, 죽은 제공자는 추가되지 않고 제거됩니다. 검증 단계는 언제든 다시 실행할 수 있으며,
> 실패는 보고되며 결코 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 메일함 | Emailnator `POST /api/generate-email` | 계정당 새 일반 `@gmail.com` — 패널 정책은 `+`/점이 들어간 별칭과 다른 모든 레일의 도메인을 거부 |
| 코드 | `GET /api/verification?email=…` | 코드 메일은 패널 자체 릴레이 도메인에서 도착 |
| 등록 | `POST /api/user/register` | `{username,password,email,verification_code}` — 코드 요청과 동일한 쿠키 jar |
| 세션 | `POST /api/user/login` | `access_token` + 계정 id; `/api/*`는 `New-Api-User: <id>`도 요구 |
| 출석 체크 | `POST /api/user/checkin` | 관문 전에 계정에 자금을 채움 |
| 토큰 | `POST /api/token/` → `POST /api/token/<id>/key` | 목록은 마스킹되고, 공개 엔드포인트가 유일한 평문 소스 |
| 관문 | `POST /v1/chat/completions` | 실제 콘텐츠와 함께 200 = 유지; 닫힌 그룹은 `/api/pricing`의 다른 그룹에서 재시도 |

## ⚙️ CLI 옵션

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| 환경 변수 | 기본값 | 의미 |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | 출구 풀, 프록시당 한 줄 — 선택 사항: 풀이 없으면 CLI는 직접 연결 |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | 라이브 검증에 사용할 모델 |

| 플래그 | 의미 |
| --- | --- |
| `--pool <file>` | 프록시 목록 (환경 변수보다 우선) |
| `--proxy <url>` | 모든 패널 호출에 하나의 출구를 고정 |
| `--group <name>` | 토큰 그룹 (기본값 `default`) |
| `--exits K` | 계정당 시도할 출구 후보 (기본값 6) |

## 🛰️ 프록시 뒤에서

**선택 사항 — 권장됨 (가입 제한은 출구 IP당 적용).** 이 도구는 프록시 없이도 작동합니다.

- **풀 사용 시:** `--pool <file>`을 전달하거나 `YUNSERVER_PROXIES`를 설정하면 모든 요청이 해당 목록의 출구를 통해 나갑니다; 죽은 회선은 해당 시도를 실패시키고 다음 출구가 시도됩니다.
- **풀 없이:** CLI는 `DIRECT (no proxy)`를 출력하고 직접 연결합니다. 가입, 키 발급, 채팅 관문은 변경되지 않습니다 — 패킷이 나가는 위치만 다를 뿐입니다.
- 먼저 `--screen`을 실행하세요: 목록의 모든 출구를 `api.yunserver.cn/api/status`에 대해 테스트하고 각 줄마다 OK/DEAD를 출력합니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 라이브 검증된 키가 한 줄에 하나씩 — git 무시됨 |
| `accounts.json` | 이메일 / 사용자 이름 / 비밀번호 / 그룹 / 관문 상태 — git 무시됨 |
| `proxies.txt` | 사용자의 출구 — git 무시됨 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. 모델은 `yunserver/<model id>`로 제공됩니다.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. 모델은 `yunserver/<model id>`로 제공됩니다.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 제공자가 주는 것 | 가입 할당량 **더하기 일일 출석 체크**가 있는 무료 계정 (캡차 관문 없음) |
| 🔑 키 하나로 얻는 것 | 자체 계정의 키 하나: `https://api.yunserver.cn/v1`의 DeepSeek id, 채팅 및 도구 검증됨 |
| 🌐 API 형태 | OpenAI 호환: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 데이터 | `yunserver.cn` / `api.yunserver.cn`, Emailnator, 그리고 사용자가 구성한 메일함 백엔드만 접촉됨 |

## 🐞 이슈

YunServer가 가입 엔드포인트를 변경하거나, Turnstile을 추가하거나, 메일함 정책을 강화하거나, 작동하는 그룹을 옮기면 도구는 해당 단계에서 멈추고 그 사실을 알립니다. 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>