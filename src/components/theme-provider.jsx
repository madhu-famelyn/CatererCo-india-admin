import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext(undefined);
const STORAGE_KEY = "catermarket-theme";
function getInitial() {
    if (typeof window === "undefined")
        return "dark";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark")
        return stored;
    return "dark";
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState("dark");
    useEffect(() => {
        setThemeState(getInitial());
    }, []);
    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.classList.toggle("light", theme === "light");
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        }
        catch { }
    }, [theme]);
    const setTheme = (t) => setThemeState(t);
    const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));
    return (<ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx)
        throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
