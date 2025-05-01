import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 
import { ThemeProvider } from "next-themes"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Form Flow Test Gen", 
  description: "Generate test data from form.io schemas", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
