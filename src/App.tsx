import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ProductModal from './components/ProductModal';
import ProductService, { Product } from './services/ProductService';

const App: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch products from Google Sheets when component mounts
  useEffect(() => {
    const fetchProductData = async () => {
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
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="App">
      <header className="App-header-top">
        <h1>Enxoval Inteligente: consultor de produtos</h1>
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
                    <p className="product-category">Categoria: {product.category}</p>
                    {product.imageUrl && product.imageUrl !== 'https://via.placeholder.com/150' && (
                      <div className="product-image">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                    )}
                    <p>{product.description}</p>
                    {product.opiniao && <p className="product-opinion"><strong>Opinião:</strong> {product.opiniao}</p>}
                    <button 
                      className="product-link"
                      onClick={() => handleProductClick(product)}
                    >
                      Ver opinião
                    </button>
                  </div>
                </div>
              ))
            )}
            {!hasSearched && (
              <div className="search-instructions">
                <p>Digite um termo para buscar produtos para bebês</p>
                <p>Exemplos: fralda, mamadeira, carrinho...</p>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/images/logo.png" alt="Logo" className="logo-image" />
          </div>
          <div className="footer-copyright">
            <p>Copyright © 2025 Inc. Todos os direitos reservados. Edufe Digital CNPJ: 48.796.931/0001-74</p>
          </div>
        </div>
      </footer>
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default App;
