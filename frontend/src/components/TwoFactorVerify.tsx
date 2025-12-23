/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Two-Factor Authentication Verification Component
 * Used during login when 2FA is enabled
 */

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://crportal-nu.vercel.app/api';

interface TwoFactorVerifyProps {
    email: string;
    onSuccess: (data: { user: any; accessToken: string; refreshToken: string }) => void;
    onCancel: () => void;
}

export function TwoFactorVerify({ email, onSuccess, onCancel }: TwoFactorVerifyProps) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [backupCode, setBackupCode] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleCodeChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        
        // Handle paste
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split('');
            for (let i = 0; i < pastedCode.length; i++) {
                if (i + index < 6) {
                    newCode[i + index] = pastedCode[i];
                }
            }
            setCode(newCode);
            // Focus last filled input or next empty
            const nextIndex = Math.min(index + pastedCode.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        newCode[index] = value;
        setCode(newCode);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = useBackupCode ? backupCode : code.join('');

        if (!useBackupCode && token.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        if (useBackupCode && !backupCode) {
            toast.error('Please enter your backup code');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/2fa/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    token,
                    isBackupCode: useBackupCode,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Verification successful!');
                onSuccess(data.data);
            } else {
                toast.error(data.message || 'Invalid code');
                // Clear code on error
                if (!useBackupCode) {
                    setCode(['', '', '', '', '', '']);
                    inputRefs.current[0]?.focus();
                }
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/80">
            <CardHeader className="space-y-2 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-gray-600">
                    {useBackupCode
                        ? 'Enter one of your backup codes'
                        : 'Enter the 6-digit code from your authenticator app'}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {useBackupCode ? (
                        <div className="space-y-2">
                            <Input
                                type="text"
                                value={backupCode}
                                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                                placeholder="Enter backup code"
                                className="h-12 text-center text-lg font-mono tracking-wider"
                                maxLength={8}
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center gap-2">
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold"
                                />
                            ))}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            'Verify'
                        )}
                    </Button>

                    <div className="flex flex-col gap-2 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setBackupCode('');
                                setCode(['', '', '', '', '', '']);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            {useBackupCode ? 'Use authenticator code' : 'Use a backup code'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                        >
                            ← Back to login
                        </button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default TwoFactorVerify;
