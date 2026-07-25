'use client'

import { useState } from 'react'
import { Brain, Zap, Target, Users, ChevronRight, Play, BookOpen, Award } from 'lucide-react'

export default function AILearningPage() {
  const [activeTab, setActiveTab] = useState('courses')

  const courses = [
    {
      id: 1,
      title: 'Основы машинного обучения',
      description: 'Изучите принципы ML, алгоритмы и практическое применение',
      duration: '12 недель',
      level: 'Начинающий',
      students: 2847,
      rating: 4.8,
      price: '₽15,999'
    },
    {
      id: 2,
      title: 'Глубокое обучение и нейронные сети',
      description: 'Погрузитесь в мир deep learning и создавайте ИИ-модели',
      duration: '16 недель',
      level: 'Продвинутый',
      students: 1923,
      rating: 4.9,
      price: '₽24,999'
    },
    {
      id: 3,
      title: 'Computer Vision на практике',
      description: 'Обработка изображений, распознавание объектов, детекция',
      duration: '10 недель',
      level: 'Средний',
      students: 1456,
      rating: 4.7,
      price: '₽19,999'
    }
  ]

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-500" />,
      title: 'ИИ-ментор',
      description: 'Персональный AI-помощник адаптирует программу под ваш темп обучения'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: 'Практические проекты',
      description: 'Реальные задачи от ведущих tech-компаний для портфолио'
    },
    {
      icon: <Target className="w-8 h-8 text-green-500" />,
      title: 'Карьерная поддержка',
      description: 'Помощь в трудоустройстве и подготовка к собеседованиям'
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: 'Комьюнити экспертов',
      description: 'Сообщество практикующих ML-инженеров и data scientists'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Изучай <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">ИИ</span>
              <br />с экспертами
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Станьте специалистом по искусственному интеллекту с персонализированной программой обучения от ведущих экспертов индустрии
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                <Play className="w-5 h-5 mr-2" />
                Начать обучение
              </button>
              <button className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-white/10">
                Бесплатный урок
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Почему выбирают нас?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Современные методы обучения с использованием ИИ-технологий для максимально эффективного изучения
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-700/70 transition-all duration-300 border border-slate-600/30">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Популярные курсы</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              От основ до продвинутых техник - выберите курс под свой уровень
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 group">
                <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{course.level}</span>
                    <div className="flex items-center text-yellow-400">
                      <Award className="w-4 h-4 mr-1" />
                      <span className="text-sm">{course.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">{course.title}</h3>
                  <p className="text-gray-400 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>{course.duration}</span>
                    <span>{course.students.toLocaleString()} студентов</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">{course.price}</span>
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center">
                      Записаться
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Готовы начать карьеру в ИИ?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Присоединяйтесь к 10,000+ студентов, которые уже изучают искусственный интеллект
          </p>
          <button className="px-12 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 text-lg">
            Начать бесплатно
          </button>
        </div>
      </div>
    </div>
  )
}
