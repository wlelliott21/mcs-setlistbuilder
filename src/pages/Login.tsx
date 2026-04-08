import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, sendOtp, verifyOtpAndSetPassword, signInWithPassword } from '@/hooks/useAuth';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';
type Step = 'credentials' | 'otp';

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Email and password are required', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithPassword(email.trim(), password);
      login({
        id: user.id,
        email: user.email!,
        username: user.user_metadata?.username || user.email!.split('@')[0],
      });
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!password.trim() || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email.trim());
      showToast('Verification code sent to your email');
      setStep('otp');
    } catch (err: any) {
      showToast(err.message || 'Failed to send code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showToast('Enter the verification code', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await verifyOtpAndSetPassword(email.trim(), otp.trim(), password, username.trim() || email.split('@')[0]);
      if (user) {
        login({
          id: user.id,
          email: user.email!,
          username: user.user_metadata?.username || user.email!.split('@')[0],
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep('credentials');
    setOtp('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'hsl(240,15%,5%)' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
            <span className="text-primary text-xl">♪</span>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>Setlist Builder</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to manage your setlists' : 'Create your account'}
          </p>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            className={cn('flex-1 text-sm font-medium py-2 rounded-md transition-colors', mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            onClick={() => switchMode('login')}
          >Sign In</button>
          <button
            className={cn('flex-1 text-sm font-medium py-2 rounded-md transition-colors', mode === 'register' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            onClick={() => switchMode('register')}
          >Register</button>
        </div>

        <div className="space-y-4 border border-border rounded-xl p-5 bg-card">
          {mode === 'login' ? (
            <>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@band.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </>
          ) : step === 'credentials' ? (
            <>
              <div className="space-y-1.5">
                <Label>Band / Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. The Groove Band" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@band.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Password (min 6 characters)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
              </div>
              <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending code…' : 'Send Verification Code'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                We sent a 4-digit code to <span className="text-foreground font-medium">{email}</span>
              </p>
              <div className="space-y-1.5">
                <Label>Verification Code</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="1234" maxLength={4} className="text-center text-lg font-mono tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()} autoFocus />
              </div>
              <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying…' : 'Create Account'}
              </Button>
              <button className="w-full text-xs text-muted-foreground hover:text-foreground text-center" onClick={() => setStep('credentials')}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
