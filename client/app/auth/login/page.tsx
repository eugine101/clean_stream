'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap, Shield, AlertCircle, ArrowRight, Droplets } from 'lucide-react';

function CleanStreamMark({ size = 44 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d={`M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`}
        fill="#4caf72"
      />
      <path
        d={`M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`}
        fill="#1a1a1a"
        transform={`rotate(120 ${cx} ${cy})`}
      />
      <path
        d={`M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`}
        fill="#6b9a9a"
        transform={`rotate(240 ${cx} ${cy})`}
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('sarah@acme.com');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Brand colors
  // bg: #1b5e5e (deep teal)
  // accent: #7ed957 (lime green)
  // text-light: #c8f5a0
  // text-muted: #8bbfb0

  return (
    <div className="min-h-screen flex" style={{ background: 'white' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #7ed957 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'rgba(126,217,87,0.08)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full"
          style={{ background: 'rgba(200,245,160,0.06)', filter: 'blur(60px)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <CleanStreamMark size={40} />
            <div>
              <p className="font-bold uppercase tracking-widest text-sm" style={{ color: '#7ed957', letterSpacing: '0.18em' }}>
                Clean Stream
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7ed957', letterSpacing: '0.1em' }}>
                Tech That Clears The Way
              </p>
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6" style={{ color: '#7ed957' }}>
            Clean data.<br />
            <span style={{ color: '#7ed957' }}>Clear decisions.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-md" style={{ color: '#8bbfb0' }}>
            Enterprise-grade data cleaning pipelines with granular access control for every team member.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Zap, label: 'Automated pipelines', sub: 'Schedule and trigger data cleaning jobs' },
            { icon: Shield, label: 'Role-based access', sub: 'Granular permissions per resource' },
            { icon: Droplets, label: 'Multi-tenant', sub: 'Isolated environments per organization' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(200,245,160,0.06)', border: '1px solid rgba(126,217,87,0.2)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(126,217,87,0.15)' }}
              >
                <Icon className="w-4 h-4" style={{ color: '#7ed957' }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: '#c8f5a0' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8bbfb0' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <CleanStreamMark size={36} />
            <div>
              <p className="font-bold uppercase tracking-widest text-sm" style={{ color: '#c8f5a0', letterSpacing: '0.15em' }}>
                Clean Stream
              </p>
              <p className="text-xs font-semibold uppercase" style={{ color: '#7ed957', letterSpacing: '0.1em' }}>
                Tech That Clears The Way
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#c8f5a0' }}>Welcome back</h2>
            <p style={{ color: '#8bbfb0' }}>Sign in to your workspace</p>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="mb-6"
              style={{ background: 'rgba(220,80,80,0.15)', border: '1px solid rgba(220,80,80,0.35)' }}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription style={{ color: '#ffaaaa' }}>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Work email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-11 text-white placeholder:text-white/30"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(126,217,87,0.25)',
                  color: '#c8f5a0',
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: '#7ed957' }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 placeholder:text-white/30"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(126,217,87,0.25)',
                  color: '#c8f5a0',
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={v => setRemember(v as boolean)}
                style={{ borderColor: 'rgba(126,217,87,0.4)' }}
                className="data-[state=checked]:bg-[#7ed957] data-[state=checked]:border-[#7ed957]"
              />
              <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: '#8bbfb0' }}>
                Keep me signed in for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold gap-2 transition-all"
              style={{
                background: '#7ed957',
                color: '#0f3d2e',
                border: 'none',
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: '#8bbfb0' }}>Don't have an account? </span>
            <Link
              href="/auth/signup"
              className="text-sm font-medium transition-colors"
              style={{ color: '#7ed957' }}
            >
              Create workspace
            </Link>
          </div>

          <div
            className="mt-8 p-4 rounded-xl"
            style={{ background: 'rgba(200,245,160,0.06)', border: '1px solid rgba(126,217,87,0.2)' }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: '#7ed957' }}>Demo credentials</p>
            <p className="text-xs" style={{ color: '#8bbfb0' }}>
              Email: <span style={{ color: '#c8f5a0' }}>sarah@acme.com</span>
            </p>
            <p className="text-xs" style={{ color: '#8bbfb0' }}>
              Password: <span style={{ color: '#c8f5a0' }}>any value</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}