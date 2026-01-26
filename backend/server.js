const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./api/users');
const aiRoutes = require('./api/ai');

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Защита заголовков
app.use(cors()); // Разрешение междоменных запросов
app.use(express.json({ limit: '10mb' })); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded данных

// Простой маршрут для проверки работоспособности
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Подключение маршрутов
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;