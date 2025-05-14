import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

interface SearchBarProps {
  onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Используем debounce для предотвращения слишком частых запросов
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      console.log('SearchBar: вызов onSearch с term:', term);
      onSearch(term);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('SearchBar: handleSearchChange вызван с value:', value);
    setSearchTerm(value);
    console.log('SearchBar: вызов debouncedSearch с value:', value);
    debouncedSearch(value);
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder="Поиск..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </SearchContainer>
  );
};

// Функция debounce для отложенного выполнения
function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export default SearchBar;
