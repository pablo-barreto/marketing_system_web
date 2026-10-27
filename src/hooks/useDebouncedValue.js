import { useEffect, useState } from 'react';

// Devuelve `value` cuando deja de cambiar durante `delay` ms (para no consultar la API por cada tecla)
export function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}
