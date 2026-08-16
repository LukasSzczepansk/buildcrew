"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/i18n/locale-provider";
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const copy = useCopy();
  const label = copy("Toggle light/dark theme", "Toggle light/dark theme");
  return <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={label} title={label}>{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</Button>;
}
