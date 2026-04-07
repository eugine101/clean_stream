'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function CleanStreamMark({ size = 40 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const path = `M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={path} fill="#4caf72" />
      <path d={path} fill="#1a1a1a" transform={`rotate(120 ${cx} ${cy})`} />
      <path d={path} fill="#6b9a9a" transform={`rotate(240 ${cx} ${cy})`} />
    </svg>
  );
}

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '', orgSlug: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'orgName' ? { orgSlug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
    }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordRules.every(r => r.test(form.password))) {
      setError('Password does not meet requirements');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.orgName);
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(126,217,87,0.25)',
    color: '#c8f5a0',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: '#1b5e5e' }}>
      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #7ed957 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-56 pointer-events-none"
        style={{ background: 'rgba(126,217,87,0.07)', filter: 'blur(60px)', borderRadius: '50%' }}
      />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <CleanStreamMark size={48} />
          <p className="font-bold uppercase tracking-widest text-sm" style={{ color: '#c8f5a0', letterSpacing: '0.18em' }}>
            Clean Stream
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7ed957', letterSpacing: '0.1em' }}>
            Tech That Clears The Way
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  background: s < step ? '#7ed957' : s === step ? 'rgba(126,217,87,0.25)' : 'rgba(255,255,255,0.08)',
                  color: s < step ? '#0f3d2e' : s === step ? '#7ed957' : '#8bbfb0',
                  border: s === step ? '1.5px solid #7ed957' : '1.5px solid transparent',
                }}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              <span
                className="text-sm transition-colors"
                style={{ color: s === step ? '#c8f5a0' : '#8bbfb0' }}
              >
                {s === 1 ? 'Your account' : 'Your workspace'}
              </span>
              {s < 2 && (
                <div
                  className="flex-1 h-px"
                  style={{ background: s < step ? '#7ed957' : 'rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(200,245,160,0.05)', border: '1px solid rgba(126,217,87,0.2)' }}
        >
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

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#c8f5a0' }}>Create your account</h2>
                <p className="text-sm" style={{ color: '#8bbfb0' }}>Start your 14-day free trial</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Full name</Label>
                <Input
                  value={form.name} onChange={update('name')} placeholder="Sarah Chen" required
                  className="h-11 placeholder:text-white/30" style={inputStyle}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Work email</Label>
                <Input
                  type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" required
                  className="h-11 placeholder:text-white/30" style={inputStyle}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Password</Label>
                <Input
                  type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required
                  className="h-11 placeholder:text-white/30" style={inputStyle}
                />
                {form.password && (
                  <div className="space-y-1.5 pt-1">
                    {passwordRules.map(rule => {
                      const passed = rule.test(form.password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: passed ? '#7ed957' : 'rgba(255,255,255,0.1)' }}
                          >
                            {passed && <Check className="w-2.5 h-2.5" style={{ color: '#0f3d2e' }} />}
                          </div>
                          <span className="text-xs" style={{ color: passed ? '#7ed957' : '#8bbfb0' }}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold gap-2"
                style={{ background: '#7ed957', color: '#0f3d2e', border: 'none' }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#c8f5a0' }}>Set up your workspace</h2>
                <p className="text-sm" style={{ color: '#8bbfb0' }}>You'll be the Owner with full admin access</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: '#a8d8b0' }}>Organization name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8bbfb0' }} />
                  <Input
                    value={form.orgName} onChange={update('orgName')} placeholder="Acme Corp" required
                    className="h-11 pl-10 placeholder:text-white/30" style={inputStyle}
                  />
                </div>
              </div>

              {form.orgSlug && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(126,217,87,0.2)' }}
                >
                  <p className="text-xs mb-1" style={{ color: '#8bbfb0' }}>Your workspace URL</p>
                  <p className="text-sm font-mono" style={{ color: '#7ed957' }}>
                    cleanstream.io/<span style={{ color: '#c8f5a0' }}>{form.orgSlug}</span>
                  </p>
                </div>
              )}

              <div
                className="p-4 rounded-xl space-y-2"
                style={{ background: 'rgba(126,217,87,0.08)', border: '1px solid rgba(126,217,87,0.2)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#7ed957' }}>You'll get as Owner:</p>
                {['Unlimited datasets & pipelines', 'Invite up to 25 team members', 'Role & permission management', 'Audit logs & compliance'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#7ed957' }} />
                    <span className="text-xs" style={{ color: '#a8d8b0' }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button" variant="outline" onClick={() => setStep(1)}
                  className="flex-1 h-11"
                  style={{ background: 'transparent', border: '1px solid rgba(126,217,87,0.3)', color: '#c8f5a0' }}
                >
                  Back
                </Button>
                <Button
                  type="submit" disabled={loading}
                  className="flex-1 h-11 font-semibold gap-2"
                  style={{ background: '#7ed957', color: '#0f3d2e', border: 'none' }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    : <>Create workspace <ArrowRight className="w-4 h-4" /></>
                  }
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: '#8bbfb0' }}>
          Already have a workspace?{' '}
          <Link href="/auth/login" className="font-medium transition-colors" style={{ color: '#7ed957' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}