// These components are used in Terms of Service and Privacy Policy pages.

export function Text({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`laedin-relaxed text-gray-300 ${className}`}>{children}</p>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="font-bold text-4xl text-white">{children}</h1>;
}
