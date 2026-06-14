import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay`
 * milliseconds have elapsed without `value` changing. Pending updates are
 * cancelled whenever `value` changes again before the delay completes.
 *
 * Useful for debouncing search inputs so a query is only sent after the user
 * stops typing, without requiring an explicit submit (Enter / button click).
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
