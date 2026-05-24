/** Firebase RTDB often returns arrays as `{ "0": item, "1": item }` — coerce back to arrays. */
export function asFirebaseArray<T>(value: T[] | Record<string, T> | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((key) => (value as Record<string, T>)[key])
      .filter((item): item is T => item != null);
  }
  return [];
}

/** Firebase RTDB rejects `undefined`; omit those keys recursively. */
export function sanitizeForFirebase<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirebase(item)) as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      out[key] = sanitizeForFirebase(val);
    }
  }
  return out as T;
}
