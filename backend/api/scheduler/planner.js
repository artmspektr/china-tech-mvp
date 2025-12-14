// backend/api/scheduler/planner.js
import cron from 'node-cron';

// Настройки планирования
const SCHEDULER_CONFIG = {
  collection_interval: '*/30 * * * *', // Каждые 30 минут
  peak_hours: ['09:00', '13:00', '18:00', '21:00'],
  posts_per_day: 8,
  ad_frequency: 5 // Каждый 5-й пост с рекламой
};

let scheduleHistory = [];
let adQueue = [];

// Планировщик контента
class ContentScheduler {
  constructor() {
    this.isScheduled = false;
    this.nextPost = null;
    this.postCounter = 0;
    this.adCounter = 0;
  }

  // Получить следующую публикацию
  getNextPublication() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Определяем оптимальное время публикации
    const nextOptimalTime = this.getNextOptimalTime(currentHour, currentMinute);
    
    return {
      scheduled_time: nextOptimalTime,
      source_priority: this.getSourcePriority(),
      expected_content_type: this.getContentType(nextOptimalTime),
      will_include_ad: this.shouldIncludeAd()
    };
  }

  // Получить следующее оптимальное время
  getNextOptimalTime(currentHour, currentMinute) {
    const peakHours = SCHEDULER_CONFIG.peak_hours.map(time => {
      const [hour, minute] = time.split(':').map(Number);
      return { hour, minute, timestamp: hour * 60 + minute };
    });
    
    const currentTimestamp = currentHour * 60 + currentMinute;
    
    // Находим ближайшее оптимальное время
    for (const peak of peakHours) {
      if (peak.timestamp > currentTimestamp) {
        return `${peak.hour.toString().padStart(2, '0')}:${peak.minute.toString().padStart(2, '0')}`;
      }
    }
    
    // Если сегодня время прошло, планируем на завтра
    const firstPeak = peakHours[0];
    return `${firstPeak.hour.toString().padStart(2, '0')}:${firstPeak.minute.toString().padStart(2, '0')}`;
  }

  // Приоритет источников в зависимости от времени
  getSourcePriority() {
    const hour = new Date().getHours();
    
    if (hour >= 9 && hour < 11) {
      return ['36kr', 'ifanr']; // Утром - стартапы и гаджеты
    } else if (hour >= 13 && hour < 15) {
      return ['ifanr', 'ithome']; // Днем - гаджеты и технологии
    } else if (hour >= 18 && hour < 20) {
      return ['ithome', '36kr']; // Вечером - технологии и стартапы
    } else {
      return ['36kr', 'ifanr', 'ithome']; // Ночью - все источники
    }
  }

  // Тип контента в зависимости от времени
  getContentType(time) {
    if (time.startsWith('09:')) return 'morning_news';
    if (time.startsWith('13:')) return 'afternoon_gadgets';
    if (time.startsWith('18:')) return 'evening_tech';
    if (time.startsWith('21:')) return 'night_summary';
    return 'regular_news';
  }

  // Проверяем нужно ли добавить рекламу
  shouldIncludeAd() {
    this.adCounter++;
    return this.adCounter % SCHEDULER_CONFIG.ad_frequency === 0;
  }

  // Запланировать публикацию
  schedulePost(article) {
    const nextPub = this.getNextPublication();
    
    this.nextPost = {
      ...article,
      scheduled_time: nextPub.scheduled_time,
      will_include_ad: nextPub.will_include_ad,
      post_number: ++this.postCounter
    };

    scheduleHistory.push({
      ...this.nextPost,
      status: 'scheduled',
      created_at: new Date().toISOString()
    });

    console.log(`📅 Запланировано: ${article.title} на ${nextPub.scheduled_time}`);
    return this.nextPost;
  }

  // Получить план на день
  getDailyPlan() {
    const today = new Date().toDateString();
    const todaySchedule = scheduleHistory.filter(post => 
      new Date(post.created_at).toDateString() === today
    );

    return {
      date: today,
      total_scheduled: todaySchedule.length,
      posts_today: todaySchedule.filter(p => p.status === 'published').length,
      pending_posts: todaySchedule.filter(p => p.status === 'scheduled').length,
      next_post: this.nextPost,
      schedule: todaySchedule
    };
  }

  // Запустить планировщик
  startScheduler() {
    if (this.isScheduled) {
      console.log('⚠️ Планировщик уже запущен');
      return;
    }

    // Запускаем каждые 30 минут
    cron.schedule(SCHEDULER_CONFIG.collection_interval, async () => {
      try {
        console.log('⏰ Проверка расписания...');
        await this.checkAndPublish();
      } catch (error) {
        console.error('❌ Ошибка планировщика:', error);
      }
    });

    this.isScheduled = true;
    console.log('✅ Планировщик запущен с интервалом 30 минут');
  }

  // Проверить и опубликовать
  async checkAndPublish() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (this.nextPost && this.nextPost.scheduled_time === currentTime) {
      console.log(`🚀 Время публикации! Пост: ${this.nextPost.title}`);
      
      // Здесь будет вызов функции публикации
      await this.publishScheduledPost(this.nextPost);
    }
  }

  // Опубликовать запланированный пост
  async publishScheduledPost(post) {
    try {
      // Помечаем как опубликованный
      post.status = 'published';
      post.published_at = new Date().toISOString();
      
      // Если есть реклама, добавляем её
      if (post.will_include_ad) {
        const ad = this.getNextAd();
        post.content = post.content + '\n\n' + ad;
      }
      
      console.log(`✅ Опубликовано: ${post.title}`);
      
      // Очищаем текущий пост
      this.nextPost = null;
      
      return post;
    } catch (error) {
      post.status = 'failed';
      post.error = error.message;
      console.error(`❌ Ошибка публикации: ${error.message}`);
      throw error;
    }
  }

  // Получить следующую рекламу
  getNextAd() {
    if (adQueue.length === 0) {
      this.initializeDefaultAds();
    }
    
    const ad = adQueue.shift();
    adQueue.push(ad); // Перемещаем в конец очереди
    
    return this.formatAd(ad);
  }

  // Форматировать рекламу
  formatAd(ad) {
    const timestamp = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
---

${ad.emoji || '💼'} ${ad.title}

${ad.description}

${ad.call_to_action || 'Подробности в описании канала'}

${ad.contact ? `📞 ${ad.contact}` : ''}
${ad.price ? `💰 ${ad.price}` : ''}
${ad.link ? `🔗 ${ad.link}` : ''}
`;
  }

  // Инициализировать рекламу по умолчанию
  initializeDefaultAds() {
    adQueue = [
      {
        id: 'consultation',
        emoji: '💼',
        title: 'КОНСУЛЬТАЦИИ ПО ЗАКУПКАМ ИЗ КИТАЯ',
        description: 'Поможем найти надежных поставщиков и избежать подводных камней при работе с китайскими производителями.',
        call_to_action: 'Получить консультацию',
        contact: '@chinatech_consult',
        price: 'от 5,000₽',
        priority: 1
      },
      {
        id: 'marathon',
        emoji: '🚀',
        title: 'МАРАФОН "БИЗНЕС С КИТАЕМ"',
        description: '5-дневный интенсив по запуску прибыльного бизнеса с китайскими товарами. От идеи до первых продаж.',
        call_to_action: 'Записаться на марафон',
        contact: '@chinatech_marathon', 
        price: '2,990₽',
        priority: 2
      },
      {
        id: 'suppliers',
        emoji: '🏭',
        title: 'БАЗА НАДЕЖНЫХ ПОСТАВЩИКОВ',
        description: 'Актуальная база проверенных китайских производителей с контактами и ценами. 500+ компаний.',
        call_to_action: 'Получить доступ к базе',
        contact: '@chinatech_suppliers',
        price: '1,500₽',
        priority: 3
      },
      {
        id: 'course',
        emoji: '📚',
        title: 'КУРС "ЗАКУПКИ В КИТАЕ"',
        description: 'Пошаговый курс по закупкам от поиска поставщиков до доставки в Россию. Видеоуроки + шаблоны.',
        call_to_action: 'Купить курс',
        contact: '@chinatech_course',
        price: '7,990₽',
        priority: 4
      }
    ];
  }

  // Добавить свою рекламу
  addCustomAd(adData) {
    const newAd = {
      id: `custom_${Date.now()}`,
      ...adData,
      priority: adQueue.length + 1
    };
    
    adQueue.push(newAd);
    console.log(`📢 Добавлена реклама: ${newAd.title}`);
    return newAd;
  }

  // Удалить рекламу
  removeAd(adId) {
    const index = adQueue.findIndex(ad => ad.id === adId);
    if (index !== -1) {
      const removed = adQueue.splice(index, 1)[0];
      console.log(`🗑️ Удалена реклама: ${removed.title}`);
      return removed;
    }
    return null;
  }

  // Получить статистику
  getStats() {
    const today = new Date().toDateString();
    const todayPosts = scheduleHistory.filter(post => 
      new Date(post.created_at).toDateString() === today
    );

    return {
      total_posts: scheduleHistory.length,
      today_posts: todayPosts.length,
      published_today: todayPosts.filter(p => p.status === 'published').length,
      failed_today: todayPosts.filter(p => p.status === 'failed').length,
      next_post: this.nextPost,
      ad_queue_size: adQueue.length,
      next_ad: adQueue[0]?.title || 'Нет рекламы'
    };
  }
}

// Экспортируем экземпляр планировщика
export const contentScheduler = new ContentScheduler();
export { SCHEDULER_CONFIG };

// Запускаем планировщик при импорте
if (process.env.NODE_ENV === 'production') {
  contentScheduler.startScheduler();
}