# Who owns what

Two frontends were merged into this repo. This is the map, so we can each
work without stepping on the other.

## Praveen's — not modified

| File | Screen |
|---|---|
| `src/auth/Login.jsx` | sign in, routed at `/login` |
| `src/auth/Register.jsx` | sign up, routed at `/register` |
| `src/auth/Home.jsx` | original landing page |
| `src/auth/InvestorDashboard.jsx` | original workspace hub |
| `src/auth/Navbar.jsx`, `Stocks.jsx`, `UserWatchList.jsx`, `StockDetail.jsx`, `Asset.jsx`, `User.jsx`, `ProtectedRoute.jsx` | earlier screens |
| `src/lists/*` | the ticker lists |
| `src/index.css` **lines 1–597** | the whole visual design |

`Login.jsx`, `Register.jsx` and `ProtectedRoute.jsx` are live. The others are
kept in place; the routes below use the versions under `src/pages`.

## Bao's — new files

| Folder | What |
|---|---|
| `src/pages/` | dashboard, watchlist, stock detail, alerts, profile, portfolio, compare, plus ports of the landing and hub |
| `src/components/ui/` | navbar, sidebar, layout, asset row, metric card, theme toggle, tutorial, chat panel |
| `src/components/charts/` | price, sentiment and comparison charts (recharts) |
| `src/data/` | the data layer — `index.js` picks mock or the real backend |
| `src/lib/` | form validation |
| `src/index.css` **lines 598+** | styles for the screens above |

## Shared — edited, worth reading before changing

| File | What changed |
|---|---|
| `src/App.jsx` | routes for both sets of pages |
| `src/api/AuthContext.jsx` | restores the session on reload, drops expired tokens |
| `src/api/privateAPI.js` | shares one refresh between concurrent 401s, signs out when it fails |
| `src/api/publicAPI.js` | backend address reads from `VITE_API_URL` |
| `src/index.css` | Bao's half appended below a marked divider |
| `package.json` | added `recharts` |

## Routes

| Path | Page | Owner |
|---|---|---|
| `/` | landing | Praveen's design |
| `/login`, `/register` | sign in, sign up | Praveen |
| `/home` | workspace hub | Praveen's layout, live data |
| `/InvestorDashboard` | 30 assets with prices | Bao |
| `/UserWatchList` | watchlist | Bao |
| `/stock/:symbol` | asset detail | Bao |
| `/alerts`, `/profile`, `/portfolio`, `/compare` | | Bao |
| `/dashboard`, `/Login` | redirects | kept so Praveen's files work unedited |

## Two things to know before editing CSS

Praveen's half styles bare elements — `nav`, `form`, `input`, `button`,
`label`, `h1`, `p`, `ul`, `li`. Those rules would otherwise reach every screen,
so the block at the start of Bao's half puts the defaults back inside
`.layout` and `.entry-page`. It uses `:where()`, which adds no weight, so a
plain class like `.btn` still wins.

Adding a bare-element rule to the top half now affects both halves. Prefer a
class.

## Running it

```
npm install
npm run dev
```

`VITE_USE_MOCK=true` in `.env.local` runs everything on sample data, so the
screens work with the backend switched off. Set it to `false` to use the real
backend on `:8081` — note that sign in always calls the backend, since
`Login.jsx` talks to it directly.
