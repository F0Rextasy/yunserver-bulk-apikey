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

**YunServer API hesaplarını API anahtarlarıyla toplu oluşturun — OpenAI uyumlu çıkarım + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-3-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

YunServer, **`turnstile_check: false` ile bir new-api çatalı** çalıştırır, bu yüzden kayıt kapısı bir e-posta adresi, bir parola ve panelin size gönderdiği 6 karakterli koddan ibarettir — captcha yok, tarayıcı yok. Kayıt kredisinin üzerine panel bir **günlük giriş** ödemesi yapar; bu araç anahtar doğrulanmadan önce bunu talep eder, böylece her anahtar fonlanmış olarak doğar; ve model **araç çağrılarını** yanıtlar (gerçek argümanlarla ölçülmüş `tool_calls`), böylece anahtarlar yalnızca düz sohbetle değil, ajan tarzı istemcilerle de çalışır.

## 🎁 Ücretsiz katman — ne kadar alırsınız

| Ne | Değer |
| --- | --- |
| Plan | ücretsiz hesap, oluşturulan her anahtar için bir tane |
| Kayıt anındaki kota | hesapta ~**10.000** panel birimi (mevcut iki hesapta ölçüldü: 11.030 / 11.044) |
| Günlük giriş | **açık** — araç kapıdan önce `POST /api/user/checkin` çağırır, böylece anahtar fonlanmış olarak başlar |
| Bir çağrının maliyeti | canlı kapı `deepseek-v4.1-flash` üzerinde çalışır (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| Hesap başına anahtar | herhangi bir sayı (`POST /api/token/`), ancak bir hesaptaki her anahtar aynı hesap kotasını çeker — bu aracın **anahtar başına bir hesap** oluşturmasının nedeni tam olarak budur |

> 💡 Ücretsiz katman YunServer API tarafından belirlenir ve değişebilir. Canlı sayıları [yunserver.cn](https://yunserver.cn) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — üçünün tamamı

`GET https://api.yunserver.cn/v1/models`, panelin DeepSeek ailesini döndürdü (anahtar başına tam sayı 3 ile 6 id arasında değişir — panel kataloğu hesap başına filtreler):

| Model Kimliği | Sohbet | Araçlar |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — bu aracın yazdığı her anahtar için kapı modeli | **200**, argümanlarla `finish_reason: tool_calls` |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — aynı uç nokta, aynı anahtar | aynı araç desteğini devralır |

> Kapı tek bir id değil, kısa bir aday listesini gezer: bir kanal tek bir model için kapalı olabilirken hesap sağlam olabilir.

## 🧪 API nasıl kullanılır

Temel URL **`https://api.yunserver.cn/v1`** — OpenAI uyumlu.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

Araç çağrısı da aynı şekilde çalışır — normal bir `tools` dizisi geçirin ve `choices[0].message.tool_calls` okuyun.

## 🛠 Hızlı başlangıç

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

Posta kutusu hattı **Emailnator**'dır ve hesap başına düz bir `@gmail.com` verir — panel sunucu tarafında bir alan adı/sözdizimi politikası uygular (ölçüldü: `user@example.com`, noktalı gmailler ve outlook/hotmail/mailtrap için `EMAIL_ADDRESS_REJECTED`) bu yüzden düz bir gmail kabul ettiği tek adres ailesidir. Panelde **captcha yoktur**, bu yüzden hiçbir zaman token veya çözücü gerekmez ve posta kutusu çağrısı panel çağrılarıyla aynı çıkış havuzunu kullanır.

### 🖱️ Başlatıcı

Başlatıcı proxy listesini (isteğe bağlı), sayıyı ve kapı modelini sorar, bunları `launcher.config.json` içinde hatırlar ve CLI'yi çalıştırır — oluştur, doğrula, çıkışları tara, ayarlar, yardım, 9Router'a Bağlan.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

| Kontrol | Sonuç |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · giriş açık |
| `GET /api/verification?email=…` | **200** `{"success":true}` — panel 6 karakterli bir kod gönderir |
| `POST /api/user/register` | **200**, kodu isteyen aynı cookie kavanozuyla |
| `POST /api/user/login` | **200** → `access_token`; sonraki her çağrı ayrıca `New-Api-User: <id>` taşır |
| `POST /api/user/checkin` | **200** — günlük hibe, anahtar doğrulanmadan önce hesaba yatar |
| `POST /api/token/` ardından `POST /api/token/<id>/key` | token listesi anahtarı maskeler; açığa çıkarma uç noktası düz metni döndürür |
| `POST /v1/chat/completions` | gerçek içerikle **200** — bir anahtar `keys.txt` dosyasına ancak bundan sonra ulaşır |
| `tools` sondası (`get_time` şeması) | **200** `finish_reason: tool_calls`, gerçek argümanlarla bir çağrı |

> **Kalite kapıları.** Buradaki her anahtar `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> başarısızlıklar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| posta kutusu | Emailnator `POST /api/generate-email` | hesap başına taze düz bir `@gmail.com` — panelin politikası `+`/nokta içeren takma adları ve diğer tüm hatların alan adını reddeder |
| kod | `GET /api/verification?email=…` | kod postası panelin kendi aktarma alan adından gelir |
| kayıt | `POST /api/user/register` | `{username,password,email,verification_code}` — kod isteğiyle aynı cookie kavanozu |
| oturum | `POST /api/user/login` | `access_token` + hesap kimliği; `/api/*` ayrıca `New-Api-User: <id>` ister |
| giriş | `POST /api/user/checkin` | hesabı kapıdan önce fonlar |
| token | `POST /api/token/` → `POST /api/token/<id>/key` | liste maskelenir, açığa çıkarma uç noktası tek düz metin kaynağıdır |
| kapı | `POST /v1/chat/completions` | gerçek içerikle 200 = tut; kapalı bir grup `/api/pricing` içinden başka bir grupta yeniden denenir |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| Ortam | Varsayılan | Anlam |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | çıkış havuzu, satır başına bir proxy — isteğe bağlı: havuz olmadan CLI doğrudan bağlanır |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | canlı doğrulama için model |

| Bayrak | Anlam |
| --- | --- |
| `--pool <file>` | proxy listesi (ortam değişkenini geçersiz kılar) |
| `--proxy <url>` | her panel çağrısı için tek bir çıkış sabitle |
| `--group <name>` | token grubu (varsayılan `default`) |
| `--exits K` | hesap başına denenen çıkış adayları (varsayılan 6) |

## 🛰️ Proxy arkasında

**İsteğe bağlı — önerilir (kayıt sınırı çıkış IP'si başınadır).** Araç proxy olmadan da çalışır.

- **Havuzla:** `--pool <file>` geçin (veya `YUNSERVER_PROXIES` ayarlayın) ve her istek o listeden bir çıkıştan geçer; ölü bir hat o denemeyi başarısız kılar ve bir sonraki çıkış denenir.
- **Havuz olmadan:** CLI `DIRECT (no proxy)` yazdırır ve doğrudan bağlanır. Kayıt, anahtar oluşturma ve sohbet kapısı değişmez — yalnızca paketlerin nereden çıktığı değişir.
- Önce `--screen` çalıştırın: listenizdeki her çıkışı `api.yunserver.cn/api/status` adresine karşı test eder ve satır başına OK/DEAD yazdırır.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına canlı doğrulanmış bir anahtar — git tarafından yok sayılır |
| `accounts.json` | e-posta / kullanıcı adı / parola / grup / kapı durumu — git tarafından yok sayılır |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |

## 🔌 9Router'a Bağlan

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Modeller `yunserver/<model id>` olarak sunulur.

## 🔌 OmniRoute'a Bağlan

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Modeller `yunserver/<model id>` olarak sunulur.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 Sağlayıcının verdikleri | kayıt kotası **artı günlük giriş** içeren ücretsiz bir hesap (captcha kapısı yok) |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabında bir anahtar: `https://api.yunserver.cn/v1` adresinin DeepSeek kimlikleri, sohbet ve araç doğrulamalı |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca `yunserver.cn` / `api.yunserver.cn`, Emailnator ve yapılandırdığınız posta kutusu arka ucuyla iletişim kurulur |

## 🐞 Sorunlar

YunServer kayıt uç noktalarını değiştirirse, Turnstile eklerse, posta kutusu politikasını sıkılaştırırsa veya çalışan grubu taşırsa, araç o adımda durur ve bunu bildirir. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey katkıda bulunanlar

</div>