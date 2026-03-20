import type { LucideIcon } from "lucide-react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActionDialogHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ActionDialogHeader({
  icon: Icon,
  title,
  description,
}: ActionDialogHeaderProps) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-pink-600 p-1.5">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <DialogTitle className="text-xl">{title}</DialogTitle>
      </div>
      <DialogDescription className="text-gray-400">
        {description}
      </DialogDescription>
    </DialogHeader>
  );
}
