import { redisService } from '../services/redisService';

export interface Item {
  id: number;
  value: number;
  selected: boolean;
  order: number;
}

// Ключи Redis
const REDIS_KEYS = {
  ITEM_PREFIX: 'item:',
  SELECTED_ITEMS: 'selected_items',
  ORDERED_ITEMS: 'ordered_items',
  SEARCH_CACHE_PREFIX: 'search:',
  TOTAL_COUNT_CACHE_PREFIX: 'total_count:',
  ITEMS_CACHE_PREFIX: 'items:page:',
};

// Максимальное количество элементов
const MAX_ITEMS = 1000000;

// Время жизни кэша в секундах
const CACHE_TTL = 60;

// Хранилище данных с использованием Redis
export class ItemStore {
  constructor() {
    this.initRedis();
  }

  // Инициализация Redis
  private async initRedis(): Promise<void> {
    try {
      await redisService.connect();

      // Проверяем, инициализирован ли Redis
      const isInitialized = await redisService.exists(REDIS_KEYS.ORDERED_ITEMS);

      if (isInitialized === 0) {
        console.log('Инициализация Redis...');
        // Инициализируем отсортированное множество для порядка элементов
        // Добавляем только первые 100 элементов для быстрой инициализации
        for (let i = 1; i <= 100; i++) {
          await redisService.zAdd(REDIS_KEYS.ORDERED_ITEMS, i, i.toString());
        }
        console.log('Redis инициализирован');
      }
    } catch (error) {
      console.error('Ошибка при инициализации Redis:', error);
    }
  }

  // Получение элемента по ID (с ленивой загрузкой)
  private async getItemById(id: number): Promise<Item | null> {
    try {
      // Проверяем, есть ли элемент в Redis
      const itemKey = `${REDIS_KEYS.ITEM_PREFIX}${id}`;
      const itemData = await redisService.hGetAll(itemKey);

      // Если элемент найден в Redis, возвращаем его
      if (Object.keys(itemData).length > 0) {
        return {
          id: parseInt(itemData.id),
          value: parseInt(itemData.value),
          selected: itemData.selected === 'true',
          order: parseInt(itemData.order),
        };
      }

      // Если элемент не найден и ID в допустимом диапазоне, создаем его (ленивая загрузка)
      if (id >= 1 && id <= MAX_ITEMS) {
        const newItem: Item = {
          id,
          value: id,
          selected: false,
          order: id,
        };

        // Сохраняем элемент в Redis
        await redisService.hMSet(itemKey, {
          id: id.toString(),
          value: id.toString(),
          selected: 'false',
          order: id.toString(),
        });

        // Добавляем элемент в отсортированное множество, если его там еще нет
        await redisService.zAdd(REDIS_KEYS.ORDERED_ITEMS, id, id.toString());

        return newItem;
      }

      return null;
    } catch (error) {
      console.error(`Ошибка при получении элемента с ID ${id}:`, error);
      return null;
    }
  }

  // Получение элементов с пагинацией и кэшированием
  async getItems(
    page: number,
    limit: number,
    search?: string
  ): Promise<Item[]> {
    try {
      // Создаем ключ кэша на основе параметров запроса
      const cacheKey = `${
        REDIS_KEYS.ITEMS_CACHE_PREFIX
      }${page}:limit:${limit}:search:${search || ''}`;

      // Проверяем кэш
      const cachedResult = await redisService.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      let result: Item[] = [];

      // Если есть поисковый запрос, выполняем поиск
      if (search && search.trim() !== '') {
        console.log('ItemStore: Выполняем поиск с запросом:', search);

        // Для простоты реализации поиска, мы будем загружать элементы по порядку
        // и фильтровать их. В реальном приложении лучше использовать RediSearch.
        const searchTerm = search.toLowerCase();
        console.log(
          'ItemStore: Поисковый запрос в нижнем регистре:',
          searchTerm
        );

        // Получаем все ID элементов из отсортированного множества
        const allIds = await redisService.zRange(
          REDIS_KEYS.ORDERED_ITEMS,
          0,
          -1
        );
        console.log(
          'ItemStore: Получено ID элементов из Redis:',
          allIds.length
        );

        // Фильтруем элементы по поисковому запросу
        const matchingIds: number[] = [];
        for (const idStr of allIds) {
          const id = parseInt(idStr);
          if (id.toString().includes(searchTerm)) {
            matchingIds.push(id);
          }

          // Ограничиваем количество проверяемых элементов для производительности
          if (matchingIds.length >= page * limit * 2) {
            break;
          }
        }
        console.log(
          'ItemStore: Найдено соответствующих ID:',
          matchingIds.length
        );

        // Применяем пагинацию к отфильтрованным ID
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedIds = matchingIds.slice(startIndex, endIndex);
        console.log('ItemStore: ID после пагинации:', paginatedIds);

        // Получаем элементы по ID
        result = await Promise.all(
          paginatedIds.map((id) => this.getItemById(id))
        ).then((items) => items.filter((item) => item !== null) as Item[]);
        console.log(
          'ItemStore: Получено элементов после фильтрации:',
          result.length
        );
      } else {
        // Если нет поискового запроса, получаем элементы из отсортированного множества
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit - 1;

        // Получаем ID элементов из отсортированного множества
        const ids = await redisService.zRange(
          REDIS_KEYS.ORDERED_ITEMS,
          startIndex,
          endIndex
        );

        // Получаем элементы по ID
        result = await Promise.all(
          ids.map((id) => this.getItemById(parseInt(id)))
        ).then((items) => items.filter((item) => item !== null) as Item[]);
      }

      // Сохраняем результат в кэш
      await redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Ошибка при получении элементов:', error);
      return [];
    }
  }

