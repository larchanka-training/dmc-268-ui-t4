import { useEffect, useState } from "react";

/** `value`, once it has stopped changing for `delayMs`. */
export function useDebouncedValue<TValue>(value: TValue, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
