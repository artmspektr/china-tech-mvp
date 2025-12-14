import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, MessageCircle, TrendingUp, Settings, BarChart3, Clock } from 'lucide-react';
import SchedulerManager from './components/SchedulerManager.jsx';

function App() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    lastUpdate: null,
    totalPosts: 0,
    success: true
  });

  const triggerContentCollection = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/cron/collect-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trigger: true })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStats(prev => ({
          ...prev,
          lastUpdate: new Date(),
          totalPosts: prev.totalPosts + result.stats.published
        }));
        
        alert(`✅ Успешно! Опубликовано ${result.stats.published} статей из ${result.stats.processed}`);
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">中</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">КитайТех</h1>
                <p className="text-sm text-gray-600">Панель управления MVP</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={triggerContentCollection}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Сбор...' : 'Собрать контент'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Дашборд
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scheduler'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Планировщик
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Настройки
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Telegram</p>
                <p className="text-2xl font-semibold text-gray-900">@chinatech_news</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Опубликовано</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Статус</p>
                <p className={`text-lg font-semibold ${stats.success ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.success ? 'Активен' : 'Ошибка'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Update */}
        {stats.lastUpdate && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Последнее обновление: {stats.lastUpdate.toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Content Collection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📰 Сбор контента</h2>
            <p className="text-gray-600 mb-4">
              Автоматически собирает новости с китайских технологических сайтов 
              и публикует их в Telegram канал.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                36kr.com - стартапы и инвестиции
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                ifanr.com - гаджеты и обзоры
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                ithome.com - технологические новости
              </div>
            </div>
            
            <button
              onClick={triggerContentCollection}
              disabled={loading}
              className="mt-4 w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              Запустить сбор сейчас
            </button>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Настройки</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram канал
                </label>
                <input
                  type="text"
                  value="@chinatech_news"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Интервал сбора
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>30 минут</option>
                  <option>1 час</option>
                  <option>2 часа</option>
                  <option>6 часов</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Максимум статей за раз
                </label>
                <input
                  type="number"
                  defaultValue="3"
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

          {/* Status Footer */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Система работает в нормальном режиме
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Все компоненты активны. Готова к автоматическому сбору контента.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'scheduler' && (
          <SchedulerManager />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Settings content */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Настройки системы</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram канал
                  </label>
                  <input
                    type="text"
                    value="@chinatech_news"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Интервал автоматического сбора
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Каждые 30 минут</option>
                    <option>Каждый час</option>
                    <option>Каждые 2 часа</option>
                    <option>Каждые 6 часов</option>
                    <option>Ежедневно</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимум статей за публикацию
                  </label>
                  <input
                    type="number"
                    defaultValue="3"
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Частота показа рекламы
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Каждый пост</option>
                    <option>Каждые 2 поста</option>
                    <option>Каждые 3 поста</option>
                    <option>Каждые 5 постов</option>
                    <option>Отключить</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;