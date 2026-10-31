import { useEffect, useState } from "react";
import { ADMIN_THEME_KEY } from "../config/admin";

export type AdminTheme = "light" | "dark";

export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    try {
      setTheme(localStorage.getItem(ADMIN_THEME_KEY) === "dark" ? "dark" : "light");
    } catch {
      // Storage can be unavailable in privacy modes; keep the safe default.
    }
  }, []);

  const toggleTheme = () =>
    setTheme((current) => {
      const next: AdminTheme = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(ADMIN_THEME_KEY, next);
      } catch {
        // Non-fatal: the theme still applies for the current session.
      }
      return next;
    });

  return { theme, toggleTheme };
}
