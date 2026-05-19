"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Brain,
  Building2,
  Users,
  Sparkles,
  CreditCard,
  Eye,
  Lock,
  ActivitySquare,
  Languages,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { getProducts, InsuranceProduct } from "@/lib/api";
import { useT } from "@/i18n/LocaleProvider";
import LocaleSwitcher from "@/i18n/LocaleSwitcher";
import DemoLoginRow from "@/components/DemoLoginRow";

export default function Home() {
  const { t } = useT();
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch {
        setError(t("landing.errorLoad"));
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [t]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* ─── Sticky nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-base font-bold tracking-tight">
              InsurSaaS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            <a href="#roles" className="hover:text-white transition-colors">
              {t("landing.navRoles")}
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              {t("landing.navFeatures")}
            </a>
            <a href="#products" className="hover:text-white transition-colors">
              {t("landing.navProducts")}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher variant="landing" />
            <Link
              href="/auth/sign-in"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              {t("landing.navSignIn")}
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-950 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              {t("landing.ctaPrimary")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-32">
        {/* Background grid + orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-emerald-600/15 blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/auth/register-company"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs font-medium text-slate-300 mb-8 backdrop-blur-sm hover:border-amber-500/40 hover:text-amber-300 transition-colors group"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            {t("landing.heroNewBadge")}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8">
            {t("landing.heroLine1")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              {t("landing.heroBrand")}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-16">
            <Link
              href="/auth/sign-up"
              className="px-7 py-3.5 rounded-full bg-white text-slate-950 font-semibold transition-all hover:bg-slate-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              {t("landing.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-7 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-semibold transition-all hover:-translate-y-0.5 inline-flex items-center justify-center"
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm max-w-4xl mx-auto">
            {[
              {
                value: t("landing.heroStat1Value"),
                label: t("landing.heroStat1Label"),
              },
              {
                value: t("landing.heroStat2Value"),
                label: t("landing.heroStat2Label"),
              },
              {
                value: t("landing.heroStat3Value"),
                label: t("landing.heroStat3Label"),
              },
              {
                value: t("landing.heroStat4Value"),
                label: t("landing.heroStat4Label"),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-950/80 px-4 py-6 flex flex-col items-center"
              >
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-500 font-bold mt-1 text-center">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Quick-demo entry — one click into any role's dashboard.
              Renders nothing in real prod (NEXT_PUBLIC_DEMO_MODE gate). */}
          <DemoLoginRow variant="landing" />
        </div>
      </section>

      {/* ─── Role-based section ──────────────────────────────────────── */}
      <section id="roles" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {t("landing.roleSectionTitle")}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t("landing.roleSectionSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: t("landing.roleCustomerTitle"),
                color: "indigo",
                bullets: [
                  t("landing.roleCustomerBullet1"),
                  t("landing.roleCustomerBullet2"),
                  t("landing.roleCustomerBullet3"),
                ],
              },
              {
                icon: Eye,
                title: t("landing.roleAgentTitle"),
                color: "emerald",
                bullets: [
                  t("landing.roleAgentBullet1"),
                  t("landing.roleAgentBullet2"),
                  t("landing.roleAgentBullet3"),
                ],
              },
              {
                icon: Building2,
                title: t("landing.roleCompanyTitle"),
                color: "amber",
                bullets: [
                  t("landing.roleCompanyBullet1"),
                  t("landing.roleCompanyBullet2"),
                  t("landing.roleCompanyBullet3"),
                ],
              },
            ].map((role) => {
              const Icon = role.icon;
              const colorClasses: Record<string, string> = {
                indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
                emerald:
                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
              };
              return (
                <div
                  key={role.title}
                  className="group p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm hover:-translate-y-1"
                >
                  <div
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center mb-6 ${colorClasses[role.color]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {role.title}
                  </h3>
                  <ul className="space-y-3">
                    {role.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features grid ───────────────────────────────────────────── */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800/40 border border-slate-800 rounded-3xl overflow-hidden">
            {[
              {
                icon: Brain,
                title: t("landing.feature1Title"),
                desc: t("landing.feature1Desc"),
              },
              {
                icon: Building2,
                title: t("landing.feature2Title"),
                desc: t("landing.feature2Desc"),
              },
              {
                icon: Lock,
                title: t("landing.feature3Title"),
                desc: t("landing.feature3Desc"),
              },
              {
                icon: CreditCard,
                title: t("landing.feature4Title"),
                desc: t("landing.feature4Desc"),
              },
              {
                icon: ActivitySquare,
                title: t("landing.feature5Title"),
                desc: t("landing.feature5Desc"),
              },
              {
                icon: Languages,
                title: t("landing.feature6Title"),
                desc: t("landing.feature6Desc"),
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-slate-950/60 p-8 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Products section (existing, polished) ──────────────────── */}
      <section
        id="products"
        className="py-24 border-t border-slate-900 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {t("landing.productsHeading")}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t("landing.productsSubtitle")}
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-2xl text-center text-red-400 max-w-2xl mx-auto backdrop-blur-sm">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product) => {
                const brand = product.company?.primaryColor ?? null;
                return (
                  <div
                    key={product.id}
                    className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm hover:-translate-y-1 flex flex-col relative overflow-hidden"
                  >
                    {brand && (
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: brand }}
                        aria-hidden
                      />
                    )}
                    <div className="flex justify-between items-start mb-5">
                      <div
                        className="h-10 w-10 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden"
                        style={{
                          backgroundColor: brand ? brand + "15" : "rgba(99,102,241,0.1)",
                        }}
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @next/next/no-img-element */}
                        {(product.company as any)?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-explicit-any
                          <img
                            src={(product.company as any).logoUrl}
                            alt={`${product.company?.name} logo`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <ShieldCheck
                            className="h-5 w-5"
                            style={{ color: brand ?? "#818cf8" }}
                          />
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 uppercase tracking-widest">
                        {product.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs font-medium text-emerald-400 mb-4">
                      {product.company.name}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed flex-grow line-clamp-3">
                      {product.description || t("landing.noDescription")}
                    </p>
                    {product.basePremium > 0 && (
                      <p className="text-emerald-400 text-sm font-bold mt-4">
                        {t("landing.fromPrice")} ${product.basePremium}/month
                      </p>
                    )}
                    <Link
                      href="/auth/sign-in"
                      className="mt-5 w-full py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-1.5 hover:opacity-90"
                      style={{ backgroundColor: brand ?? "#6366f1" }}
                    >
                      {t("landing.applyNow")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Trust strip ─────────────────────────────────────────────── */}
      <section className="py-12 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
            {[
              t("landing.trustBadge1"),
              t("landing.trustBadge2"),
              t("landing.trustBadge3"),
              t("landing.trustBadge4"),
              t("landing.trustBadge5"),
              t("landing.trustBadge6"),
            ].map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest"
              >
                <Zap className="h-3 w-3 text-emerald-400" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section className="py-24 border-t border-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-emerald-600/5" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            {t("landing.finalCtaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/auth/sign-in"
              className="px-7 py-3.5 rounded-full bg-white text-slate-950 font-semibold hover:bg-slate-200 transition-all inline-flex items-center justify-center gap-2"
            >
              {t("landing.finalCtaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/register-company"
              className="px-7 py-3.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/20 transition-all inline-flex items-center justify-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              {t("landing.finalCtaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-sm font-bold tracking-tight">
                  InsurSaaS
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("landing.heroSubtitle").slice(0, 90)}…
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                {t("landing.footerProduct")}
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    {t("landing.navFeatures")}
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-white transition-colors">
                    {t("landing.navProducts")}
                  </a>
                </li>
                <li>
                  <Link
                    href="/auth/register-company"
                    className="hover:text-white transition-colors"
                  >
                    {t("auth.companySignUpHere")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                {t("landing.footerDocs")}
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="https://backend-production-2cce.up.railway.app/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t("landing.footerSwagger")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/alionuka/insurance-saas-platform/blob/main/ARCHITECTURE.md"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t("landing.footerArchitecture")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/alionuka/insurance-saas-platform/blob/main/COMPLIANCE.md"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    {t("landing.footerCompliance")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                {t("landing.footerCompany")}
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="https://github.com/alionuka/insurance-saas-platform"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="hover:text-white transition-colors"
                  >
                    {t("landing.ctaPrimary")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>© 2026 {t("landing.footerCopyright")}</p>
            <div className="flex items-center gap-4">
              <span>Next.js 16 · NestJS 11 · FastAPI · scikit-learn</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
