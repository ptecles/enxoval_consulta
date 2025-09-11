import React, { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="search-bar-content">
      <h2>Consulte a opinião da Elisa sobre os produtos que ela recomenda</h2>
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Digite o produto que você procura..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Buscar
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
