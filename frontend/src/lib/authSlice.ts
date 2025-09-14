import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Check if there's a token in localStorage on app load
const getInitialAuthState = (): AuthState => {
    const token = localStorage.getItem('accessToken');
    return {
        user: null,
        accessToken: token,
        isAuthenticated: Boolean(token),
        isLoading: Boolean(token), // If there's a token, we'll need to verify it
    };
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
            console.log('[AUTH SLICE] Setting credentials for user:', action.payload.user.email);
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            state.isLoading = false;
            localStorage.setItem('accessToken', action.payload.accessToken);
        },
        clearCredentials: (state) => {
            console.log('[AUTH SLICE] Clearing credentials');
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            localStorage.removeItem('accessToken');
            // Also remove any other auth-related localStorage items
            localStorage.removeItem('refreshToken');
        },
        updateUser: (state, action: PayloadAction<User>) => {
            console.log('[AUTH SLICE] Updating user data:', action.payload.email);
            state.user = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        initializeAuth: (state, action: PayloadAction<User>) => {
            console.log('[AUTH SLICE] Initializing auth with user:', action.payload.email);
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
        },
    },
});

export const { setCredentials, clearCredentials, updateUser, setLoading, initializeAuth } = authSlice.actions;
export default authSlice.reducer;