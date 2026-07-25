import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Вход — LOFT",
  description: "Добро пожаловать в лофт",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#f5efe6] min-h-screen flex items-center justify-center p-5">
        {children}
      </body>
    </html>
  );
}
