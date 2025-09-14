import { useCallback, useState } from 'react';

// Generic form state hook
export const useFormState = <T extends Record<string, unknown>>(initialState: T) => {
    const [state, setState] = useState<T>(initialState);

    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setState(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const updateFields = useCallback((updates: Partial<T>) => {
        setState(prev => ({
            ...prev,
            ...updates,
        }));
    }, []);

    const resetForm = useCallback(() => {
        setState(initialState);
    }, [initialState]);

    return {
        state,
        updateField,
        updateFields,
        resetForm,
        setState,
    };
};

// Modal state hook
export const useModalState = (initialOpen = false) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return {
        isOpen,
        open,
        close,
        toggle,
        setIsOpen,
    };
};

// Selection state hook
export const useSelectionState = <T>(initialSelected: T[] = []) => {
    const [selected, setSelected] = useState<T[]>(initialSelected);

    const select = useCallback((item: T) => {
        setSelected(prev => [...prev, item]);
    }, []);

    const deselect = useCallback((item: T) => {
        setSelected(prev => prev.filter(i => i !== item));
    }, []);

    const toggle = useCallback((item: T) => {
        setSelected(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    }, []);

    const clear = useCallback(() => {
        setSelected([]);
    }, []);

    const selectAll = useCallback((items: T[]) => {
        setSelected(items);
    }, []);

    const isSelected = useCallback((item: T) => {
        return selected.includes(item);
    }, [selected]);

    return {
        selected,
        select,
        deselect,
        toggle,
        clear,
        selectAll,
        isSelected,
        setSelected,
    };
};

// Pagination state hook
export const usePaginationState = (initialPage = 1, initialLimit = 10) => {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);

    const nextPage = useCallback(() => setPage(prev => prev + 1), []);
    const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), []);
    const goToPage = useCallback((pageNum: number) => setPage(Math.max(1, pageNum)), []);
    const reset = useCallback(() => setPage(initialPage), [initialPage]);

    return {
        page,
        limit,
        setPage,
        setLimit,
        nextPage,
        prevPage,
        goToPage,
        reset,
    };
};

// Filter state hook
export const useFilterState = <T extends Record<string, unknown>>(initialFilters: T) => {
    const [filters, setFilters] = useState<T>(initialFilters);

    const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const clearFilter = useCallback(<K extends keyof T>(key: K) => {
        setFilters(prev => ({
            ...prev,
            [key]: initialFilters[key],
        }));
    }, [initialFilters]);

    const clearAllFilters = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    return {
        filters,
        updateFilter,
        clearFilter,
        clearAllFilters,
        setFilters,
    };
};