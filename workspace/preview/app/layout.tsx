import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOFT",
  description: "Добро пожаловать в лофт",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#f5efe6] min-h-screen flex items-center justify-center p-5 relative">
        <nav className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          <Link
            href="/"
            className="px-4 py-2 bg-[#3c2f28] text-[#fcf9f5] rounded-xl text-sm font-medium hover:bg-[#57473d] transition-colors"
          >
            Главная
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-[#161b22] text-[#c9d1d9] rounded-xl text-sm font-medium hover:bg-[#1c2333] transition-colors"
          >
            Вход
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white text-gray-800 rounded-xl text-sm font-medium border border-gray-200 hover:shadow-md transition-shadow"
          >
            Дашборд
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
