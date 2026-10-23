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

**Créez en masse des comptes YunServer API avec des clés API — inférence compatible OpenAI + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-3%20served-412991?style=for-the-badge)](https://api.yunserver.cn/v1/models)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-3-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cet outil existe

YunServer utilise un **fork de new-api avec `turnstile_check: false`**, donc la barrière d'inscription se résume à une adresse e-mail, un mot de passe et le code à 6 caractères que le panneau vous envoie par e-mail — pas de captcha, pas de navigateur. En plus du crédit d'inscription, le panneau verse un **check-in quotidien**, que cet outil réclame avant que la clé ne soit validée, de sorte que chaque clé naît approvisionnée ; et le modèle répond aux **appels d'outils** (mesuré : `tool_calls` avec de vrais arguments), donc les clés fonctionnent avec les clients de type agent, pas seulement en chat simple.

## 🎁 Offre gratuite — ce que vous obtenez

| Élément | Valeur |
| --- | --- |
| Formule | compte gratuit, un par clé générée |
| Quota à l'inscription | ~**10 000** unités de panneau sur le compte (mesuré sur les deux comptes préexistants : 11 030 / 11 044) |
| Check-in quotidien | **activé** — l'outil appelle `POST /api/user/checkin` avant la validation, donc la clé démarre approvisionnée |
| Coût d'un appel | la validation en direct s'exécute sur `deepseek-v4.1-flash` (`ratio 0.15`, `completion 4`, `quota_type 0`) |
| Clés par compte | un nombre quelconque (`POST /api/token/`), mais chaque clé d'un compte puise dans le même quota de compte — c'est précisément pourquoi cet outil génère **un compte par clé** |

> 💡 L'offre gratuite est définie par YunServer API et peut changer. Vérifiez les chiffres en direct sur [yunserver.cn](https://yunserver.cn) — et laissez la validation de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 3 au complet

`GET https://api.yunserver.cn/v1/models` a renvoyé la famille DeepSeek du panneau (le nombre exact par clé varie entre 3 et 6 identifiants — le panneau filtre le catalogue par compte) :

| ID du modèle | Chat | Outils |
| --- | --- | --- |
| `deepseek-v4.1-flash` | **200** — le modèle de validation pour chaque clé que cet outil écrit | **200**, `finish_reason: tool_calls` avec arguments |
| `deepseek-v4-pro`, `deepseek-v4-pro-0813` | 200 — même endpoint, même clé | hérite du même support des outils |

> La validation parcourt une courte liste de candidats, pas un seul identifiant : un canal peut être en panne pour un seul modèle alors que le compte est intact.

## 🧪 Comment utiliser l'API

URL de base **`https://api.yunserver.cn/v1`** — compatible OpenAI.

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.yunserver.cn/v1", api_key="<your key>")
print(c.chat.completions.create(model="deepseek-v4.1-flash",
      messages=[{"role": "user", "content": "hi"}]).choices[0].message.content)
```

L'appel d'outils fonctionne de la même manière — passez un tableau `tools` normal et lisez `choices[0].message.tool_calls`.

## 🛠 Démarrage rapide

```bash
cd yunserver-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 3 --pool proxies.txt
node src/cli.js --verify-only
```

Le canal de boîte mail est **Emailnator**, qui fournit un simple `@gmail.com` par compte — le panneau applique une politique de domaine/syntaxe côté serveur (mesuré : `EMAIL_ADDRESS_REJECTED` pour `user@example.com`, les gmails avec points, et outlook/hotmail/mailtrap) donc un gmail simple est la seule famille d'adresses qu'il accepte. Le panneau n'a **aucun captcha**, donc aucun jeton ni solveur n'est jamais nécessaire, et l'appel au canal emprunte le même pool de sortie que les appels au panneau.

### 🖱️ Le lanceur

Le lanceur demande la liste de proxys (facultative), le nombre et le modèle de validation, les mémorise dans `launcher.config.json`, et exécute le CLI — générer, vérifier, tester les sorties, paramètres, aide, Connect to 9Router.

## ✅ Vérifié fonctionnel — chaque clé est testée

| Vérification | Résultat |
| --- | --- |
| `GET /api/status` | `turnstile_check: false` · `email_verification: true` · `password_register: true` · check-in activé |
| `GET /api/verification?email=…` | **200** `{"success":true}` — le panneau envoie un code à 6 caractères |
| `POST /api/user/register` | **200** avec le même pot de cookies que celui ayant demandé le code |
| `POST /api/user/login` | **200** → `access_token` ; chaque appel ultérieur porte aussi `New-Api-User: <id>` |
| `POST /api/user/checkin` | **200** — l'attribution quotidienne arrive sur le compte avant que la clé ne soit validée |
| `POST /api/token/` puis `POST /api/token/<id>/key` | la liste des jetons masque la clé ; l'endpoint de révélation renvoie le texte en clair |
| `POST /v1/chat/completions` | **200** avec du contenu réel — une clé n'atteint `keys.txt` qu'après cela |
| sonde `tools` (schéma `get_time`) | **200** `finish_reason: tool_calls`, un appel avec de vrais arguments |

> **Contrôles qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combos du routeur suivent la même règle au niveau du modèle : une entrée n'est
> ajoutée **que si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans support des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais cachés.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: YunServer API page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.yunserver.cn/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Remarques |
| --- | --- | --- |
| boîte mail | Emailnator `POST /api/generate-email` | un simple `@gmail.com` neuf par compte — la politique du panneau rejette les alias avec `+`/points et le domaine de tout autre canal |
| code | `GET /api/verification?email=…` | l'e-mail du code arrive depuis le propre domaine relais du panneau |
| inscription | `POST /api/user/register` | `{username,password,email,verification_code}` — même pot de cookies que la demande de code |
| session | `POST /api/user/login` | `access_token` + l'id du compte ; `/api/*` veut aussi `New-Api-User: <id>` |
| check-in | `POST /api/user/checkin` | approvisionne le compte avant la validation |
| jeton | `POST /api/token/` → `POST /api/token/<id>/key` | la liste est masquée, l'endpoint de révélation est la seule source en clair |
| validation | `POST /v1/chat/completions` | 200 avec du contenu réel = conserver ; un groupe fermé est retenté sur un autre groupe depuis `/api/pricing` |

## ⚙️ Options du CLI

```bash
node src/cli.js --count N        # mint N keys (each stops at the live chat gate)
node src/cli.js --verify-only    # re-prove every key in keys.txt
node src/cli.js --screen         # exit pool self-test against api.yunserver.cn
node src/cli.js --connect-9router
node src/cli.js --help
```

| Env | Défaut | Signification |
| --- | --- | --- |
| `YUNSERVER_PROXIES` | `proxies.txt` | pool de sortie, une ligne par proxy — facultatif : sans pool, le CLI se connecte directement |
| `YUNSERVER_MODEL` | `deepseek-v4.1-flash` | modèle pour la vérification en direct |

| Option | Signification |
| --- | --- |
| `--pool <file>` | liste de proxys (prioritaire sur la variable d'environnement) |
| `--proxy <url>` | fixer une sortie pour chaque appel au panneau |
| `--group <name>` | groupe de jetons (défaut `default`) |
| `--exits K` | candidats de sortie essayés par compte (défaut 6) |

## 🛰️ Derrière un proxy

**Facultatif — recommandé (la limite d'inscription est par IP de sortie).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `YUNSERVER_PROXIES`) et chaque requête passe par une sortie de cette liste ; une ligne morte fait échouer cette tentative et la sortie suivante est essayée.
- **Sans pool :** le CLI affiche `DIRECT (no proxy)` et se connecte directement. L'inscription, la génération de clés et la validation du chat sont inchangées — seul le point de départ des paquets change.
- Lancez d'abord `--screen` : il teste chaque sortie de votre liste contre `api.yunserver.cn/api/status` et affiche OK/DEAD par ligne.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignoré par git |
| `accounts.json` | e-mail / nom d'utilisateur / mot de passe / groupe / statut de validation — ignoré par git |
| `proxies.txt` | vos sorties — ignoré par git |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Les modèles sont servis sous `yunserver/<model id>`.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix yunserver`, `--base-url https://api.yunserver.cn/v1`, `--model deepseek-v4.1-flash`. Les modèles sont servis sous `yunserver/<model id>`.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **YunServer API** — [yunserver.cn](https://yunserver.cn) |
| 🎁 Ce que le fournisseur donne | un compte gratuit avec quota d'inscription **plus un check-in quotidien** (pas de barrière captcha) |
| 🔑 Ce qu'une clé vous apporte | une clé sur son propre compte : les identifiants DeepSeek de `https://api.yunserver.cn/v1`, vérifiés en chat et en outils |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://api.yunserver.cn/v1/chat/completions` |
| 🔒 Vos données | seuls `yunserver.cn` / `api.yunserver.cn`, Emailnator et le backend de boîte mail que vous configurez sont contactés |

## 🐞 Problèmes

Si YunServer modifie ses endpoints d'inscription, ajoute Turnstile, resserre la politique de boîte mail ou déplace le groupe fonctionnel, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 yunserver-bulk-apikey contributors

</div>