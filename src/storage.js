import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SHOPS: '@due_bill_shops',
  PRODUCTS: '@due_bill_products',
  TRANSACTIONS: '@due_bill_transactions',
  SETTINGS: '@due_bill_settings',
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const MAX_PINNED = 3;



// ---------------- Shops ----------------
export async function getShops() {
  const raw = await AsyncStorage.getItem(KEYS.SHOPS);
  return raw ? JSON.parse(raw) : [];
}

async function saveShops(shops) {
  await AsyncStorage.setItem(KEYS.SHOPS, JSON.stringify(shops));
}

export async function addShop(name) {
  const shops = await getShops();
  const newShop = { id: generateId(), name: name.trim(), createdAt: Date.now() };
  await saveShops([...shops, newShop]);
  return newShop;
}

export async function updateShopLimit(shopId, warningLimit) {
  const shops = await getShops();

  const updatedShops = shops.map((shop) => {
    if (shop.id !== shopId) return shop;

    return {
      ...shop,
      warningLimit:
        warningLimit === null || warningLimit === ''
          ? null
          : parseFloat(warningLimit),
    };
  });

  await saveShops(updatedShops);

  return updatedShops.find((shop) => shop.id === shopId);
}

// Call this whenever a purchase/payment is recorded for a shop —
// used to sort "last used" shops to the top of the list.
export async function touchShopLastUsed(shopId) {
  const shops = await getShops();
  const updated = shops.map((s) => (s.id === shopId ? { ...s, lastUsedAt: Date.now() } : s));
  await saveShops(updated);
}

// Pins/unpins a shop. Max 3 pinned at once.
// Returns { success: true } or { success: false, reason: 'limit' | 'not_found' }
export async function toggleShopPin(shopId) {
  const shops = await getShops();
  const target = shops.find((s) => s.id === shopId);
  if (!target) return { success: false, reason: 'not_found' };

  if (!target.pinned) {
    const pinnedCount = shops.filter((s) => s.pinned).length;
    if (pinnedCount >= MAX_PINNED) {
      return { success: false, reason: 'limit' };
    }
  }

  const updated = shops.map((s) =>
    s.id === shopId ? { ...s, pinned: !s.pinned, pinnedAt: !s.pinned ? Date.now() : null } : s
  );
  await saveShops(updated);
  return { success: true };
}

export async function deleteShop(shopId) {
  const shops = await getShops();
  await saveShops(shops.filter((s) => s.id !== shopId));

  const products = await getProducts();
  await saveProducts(products.filter((p) => p.shopId !== shopId));

  const transactions = await getTransactions();
  await saveTransactions(transactions.filter((t) => t.shopId !== shopId));
}

// ---------------- Products ----------------
export async function getProducts() {
  const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
  return raw ? JSON.parse(raw) : [];
}

async function saveProducts(products) {
  await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
}

export async function addProduct(shopId, name, price) {
  const products = await getProducts();
  const newProduct = { id: generateId(), shopId, name: name.trim(), price: parseFloat(price) };
  await saveProducts([...products, newProduct]);
  return newProduct;
}

export async function deleteProduct(productId) {
  const products = await getProducts();
  await saveProducts(products.filter((p) => p.id !== productId));
}

export async function getProductsByShop(shopId) {
  const products = await getProducts();
  return products.filter((p) => p.shopId === shopId);
}

// ---------------- Transactions ----------------
export async function getTransactions() {
  const raw = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
  return raw ? JSON.parse(raw) : [];
}

