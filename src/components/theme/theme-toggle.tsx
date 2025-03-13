
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
      <Switch 
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
    </div>
  );
}
