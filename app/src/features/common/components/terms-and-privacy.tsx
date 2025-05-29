export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="font-bold text-4xl text-white">{children}</h1>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-bold text-2xl text-white">{children}</h2>;
}

export function SectionSecondaryTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h3 className="font-semibold text-pink-400 text-xl">{children}</h3>;
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4"> {children}</section>;
}

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
