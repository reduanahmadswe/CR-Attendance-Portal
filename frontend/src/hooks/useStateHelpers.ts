import { useCallback, useEffect, useRef, useState } from 'react';

// Hook to cleanup state on unmount
export const useCleanup = (cleanupFn: () => void) => {
    const cleanupRef = useRef(cleanupFn);

    // Update cleanup function ref if it changes
    useEffect(() => {
        cleanupRef.current = cleanupFn;
    }, [cleanupFn]);

    // Run cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupRef.current();
        };
    }, []);
};

// Hook to prevent state updates on unmounted components
export const useIsMounted = () => {
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    return isMounted.current;
};

// Hook to safely set state only if component is mounted
export const useSafeState = <T>(initialState: T) => {
    const isMounted = useIsMounted();
    const [state, setState] = useState(initialState);

    const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
        if (isMounted) {
            setState(newState);
        }
    }, [isMounted]);

    return [state, safeSetState] as const;
};

// Hook to debounce state updates
export const useDebouncedState = <T>(initialValue: T, delay: number) => {
    const [value, setValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue, setValue] as const;
};

// Hook to persist state in localStorage
export const usePersistedState = <T>(key: string, initialValue: T) => {
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setPersistedState = useCallback((newState: T | ((prev: T) => T)) => {
        setState((prev: T) => {
            const value = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.warn('Failed to persist state to localStorage:', error);
            }
            return value;
        });
    }, [key]);

    return [state, setPersistedState] as const;
};