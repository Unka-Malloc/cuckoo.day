# cuckoo.day

Static product site for Cuckoo / 晨昏报, served by GitHub Pages from this repository (see `.github/workflows/site.yml`). Plain HTML and CSS with system fonts; no build step, no analytics, no cookies, no third-party requests.

## Pages

- `/` product page in English and `/zh/` in Simplified Chinese (a Chinese browser is sent to `/zh/` unless the visitor chose English); eleven full-screen newspaper spreads styled by `assets/home.css` and `assets/home.js`
- `/privacy/` privacy summary — also the App Store privacy policy URL
- `/support/` getting started and support — also the App Store support URL
- `/404.html`

Each spread is a fixed artboard scaled to cover the window, so nothing collides at any size. The pages follow light/dark appearance and honour Reduce Motion. On a festival day the masthead carries that festival's illustration — Chinese festivals on `/zh/`, Western holidays on `/` — and the seasons spread follows the real calendar (dates in `assets/calendar.js`, from the Hong Kong Observatory tables, through 2030).

## Before launch

Edit `assets/config.js`:

- `macDownload` — the published Mac installer (the GitHub Release `.dmg` asset). When set, the home page CTA becomes "Download for Mac".
- `appStore.mac` and `appStore.ios` — App Store product URLs, for the subpages.
- `contactEmail` — shown on the privacy and support pages when set.

The app repository maintains the full release privacy draft; `/privacy/` describes the current local-first product and selected-provider processing. Public support: support@cuckoo.day.

## Releases

Each published Mac release is a GitHub Release `v<version>` in this repository carrying the signed, notarized `Cuckoo-<version>.dmg` installer and the Sparkle `appcast.xml`; installed apps read the latest release's `appcast.xml`. This repository never carries application source. The download link changes only after its installer is downloadable:

1. Tag the current published `main` here as `v<version>` and push the tag.
2. Create the GitHub Release for that tag as a draft, upload the `.dmg` and `appcast.xml`, publish it as the latest release, and confirm both asset URLs download.
3. In one commit, add `release/v<version>.md` (artifact SHA-256s and verifiable signing properties) and point `macDownload` at the new `.dmg`, then push it.
4. If a release is not created or is withdrawn, point `macDownload` back at the last published installer in the same commit that adds the manifest's dated status; with no published installer, empty it, which shows the App Store placeholder instead of a download.

Manifests are never deleted: a manifest whose release did not happen, was superseded or was withdrawn keeps its hashes and gains a dated status line at the top.

## DNS

`CNAME` contains `cuckoo.day`. In the domain's DNS, point the apex at GitHub Pages (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, and AAAA 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153), optionally `www` as a CNAME to `unka-malloc.github.io`, then enable "Enforce HTTPS" in the repository's Pages settings with source "GitHub Actions".

## Images

`assets/img/app/` holds crops of the app's own offscreen renders (`scripts/check-report-visuals.sh --site-hero` in the app repository) with synthetic data, in `zh`/`en` and light/dark. `assets/img/bookstall.webp` and `aircraft-wing.webp` are Unsplash License photographs; credits are in `assets/img/CREDITS.md` and on the About spread. `assets/og-image.png` is produced by the app repository's `scripts/compose-social-images.py --website <website-checkout>`. `favicon.png`, `apple-touch-icon.png` and `assets/brand/icon-512.png` are resized exports of the approved app icon (`scripts/build-app-icon.py` in the app repository; press render at `dist/marketing/press/icon-1024.png`).
