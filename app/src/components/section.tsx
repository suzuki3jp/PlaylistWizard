// These components are used in Terms of Service and Privacy Policy pages.

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
