"use client";
import { useState } from "react";

export default function DashboardPage() {
  const [stats] = useState({
    users: 1248,
    revenue: 48230,
    orders: 347,
    growth: 12.5,
  });

  const [recentActivities] = useState([
    { id: 1, user: "Алексей", action: "Создал проект", time: "2 мин назад" },
    { id: 2, user: "Мария", action: "Оплатила подписку", time: "15 мин назад" },
    { id: 3, user: "Иван", action: "Обновил профиль", time: "1 час назад" },
    { id: 4, user: "Елена", action: "Добавила задачу", time: "3 часа назад" },
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">Дашборд</h1>
        <p className="text-gray-500 mt-1">Добро пожаловать в рабочее пространство</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Пользователи" value={stats.users.toLocaleString()} trend="+5.2%" />
        <StatCard label="Доход" value={`$${stats.revenue.toLocaleString()}`} trend="+8.1%" />
        <StatCard label="Заказы" value={stats.orders.toLocaleString()} trend="+12.5%" />
        <StatCard label="Рост" value={`${stats.growth}%`} trend="+1.3%" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Последние действия</h2>
        <div className="space-y-3">
          {recentActivities.map((act) => (
            <div key={act.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                  {act.user[0]}
                </div>
                <div>
                  <span className="text-gray-800 font-medium">{act.user}</span>
                  <span className="text-gray-500 ml-2">{act.action}</span>
                </div>
              </div>
              <span className="text-gray-400 text-sm">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition hover:shadow-md">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        {trend}
      </span>
    </div>
  );
}
