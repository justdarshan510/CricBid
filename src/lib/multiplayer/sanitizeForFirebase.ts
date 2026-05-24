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
