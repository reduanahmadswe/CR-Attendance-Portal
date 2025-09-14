import { useCallback, useState } from 'react';

export interface LoadingState {
    [key: string]: boolean;
}

export interface LoadingActions {
    setLoading: (key: string, loading: boolean) => void;
    startLoading: (key: string) => void;
    stopLoading: (key: string) => void;
    isLoading: (key: string) => boolean;
    clearAll: () => void;
}

export const useLoadingState = (initialState: LoadingState = {}) => {
    const [loadingState, setLoadingState] = useState<LoadingState>(initialState);

    const setLoading = useCallback((key: string, loading: boolean) => {
        setLoadingState(prev => ({
            ...prev,
            [key]: loading,
        }));
    }, []);

    const startLoading = useCallback((key: string) => {
        setLoading(key, true);
    }, [setLoading]);

    const stopLoading = useCallback((key: string) => {
        setLoading(key, false);
    }, [setLoading]);

    const isLoading = useCallback((key: string) => {
        return Boolean(loadingState[key]);
    }, [loadingState]);

    const clearAll = useCallback(() => {
        setLoadingState({});
    }, []);

    const actions: LoadingActions = {
        setLoading,
        startLoading,
        stopLoading,
        isLoading,
        clearAll,
    };

    return {
        loadingState,
        ...actions,
    };
};