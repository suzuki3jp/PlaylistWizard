"use client";
import {
  arrow,
  autoUpdate,
  FloatingArrow,
  FloatingPortal,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { X } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { cn } from "@/lib/cn";

type Placement = "top" | "bottom" | "left" | "right";

interface BalloonProps {
  /** The ref of the element the balloon points to */
  targetRef: RefObject<HTMLElement | null>;
  /** Unique ID used for localStorage key (`balloon-{balloonKey}-dismissed`) */
  balloonKey: string;
  /** Balloon placement relative to the target element (default: "bottom") */
  placement?: Placement;
  children: ReactNode;
  className?: string;
}

// Tailwind gray-900 / gray-800 hex values
const FILL = "#1e2939"; // bg-gray-800
const STROKE = "#364153"; // border-gray-700

export function Balloon({
  targetRef,
  balloonKey,
  placement = "bottom",
  children,
  className,
}: BalloonProps) {
  const [dismissed, setDismissed] = useLocalStorage(
    `balloon-${balloonKey}-dismissed`,
    false,
  );
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(targetRef.current);
  }, [refs, targetRef]);

  if (dismissed) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={{ ...floatingStyles, zIndex: 50 }}
        className={cn(
          "relative w-72 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white shadow-md",
          className,
        )}
      >
        <FloatingArrow
          ref={arrowRef}
          context={context}
          fill={FILL}
          stroke={STROKE}
          strokeWidth={1}
          width={14}
          height={7}
        />
        <div className="pr-5">{children}</div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 cursor-pointer rounded p-0.5 hover:bg-accent"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </FloatingPortal>
  );
}
