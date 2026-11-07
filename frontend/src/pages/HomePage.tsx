import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileSearch,
  Fingerprint,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const capabilities = [
  {
    icon: ScanSearch,
    title: 'Inspect every detail',
    description: 'Surface metadata, visual anomalies, and document-level inconsistencies.',
  },
  {
    icon: FileSearch,
    title: 'Connect related evidence',
    description: 'Compare dates, amounts, and entities across a complete case file.',
  },
  {
    icon: ShieldCheck,
    title: 'Keep investigators in control',
    description: 'Review evidence and attest findings before creating a case dossier.',
  },
];

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden bg-[#070B12] text-[#F1F5F9]">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="DocuForensics AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#20B8A6]/30 bg-[#20B8A6]/10 text-[#20B8A6]">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide">DocuForensics AI</span>
            <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#718096]">
              Evidence intelligence
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#20B8A6] px-4 text-sm font-semibold text-[#071411] transition-colors hover:bg-[#35c9b8]"
            >
              Open workspace <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-4 py-2.5 text-sm font-medium text-[#A7B4C7] transition-colors hover:text-white sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#20B8A6] px-4 text-sm font-semibold text-[#071411] transition-colors hover:bg-[#35c9b8]"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-20">
          <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#20B8A6]/[0.07] blur-3xl" />
          <div className="relative">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#243247] bg-[#0D1420] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#9AABBF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#20B8A6]" />
              Document forensics, made explainable
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[68px]">
              Every detail tells a story.
              <span className="mt-2 block text-[#20B8A6]">Find the evidence.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#A7B4C7] sm:text-lg sm:leading-8">
              Investigate document integrity with structured analysis, cross-document context, and
              clear evidence for the people who make the final call.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#20B8A6] px-5 text-sm font-semibold text-[#071411] shadow-[0_8px_30px_rgba(32,184,166,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#35c9b8]"
              >
                {user ? 'Go to your workspace' : 'Get started'} <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#243247] px-5 text-sm font-medium text-[#D4DCE7] transition-colors hover:border-[#3B526D] hover:bg-[#0D1420]"
                >
                  Sign in
                </Link>
              )}
            </div>
            <div className="mt-9 flex items-center gap-2 text-xs text-[#718096]">
              <Check className="h-3.5 w-3.5 text-[#20B8A6]" />
              Private case workspaces · Human-reviewed findings
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute -inset-8 rounded-[36px] bg-[#20B8A6]/[0.055] blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-[#243247] bg-[#0D1420] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
              <div className="flex items-center justify-between border-b border-[#243247] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#20B8A6]/20 bg-[#20B8A6]/10 text-[#20B8A6]">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Investigation workspace</p>
                    <p className="mt-0.5 text-[10px] font-mono text-[#718096]">A clear view of your evidence</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#243247] px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-[#718096]">
                  Your case
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-xl border border-[#243247] bg-[#101927] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#718096]">
                      Analysis workflow
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#20B8A6]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#20B8A6]" />
                      Evidence-led
                    </span>
                  </div>
                  {[
                    ['01', 'Upload source documents', 'PDF · PNG · JPEG'],
                    ['02', 'Review extracted evidence', 'Fields · Metadata · OCR'],
                    ['03', 'Compare and attest', 'Examiner controlled'],
                  ].map(([number, title, detail], index) => (
                    <div className="flex gap-3" key={number}>
                      <div className="flex flex-col items-center">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#243247] bg-[#0D1420] text-[10px] font-mono text-[#20B8A6]">
                          {number}
                        </span>
                        {index < 2 && <span className="my-1 h-5 w-px bg-[#243247]" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-medium text-[#E4EAF1]">{title}</p>
                        <p className="mt-1 text-[10px] font-mono text-[#718096]">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#243247] bg-[#101927] p-4">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#718096]">Analysis</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#20B8A6]" />
                      <span className="text-xs font-medium">Explainable signals</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#243247] bg-[#101927] p-4">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#718096]">Privacy</p>
                    <div className="mt-3 flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#20B8A6]" />
                      <span className="text-xs font-medium">Private by account</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#243247] px-5 py-3 text-[10px] font-mono text-[#718096]">
                <span>Human judgment stays in the loop</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#192538] bg-[#0A101A]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
            <div className="mb-10 max-w-2xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#20B8A6]">
                A careful workflow
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                More context. Clearer decisions.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }, index) => (
                <article
                  key={title}
                  className="rounded-xl border border-[#243247] bg-[#0D1420] p-6 transition-colors hover:border-[#20B8A6]/35"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#20B8A6]/20 bg-[#20B8A6]/10 text-[#20B8A6]">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-[10px] font-mono text-[#4B5A70]">0{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#8D9AAF]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center lg:px-10">
          <div>
            <p className="text-lg font-semibold">Start with your own secure workspace.</p>
            <p className="mt-1 text-sm text-[#8D9AAF]">Each account has a private investigation library.</p>
          </div>
          <Link
            to={user ? '/dashboard' : '/signup'}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#20B8A6]/35 bg-[#20B8A6]/10 px-4 text-sm font-semibold text-[#4DD6C5] transition-colors hover:bg-[#20B8A6]/15"
          >
            {user ? 'Open workspace' : 'Create your account'} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <footer className="border-t border-[#192538] px-6 py-5 text-center text-[11px] text-[#5D6A7E]">
        DocuForensics AI · Evidence first, examiner led.
      </footer>
    </div>
  );
};
