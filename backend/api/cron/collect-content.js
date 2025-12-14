// backend/api/cron/collect-content.js
import axios from 'axios';
import * as cheerio from 'cheerio';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@chinatech_news';
const GEMINI_KEY = process.env.GEMINI_KEY_1;

// Функция парсинга 36kr
async function parse36kr() {
  try {
    console.log('🔍 Парсинг 36kr...');
    
    const response = await axios.get('https://36kr.com/information/latest', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Поиск статей на странице
    $('a[href*="/p/"]').each((i, element) => {
      if (articles.length < 5) { // Берем только 5 статей
        const title = $(element).text().trim();
        const url = $(element).attr('href');
        
        if (title && url && title.length > 10) {
          articles.push({
            title: title,
            url: url.startsWith('http') ? url : `https://36kr.com${url}`,
            source: '36kr',
            category: 'startups'
          });
        }
      }
    });
    
    console.log(`✅ Найдено ${articles.length} статей на 36kr`);
    return articles;
    
  } catch (error) {
    console.error('❌ Ошибка парсинга 36kr:', error.message);
    return [];
  }
}

// Функция парсинга ifanr
async function parseIfanr() {
  try {
    console.log('🔍 Парсинг ifanr...');
    
    const response = await axios.get('https://www.ifanr.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Поиск статей
    $('.post-card__title').each((i, element) => {
      if (articles.length < 5) {
        const link = $(element).find('a');
        const title = link.text().trim();
        const url = link.attr('href');
        
        if (title && url && title.length > 10) {
          articles.push({
            title: title,
            url: url.startsWith('http') ? url : `https://www.ifanr.com${url}`,
            source: 'ifanr',
            category: 'gadgets'
          });
        }
      }
    });
    
    console.log(`✅ Найдено ${articles.length} статей на ifanr`);
    return articles;
    
  } catch (error) {
    console.error('❌ Ошибка парсинга ifanr:', error.message);
    return [];
  }
}

// Функция перевода через Gemini
async function translateWithGemini(text, type = 'telegram') {
  try {
    if (!GEMINI_KEY) {
      console.warn('⚠️ Gemini API key не настроен');
      return text.substring(0, 200); // Возвращаем часть оригинала
    }

    const prompt = getPromptForType(type, text);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.candidates && response.data.candidates[0]) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.warn('⚠️ Неожиданный ответ от Gemini API');
      return text.substring(0, 200);
    }
    
  } catch (error) {
    console.error('❌ Ошибка перевода:', error.message);
    return text.substring(0, 200); // Возвращаем часть оригинала при ошибке
  }
}

// Функция для получения промптов по типу контента
function getPromptForType(type, text) {
  const basePrompt = 'Переведи следующий текст с китайского на русский язык и адаптируй для российских читателей:';
  
  if (type === 'telegram') {
    return `${basePrompt}
Требования для Telegram:
- Максимум 200 символов
- Используй эмодзи 🔥 📱 💼
- Добавь хэштеги #КитайТех #Технологии
- Сделай живым и интересным

Текст: ${text}

Верни только готовый пост без дополнительных объяснений:`;
  }
  
  return `${basePrompt}
Переведи и адаптируй для российской аудитории.
Сделай кратким и понятным.

Текст: ${text}`;
}

// Функция публикации в Telegram
async function publishToTelegram(content) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram Bot Token не настроен');
    }

    const message = formatForTelegram(content);
    
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Сообщение опубликовано в Telegram');
    return {
      success: true,
      messageId: response.data.result.message_id,
      chatId: response.data.result.chat.id
    };
    
  } catch (error) {
    console.error('❌ Ошибка публикации в Telegram:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Функция форматирования для Telegram
function formatForTelegram(content) {
  const timestamp = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `🔥 ${content.title}

${content.description}

🔗 Источник: ${content.source}
🏷 #КитайТех #Технологии

💡 Новость из мира китайских технологий

🕒 ${timestamp}`;
}

// Основная функция сбора и публикации
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 Запуск сбора контента...');
  
  try {
    // 1. Собираем статьи
    const [krArticles, ifanrArticles] = await Promise.all([
      parse36kr(),
      parseIfanr()
    ]);
    
    const allArticles = [...krArticles, ...ifanrArticles];
    
    if (allArticles.length === 0) {
      throw new Error('Не удалось собрать статьи');
    }
    
    console.log(`📰 Всего собрано ${allArticles.length} статей`);
    
    // 2. Обрабатываем каждую статью
    const results = [];
    
    for (let i = 0; i < Math.min(allArticles.length, 3); i++) {
      const article = allArticles[i];
      
      try {
        console.log(`🔤 Обработка статьи: ${article.title.substring(0, 50)}...`);
        
        // Переводим контент
        const description = await translateWithGemini(
          `${article.title}. ${article.title}`, // Используем заголовок как описание для MVP
          'telegram'
        );
        
        const content = {
          ...article,
          description: description,
          processed_at: new Date().toISOString()
        };
        
        // Публикуем в Telegram
        const publishResult = await publishToTelegram(content);
        results.push({
          article: article.title,
          success: publishResult.success,
          publish_result: publishResult
        });
        
        // Задержка между публикациями
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('❌ Ошибка обработки статьи:', error.message);
        results.push({
          article: article.title,
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    
    res.status(200).json({
      success: true,
      message: 'Сбор контента завершен',
      stats: {
        total_articles: allArticles.length,
        processed: results.length,
        published: successful,
        failed: results.length - successful
      },
      results: results
    });
    
    console.log(`🎉 Сбор контента завершен. Опубликовано: ${successful}/${results.length}`);
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}