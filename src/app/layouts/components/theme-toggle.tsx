import { Moon, Sun } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { toggleTheme, useShownTheme } from "../../providers/theme";

/** Switches away from the theme currently on screen. */
export function ThemeToggle() {
  const shownTheme = useShownTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={
        shownTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      onClick={toggleTheme}
    >
      {shownTheme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}
