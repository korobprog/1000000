import express from 'express';
import type { Request, Response } from 'express';
import { itemStore } from '../models/Item';

// Создаем роутер
export const itemsRouter = express.Router();

// Получение элементов с пагинацией и поиском
itemsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    console.log('Server: GET /items запрос с параметрами:', {
      page,
      limit,
      search,
    });

    const [items, total] = await Promise.all([
      itemStore.getItems(page, limit, search),
      itemStore.getTotalCount(search),
    ]);

    console.log('Server: Результаты поиска:', {
      itemsCount: items.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchTerm: search,
    });

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Ошибка при получении элементов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение выбранных элементов
itemsRouter.get('/selected', async (req: Request, res: Response) => {
  try {
    const selectedItems = await itemStore.getSelectedItems();
    res.json(selectedItems);
  } catch (error) {
    console.error('Ошибка при получении выбранных элементов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Выбор/отмена выбора элемента
itemsRouter.post(
  '/toggle-selection/:id',
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedItem = await itemStore.toggleSelection(id);

      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ error: 'Элемент не найден' });
      }
    } catch (error) {
      console.error('Ошибка при переключении выбора элемента:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// Обновление порядка элементов (для Drag&Drop)
itemsRouter
  .route('/reorder')
  .post(async function (req: Request, res: Response) {
    try {
      const { sourceIndex, destinationIndex, items } = req.body;

      if (
        sourceIndex === undefined ||
        destinationIndex === undefined ||
        !items
      ) {
        res.status(400).json({ error: 'Неверные параметры запроса' });
        return;
      }

      const updatedItems = await itemStore.moveItem(
        sourceIndex,
        destinationIndex,
        items
      );
      res.json(updatedItems);
    } catch (error) {
      console.error('Ошибка при перемещении элемента:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });
