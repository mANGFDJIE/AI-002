"use client";
import { useState } from "react";

export default function LoginPage() {
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" | "" }>({ text: "", type: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      setMessage({ text: "⚠️ Заполните оба поля", type: "error" });
      return;
    }
    setMessage({ text: `✅ Добро пожаловать, ${username}! (демо)`, type: "success" });
  };

  return (
    <div className="bg-[#161b22] border border-[#2a313c] rounded-xl p-10 w-full max-w-sm shadow-2xl">
      <h1 className="text-2xl font-semibold text-center mb-2 text-[#c9d1d9]">🔐 Вход</h1>
      <p className="text-center text-sm text-[#8b949e] mb-7">Введите свои учётные данные</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-[#b1bac4] mb-1.5">Имя пользователя</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="username"
            required
            autoComplete="username"
            className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] text-sm outline-none focus:border-[#58a6ff] placeholder:text-[#484f58]"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-[#b1bac4] mb-1.5">Пароль</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] text-sm outline-none focus:border-[#58a6ff] placeholder:text-[#484f58]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-[#238636] rounded-lg text-white font-semibold text-sm hover:bg-[#2ea043] transition-colors mt-2"
        >
          Войти
        </button>
      </form>

      {message.text && (
        <div className={`mt-4 text-center text-sm ${
          message.type === "error" ? "text-[#f85149]" : "text-[#3fb950]"
        }`}>
          {message.text}
        </div>
      )}

      <div className="text-center mt-5 text-sm">
        <a href="/" className="text-[#58a6ff] hover:underline">← На главную</a>
      </div>
    </div>
  );
}
