"use client";

import { MessageSquareIcon } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";
import { submitFeedback } from "../actions";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "../constants";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useT();
  const { data: session } = useSession();
  const [category, setCategory] = useState<FeedbackCategory>("bug_report");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [isPending, startTransition] = useTransition();
  const categoryId = useId();
  const messageId = useId();
  const emailId = useId();

  function handleSubmit() {
    startTransition(async () => {
      await submitFeedback({
        category,
        message,
        email: email || undefined,
        browser: navigator.userAgent,
        pageUrl: window.location.href,
      });
      onOpenChange(false);
      setMessage("");
      setCategory("bug_report");
    });
  }

  const categoryLabelKey: Record<FeedbackCategory, string> = {
    bug_report: "feedback-dialog.category.bug-report",
    feature_request: "feedback-dialog.category.feature-request",
    other: "feedback-dialog.category.other",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-pink-600 p-1.5">
              <MessageSquareIcon className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {t("feedback-dialog.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {t("feedback-dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label
              htmlFor={categoryId}
              className="font-medium text-sm text-white"
            >
              {t("feedback-dialog.category.label")}
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as FeedbackCategory)}
            >
              <SelectTrigger
                id={categoryId}
                className="w-full border-gray-700 bg-gray-800 text-white focus:ring-pink-500"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800 text-white">
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="focus:bg-pink-600"
                  >
                    {t(categoryLabelKey[cat])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor={messageId}
              className="font-medium text-sm text-white"
            >
              {t("feedback-dialog.message.label")}
            </label>
            <Textarea
              id={messageId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback-dialog.message.placeholder")}
              rows={4}
              className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={emailId} className="font-medium text-sm text-white">
              {t("feedback-dialog.email.label")}
            </label>
            <Input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("feedback-dialog.email.placeholder")}
              className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("action-modal.common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || isPending}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            {t("feedback-dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
