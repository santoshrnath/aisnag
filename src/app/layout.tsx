import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ToastHost } from "@/components/ui/toast";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: "SnagPin — snag in 30 seconds",
  description:
    "Mobile-first snagging app for construction. Drop pins on drawings, capture defects with photos + voice, track to closure.",
  applicationName: "SnagPin",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "SnagPin",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-ink-900">
        {children}
        <ToastHost />
      </body>
    </html>
  );

  if (!clerkPk) {
    // Open-source / first-run mode: no Clerk keys present. App still works
    // fully against the demo tenant; sign-in UI hides itself.
    return shell;
  }

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",
          borderRadius: "0.75rem",
        },
      }}
    >
      {shell}
    </ClerkProvider>
  );
}
