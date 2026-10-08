# cuckoo.day

Static product site for Cuckoo / 晨昏报, served by GitHub Pages from this repository (see `.github/workflows/site.yml`). Plain HTML and CSS with system fonts; no build step, no analytics, no cookies, no third-party requests.

## Pages

- `/` product page (English and Simplified Chinese; follows the browser language, with a toggle)
- `/privacy/` privacy summary — also the App Store privacy policy URL
- `/support/` getting started and support — also the App Store support URL
- `/404.html`

The page follows light/dark appearance and switches to the evening palette between 18:00 and 06:00 local time; the masthead day rule shows the visitor's current time.

## Before launch

Edit `assets/config.js`:

- `appStore.mac` and `appStore.ios` — App Store product URLs. Until set, the page shows "Coming soon to the App Store" and no download buttons.
- `contactEmail` — shown on the privacy and support pages when set.

The app repository maintains the full release privacy draft; `/privacy/` describes the current local-first product and selected-provider processing. Public support: support@cuckoo.day.

## DNS

`CNAME` contains `cuckoo.day`. In the domain's DNS, point the apex at GitHub Pages (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, and AAAA 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153), optionally `www` as a CNAME to `unka-malloc.github.io`, then enable "Enforce HTTPS" in the repository's Pages settings with source "GitHub Actions".

## Images

Screenshots in `assets/shots/` come from the synthetic captures in the private app repository. `assets/og-image.png` is produced by the app repository’s `scripts/compose-social-images.py --website <website-checkout>`. Regenerate them together when the app's appearance changes.
