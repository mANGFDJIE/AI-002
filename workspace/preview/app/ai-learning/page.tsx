'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AILearningPage() {
  const [selectedLevel, setSelectedLevel] = useState('beginner')

  const courses = {
    beginner: [
      {
        id: 1,
        title: "Основы машинного обучения",
        description: "Введение в ML, алгоритмы и базовые концепции",
        duration: "4 недели",
        level: "Начальный",
        icon: "🤖"
      },
      {
        id: 2,
        title: "Python для AI",
        description: "Изучите Python с фокусом на AI библиотеки",
        duration: "3 недели", 
        level: "Начальный",
        icon: "🐍"
      },
      {
        id: 3,
        title: "Нейронные сети",
        description: "Понимание архитектуры и принципов работы",
        duration: "5 недель",
        level: "Начальный",
        icon: "🧠"
      }
    ],
    intermediate: [
      {
        id: 4,
        title: "Deep Learning с TensorFlow",
        description: "Глубокое обучение и практические проекты",
        duration: "6 недель",
        level: "Средний",
        icon: "⚡"
      },
      {
        id: 5,
        title: "Computer Vision",
        description: "Обработка изображений и распознавание объектов",
        duration: "5 недель",
        level: "Средний", 
        icon: "👁️"
      },
      {
        id: 6,
        title: "NLP и обработка текста",
        description: "Анализ естественного языка и чат-боты",
        duration: "4 недели",
        level: "Средний",
        icon: "💬"
      }
    ],
    advanced: [
      {
        id: 7,
        title: "Генеративные модели",
        description: "GANs, VAE и создание контента с помощью AI",
        duration: "8 недель",
        level: "Продвинутый",
        icon: "🎨"
      },
      {
        id: 8,
        title: "MLOps и развертывание",
        description: "Продакшн системы и масштабирование ML",
        duration: "6 недель",
        level: "Продвинутый",
        icon: "🚀"
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Обучение
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Изучайте искусственный интеллект с современными курсами от основ до продвинутых техник
          </p>
        </div>

        {/* Level Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-2 border border-gray-700">
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedLevel === level
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {level === 'beginner' && 'Начальный'}
                {level === 'intermediate' && 'Средний'}
                {level === 'advanced' && 'Продвинутый'}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {courses[selectedLevel].map((course) => (
            <div
              key={course.id}
              className="bg-gray-800/30 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer group"
            >
              <div className="text-4xl mb-4">{course.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {course.title}
              </h3>
              <p className="text-gray-400 mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                  {course.level}
                </span>
                <span className="text-gray-500 text-sm">⏱️ {course.duration}</span>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                Начать обучение
              </button>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Практические проекты</h3>
            <p className="text-gray-400">Реальные задачи и проекты для закрепления знаний</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Сообщество</h3>
            <p className="text-gray-400">Общение с единомышленниками и экспертами</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Сертификаты</h3>
            <p className="text-gray-400">Получите признанные сертификаты по завершении</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы начать путь в мир AI?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Присоединяйтесь к тысячам студентов, изучающих будущее технологий
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai/learn">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                Начать бесплатно
              </button>
            </Link>
            <button className="px-8 py-4 border border-gray-600 text-gray-300 rounded-lg font-medium hover:border-gray-500 hover:text-white transition-all duration-300">
              Смотреть демо
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
