import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, isFirstLogin = false }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('সব field পূরণ করুন');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('নতুন password কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('নতুন password এবং confirm password মিলছে না');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('নতুন password পুরাতন password থেকে ভিন্ন হতে হবে');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/student/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      toast.success('Password সফলভাবে পরিবর্তন হয়েছে! 🎉');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change করতে সমস্যা হয়েছে';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isFirstLogin) {
      toast.warning('Security এর জন্য password পরিবর্তন করুন!');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Password পরিবর্তন করুন
          </DialogTitle>
          <DialogDescription>
            {isFirstLogin ? (
              <span className="text-orange-600 font-medium">
                ⚠️ প্রথম login! Security এর জন্য আপনার password পরিবর্তন করুন।
              </span>
            ) : (
              'আপনার account secure রাখতে একটি শক্তিশালী password ব্যবহার করুন।'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Current Password */}
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">বর্তমান Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="আপনার Student ID"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="grid gap-2">
              <Label htmlFor="newPassword">নতুন Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-500">কমপক্ষে ৬ অক্ষর দিন</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Password নিশ্চিত করুন</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="নতুন password আবার লিখুন"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Password মিলছে না</p>
              )}
            </div>
          </div>

          <DialogFooter>
            {!isFirstLogin && (
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                বাতিল করুন
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'পরিবর্তন হচ্ছে...' : 'Password পরিবর্তন করুন'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
