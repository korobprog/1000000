import React, { useState } from 'react';
import styled from 'styled-components';
// Закомментируем неиспользуемые импорты вместо удаления, чтобы легко вернуть их при необходимости
// import { FixedSizeList as List } from 'react-window';
// import InfiniteLoader from 'react-window-infinite-loader';
// import AutoSizer from 'react-virtualized-auto-sizer';
import { useQueryClient } from '@tanstack/react-query';
import type { Item } from '../services/api';
import {
  useItems,
  useToggleSelection,
  useReorderItems,
  QUERY_KEYS,
} from '../services/api';

// Стили для компонентов
const ListContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 600px; // Фиксированная высота для виртуализации
`;

const Table = styled.div`
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  background-color: #f2f2f2;
  border-bottom: 1px solid #ddd;
  padding: 12px;
  font-weight: bold;
`;

const TableRow = styled.div<{ $isSelected: boolean; $isDragging: boolean }>`
  display: grid;
  grid-template-columns: 80px 100px 1fr;
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  opacity: ${(props) => (props.$isDragging ? 0.5 : 1)};
  cursor: grab;
  border-bottom: 1px solid #ddd;

  &:hover {
    background-color: ${(props) => (props.$isSelected ? '#bae7ff' : '#f5f5f5')};
  }
`;

const TableCell = styled.div`
  padding: 12px;
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;

