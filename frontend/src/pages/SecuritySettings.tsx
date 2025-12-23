/**
 * Security Settings Page
 * Manage 2FA and password settings
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
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://crportal-nu.vercel.app/api';

export function SecuritySettings() {
    const { accessToken, user } = useAuth();
    const navigate = useNavigate();
    
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSetup2FA, setShowSetup2FA] = useState(false);
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showRegenerateBackup, setShowRegenerateBackup] = useState(false);
    
    // Disable 2FA form
    const [disablePassword, setDisablePassword] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [isDisabling, setIsDisabling] = useState(false);
    
    // Change password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Regenerate backup codes
    const [regeneratePassword, setRegeneratePassword] = useState('');
    const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Fetch 2FA status
    useEffect(() => {
        const fetch2FAStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/2fa/status`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setIs2FAEnabled(data.data.enabled);
                }
            } catch (error) {
                console.error('Failed to fetch 2FA status:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (accessToken) {
            fetch2FAStatus();
        }
    }, [accessToken]);

    const handleDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!disablePassword) {
            toast.error('Password is required');
            return;
        }

        setIsDisabling(true);
        try {
            const response = await fetch(`${API_URL}/auth/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    password: disablePassword,
                    token: disableCode || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('2FA disabled successfully');
                setIs2FAEnabled(false);
                setShowDisable2FA(false);
                setDisablePassword('');
                setDisableCode('');
            } else {
                toast.error(data.message || 'Failed to disable 2FA');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsDisabling(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Password changed successfully');
                setShowChangePassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.message || 'Failed to change password');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleRegenerateBackupCodes = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!regeneratePassword) {
            toast.error('Password is required');
            return;
        }

        setIsRegenerating(true);
        try {
            const response = await fetch(`${API_URL}/auth/2fa/backup-codes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ password: regeneratePassword }),
            });

            const data = await response.json();

            if (data.success) {
                setNewBackupCodes(data.data.backupCodes);
                setRegeneratePassword('');
                toast.success('New backup codes generated!');
            } else {
                toast.error(data.message || 'Failed to regenerate backup codes');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setIsRegenerating(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(newBackupCodes.join('\n'));
        toast.success('Backup codes copied!');
    };

    if (showSetup2FA) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
                <TwoFactorSetup
                    accessToken={accessToken || ''}
                    onComplete={() => {
                        setShowSetup2FA(false);
                        setIs2FAEnabled(true);
                    }}
                    onCancel={() => setShowSetup2FA(false)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="p-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Security Settings</h1>
                        <p className="text-gray-500">Manage your account security</p>
                    </div>
                </div>

                {/* Two-Factor Authentication */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${is2FAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    <svg
                                        className={`w-5 h-5 ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`}
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
                                <div>
                                    <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                                    <CardDescription>
                                        {is2FAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                                    </CardDescription>
                                </div>
                            </div>
                            {!isLoading && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {is2FAEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {is2FAEnabled ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRegenerateBackup(true)}
                                    className="flex-1"
                                >
                                    Regenerate Backup Codes
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDisable2FA(true)}
                                    className="flex-1"
                                >
                                    Disable 2FA
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setShowSetup2FA(true)}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                Enable 2FA
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Password */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <CardTitle className="text-lg">Password</CardTitle>
                                <CardDescription>Change your account password</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() => setShowChangePassword(true)}
                            className="w-full"
                        >
                            Change Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Role</span>
                            <span className="font-medium capitalize">{user?.role}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium">{user?.name}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Disable 2FA Dialog */}
            <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            This will make your account less secure. Enter your password to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDisable2FA} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="disablePassword">Password</Label>
                            <Input
                                id="disablePassword"
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="disableCode">2FA Code (optional)</Label>
                            <Input
                                id="disableCode"
                                type="text"
                                value={disableCode}
                                onChange={(e) => setDisableCode(e.target.value)}
                                placeholder="Enter code from authenticator"
                                maxLength={6}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDisable2FA(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="flex-1"
                                disabled={isDisabling}
                            >
                                {isDisabling ? 'Disabling...' : 'Disable 2FA'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and a new password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowChangePassword(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? 'Changing...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Regenerate Backup Codes Dialog */}
            <Dialog open={showRegenerateBackup} onOpenChange={(open) => {
                setShowRegenerateBackup(open);
                if (!open) {
                    setNewBackupCodes([]);
                    setRegeneratePassword('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {newBackupCodes.length > 0 ? 'New Backup Codes' : 'Regenerate Backup Codes'}
                        </DialogTitle>
                        <DialogDescription>
                            {newBackupCodes.length > 0
                                ? 'Save these new codes. Your old codes will no longer work.'
                                : 'This will invalidate your old backup codes.'}
                        </DialogDescription>
                    </DialogHeader>
                    {newBackupCodes.length > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 border rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {newBackupCodes.map((code, index) => (
                                        <code
                                            key={index}
                                            className="bg-white px-3 py-2 rounded border text-center font-mono text-sm"
                                        >
                                            {code}
                                        </code>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={copyBackupCodes} variant="outline" className="w-full">
                                Copy Codes
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowRegenerateBackup(false);
                                    setNewBackupCodes([]);
                                }}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                Done
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegenerateBackupCodes} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="regeneratePassword">Password</Label>
                                <Input
                                    id="regeneratePassword"
                                    type="password"
                                    value={regeneratePassword}
                                    onChange={(e) => setRegeneratePassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowRegenerateBackup(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                    disabled={isRegenerating}
                                >
                                    {isRegenerating ? 'Generating...' : 'Generate'}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default SecuritySettings;
