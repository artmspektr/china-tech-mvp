// backend/api/scheduler/next.js
import { contentScheduler } from './planner.js';

// Получить информацию о следующей публикации
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const nextPublication = contentScheduler.getNextPublication();
    const dailyPlan = contentScheduler.getDailyPlan();
    const stats = contentScheduler.getStats();
    
    // Добавляем информацию о времени
    const now = new Date();
    const timeToNext = calculateTimeToNext(nextPublication.scheduled_time);
    
    res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      next_publication: {
        ...nextPublication,
        time_to_next: timeToNext,
        current_time: now.toTimeString().slice(0, 5)
      },
      daily_plan: dailyPlan,
      system_stats: stats
    });
  } catch (error) {
    console.error('Next publication API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Рассчитать время до следующей публикации
function calculateTimeToNext(scheduledTime) {
  const now = new Date();
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  // Создаем дату для сегодняшнего дня
  const scheduledDate = new Date();
  scheduledDate.setHours(hours, minutes, 0, 0);
  
  // Если время уже прошло, планируем на завтра
  if (scheduledDate <= now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }
  
  const diffMs = scheduledDate - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hoursLeft = Math.floor(diffMinutes / 60);
  const minutesLeft = diffMinutes % 60;
  
  if (diffMinutes <= 0) {
    return 'Сейчас';
  } else if (hoursLeft > 0) {
    return `${hoursLeft}ч ${minutesLeft}м`;
  } else {
    return `${minutesLeft}м`;
  }
}