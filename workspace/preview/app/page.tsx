import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">LOFT</h1>
        <p className="text-gray-500">Добро пожаловать в ваше рабочее пространство</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard
          href="/"
          icon="🏠"
          title="Главная"
          description="Обзорная страница проекта, новости и быстрые ссылки."
        />
        <SectionCard
          href="/login"
          icon="🔐"
          title="Вход"
          description="Авторизация в системе с тёмной темой."
        />
        <SectionCard
          href="/dashboard"
          icon="📊"
          title="Дашборд"
          description="Статистика, пользователи, доход и последние действия."
        />
      </div>
    </div>
  );
}

function SectionCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <div className="text-3xl mb-3">{icon}</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
        <p className="text-gray-500 text-sm">{description}</p>
        <div className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">
          Перейти →
        </div>
      </div>
    </Link>
  );
}
