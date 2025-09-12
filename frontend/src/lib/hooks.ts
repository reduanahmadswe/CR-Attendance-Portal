import { useDispatch, useSelector } from 'react-redux';
import { useGetProfileQuery, useLoginMutation, useLogoutMutation } from './apiSlice';
import { clearCredentials, setCredentials } from './authSlice';
import type { RootState } from './simpleStore';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
    const [logoutMutation] = useLogoutMutation();

    // Skip the profile query if no token
    const { isLoading: isProfileLoading } = useGetProfileQuery(undefined, {
        skip: !accessToken,
    });

    const login = async (email: string, password: string) => {
        const result = await loginMutation({ email, password }).unwrap();
        if (result.success && result.data) {
            dispatch(setCredentials({
                user: result.data.user,
                accessToken: result.data.accessToken,
            }));
        }
        return result;
    };

    const logout = async () => {
        try {
            await logoutMutation().unwrap();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(clearCredentials());
        }
    };

    return {
        user,
        isAuthenticated,
        isLoading: isLoginLoading || isProfileLoading,
        login,
        logout,
    };
};