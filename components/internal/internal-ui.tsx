import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "accent";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const internalPageClassName = "min-h-full bg-slate-950 text-slate-100";

export const internalSurfaceClassName =
  "rounded-[1.75rem] border border-slate-800 bg-slate-900/90 shadow-[0_1px_0_rgba(255,255,255,0.03)]";

export const internalSoftSurfaceClassName =
  "rounded-[1.5rem] border border-slate-800 bg-slate-950/60";

export const internalInputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

export const internalSelectClassName = internalInputClassName;

export const internalTextareaClassName = cn(internalInputClassName, "min-h-28 resize-y");

export const internalPrimaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-emerald-500/40";

export const internalSecondaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

export const internalTertiaryButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

export const internalDangerButtonClassName =
  "inline-flex items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-400/40 hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

export function InternalPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(internalPageClassName, className)}>{children}</div>;
}

export function InternalPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function InternalSection({
  eyebrow,
  title,
  description,
  action,
  children,
  tone = "neutral",
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: Exclude<Tone, "accent">;
  className?: string;
}) {
  const shellClassName =
    tone === "warning"
      ? "overflow-hidden rounded-[1.75rem] border border-amber-500/20 bg-amber-950/25"
      : internalSurfaceClassName;

  const headerClassName =
    tone === "warning"
      ? "flex flex-wrap items-start justify-between gap-3 border-b border-amber-500/15 bg-amber-500/10 px-5 py-5 sm:px-6"
      : "flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-5 sm:px-6";

  return (
    <section className={cn(shellClassName, className)}>
      <div className={headerClassName}>
        <div className="max-w-2xl space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-50">
            {title}
          </h2>
          <p className="text-sm leading-6 text-slate-300">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export function InternalBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
        : tone === "accent"
          ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
          : "border-slate-700 bg-slate-800 text-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClassName
      )}
    >
      {children}
    </span>
  );
}

export function InternalMetricCard({
  label,
  value,
  detail,
  emphasis = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
  tone?: "neutral" | "accent";
}) {
  const cardClassName =
    tone === "accent"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : emphasis
        ? "border-slate-700 bg-slate-950/70"
        : "border-slate-800 bg-slate-950/45";

  return (
    <article className={cn("rounded-[1.5rem] border p-5", cardClassName)}>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-3 font-semibold tracking-tight text-slate-50",
          emphasis ? "text-3xl" : "text-2xl"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </article>
  );
}

export function InternalEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[1.25rem] border border-dashed border-slate-700 bg-slate-950/40 px-5 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="max-w-2xl leading-6">{description}</p>
      </div>
      {action}
    </div>
  );
}
