# Due Bill — track what you owe at your local shops

A simple Expo (React Native) app for tracking running credit ("due") at shops
you frequent — tea stalls, coffee shops, corner stores, etc. All data is
stored locally on your device with AsyncStorage; nothing is sent anywhere.

## How it works

- **Add a shop** (tap the `+` button on the Shops screen) — e.g. "Rahim Tea
  Stall".
- Inside a shop, **add products with prices** once (e.g. Tea — ৳15,
  Coffee — ৳40). These become quick-add buttons.
- Every time you get something, **tap the product button** — the price is
  instantly added to your due for that shop, with a timestamp.
- **Make a payment** any time — enter a partial amount to reduce the due, or
  tap "Pay full amount" to clear it back to zero.
- The **History** tab shows every purchase and payment across all shops, plus
  your total spend this month.
- Long-press a shop to delete it, or long-press a product to remove it from
  the quick-add list.

## Setup

1. Install [Node.js](https://nodejs.org) (18+) if you don't have it.
2. Unzip this project and open a terminal in the folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npx expo start
   ```
5. Install the **Expo Go** app on your phone (App Store / Play Store), then
   scan the QR code shown in the terminal / browser tab. The app opens on
   your phone instantly — no build step needed.

   Alternatively, press `a` for an Android emulator or `i` for an iOS
   simulator if you have one set up, or `w` to run in a browser.

## Changing the currency symbol

Open `src/theme.js` and change the `CURRENCY` constant (defaults to `৳`).

## Project structure

```
App.js                        Root component, simple tab/screen switching
src/
  theme.js                    Colors, spacing, currency symbol
  storage.js                  All AsyncStorage read/write logic
  screens/
    ShopsScreen.js             List of shops + total due
    ShopDetailScreen.js        Quick-add buttons, payment, per-shop history
    HistoryScreen.js           All transactions across shops
  components/
    AddShopModal.js
    AddProductModal.js
    PaymentModal.js
    BottomNav.js
```

## Notes / ideas for later

- Data is per-device only (AsyncStorage). If you want it to sync across
  devices or survive an app reinstall, you'd need to add a backend or
  cloud backup later.
- Long-press actions currently ask for confirmation before deleting.
- If your shop list grows large, consider switching `storage.js` from
  AsyncStorage to SQLite (`expo-sqlite`) — the function signatures can stay
  the same, only the internals change.
