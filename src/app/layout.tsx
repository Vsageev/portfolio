import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "//TODO_RENAME blog",
  description: "daily project blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem("theme");if(theme==="light"||theme==="dark"){document.documentElement.setAttribute("data-theme",theme);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ConvexClientProvider>
          <Nav />
          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "0 var(--space-md)",
              paddingTop: "calc(56px + 2px + var(--space-lg))",
            }}
          >
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
