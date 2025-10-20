"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "uiuc-theme";
const LIGHT = "theme-sunset";
const DARK  = "theme-midnight";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const current =
      (html.classList.contains(DARK) && DARK) ||
      (html.classList.contains(LIGHT) && LIGHT) ||
      null;
    setTheme(current);
  }, []);

  function flip() {
    const next = theme === DARK ? LIGHT : DARK;
    const html = document.documentElement;
    html.classList.remove(DARK, LIGHT);
    html.classList.add(next);
    localStorage.setItem(KEY, next);
    setTheme(next);
  }

  if (!theme) return null; 

  const isDark = theme === DARK;
  return (
    <button
      className="icon-btn"
      onClick={flip}
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
