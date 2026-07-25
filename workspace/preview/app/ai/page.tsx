import Link from "next/link";

export default function AIPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-16 animate-fade-in-up">
        <div className="inline-block px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white text-sm font-medium mb-4">
          Next-Gen AI
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Умный AI-помощник
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Анализируйте данные, автоматизируйте задачи и принимайте решения
          быстрее с нашей платформой на основе искусственного интеллекта.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="#features"
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Начать
          </Link>
          <Link
            href="#"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:shadow-md transition-shadow font-medium"
          >
            Демо
          </Link>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="mb-16 animate-fade-in-up">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          Возможности
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} delay={idx * 0.1} />
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="animate-fade-in-up">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          Почему выбирают нас
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <BenefitCard key={idx} {...benefit} delay={idx * 0.1} />
          ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: "🧠",
    title: "Нейросети",
    desc: "Глубокое обучение для анализа текста, изображений и речи.",
  },
  {
    icon: "⚡",
    title: "Автоматизация",
    desc: "Настраиваемые пайплайны для обработки данных в реальном времени.",
  },
  {
    icon: "🔍",
    title: "Прогнозирование",
    desc: "Модели машинного обучения для предсказания трендов и аномалий.",
  },
];

const benefits = [
  { icon: "🚀", title: "Высокая скорость", desc: "Обработка запросов до 10x быстрее аналогов." },
  { icon: "🔒", title: "Безопасность", desc: "Данные шифруются end-to-end, сертификация ISO." },
  { icon: "📊", title: "Гибкая интеграция", desc: "API и SDK для любого стека технологий." },
  { icon: "🎯", title: "Точность 99%", desc: "Модели постоянно дообучаются на ваших данных." },
];

function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: string;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition hover:shadow-lg hover:-translate-y-0.5 animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: string;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition hover:shadow-lg animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
      <p className="text-gray-400 text-xs">{desc}</p>
    </div>
  );
}
