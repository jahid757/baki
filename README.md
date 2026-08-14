# Baki 🧾

**Baki** is a simple, private, offline-first mobile app for tracking what you owe at your local shops — tea stalls, grocery stores, coffee shops, anywhere you run a tab. Built with React Native (Expo), with all data stored locally on-device.

This repo contains both the **mobile app** and its **marketing landing page**.


---

## ✨ Features

- 🏪 **Multiple shops** — track dues separately for every shop you visit
- ⚡ **One-tap purchases** — save your usual items (tea, coffee, groceries) as quick-add buttons with preset prices
- 💳 **Flexible payments** — pay in full or make partial payments to reduce a due
- 🔔 **Due limit alerts** — set a warning limit per shop (or a global default) and get a local notification when you're close to or over it
- 📝 **Notes on transactions** — attach a note to any entry, e.g. "borrowed for a friend"
- 🔍 **Search** — quickly find a shop or a past transaction across your whole history
- 📊 **Spending overview** — see total dues, and how much you've spent this week/month
- 🔒 **Fully private** — no account, no server, no internet required. All data lives in `AsyncStorage` on your device.

---

## 📱 Tech stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) (React Native) |
| Local storage | `@react-native-async-storage/async-storage` |
| Notifications | `expo-notifications` (local, on-device only) |
| Icons | `@expo/vector-icons` |
| Build/distribution | [EAS Build](https://docs.expo.dev/build/introduction/) (APK) |

No backend, no database server, no API keys required.

---

## 📂 Repo structure

```
.
├── due-bill-app/              # The Expo/React Native app
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   ├── src/
│   │   ├── storage.js         # AsyncStorage read/write logic
│   │   ├── notifications.js   # Local due-limit alert notifications
│   │   ├── dueAlerts.js       # Warning-limit threshold logic
│   │   ├── theme.js           # Colors, spacing, currency symbol
│   │   ├── screens/           # Shops, ShopDetail, History screens
│   │   └── components/        # Modals, BottomNav, etc.
│   └── assets/                # icon.png, adaptive-icon.png, splash-icon.png
│
├── landing-page/
│   └── due-bill-landing.html  # Self-contained marketing landing page
│
├── assets/
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── favicon.png
│   └── marketing-banner.png
│
└── README.md
```

> Adjust the tree above if your local folder layout differs — the important part is that `due-bill-app/` is a standalone Expo project.

---

## 🚀 Running the app locally

```bash
cd due-bill-app
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (Android/iOS) to run it on your phone instantly — no build step needed for development.

---

## 📦 Building an installable APK

This project uses **EAS Build** to produce a standalone Android APK (no Play Store needed for sideloading):

```bash
npm install -g eas-cli
eas login
cd due-bill-app
eas build:configure
```

Make sure your `eas.json` requests an APK for the preview profile:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

Then build:

```bash
eas build -p android --profile preview
```

When the build finishes, download the `.apk` from the link EAS prints (or from your [expo.dev](https://expo.dev) dashboard) and install it on your device.

---

## 🌐 Landing page

## <b>[Landing Page](https://jahid757.github.io/baki-apk)</b> is a single, self-contained HTML file (no build step, no dependencies) — the banner image is embedded as base64, so you can host it anywhere: GitHub Pages, Netlify, Vercel, or any static file host.

Before publishing, update the download button links inside the file:

```html
<a class="btn-download" href="Baki.apk" download="baki.apk">
```

Replace `Baki.apk` with a permanent link to your built APK — e.g. a GitHub Release asset URL.

### Deploying to GitHub Pages

```bash
# from the repo root
git add landing-page/due-bill-landing.html
git commit -m "Add landing page"
git push
```

Then in **Settings → Pages**, set the source to the branch/folder containing `index.html` (or rename it to `index.html` in a `docs/` folder for the simplest setup).

---

## 🗺️ Roadmap ideas

- [ ] Backup & restore (export/import all data as a file)
- [ ] App lock (PIN/biometric)
- [ ] Spending categories across shops
- [ ] Light theme toggle
- [ ] Multi-currency support

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Made for shopkeepers &amp; shoppers who are tired of forgetting who owes what. 🫖</p>