import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface ErrorState {
    error: string | null;
    isError: boolean;
}

export interface ErrorActions {
    setError: (error: string | null) => void;
    clearError: () => void;
    handleError: (error: unknown, message?: string) => void;
    handleApiError: (error: unknown, defaultMessage?: string) => void;
}

export const useErrorHandler = () => {
    const [errorState, setErrorState] = useState<ErrorState>({
        error: null,
        isError: false,
    });

    const setError = useCallback((error: string | null) => {
        setErrorState({
            error,
            isError: Boolean(error),
        });
    }, []);

    const clearError = useCallback(() => {
        setErrorState({
            error: null,
            isError: false,
        });
    }, []);

    const handleError = useCallback((error: unknown, message?: string) => {
        console.error('Error occurred:', error);

        let errorMessage = message || 'An unexpected error occurred';

        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        setError(errorMessage);
        toast.error(errorMessage);
    }, [setError]);

    const handleApiError = useCallback((error: unknown, defaultMessage = 'API request failed') => {
        console.error('API Error:', error);

        let errorMessage = defaultMessage;

        // Handle RTK Query errors
        if (error && typeof error === 'object' && 'data' in error) {
            const apiError = error as { data?: { message?: string }; error?: string; message?: string; status?: number };
            if (apiError.data?.message) {
                errorMessage = apiError.data.message;
            } else if (apiError.error) {
                errorMessage = apiError.error;
            } else if (apiError.message) {
                errorMessage = apiError.message;
            } else if (apiError.status) {
                switch (apiError.status) {
                    case 400:
                        errorMessage = 'Bad request. Please check your input.';
                        break;
                    case 401:
                        errorMessage = 'Unauthorized. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'Access denied. You do not have permission.';
                        break;
                    case 404:
                        errorMessage = 'Resource not found.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    default:
                        errorMessage = `Request failed with status ${apiError.status}`;
                }
            }
        }

        setError(errorMessage);
        toast.error(errorMessage);
    }, [setError]);

    const actions: ErrorActions = {
        setError,
        clearError,
        handleError,
        handleApiError,
    };

    return {
        ...errorState,
        ...actions,
    };
};