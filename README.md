# @azari/mobile-core

Shared code for the Azari Solar Android and iOS apps: screens, navigation,
services, validation and request integrity. The apps are standalone native
clients (no WebView) that read and write the same azari-service API as
https://azari.solar.

The app shells ([android-azari-solar](https://github.com/stephenabv/android-azari-solar),
[ios-azari-solar](https://github.com/stephenabv/ios-azari-solar)) render
`<AzariApp config adapter />` and supply only platform specifics through a
`PlatformAdapter` (integrity attestation, device security, file picker).

## Features (parity with the website)

| Area | Screens | API |
|---|---|---|
| Home | Hero, metrics, partners, benefits, excellence, tropics, process, testimonials, savings calculator, call to action. Each section follows the admin `section-visibility` switch. | `GET /api/content` |
| Packages | Single / Three Phase, inverter brand filter (brands come from live data, logos and order from `inverter-brands` content), customise-your-system steppers with live pricing, details, paging, inquiry form | `GET /api/packages`, `POST /api/packages/inquiries` |
| Calculator | Property class, zero bill / monthly savings / peak shaving sizing, load profile editor, bill upload, proposal request, matching packages | `POST /api/quotation/request-proposal` (multipart) |
| Projects | Category filters, project detail, gallery with pinch-zoom viewer, video links | `GET /api/projects`, `GET /api/projects/:id` |
| Client journey | Step list with admin block renderer | `GET /api/client-journey` |
| Talk to an expert | Contact form with location search | `POST /api/talk/send` |
| Legal | Privacy policy, terms | site content |

Website URLs (`/packages?brand=…`, `/projects/:id`, `/solar-calculator`,
`/client-journey`, `/privacy-policy`, `/terms-and-conditions`) open the
matching screen through verified App Links / Universal Links.

## Design

- **Data driven.** Home sections, journey blocks, project filters, inverter
  brands, sizing strategies and form rules are registries or derived from API
  data, so most content changes need no app release.
- **Typed boundaries.** Every API response is validated with zod; failures are
  typed `ApiError` subclasses with customer-safe messages.
- **Responsive.** Material window size classes (600 / 840 dp): one column on
  phones, grids on tablets, a navigation rail and side panels on wide screens.
- **Offline tolerant.** Public catalog responses are cached (MMKV) and served
  when the network fails.

## Security

- Mutating requests are signed with Play Integrity (Android) or App Attest
  (iOS) over `azari-integrity-v1\n<challenge>\n<METHOD>\n<path>\n<sha256(body)>`,
  matching `azari-backend/src/services/integrity/protocol.ts`. Challenges are
  single use; expired challenges and unknown iOS keys are retried once.
- HTTPS only (cleartext allowed solely for loopback in development builds),
  `credentials: 'omit'`, request paths allow-listed, timeouts on every call.
- Secrets live in the Keychain / Android Keystore; nothing sensitive in MMKV.
- Screens with personal details block screenshots and recording.
- Admin-edited links open only `https:`, `mailto:` and `tel:`; rich text is
  parsed into native text, never rendered in a WebView.
- Builds below the server's minimum version are blocked; rooted or hooked
  devices get a warning (the server rejects their submissions).

## Development

```bash
npm install
npm run verify      # typecheck + lint + jest
```

Releases are git tags (`v0.1.0`, …). Shells depend on a tag:
`"@azari/mobile-core": "git+ssh://git@github.com/stephenabv/azari-mobile-core.git#v0.1.0"`.
