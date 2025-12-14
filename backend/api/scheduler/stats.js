// backend/api/scheduler/stats.js
import { contentScheduler } from './planner.js';

// API для получения статистики планировщика
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = contentScheduler.getStats();
    const dailyPlan = contentScheduler.getDailyPlan();
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: stats,
      daily_plan: dailyPlan
    });
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}