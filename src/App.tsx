import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ProductService, { Product } from './services/ProductService';

function App() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch products from Google Sheets when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const products = await ProductService.fetchProducts();
        setAllProducts(products);
        
        // Extract unique brands and categories
        const uniqueBrands = Array.from(new Set(products
          .map(product => product.marca)
          .filter(brand => brand && brand.trim() !== '')
          .sort()));
        
        const uniqueCategories = Array.from(new Set(products
          .map(product => product.category)
          .filter(category => category && category.trim() !== '')
          .sort()));
        
        setBrandOptions(uniqueBrands);
        setCategoryOptions(uniqueCategories);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products. Using backup data instead.');
      } finally {
        setIsLoading(false);
        // If the CSV loading fails, we could set some backup data here
        // or implement a retry mechanism
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim() && !selectedBrand && !selectedCategory) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Split the search query into individual words
    const searchWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    // Apply all filters: search query, brand, and category
    const filteredProducts = allProducts.filter((product: Product) => {
      // Text search filter
      const productName = product.name.toLowerCase();
      const productBrand = product.marca.toLowerCase();
      const matchesSearchQuery = searchWords.length === 0 || searchWords.some(word => 
        productName.includes(word) || productBrand.includes(word)
      );
      
      // Brand filter
      const matchesBrand = !selectedBrand || product.marca === selectedBrand;
      
      // Category filter
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      // Product must match all active filters
      return matchesSearchQuery && matchesBrand && matchesCategory;
    });
    
    setSearchResults(filteredProducts);
    setHasSearched(true);
  };

  return (
    <div className="App">
      <header className="App-header-top">
        <h1>Busca Produtos para Bebê</h1>
      </header>
      <main className="App-main">
        <div className="search-container">
          <SearchBar onSearch={handleSearch} />
          
          <div className="filter-container">
            <div className="filter-item">
              <label htmlFor="brand-filter">Marca:</label>
              <select 
                id="brand-filter" 
                value={selectedBrand} 
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '');
                }}
              >
                <option value="">Todas as marcas</option>
                {brandOptions.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <label htmlFor="category-filter">Categoria:</label>
              <select 
                id="category-filter" 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '');
                }}
              >
                <option value="">Todas as categorias</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading">
            <p>Carregando produtos...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="search-results">
            {hasSearched && searchResults.length === 0 ? (
              <p className="no-results">Nenhum produto encontrado. Tente outra busca.</p>
            ) : (
              searchResults.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    {product.marca && <p className="product-brand"><strong>Marca:</strong> {product.marca}</p>}
                    <p>{product.description}</p>
                    <p className="product-category">Categoria: {product.category}</p>
                    <p className="product-price">R$ {product.price.toFixed(2)}</p>
                    {product.opiniao && <p className="product-opinion"><strong>Opinião:</strong> {product.opiniao}</p>}
                    {product.link && (
                      <a 
                        href={product.link.startsWith('http') ? product.link : `https://${product.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="product-link"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Ver produto
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
            {!hasSearched && (
              <div className="search-instructions">
                <p>Digite um termo para buscar produtos para bebês</p>
                <p>Exemplos: fralda, mamadeira, carrinho...</p>
                <p className="data-source">Dados carregados do Google Sheets: {allProducts.length} produtos</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
