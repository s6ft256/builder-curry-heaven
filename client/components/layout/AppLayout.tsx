import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function AppLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background to-secondary/40",
        className,
      )}
    >
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto flex items-center justify-between py-3">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent" />
            <span className="text-lg font-bold tracking-tight">ELIUS 2025</span>
          </a>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6">{children}</main>
      <footer className="border-t mt-10">
        <div className="container mx-auto py-6 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} ELIUS 2025</span>
          <span>Built for data analysts & business teams</span>
        </div>
      </footer>
    </div>
  );
}
