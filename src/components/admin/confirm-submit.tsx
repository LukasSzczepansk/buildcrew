"use client";

import type { MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmSubmit({
  message,
  children,
  onClick,
  ...props
}: ButtonProps & { message: string }) {
  return (
    <Button
      {...props}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
