/**
 * Two-Factor Authentication Setup Component
 * Allows users to enable 2FA on their account
 */

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://crportal-nu.vercel.app/api';

interface TwoFactorSetupProps {
    accessToken: string;
    onComplete: () => void;
    onCancel: () => void;
}

interface SetupData {
    secret: string;
    qrCode: string;
    backupCodes: string[];
    otpauthUrl: string;
}

export function TwoFactorSetup({ accessToken, onComplete, onCancel }: TwoFactorSetupProps) {
    const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [showBackupDialog, setShowBackupDialog] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Fetch setup data
    const initSetup = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/2fa/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setSetupData(data.data);
                setStep('verify');
            } else {
                toast.error(data.message || 'Failed to setup 2FA');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split('');
            for (let i = 0; i < pastedCode.length; i++) {
                if (i + index < 6) {
                    newCode[i + index] = pastedCode[i];
                }
            }
            setCode(newCode);
            const nextIndex = Math.min(index + pastedCode.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyAndEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const token = code.join('');
        if (token.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('2FA enabled successfully!');
                setStep('backup');
                setShowBackupDialog(true);
            } else {
                toast.error(data.message || 'Invalid code. Please try again.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyBackupCodes = () => {
        if (setupData?.backupCodes) {
            navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
            toast.success('Backup codes copied to clipboard!');
        }
    };

    const downloadBackupCodes = () => {
        if (setupData?.backupCodes) {
            const content = `CR Attendance Portal - 2FA Backup Codes\n${'='.repeat(45)}\n\nKeep these codes safe! Each code can only be used once.\n\n${setupData.backupCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cr-portal-backup-codes.txt';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Backup codes downloaded!');
        }
    };

    // Initial setup step
    if (step === 'setup') {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
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
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold">Enable Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account by enabling 2FA.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">What you'll need:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                An authenticator app (Google Authenticator, Authy, etc.)
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                A safe place to store backup codes
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={initSetup}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : 'Continue'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // QR code and verification step
    if (step === 'verify' && setupData) {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">Scan QR Code</CardTitle>
                    <CardDescription>
                        Scan this QR code with your authenticator app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* QR Code */}
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-inner border">
                            <img
                                src={setupData.qrCode}
                                alt="2FA QR Code"
                                className="w-48 h-48"
                            />
                        </div>
                    </div>

                    {/* Manual entry */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Can't scan? Enter this code manually:</p>
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono select-all">
                            {setupData.secret}
                        </code>
                    </div>

                    {/* Verification */}
                    <form onSubmit={verifyAndEnable} className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2 text-center">
                                Enter the 6-digit code from your app:
                            </p>
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
                                        className="w-11 h-12 text-center text-xl font-bold"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={onCancel}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : 'Enable 2FA'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    // Backup codes step
    return (
        <>
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <CardTitle className="text-xl font-bold text-green-600">2FA Enabled!</CardTitle>
                    <CardDescription>
                        Your account is now protected with two-factor authentication.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => setShowBackupDialog(true)}
                        variant="outline"
                        className="w-full"
                    >
                        View Backup Codes
                    </Button>
                    <Button
                        onClick={onComplete}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        Done
                    </Button>
                </CardContent>
            </Card>

            {/* Backup Codes Dialog */}
            <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Your Backup Codes</DialogTitle>
                        <DialogDescription>
                            These codes can be used to access your account if you lose access to your authenticator app. Each code can only be used once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-gray-50 border rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {setupData?.backupCodes.map((code, index) => (
                                    <code
                                        key={index}
                                        className="bg-white px-3 py-2 rounded border text-center font-mono text-sm"
                                    >
                                        {code}
                                    </code>
                                ))}
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>⚠️ Important:</strong> Store these codes in a safe place. You won't be able to see them again!
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={copyBackupCodes}
                                variant="outline"
                                className="flex-1"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </Button>
                            <Button
                                onClick={downloadBackupCodes}
                                variant="outline"
                                className="flex-1"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </Button>
                        </div>

                        <Button
                            onClick={() => {
                                setShowBackupDialog(false);
                                onComplete();
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                            I've saved my codes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default TwoFactorSetup;
