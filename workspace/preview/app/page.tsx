"use client";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" | "" }>({ text: "", type: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setMessage({ text: "⚠️ Заполните оба поля", type: "error" });
      return;
    }
    setMessage({ text: `✅ С возвращением, ${email.split("@")[0]}! (демо)`, type: "success" });
  };

  return (
    <div className="bg-[#fcf9f5] border border-[#ddd2c5] rounded-2xl p-12 w-full max-w-md shadow-lg relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c7a17a] via-[#d6b48b] to-[#c7a17a] rounded-t-2xl" />
      <div className="flex justify-center gap-2 mb-7">
        {[...Array(3)].map((_, i) => (
          <span key={i} className="block w-8 h-0.5 bg-[#d6c8bc] rounded" />
        ))}
      </div>
      <h1 className="text-2xl font-medium text-[#2c2420] tracking-tight mb-1">Вход</h1>
      <p className="text-sm text-[#8a7e74] mb-8">Добро пожаловать в лофт</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#5f534a] mb-1.5">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-white border border-[#dcd3ca] rounded-xl text-[#1f1a16] text-sm outline-none focus:border-[#c7a17a] focus:ring-3 focus:ring-[#c7a17a]/15 placeholder:text-[#b0a398]"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#5f534a] mb-1.5">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-white border border-[#dcd3ca] rounded-xl text-[#1f1a16] text-sm outline-none focus:border-[#c7a17a] focus:ring-3 focus:ring-[#c7a17a]/15 placeholder:text-[#b0a398]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3.5 bg-[#3c2f28] rounded-xl text-[#fcf9f5] font-medium text-base hover:bg-[#57473d] active:scale-[0.98] transition-all"
        >
          Войти
        </button>
      </form>

      {message.text && (
        <div className={`mt-5 text-center text-sm py-2 px-3 rounded-lg ${
          message.type === "error" ? "bg-[#fce8e4] text-[#a53d2b]" : "bg-[#e4f0e0] text-[#3a6b3f]"
        }`}>
          {message.text}
        </div>
      )}

      <div className="text-center mt-6 text-sm text-[#8a7e74]">
        <a href="/login" className="text-[#7a6a5c] border-b border-dotted border-[#c7b7ab] hover:text-[#3c2f28] hover:border-[#3c2f28] transition-colors">
          Забыли пароль?
        </a>
      </div>
    </div>
  );
}