async function saveTransactions(transactions) {
  await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

// type: 'purchase' | 'payment'
export async function addTransaction({ shopId, type, amount, productName, note }) {
  const transactions = await getTransactions();
  const newTx = {
    id: generateId(),
    shopId,
    type,
    amount: parseFloat(amount),
    productName: productName || null,
    note: note || null,
    timestamp: Date.now(),
  };
  await saveTransactions([...transactions, newTx]);
  return newTx;
}

export async function getTransactionsByShop(shopId) {
  const transactions = await getTransactions();
  return transactions.filter((t) => t.shopId === shopId).sort((a, b) => b.timestamp - a.timestamp);
}


export function computeDue(transactions) {
  return transactions.reduce((sum, t) => (t.type === 'purchase' ? sum + t.amount : sum - t.amount), 0);
}
export async function deleteTransaction(transactionId) {
  const transactions = await getTransactions();
  await saveTransactions(transactions.filter((t) => t.id !== transactionId));
}
export async function getDuesByShop() {
  const transactions = await getTransactions();
  const map = {};
  transactions.forEach((t) => {
    if (!map[t.shopId]) map[t.shopId] = 0;
    map[t.shopId] += t.type === 'purchase' ? t.amount : -t.amount;
  });
  return map;
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts) {
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(ts) {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Spend (purchases only) across common time windows, for the home screen stats.
export async function getExpenseStats() {
  const transactions = await getTransactions();
  const purchases = transactions.filter((t) => t.type === 'purchase');
  const now = Date.now();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const sum = (filterFn) => purchases.filter(filterFn).reduce((s, t) => s + t.amount, 0);

  return {
    today: sum((t) => t.timestamp >= todayStart),
    yesterday: sum((t) => t.timestamp >= yesterdayStart && t.timestamp < todayStart),
    last7Days: sum((t) => t.timestamp >= sevenDaysAgo),
    last30Days: sum((t) => t.timestamp >= thirtyDaysAgo),
    thisWeek: sum((t) => t.timestamp >= weekStart),
    thisMonth: sum((t) => t.timestamp >= monthStart),
  };
}

export async function clearAllData() {
  await AsyncStorage.multiRemove([
    KEYS.SHOPS,
    KEYS.PRODUCTS,
    KEYS.TRANSACTIONS,
    KEYS.SETTINGS,
  ]);
}



// added 

// Default settings for the app. These will be used if no settings are saved in AsyncStorage.
// ---------------- Settings ----------------

const DEFAULT_SETTINGS = {
  defaultWarningLimit: null,
  theme: 'dark',
  currency: '\u09f3',

  appLock: {
    enabled: false,
    pin: null,
    question: null,
    answer: null,
  },
};

export async function getSettings() {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);

  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const saved = JSON.parse(raw);

    return {
      ...DEFAULT_SETTINGS,
      ...saved,

      // Make sure old app-lock data remains compatible
      appLock: {
        ...DEFAULT_SETTINGS.appLock,
        ...(saved.appLock || {}),
      },
    };
  } catch (error) {
    console.warn('Failed to parse settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  const currentSettings = await getSettings();

  const updatedSettings = {
    ...currentSettings,
    ...settings,
  };

  await AsyncStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify(updatedSettings)
  );

  return updatedSettings;
}

export async function setTheme(theme) {
  return saveSettings({ theme });
}

export async function setCurrency(currency) {
  return saveSettings({ currency });
}


// ---------------- App Lock ----------------

export async function setAppLockPin(pin, question, answer) {
  const cleanPin = String(pin).trim();
  const cleanQuestion = String(question).trim();
  const cleanAnswer = String(answer).trim().toLowerCase();

  return saveSettings({
    appLock: {
      enabled: true,
      pin: cleanPin,
      question: cleanQuestion,
      answer: cleanAnswer,
    },
  });
}

export async function disableAppLock() {
  return saveSettings({
    appLock: {
      enabled: false,
      pin: null,
      question: null,
      answer: null,
    },
  });
}

export async function verifyAppLockPin(pin) {
  const settings = await getSettings();

  return (
    !!settings.appLock?.enabled &&
    settings.appLock?.pin === String(pin).trim()
  );
}

export async function getAppLockRecoveryQuestion() {
  const settings = await getSettings();

  if (!settings.appLock?.enabled) {
    return null;
  }

  return settings.appLock?.question || null;
}

export async function verifyAppLockAnswer(answer) {
  const settings = await getSettings();

  if (!settings.appLock?.enabled) {
    return false;
  }

  const savedAnswer = String(
    settings.appLock?.answer || ''
  )
    .trim()
    .toLowerCase();

  const enteredAnswer = String(answer || '')
    .trim()
    .toLowerCase();

  return savedAnswer !== '' && savedAnswer === enteredAnswer;
}

export async function resetAppLockPin(newPin) {
  const settings = await getSettings();

  if (!settings.appLock?.enabled) {
    return false;
  }

  const cleanPin = String(newPin).trim();

  if (!cleanPin) {
    return false;
  }

  await saveSettings({
    appLock: {
      ...settings.appLock,
      pin: cleanPin,
    },
  });

  return true;
}