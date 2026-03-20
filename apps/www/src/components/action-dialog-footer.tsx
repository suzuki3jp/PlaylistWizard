import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface ActionDialogFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
}

export function ActionDialogFooter({
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
}: ActionDialogFooterProps) {
  return (
    <DialogFooter className="flex gap-2 sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        onClick={onConfirm}
        className="bg-pink-600 text-white hover:bg-pink-700"
      >
        {confirmLabel}
      </Button>
    </DialogFooter>
  );
}
