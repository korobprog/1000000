const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { itemStore } = require('./models/Item');

// Создаем экземпляр приложения Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Маршруты API
const apiRouter = express.Router();

// Получение элементов с пагинацией и поиском
apiRouter.get('/items', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search;

  const items = itemStore.getItems(page, limit, search);
  const total = itemStore.getTotalCount(search);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// Получение выбранных элементов
apiRouter.get('/items/selected', (req, res) => {
  const selectedItems = itemStore.getSelectedItems();
  res.json(selectedItems);
});

// Выбор/отмена выбора элемента
apiRouter.post('/items/toggle-selection/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updatedItem = itemStore.toggleSelection(id);

  if (updatedItem) {
    res.json(updatedItem);
  } else {
    res.status(404).json({ error: 'Элемент не найден' });
  }
});

// Обновление порядка элементов (для Drag&Drop)
apiRouter.post('/items/reorder', (req, res) => {
  const { sourceIndex, destinationIndex, items } = req.body;

  if (sourceIndex === undefined || destinationIndex === undefined || !items) {
    return res.status(400).json({ error: 'Неверные параметры запроса' });
  }

  const updatedItems = itemStore.moveItem(sourceIndex, destinationIndex, items);
  res.json(updatedItems);
});

// Подключаем маршруты API
app.use('/api', apiRouter);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
