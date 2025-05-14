// Модель для элементов списка
class ItemStore {
  constructor() {
    // Инициализация списка с числами от 1 до 1 000 000
    this.items = Array.from({ length: 1000000 }, (_, index) => ({
      id: index + 1,
      value: index + 1,
      selected: false,
      order: index + 1,
    }));
    this.selectedItems = new Set();
    this.customOrder = new Map();
  }

  // Получение элементов с пагинацией
  getItems(page, limit, search) {
    let filteredItems = this.items;

    // Применяем поиск, если указан
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.value.toString().includes(searchTerm)
      );
    }

    // Применяем пользовательскую сортировку
    filteredItems = [...filteredItems].sort((a, b) => {
      const orderA = this.customOrder.get(a.id) || a.order;
      const orderB = this.customOrder.get(b.id) || b.order;
      return orderA - orderB;
    });

    // Применяем пагинацию
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredItems.slice(startIndex, endIndex);
  }

  // Получение общего количества элементов (для пагинации)
  getTotalCount(search) {
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase();
      return this.items.filter((item) =>
        item.value.toString().includes(searchTerm)
      ).length;
    }
    return this.items.length;
  }

  // Выбор/отмена выбора элемента
  toggleSelection(id) {
    const item = this.items.find((item) => item.id === id);
    if (item) {
      item.selected = !item.selected;

      if (item.selected) {
        this.selectedItems.add(id);
      } else {
        this.selectedItems.delete(id);
      }

      return item;
    }
    return null;
  }

  // Получение выбранных элементов
  getSelectedItems() {
    return this.items
      .filter((item) => this.selectedItems.has(item.id))
      .sort((a, b) => {
        const orderA = this.customOrder.get(a.id) || a.order;
        const orderB = this.customOrder.get(b.id) || b.order;
        return orderA - orderB;
      });
  }

  // Обновление порядка элементов
  updateOrder(itemId, newOrder) {
    this.customOrder.set(itemId, newOrder);
  }

  // Перемещение элемента (для Drag&Drop)
  moveItem(sourceIndex, destinationIndex, items) {
    const result = [...items];
    const [removed] = result.splice(sourceIndex, 1);
    result.splice(destinationIndex, 0, removed);

    // Обновляем порядок
    result.forEach((item, index) => {
      this.updateOrder(item.id, index + 1);
    });

    return result;
  }
}

// Создаем и экспортируем экземпляр хранилища
const itemStore = new ItemStore();

module.exports = { itemStore };
