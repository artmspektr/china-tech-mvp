// backend/api/ads/manager.js
import { contentScheduler } from '../scheduler/planner.js';

// Управление рекламой
export default async function handler(req, res) {
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        return getAds(req, res);
      case 'POST':
        return addAd(req, res);
      case 'DELETE':
        return deleteAd(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Ads manager error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Получить список рекламы
async function getAds(req, res) {
  const ads = contentScheduler.adQueue;
  
  res.status(200).json({
    success: true,
    ads: ads,
    total_ads: ads.length,
    next_ad: ads[0] || null
  });
}

// Добавить рекламу
async function addAd(req, res) {
  const { title, description, emoji, contact, price, link, call_to_action } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      error: 'Title and description are required'
    });
  }
  
  const newAd = contentScheduler.addCustomAd({
    title,
    description,
    emoji: emoji || '💼',
    contact: contact || '',
    price: price || '',
    link: link || '',
    call_to_action: call_to_action || 'Подробности в описании канала'
  });
  
  res.status(201).json({
    success: true,
    message: 'Реклама добавлена',
    ad: newAd
  });
}

// Удалить рекламу
async function deleteAd(req, res) {
  const { adId } = req.query;
  
  if (!adId) {
    return res.status(400).json({
      success: false,
      error: 'Ad ID is required'
    });
  }
  
  const removedAd = contentScheduler.removeAd(adId);
  
  if (!removedAd) {
    return res.status(404).json({
      success: false,
      error: 'Реклама не найдена'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Реклама удалена',
    removed_ad: removedAd
  });
}