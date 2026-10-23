"use client";

import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function ConfirmSubmit({
  message,
  children,
  onClick,
  ...props
}: ButtonProps & { message: string }) {
  const { confirm, dialog } = useConfirm();

  return (
    <>
      <Button
        {...props}
        onClick={async (event: MouseEvent<HTMLButtonElement>) => {
          // Block the native submit, ask in a dialog, then re-submit the same form via the same button.
          event.preventDefault();
          const button = event.currentTarget;
          const form = button.form;
          if (!(await confirm({ message, destructive: true }))) return;
          onClick?.(event);
          if (form) form.requestSubmit(button);
        }}
      >
        {children}
      </Button>
      {dialog}
    </>
  );
}
