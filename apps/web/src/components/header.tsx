import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center px-5 py-4 sm:px-8 lg:px-10">
        <Link
          className="flex items-center gap-2 hover:opacity-80"
          to="/"
        >
          <span className="text-sm font-semibold tracking-tight">Portier</span>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm text-muted-foreground">Sync Console</span>
        </Link>
      </div>
    </header>
  );
}
