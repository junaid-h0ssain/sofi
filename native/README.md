# SoFi native — Flutter client (Android · iOS · Windows · Linux)

Flutter app consuming the split backend directly:

- **Auth** (`auth/`, better-auth on `http://localhost:4000`): sign-up/sign-in
  return the session token in the JSON body; it is stored in secure storage
  (DPAPI / Keychain / libsecret) and sent as `Authorization: Bearer`.
- **API** (`backend/src/SoFi.Api`, on `http://localhost:5080`): REST `/api/v1`
  for catalog, cart, checkout, orders and admin.

## Architecture

Layered (UI → ViewModels → Repositories → Services), per feature:

```text
lib/
├── core/                  # config, theme, money formatting, ApiError, shared widgets
├── data/
│   ├── models/            # DTOs mirroring Contracts/Dtos.cs (camelCase JSON)
│   ├── services/          # ApiClient (Bearer + error mapping), AuthService, SessionStore
│   └── repositories/      # catalog / cart / order / admin (single source of truth)
├── ui/
│   ├── app_shell.dart     # ADAPTIVE: NavigationBar <600px, NavigationRail ≥600px
│   └── features/          # auth / catalog / cart / orders / admin
│       ├── view_models/   # Riverpod Notifiers + FutureProviders
│       └── views/
└── di.dart                # Riverpod wiring of config → http → api client → repos
```

State management is `flutter_riverpod` (v3). Admin visibility works by probing
`GET /api/v1/admin/products/stats`: 200 → admin UI shown, 403 → hidden.

## Run

1. Start auth + API (and optionally the web app for product images):

   ```sh
   docker compose up          # or the three terminals from the root README
   ```

2. Launch the app:

   ```sh
   cd native
   flutter run -d linux                    # or windows / macos
   flutter run -d <emulator-id>            # Android emulator uses 10.0.2.2 automatically
   ```

### Base URLs

Defaults work for emulators/simulators/desktop against local services:

| Target | API (:5080) | Auth (:4000) | Images (:5173) |
| --- | --- | --- | --- |
| Windows / Linux / iOS sim | `localhost` | `localhost` | `localhost` |
| Android emulator | `10.0.2.2` | `10.0.2.2` | `10.0.2.2` |
| Physical device | LAN IP via dart-define | | |

Override any of them without editing code:

```sh
flutter run \
  --dart-define=API_BASE_URL=http://192.168.1.20:5080 \
  --dart-define=AUTH_BASE_URL=http://192.168.1.20:4000 \
  --dart-define=ASSET_BASE_URL=http://192.168.1.20:5173
```

> Product images are SVGs served by the web origin (`static/products/*.svg`);
> if the web app isn't running, cards fall back to category icons.

> Dev builds allow cleartext HTTP (Android `usesCleartextTraffic`,
> iOS `NSAllowsLocalNetworking`). Restrict these before a production release.

## Test

```sh
flutter analyze
flutter test
```
