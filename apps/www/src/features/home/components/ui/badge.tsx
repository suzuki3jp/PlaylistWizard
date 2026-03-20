import type { PropsWithChildren } from "react";

export function Badge({ children }: PropsWithChildren) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-4 py-2 font-medium text-pink-300 text-sm">
      {children}
    </div>
  );
}
