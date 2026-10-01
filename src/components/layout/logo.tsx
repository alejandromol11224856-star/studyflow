import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-linear-to-br from-[#7b6dff] via-[#5b4ef5] to-[#3b2fd1] text-white shadow-sm shadow-primary/30",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        <path d="M4 15c2.5 0 3.5-6 6-6s3.5 6 6 6 3-3 4-4" />
        <circle cx="20" cy="11" r="0.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-[15px] font-semibold tracking-tight">StudyFlow</span>}
    </span>
  );
}
