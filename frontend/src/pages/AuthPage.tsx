import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  FileSearch,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../services/AuthContext';
import { authApi } from '../services/authApi';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

const authHighlights = [
  { icon: FileSearch, text: 'Structured document analysis' },
  { icon: Fingerprint, text: 'Evidence mapped to its source' },
  { icon: LockKeyhole, text: 'Private cases scoped to your account' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const isSignUp = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const { acceptUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectState = location.state as { from?: { pathname?: string } } | null;
  const requestedPath = redirectState?.from?.pathname;
  const destination =
    requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/dashboard';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = isSignUp
        ? await authApi.signUp(email, password)
        : await authApi.logIn(email, password);
      acceptUser(user);
      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to authenticate your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070B12] text-[#F1F5F9] lg:grid lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#243247] bg-[#0A111B] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -left-44 top-1/4 h-[520px] w-[520px] rounded-full bg-[#20B8A6]/[0.07] blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="Go to home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#20B8A6]/30 bg-[#20B8A6]/10 text-[#20B8A6]">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">DocuForensics AI</span>
              <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-[#718096]">
                Evidence intelligence
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-xl py-14">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#20B8A6]">
            Your cases. Your evidence.
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.035em] xl:text-5xl">
            Investigate with clarity and confidence.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[#8D9AAF]">
            A focused workspace for examining documents, connecting evidence, and keeping human
            judgment at the center of every finding.
          </p>
          <div className="mt-9 grid gap-3">
            {authHighlights.map(({ icon: CapabilityIcon, text }) => (
              <div className="flex items-center gap-3 text-xs text-[#A7B4C7]" key={text}>
                <CapabilityIcon className="h-4 w-4 text-[#20B8A6]" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-[#243247] pt-5 text-[10px] font-mono text-[#5D6A7E]">
          <span>Evidence first. Examiner led.</span>
          <span>DOCUFORENSICS · 01</span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-[#8D9AAF] transition-colors hover:text-white lg:hidden"
          >
            <ShieldAlert className="h-4 w-4 text-[#20B8A6]" />
            DocuForensics AI
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#718096] transition-colors hover:text-[#D4DCE7]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl border border-[#20B8A6]/25 bg-[#20B8A6]/10 text-[#20B8A6]">
            {isSignUp ? <Fingerprint className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#20B8A6]">
            {isSignUp ? 'Create a private workspace' : 'Secure investigator access'}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#8D9AAF]">
            {isSignUp
              ? 'Your investigations are private to your account.'
              : 'Sign in to continue to your investigation workspace.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-[#EF4444]/35 bg-[#EF4444]/[0.08] px-4 py-3 text-xs leading-5 text-[#FCA5A5]"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium text-[#D4DCE7]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@organization.com"
                className="h-12 w-full rounded-lg border border-[#243247] bg-[#0D1420] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-[#566479] focus:border-[#20B8A6]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-[#D4DCE7]">
                  Password
                </label>
                {isSignUp && <span className="text-[10px] text-[#718096]">At least 12 characters</span>}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  minLength={isSignUp ? 12 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                  className="h-12 w-full rounded-lg border border-[#243247] bg-[#0D1420] px-3.5 pr-11 text-sm text-white outline-none transition-colors placeholder:text-[#566479] focus:border-[#20B8A6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#718096] transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-xs font-medium text-[#D4DCE7]">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  className="h-12 w-full rounded-lg border border-[#243247] bg-[#0D1420] px-3.5 text-sm text-white outline-none transition-colors placeholder:text-[#566479] focus:border-[#20B8A6]"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="mt-2 w-full !h-12 !text-sm !text-[#071411]"
            >
              {isSignUp ? 'Create account' : 'Sign in'} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-7 text-center text-xs text-[#8D9AAF]">
            {isSignUp ? 'Already have an account?' : 'New to DocuForensics AI?'}{' '}
            <Link
              to={isSignUp ? '/login' : '/signup'}
              state={location.state}
              className="font-semibold text-[#3BC8B7] hover:text-[#78E2D6]"
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="mt-10 border-t border-[#192538] pt-5 text-center text-[10px] leading-5 text-[#5D6A7E]">
            By continuing, you agree to use this workspace responsibly. Findings are observations
            for examiner review and are not legal proof of fraud.
          </p>
        </div>
      </section>
    </main>
  );
};