const LoadingMessage = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 18px;
`;

const PaginationInfo = styled.div`
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
`;

interface ItemListProps {
  searchTerm: string;
  onItemsChange: (items: Item[]) => void;
}

const ITEMS_PER_PAGE = 20;
// Закомментируем неиспользуемую переменную
// const ROW_HEIGHT = 50;

const ItemList: React.FC<ItemListProps> = ({ searchTerm, onItemsChange }) => {
  const [page, setPage] = useState(1);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  // Добавляем лог для отслеживания изменения searchTerm
  console.log('ItemList: searchTerm изменился на:', searchTerm);

  // Получаем queryClient для управления кэшем
  const queryClient = useQueryClient();

  // Сбрасываем страницу и кэш при изменении поискового запроса
  React.useEffect(() => {
    console.log('ItemList: сбрасываем страницу из-за изменения searchTerm');
    setPage(1);

    // Сбрасываем кэш запросов при изменении поискового запроса
    console.log('ItemList: инвалидируем кэш запросов');
    queryClient.invalidateQueries([QUERY_KEYS.ITEMS]);
  }, [searchTerm, queryClient]);

  // Используем React Query для получения данных с кэшированием
  // Убираем неиспользуемые переменные из деструктуризации
  const { data, isLoading, isFetching } = useItems(
    page,
    ITEMS_PER_PAGE,
    searchTerm
  );

  // Добавляем лог для отслеживания данных, полученных от хука useItems
  console.log('ItemList: данные получены:', {
    pagesCount: data?.pages?.length,
    itemsCount: data?.pages
      ? data.pages.flatMap((page) => page.items).length
      : 0,
    isLoading,
    isFetching,
  });

  // Добавляем детальный лог для проверки структуры данных
  if (data?.pages && data.pages.length > 0) {
    console.log('ItemList: детальная структура первой страницы:', {
      firstPageItems: data.pages[0].items.slice(0, 3), // Показываем первые 3 элемента
      total: data.pages[0].total,
      totalPages: data.pages[0].totalPages,
      page: data.pages[0].page,
    });
  } else {
    console.log('ItemList: данные отсутствуют или пусты');
  }

  // Мутации для выбора элементов и изменения порядка
  const toggleSelectionMutation = useToggleSelection();
  const reorderItemsMutation = useReorderItems();

  // Получаем все элементы из всех страниц
  const items = data?.pages ? data.pages.flatMap((page) => page.items) : [];
  const totalItems =
    data?.pages && data.pages.length > 0 ? data.pages[0].total : 0;
  const totalPages =
    data?.pages && data.pages.length > 0 ? data.pages[0].totalPages : 0;

  // Закомментируем неиспользуемую функцию
  // Обработчик загрузки следующей страницы
  // const loadMoreItems = useCallback(() => {
  //   if (!isFetching && hasNextPage) {
  //     setPage((prevPage) => prevPage + 1);
  //     fetchNextPage();
  //   }
  // }, [isFetching, hasNextPage, fetchNextPage]);

  // Закомментируем неиспользуемую функцию
  // // Проверка, загружен ли элемент
  // const isItemLoaded = useCallback(
  //   (index: number) => {
  //     return index < items.length;
  //   },
  //   [items]
  // );

  // Обработчик выбора элемента
  const handleToggleSelection = async (id: number) => {
    try {
      toggleSelectionMutation.mutate(id);
    } catch (error) {
      console.error('Ошибка при выборе элемента:', error);
    }
  };

  // Обработчики для Drag&Drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: Item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Добавляем прозрачное изображение для лучшего UX
    const img = new Image();
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetItem: Item
  ) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const sourceIndex = items.findIndex((item) => item.id === draggedItem.id);
    const destinationIndex = items.findIndex(
      (item) => item.id === targetItem.id
    );

    if (sourceIndex === -1 || destinationIndex === -1) return;

    try {
      reorderItemsMutation.mutate({
        sourceIndex,
        destinationIndex,
        items,
      });
    } catch (error) {
      console.error('Ошибка при перемещении элемента:', error);
    }

    setDraggedItem(null);
  };

  // Закомментируем неиспользуемую функцию renderRow
  // // Рендер элемента списка
  // const renderRow = useCallback(
  //   ({ index, style }: { index: number; style: React.CSSProperties }) => {
  //     console.log('renderRow вызван для индекса:', index, 'стиль:', style);

  //     if (!isItemLoaded(index)) {
  //       console.log('Рендеринг строки загрузки с пропсами:', {
  //         $isSelected: false,
  //         $isDragging: false,
  //         index,
  //       });
  //       return (
  //         <TableRow style={style} $isSelected={false} $isDragging={false}>
  //           <TableCell>Загрузка...</TableCell>
  //           <TableCell></TableCell>
  //           <TableCell></TableCell>
  //         </TableRow>
  //       );
  //     }

  //     const item = items[index];
  //     console.log('Рендеринг строки элемента с пропсами:', {
  //       $isSelected: item.selected,
  //       $isDragging: draggedItem?.id === item.id,
  //       id: item.id,
  //       index,
  //     });

  //     return (
  //       <TableRow
  //         style={style}
  //         $isSelected={item.selected}
  //         $isDragging={draggedItem?.id === item.id}
  //         draggable
  //         onDragStart={(e) => handleDragStart(e, item)}
  //         onDragOver={handleDragOver}
  //         onDrop={(e) => handleDrop(e, item)}
  //       >
  //         <TableCell>
  //           <Checkbox
  //             type="checkbox"
  //             checked={item.selected}
  //             onChange={() => handleToggleSelection(item.id)}
  //           />
  //         </TableCell>
  //         <TableCell>{item.id}</TableCell>
  //         <TableCell>{item.value}</TableCell>
  //       </TableRow>
  //     );
  //   },
  //   [items, draggedItem, isItemLoaded, handleToggleSelection]
  // );

  // Обновляем родительский компонент при изменении данных
  React.useEffect(() => {
    if (data?.pages && data.pages.length > 0) {
      const allItems = data.pages.flatMap((page) => page.items);
      onItemsChange(allItems);
    }
  }, [data, onItemsChange]);

  // Добавляем ref для контейнера таблицы
  const tableRef = React.useRef<HTMLDivElement>(null);

  // Логируем размеры контейнера при монтировании и обновлении
  React.useEffect(() => {
    if (tableRef.current) {
      console.log('Размеры контейнера таблицы:', {
        offsetWidth: tableRef.current.offsetWidth,
        offsetHeight: tableRef.current.offsetHeight,
        clientWidth: tableRef.current.clientWidth,
        clientHeight: tableRef.current.clientHeight,
      });
    }
  }, [data]);

  return (
    <ListContainer>
      <TableHeader>
        <div>Выбор</div>
        <div>ID</div>
        <div>Значение</div>
      </TableHeader>

      <Table ref={tableRef}>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {/* Рендерим первые 20 элементов напрямую без виртуализации */}
          {items.slice(0, 20).map((item) => (
            <TableRow
              key={item.id}
              $isSelected={item.selected}
              $isDragging={draggedItem?.id === item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
            >
              <TableCell>
                <Checkbox
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => handleToggleSelection(item.id)}
                />
              </TableCell>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}

          {/* Если элементов нет, показываем сообщение */}
          {items.length === 0 && !isLoading && (
            <TableRow $isSelected={false} $isDragging={false}>
              <TableCell
                style={{ gridColumn: '1 / span 3', textAlign: 'center' }}
              >
                Нет элементов для отображения
              </TableCell>
            </TableRow>
          )}

          {/* Если идет загрузка и нет элементов, показываем индикатор загрузки */}
          {isLoading && items.length === 0 && (
            <TableRow $isSelected={false} $isDragging={false}>
              <TableCell
                style={{ gridColumn: '1 / span 3', textAlign: 'center' }}
              >
                Загрузка...
              </TableCell>
            </TableRow>
          )}
        </div>
      </Table>

      {isLoading && <LoadingMessage>Загрузка...</LoadingMessage>}

      {!isLoading && data?.pages && data.pages.length > 0 && (
        <PaginationInfo>
          Страница {page} из {totalPages} (всего элементов: {totalItems})
        </PaginationInfo>
      )}
    </ListContainer>
  );
};

export default ItemList;
