import type { PropsWithChildren } from "react";

export function ComparisonTable({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
        {children}
      </div>
    </div>
  );
}

export function ComparisonTableHeader() {
  const cellBaseStyle = "border-gray-700 border-b p-6";

  return (
    <div className="grid grid-cols-4 gap-0">
      <div className={`${cellBaseStyle} bg-gray-750`}>
        <h3 className="font-semibold text-white">機能</h3>
      </div>
      <div className={`${cellBaseStyle} border-l bg-gray-750`}>
        <h3 className="font-semibold text-gray-300">公式の方法</h3>
      </div>
      <div className={`${cellBaseStyle} border-l bg-gray-750`}>
        <h3 className="font-semibold text-gray-300">サードパーティアプリ</h3>
      </div>
      <div
        className={`${cellBaseStyle} border-l bg-gradient-to-r from-pink-500/10 to-purple-500/10`}
      >
        <h3 className="font-semibold text-white">PlaylistWizard</h3>
      </div>
    </div>
  );
}
