import axios from 'axios';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

// Базовый URL для API
const API_URL = 'http://localhost:3001/api';

// Интерфейс для элемента списка
export interface Item {
  id: number;
  value: number;
  selected: boolean;
  order: number;
}

// Интерфейс для ответа API с пагинацией
export interface PaginatedResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Ключи для кэша React Query
export const QUERY_KEYS = {
  ITEMS: 'items',
  SELECTED_ITEMS: 'selectedItems',
};

// API-клиент с кэшированием и оптимизацией запросов

// Получение элементов с пагинацией и поиском
export const getItems = async (
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse> => {
  // Добавляем лог для отслеживания параметров запроса
  console.log('API getItems: параметры запроса:', { page, limit, search });

  const params = { page, limit, search };
  const response = await axios.get(`${API_URL}/items`, { params });

  // Добавляем лог для отслеживания ответа сервера
  console.log('API getItems: ответ сервера:', {
    itemsCount: response.data.items.length,
    total: response.data.total,
    page: response.data.page,
    totalPages: response.data.totalPages,
  });

  return response.data;
};

// Хук для получения элементов с бесконечной загрузкой и кэшированием
export const useItems = (page: number, limit: number, search?: string) => {
  // Добавляем лог для отслеживания параметров хука
  console.log('useItems: параметры хука:', { page, limit, search });

  return useInfiniteQuery(
    // Добавляем page в ключ кэша, чтобы при изменении search сбрасывался кэш
    [QUERY_KEYS.ITEMS, page, limit, search],
    ({ pageParam = 1 }) => {
      console.log('useItems: вызов getItems с pageParam:', pageParam);
      return getItems(pageParam, limit, search);
    },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.page < lastPage.totalPages) {
          return lastPage.page + 1;
        }
        return undefined;
      },
      staleTime: 30000, // Данные считаются актуальными в течение 30 секунд
      cacheTime: 300000, // Кэш хранится 5 минут,
      // Сбрасываем данные при изменении поискового запроса
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

// Получение выбранных элементов
export const getSelectedItems = async (): Promise<Item[]> => {
  const response = await axios.get(`${API_URL}/items/selected`);
  return response.data;
};

// Хук для получения выбранных элементов с кэшированием
export const useSelectedItems = () => {
  return useQuery([QUERY_KEYS.SELECTED_ITEMS], getSelectedItems, {
    staleTime: 30000,
    cacheTime: 300000,
  });
};

// Выбор/отмена выбора элемента
export const toggleSelection = async (id: number): Promise<Item> => {
  const response = await axios.post(`${API_URL}/items/toggle-selection/${id}`);
  return response.data;
};

// Хук для выбора/отмены выбора элемента с обновлением кэша
export const useToggleSelection = () => {
  const queryClient = useQueryClient();

  return useMutation(toggleSelection, {
    // При успешном выполнении инвалидируем кэш
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.ITEMS]);
      queryClient.invalidateQueries([QUERY_KEYS.SELECTED_ITEMS]);
    },
  });
};

// Обновление порядка элементов (для Drag&Drop)
export const reorderItems = async (
  sourceIndex: number,
  destinationIndex: number,
  items: Item[]
): Promise<Item[]> => {
  const response = await axios.post(`${API_URL}/items/reorder`, {
    sourceIndex,
    destinationIndex,
    items,
  });
  return response.data;
};

// Хук для обновления порядка элементов с обновлением кэша
export const useReorderItems = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      sourceIndex,
      destinationIndex,
      items,
    }: {
      sourceIndex: number;
      destinationIndex: number;
      items: Item[];
    }) => reorderItems(sourceIndex, destinationIndex, items),
    {
      // При успешном выполнении инвалидируем кэш
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.ITEMS]);
        queryClient.invalidateQueries([QUERY_KEYS.SELECTED_ITEMS]);
      },
    }
  );
};
