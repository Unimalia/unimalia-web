// components/ui/button.tsx
import Link from "next/link";

type ButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function ButtonPrimary({ href, onClick, children, className }: ButtonProps) {
  const base =
    "rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800";
  if (href) return <Link href={href} className={`${base} ${className ?? ""}`}>{children}</Link>;
  return <button onClick={onClick} className={`${base} ${className ?? ""}`}>{children}</button>;
}

export function ButtonSecondary({ href, onClick, children, className }: ButtonProps) {
  const base =
    "rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50";
  if (href) return <Link href={href} className={`${base} ${className ?? ""}`}>{children}</Link>;
  return <button onClick={onClick} className={`${base} ${className ?? ""}`}>{children}</button>;
}