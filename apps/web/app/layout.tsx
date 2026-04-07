import type { Metadata, Route } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import Link from "next/link";
import { Badge, Footer, SiteHeader } from "@govgraph/ui";

import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GovGraph",
  description:
    "An official-source-first map of Victoria's current ministers, offices, and supporting departments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <SiteHeader
            brand={
              <div className="space-y-[var(--gg-space-1)]">
                <Link
                  href="/"
                  className="font-[family-name:var(--gg-font-family-display)] text-[length:var(--gg-font-size-2xl)] font-semibold tracking-[var(--gg-font-letter-spacing-tight)] text-[var(--gg-color-ink)]"
                >
                  GovGraph
                </Link>
                <p className="text-[length:var(--gg-font-size-xs)] font-semibold uppercase tracking-[var(--gg-font-letter-spacing-caps)] text-[var(--gg-color-semantic-text-secondary)]">
                  Official register interface
                </p>
              </div>
            }
            navigation={
              <>
                <Link href="/" className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline">
                  Atlas
                </Link>
                <Link href={"/design" as Route} className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline">
                  Design
                </Link>
              </>
            }
            utility={<Badge tone="accent">Prototype</Badge>}
          />
          <div className="flex-1">{children}</div>
          <Footer
            links={
              <div className="flex flex-wrap gap-[var(--gg-space-4)]">
                <Link href="/" className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline">
                  Home
                </Link>
                <Link href={"/design" as Route} className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline">
                  Design System
                </Link>
                <a
                  href="https://www.parliament.vic.gov.au/portfolios/"
                  className="underline-offset-4 hover:text-[var(--gg-color-deep)] hover:underline"
                >
                  Parliament Source
                </a>
              </div>
            }
            meta={
              <p>
                Built on official-source-first parsing with register-style UI
                primitives shared across the app.
              </p>
            }
            summary={
              <p>
                GovGraph turns Victorian Government structures into a readable
                public register, with warm paper surfaces, deep-ink typography,
                and every visible record anchored to source material.
              </p>
            }
          />
        </div>
      </body>
    </html>
  );
}
