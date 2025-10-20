import "./globals.css";
import { Toaster } from "sonner";
import ActiveLink from "@/components/site/ActiveLink.client";
import Link from "next/link";

export const metadata = {
  title: "UIUC Course Planner",
  description: "Plan semesters with ease.",
};

const bootstrap = `
(function() {
  const k='uiuc-theme';
  const saved = localStorage.getItem(k);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'theme-midnight' : 'theme-sunset');
  document.documentElement.classList.remove('theme-midnight','theme-sunset');
  document.documentElement.classList.add(theme);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary shadow-[var(--shadow-glow)]" />
              <span className="font-semibold">UIUC Course Planner</span>
            </Link>

            <nav className="ml-auto flex items-center gap-2">
              <ActiveLink href="/" exact>Home</ActiveLink>
              <ActiveLink href="/progress">Progress</ActiveLink>
              <ActiveLink href="/plans">Plans</ActiveLink>
              <ActiveLink href="/search">Search</ActiveLink>
            </nav>
          </div>
          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary/70" />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
