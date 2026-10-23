"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCopy } from "@/components/i18n/locale-provider";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Pending = ConfirmOptions & { resolve: (value: boolean) => void };

/**
 * Promise-based replacement for window.confirm().
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ message: "Delete?", destructive: true }))) return;
 *   ...render {dialog} once in the component tree.
 */
export function useConfirm() {
  const copy = useCopy();
  const [pending, setPending] = React.useState<Pending | null>(null);

  const confirm = React.useCallback((options: ConfirmOptions | string) => {
    const normalized = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => setPending({ ...normalized, resolve }));
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const dialog = (
    <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) settle(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pending?.title ?? copy("Potwierdź", "Please confirm")}</DialogTitle>
          <DialogDescription>{pending?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => settle(false)}>{pending?.cancelLabel ?? copy("Anuluj", "Cancel")}</Button>
          <Button type="button" variant={pending?.destructive ? "destructive" : "default"} onClick={() => settle(true)} autoFocus>
            {pending?.confirmLabel ?? copy("Potwierdź", "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
