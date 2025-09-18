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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  const handleSearch = (query: string, brandFilter?: string, categoryFilter?: string) => {
    const currentBrand = brandFilter !== undefined ? brandFilter : selectedBrand;
    const currentCategory = categoryFilter !== undefined ? categoryFilter : selectedCategory;
    
    if (!query.trim() && !currentBrand && !currentCategory) {
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
      const matchesBrand = !currentBrand || product.marca === currentBrand;
      
      // Category filter
      const matchesCategory = !currentCategory || product.category === currentCategory;
      
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
      <div className="header-bar-top">
        <p className="promo-text">Aproveite essa novidade exclusiva para as alunas!</p>
      </div>
      <header className="App-header-top">
        <div className="header-left">
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <img src="/images/logo.png" alt="Enxoval Inteligente" className="header-logo" />
        <div className="social-icons">
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/youtube.png" alt="YouTube" className="social-icon" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/instagram.png" alt="Instagram" className="social-icon" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/tiktok.png" alt="TikTok" className="social-icon" />
          </a>
        </div>
      </header>
      <div className="header-bar-bottom">
        <div className="categories-nav desktop-nav">
          <button 
            className={`category-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('');
              setSelectedBrand('');
              setSearchResults([]);
              setHasSearched(false);
              const searchInput = document.querySelector<HTMLInputElement>('.search-input');
              if (searchInput) {
                searchInput.value = '';
              }
            }}
          >
            Home
          </button>
          {categoryOptions.map(category => (
            <button 
              key={category} 
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                const newCategory = category === selectedCategory ? '' : category;
                setSelectedCategory(newCategory);
                handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu">
          <button 
            className={`mobile-menu-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('');
              setSelectedBrand('');
              setSearchResults([]);
              setHasSearched(false);
              setIsMobileMenuOpen(false);
              const searchInput = document.querySelector<HTMLInputElement>('.search-input');
              if (searchInput) {
                searchInput.value = '';
              }
            }}
          >
            Home
          </button>
          {categoryOptions.map(category => (
            <button 
              key={category} 
              className={`mobile-menu-item ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                const newCategory = category === selectedCategory ? '' : category;
                setSelectedCategory(newCategory);
                setIsMobileMenuOpen(false);
                handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
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
                  const newBrand = e.target.value;
                  setSelectedBrand(newBrand);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', newBrand);
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
                  const newCategory = e.target.value;
                  setSelectedCategory(newCategory);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory);
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
        
        <div className="brands-container">
          <button 
            className="scroll-arrow scroll-arrow-left"
            onClick={() => {
              const container = document.querySelector('.brands-scroll');
              if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
            }}
          >
            &#8249;
          </button>
          <div className="brands-scroll">
            {brandOptions.map((brand, index) => (
              <div 
                key={brand}
                className={`brand-card ${selectedBrand === brand ? 'active' : ''}`}
                style={{
                  backgroundColor: index % 4 === 0 ? '#8fbc8f' : 
                                 index % 4 === 1 ? '#638ca6' : 
                                 index % 4 === 2 ? '#e67e40' : '#f4a792'
                }}
                onClick={() => {
                  const newBrand = brand === selectedBrand ? '' : brand;
                  setSelectedBrand(newBrand);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', newBrand);
                }}
              >
                <span className="brand-name">{brand}</span>
              </div>
            ))}
          </div>
          <button 
            className="scroll-arrow scroll-arrow-right"
            onClick={() => {
              const container = document.querySelector('.brands-scroll');
              if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
            }}
          >
            &#8250;
          </button>
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
