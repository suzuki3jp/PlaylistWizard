import { Check, TriangleAlert } from "lucide-react";
import type { PropsWithChildren } from "react";

export function ResultCard({
  type,
  title,
  children,
}: PropsWithChildren<{ type: "success" | "error"; title: string }>) {
  return (
    <div
      className={`rounded-lg p-4 ${type === "success" ? "border-green-800 bg-green-900/20" : "border-red-900 bg-red-900/20"} border`}
    >
      <div className="flex space-x-2">
        {type === "success" ? (
          <Check color="#05df72" />
        ) : (
          <TriangleAlert color="#ff4d4f" />
        )}
        <h4
          className={`mb-2 font-medium ${type === "success" ? "text-green-400" : "text-red-400"}`}
        >
          {title}
        </h4>
      </div>

      <div className="space-y-1 text-gray-300 text-sm">{children}</div>
    </div>
  );
}
