// Shared logic for per-shop / default due warning limits.

export function resolveWarningLimit(shop, settings) {
  if (shop && shop.warningLimit !== null && shop.warningLimit !== undefined) {
    return shop.warningLimit;
  }
  return settings && settings.defaultWarningLimit != null ? settings.defaultWarningLimit : null;
}

// 'normal' | 'warning' | 'danger'
export function getDueLevel(due, limit) {
  if (!limit || limit <= 0) return 'normal';
  if (due >= limit) return 'danger';
  if (due >= limit * 0.9) return 'warning';
  return 'normal';
}

// Returns the new level ('warning' | 'danger') only the moment it's freshly
// crossed, so we don't re-notify on every single purchase after that.
export function checkThresholdCrossed(prevDue, newDue, limit) {
  const prevLevel = getDueLevel(prevDue, limit);
  const newLevel = getDueLevel(newDue, limit);
  if (newLevel === 'normal') return null;
  if (newLevel !== prevLevel) return newLevel;
  return null;
}