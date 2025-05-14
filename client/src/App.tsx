import { useState } from 'react';
import styled from 'styled-components';
import type { Item } from './services/api';
import { useSelectedItems } from './services/api';
import ItemList from './components/ItemList';
import SearchBar from './components/SearchBar';

const AppContainer = styled.div`
  font-family: 'Arial', sans-serif;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #1890ff;
`;

const SelectedItemsContainer = styled.div`
  margin-top: 40px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const SelectedItemsTitle = styled.h2`
  margin-bottom: 20px;
  color: #333;
`;

const SelectedItemsList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const SelectedItem = styled.li`
  padding: 10px;
  margin-bottom: 5px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
`;

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  // Используем хук useSelectedItems для получения выбранных элементов
  const { data: selectedItems = [] as Item[] } = useSelectedItems();

  // Обработчик изменения поискового запроса
  const handleSearch = (term: string) => {
    console.log('App: handleSearch вызван с term:', term);
    setSearchTerm(term);
    console.log('App: searchTerm обновлен на:', term);
  };

  // Обработчик изменения элементов списка
  const handleItemsChange = (items: Item[]) => {
    console.log(
      'App: handleItemsChange вызван с количеством элементов:',
      items.length
    );
    // Нет необходимости вручную обновлять данные,
    // react-query автоматически обновит их при изменении
  };

  return (
    <AppContainer>
      <Title>Список элементов (1 - 1 000 000)</Title>

      <SearchBar onSearch={handleSearch} />

      <ItemList searchTerm={searchTerm} onItemsChange={handleItemsChange} />

      {selectedItems.length > 0 && (
        <SelectedItemsContainer>
          <SelectedItemsTitle>
            Выбранные элементы ({selectedItems.length})
          </SelectedItemsTitle>
          <SelectedItemsList>
            {selectedItems.map((item) => (
              <SelectedItem key={item.id}>
                <span>ID: {item.id}</span>
                <span>Значение: {item.value}</span>
              </SelectedItem>
            ))}
          </SelectedItemsList>
        </SelectedItemsContainer>
      )}
    </AppContainer>
  );
}

export default App;
