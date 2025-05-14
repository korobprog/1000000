import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { itemsRouter } from './routes/items';
import { redisService } from './services/redisService';

// Создаем экземпляр приложения Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Подключаем маршруты API
app.use('/api/items', itemsRouter);

// Обработка ошибок
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
);

// Функция для корректного завершения работы
const gracefulShutdown = async () => {
  console.log('Завершение работы сервера...');

  try {
    // Отключаемся от Redis
    await redisService.disconnect();
    console.log('Отключено от Redis');

    process.exit(0);
  } catch (error) {
    console.error('Ошибка при завершении работы:', error);
    process.exit(1);
  }
};

// Обработка сигналов завершения
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
