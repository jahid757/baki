import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SHOPS: '@due_bill_shops',
  PRODUCTS: '@due_bill_products',
  TRANSACTIONS: '@due_bill_transactions',
  SETTINGS: '@due_bill_settings',
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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

const DEFAULT_SETTINGS = {
  defaultWarningLimit: null,
};

export async function getSettings() {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);

  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
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