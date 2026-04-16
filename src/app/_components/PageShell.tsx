export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-8">
      {children}
    </div>
  );
}