  // Получение общего количества элементов с кэшированием
  async getTotalCount(search?: string): Promise<number> {
    try {
      // Создаем ключ кэша
      const cacheKey = `${REDIS_KEYS.TOTAL_COUNT_CACHE_PREFIX}${search || ''}`;

      // Проверяем кэш
      const cachedCount = await redisService.get(cacheKey);
      if (cachedCount) {
        return parseInt(cachedCount);
      }

      let count: number;

      // Если есть поисковый запрос, выполняем поиск
      if (search && search.trim() !== '') {
        const searchTerm = search.toLowerCase();

        // В реальном приложении здесь лучше использовать RediSearch
        // Для демонстрации используем простой подход

        // Получаем все ID элементов из отсортированного множества
        const allIds = await redisService.zRange(
          REDIS_KEYS.ORDERED_ITEMS,
          0,
          -1
        );

        // Фильтруем элементы по поисковому запросу
        let matchingCount = 0;
        for (const idStr of allIds) {
          const id = parseInt(idStr);
          if (id.toString().includes(searchTerm)) {
            matchingCount++;
          }
        }

        count = matchingCount;
      } else {
        // Если нет поискового запроса, возвращаем общее количество элементов
        count = MAX_ITEMS;
      }

      // Сохраняем результат в кэш
      await redisService.set(cacheKey, count.toString(), CACHE_TTL);

      return count;
    } catch (error) {
      console.error('Ошибка при получении общего количества элементов:', error);
      return 0;
    }
  }

  // Выбор/отмена выбора элемента
  async toggleSelection(id: number): Promise<Item | null> {
    try {
      // Получаем элемент
      const item = await this.getItemById(id);
      if (!item) {
        return null;
      }

      // Инвертируем состояние выбора
      item.selected = !item.selected;

      // Обновляем элемент в Redis
      const itemKey = `${REDIS_KEYS.ITEM_PREFIX}${id}`;
      await redisService.hSet(
        itemKey,
        'selected',
        item.selected ? 'true' : 'false'
      );

      // Обновляем множество выбранных элементов
      if (item.selected) {
        await redisService.sAdd(REDIS_KEYS.SELECTED_ITEMS, id.toString());
      } else {
        await redisService.sRem(REDIS_KEYS.SELECTED_ITEMS, id.toString());
      }

      // Инвалидируем кэш
      await this.invalidateCache();

      return item;
    } catch (error) {
      console.error(
        `Ошибка при переключении выбора элемента с ID ${id}:`,
        error
      );
      return null;
    }
  }

  // Получение выбранных элементов
  async getSelectedItems(): Promise<Item[]> {
    try {
      // Получаем ID выбранных элементов из множества
      const selectedIds = await redisService.sMembers(
        REDIS_KEYS.SELECTED_ITEMS
      );

      // Получаем элементы по ID
      const selectedItems = await Promise.all(
        selectedIds.map((id) => this.getItemById(parseInt(id)))
      ).then((items) => items.filter((item) => item !== null) as Item[]);

      // Сортируем элементы по порядку
      return selectedItems.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Ошибка при получении выбранных элементов:', error);
      return [];
    }
  }

  // Обновление порядка элемента
  async updateOrder(itemId: number, newOrder: number): Promise<void> {
    try {
      // Получаем элемент
      const item = await this.getItemById(itemId);
      if (!item) {
        return;
      }

      // Обновляем порядок элемента
      item.order = newOrder;

      // Обновляем элемент в Redis
      const itemKey = `${REDIS_KEYS.ITEM_PREFIX}${itemId}`;
      await redisService.hSet(itemKey, 'order', newOrder.toString());

      // Обновляем позицию в отсортированном множестве
      await redisService.zAdd(
        REDIS_KEYS.ORDERED_ITEMS,
        newOrder,
        itemId.toString()
      );

      // Инвалидируем кэш
      await this.invalidateCache();
    } catch (error) {
      console.error(
        `Ошибка при обновлении порядка элемента с ID ${itemId}:`,
        error
      );
    }
  }

  // Перемещение элемента (для Drag&Drop)
  async moveItem(
    sourceIndex: number,
    destinationIndex: number,
    items: Item[]
  ): Promise<Item[]> {
    try {
      // Перемещаем элемент в массиве
      const result = [...items];
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);

      // Обновляем порядок элементов
      for (let i = 0; i < result.length; i++) {
        await this.updateOrder(result[i].id, i + 1);
      }

      // Инвалидируем кэш
      await this.invalidateCache();

      return result;
    } catch (error) {
      console.error('Ошибка при перемещении элемента:', error);
      return items;
    }
  }

  // Инвалидация кэша
  private async invalidateCache(): Promise<void> {
    try {
      // Удаляем все ключи кэша
      const itemsCacheKeys = await redisService.keys(
        `${REDIS_KEYS.ITEMS_CACHE_PREFIX}*`
      );
      const totalCountCacheKeys = await redisService.keys(
        `${REDIS_KEYS.TOTAL_COUNT_CACHE_PREFIX}*`
      );
      const searchCacheKeys = await redisService.keys(
        `${REDIS_KEYS.SEARCH_CACHE_PREFIX}*`
      );

      const allCacheKeys = [
        ...itemsCacheKeys,
        ...totalCountCacheKeys,
        ...searchCacheKeys,
      ];

      for (const key of allCacheKeys) {
        await redisService.del(key);
      }
    } catch (error) {
      console.error('Ошибка при инвалидации кэша:', error);
    }
  }
}

// Создаем и экспортируем экземпляр хранилища
export const itemStore = new ItemStore();
