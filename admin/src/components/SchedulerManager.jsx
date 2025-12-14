// admin/src/components/SchedulerManager.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Plus, Trash2, Edit } from 'lucide-react';

const SchedulerManager = () => {
  const [loading, setLoading] = useState(true);
  const [nextPublication, setNextPublication] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [ads, setAds] = useState([]);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    emoji: '💼',
    contact: '',
    price: '',
    link: ''
  });

  useEffect(() => {
    fetchSchedulerData();
    const interval = setInterval(fetchSchedulerData, 30000); // Обновляем каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      
      // Получаем данные о следующей публикации
      const nextResponse = await fetch('/api/scheduler/next');
      const nextData = await nextResponse.json();
      
      if (nextData.success) {
        setNextPublication(nextData.next_publication);
        setDailyPlan(nextData.daily_plan);
      }
      
      // Получаем список рекламы
      const adsResponse = await fetch('/api/ads/manager');
      const adsData = await adsResponse.json();
      
      if (adsData.success) {
        setAds(adsData.ads);
      }
      
    } catch (error) {
      console.error('Error fetching scheduler data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAd = async () => {
    if (!newAd.title || !newAd.description) {
      alert('Заполните заголовок и описание');
      return;
    }

    try {
      const response = await fetch('/api/ads/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Реклама добавлена!');
        setNewAd({
          title: '',
          description: '',
          emoji: '💼',
          contact: '',
          price: '',
          link: ''
        });
        fetchSchedulerData();
      } else {
        alert('Ошибка: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding ad:', error);
      alert('Ошибка добавления рекламы');
    }
  };

  const deleteAd = async (adId) => {
    if (!confirm('Удалить эту рекламу?')) return;

    try {
      const response = await fetch(`/api/ads/manager?adId=${adId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Реклама удалена!');
        fetchSchedulerData();
      } else {
        alert('Ошибка: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Ошибка удаления рекламы');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка планировщика...</div>;
  }

  return (
    <div className="scheduler-manager space-y-6">
      {/* Следующая публикация */}
      {nextPublication && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Следующая публикация
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Время публикации</div>
              <div className="text-2xl font-bold text-orange-600">
                {nextPublication.scheduled_time}
              </div>
              <div className="text-sm text-gray-500">
                Через {nextPublication.time_to_next}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Источники</div>
              <div className="text-lg font-semibold text-blue-600">
                {nextPublication.source_priority.join(', ')}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Тип контента</div>
              <div className="text-lg font-semibold text-green-600">
                {nextPublication.expected_content_type}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${nextPublication.will_include_ad ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-sm text-gray-600">
                {nextPublication.will_include_ad ? 'С рекламой' : 'Без рекламы'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* План на день */}
      {dailyPlan && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              План на сегодня
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dailyPlan.total_scheduled}
              </div>
              <div className="text-sm text-gray-600">Запланировано</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dailyPlan.posts_today}
              </div>
              <div className="text-sm text-gray-600">Опубликовано</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dailyPlan.pending_posts}
              </div>
              <div className="text-sm text-gray-600">В ожидании</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((dailyPlan.posts_today / dailyPlan.total_scheduled) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Выполнено</div>
            </div>
          </div>
        </div>
      )}

      {/* Управление рекламой */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Список рекламы */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Рекламная очередь
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              Всего: {ads.length}
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ads.map((ad, index) => (
              <div 
                key={ad.id} 
                className={`p-3 rounded-lg border ${index === 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{ad.emoji}</span>
                      <h4 className="font-semibold text-sm">{ad.title}</h4>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
                          Следующая
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {ad.description.substring(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {ad.contact && <span>📞 {ad.contact}</span>}
                      {ad.price && <span>💰 {ad.price}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {ads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Реклама не настроена
              </div>
            )}
          </div>
        </div>

        {/* Добавить рекламу */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Plus className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Добавить рекламу
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Эмодзи
              </label>
              <input
                type="text"
                value={newAd.emoji}
                onChange={(e) => setNewAd({...newAd, emoji: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="💼"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заголовок *
              </label>
              <input
                type="text"
                value={newAd.title}
                onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="КОНСУЛЬТАЦИИ ПО ЗАКУПКАМ"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание *
              </label>
              <textarea
                value={newAd.description}
                onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Поможем найти надежных поставщиков..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Контакт
                </label>
                <input
                  type="text"
                  value={newAd.contact}
                  onChange={(e) => setNewAd({...newAd, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="@chinatech_consult"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена
                </label>
                <input
                  type="text"
                  value={newAd.price}
                  onChange={(e) => setNewAd({...newAd, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="от 5,000₽"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ссылка
              </label>
              <input
                type="url"
                value={newAd.link}
                onChange={(e) => setNewAd({...newAd, link: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://t.me/chinatech_consult"
              />
            </div>
            
            <button
              onClick={addAd}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Добавить рекламу
            </button>
          </div>
        </div>
      </div>

      {/* Статус системы */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              Планировщик работает в нормальном режиме
            </p>
            <p className="text-xs text-green-600 mt-1">
              Следующая проверка через 30 секунд. Автоматические публикации каждые 2 часа.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerManager;