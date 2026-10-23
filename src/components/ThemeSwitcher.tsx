import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function select(value: Theme) {
    setTheme(value);
    try {
      localStorage.setItem("systemx-theme", value);
    } catch {
      /* Theme remains available without storage. */
    }
  }

  return (
    <div className="theme-switcher" role="group" aria-label="Aparência do site">
      <button
        type="button"
        aria-label="Tema claro"
        aria-pressed={theme === "light"}
        onClick={() => select("light")}
      >
        <Sun size={16} />
        <span>Claro</span>
      </button>
      <button
        type="button"
        aria-label="Tema escuro"
        aria-pressed={theme === "dark"}
        onClick={() => select("dark")}
      >
        <Moon size={16} />
        <span>Escuro</span>
      </button>
    </div>
  );
}
