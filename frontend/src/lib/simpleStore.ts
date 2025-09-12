// Redux store setup
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import type { User } from '../types';
import { apiSlice } from './apiSlice';

// Simple auth state without slice for now
const initialAuthState = {
    user: null as User | null,
    accessToken: localStorage.getItem('accessToken'),
    isAuthenticated: false,
};

interface AuthAction {
    type: string;
    payload?: {
        user: User;
        accessToken: string;
    };
}

const authReducer = (state = initialAuthState, action: AuthAction) => {
    switch (action.type) {
        case 'auth/setCredentials':
            if (action.payload) {
                localStorage.setItem('accessToken', action.payload.accessToken);
                return {
                    ...state,
                    user: action.payload.user,
                    accessToken: action.payload.accessToken,
                    isAuthenticated: true,
                };
            }
            return state;
        case 'auth/clearCredentials':
            console.log('[STORE] Clearing credentials - removing accessToken from localStorage');
            localStorage.removeItem('accessToken');
            console.log('[STORE] Credentials cleared, setting user to null');
            return {
                ...state,
                user: null,
                accessToken: null,
                isAuthenticated: false,
            };
        default:
            return state;
    }
};

export const store = configureStore({
    reducer: {
        api: apiSlice.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Action creators
export const setCredentials = (payload: { user: User; accessToken: string }) => ({
    type: 'auth/setCredentials',
    payload,
});

export const clearCredentials = () => ({
    type: 'auth/clearCredentials',
});