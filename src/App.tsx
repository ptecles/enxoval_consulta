import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ProductService, { Product } from './services/ProductService';

const App: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
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
        // initialize subcategories empty until a category is chosen
        setSubcategoryOptions([]);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, []);

  const handleSearch = (query: string, brandFilter?: string, categoryFilter?: string, subcategoryFilter?: string) => {
    const currentBrand = brandFilter !== undefined ? brandFilter : selectedBrand;
    const currentCategory = categoryFilter !== undefined ? categoryFilter : selectedCategory;
    const currentSubcategory = subcategoryFilter !== undefined ? subcategoryFilter : selectedSubcategory;
    
    if (!query.trim() && !currentBrand && !currentCategory && !currentSubcategory) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Split the search query into individual words
    const searchWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    // Apply all filters: search query, brand, category, and subcategory
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

      // Subcategory filter (only if a category is selected; if not, ignore)
      const matchesSubcategory = !currentSubcategory || product.subcategory === currentSubcategory;
      
      // Product must match all active filters
      return matchesSearchQuery && matchesBrand && matchesCategory && matchesSubcategory;
    });
    
    setSearchResults(filteredProducts);
    setHasSearched(true);
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
              setSelectedSubcategory('');
              setSubcategoryOptions([]);
              setSelectedBrand('');
              setSearchResults([]);
              setHasSearched(false);
              setOpenDropdown(null);
              const searchInput = document.querySelector<HTMLInputElement>('.search-input');
              if (searchInput) {
                searchInput.value = '';
              }
            }}
          >
            Home
          </button>
          {categoryOptions.map(category => {
            const categorySubcategories = Array.from(new Set(allProducts
              .filter(p => p.category === category)
              .map(p => p.subcategory)
              .filter(sc => sc && sc.trim() !== '')
            )).sort();
            
            return (
              <div 
                key={category} 
                className="category-dropdown-container"
                onMouseEnter={() => categorySubcategories.length > 0 && setOpenDropdown(category)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button 
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    const newCategory = category === selectedCategory ? '' : category;
                    setSelectedCategory(newCategory);
                    // Reset subcategory when category changes
                    const newSubcategories = newCategory
                      ? Array.from(new Set(allProducts
                          .filter(p => p.category === newCategory)
                          .map(p => p.subcategory)
                          .filter(sc => sc && sc.trim() !== '')
                        )).sort()
                      : [];
                    setSubcategoryOptions(newSubcategories);
                    setSelectedSubcategory('');
                    setOpenDropdown(null);
                    handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory, '');
                  }}
                >
                  {category}
                </button>
                
                {openDropdown === category && categorySubcategories.length > 0 && (
                  <div className="subcategory-dropdown">
                    <button
                      className={`subcategory-item ${selectedCategory === category && !selectedSubcategory ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedSubcategory('');
                        setSubcategoryOptions(categorySubcategories);
                        setOpenDropdown(null);
                        handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, category, '');
                      }}
                    >
                      Todas de {category}
                    </button>
                    {categorySubcategories.map(sub => (
                      <button
                        key={sub}
                        className={`subcategory-item ${selectedCategory === category && selectedSubcategory === sub ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedSubcategory(sub);
                          setSubcategoryOptions(categorySubcategories);
                          setOpenDropdown(null);
                          handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, category, sub);
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      
      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu">
          <button 
            className={`mobile-menu-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('');
              setSelectedSubcategory('');
              setSubcategoryOptions([]);
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
          {categoryOptions.map(category => {
            const categorySubcategories = Array.from(new Set(allProducts
              .filter(p => p.category === category)
              .map(p => p.subcategory)
              .filter(sc => sc && sc.trim() !== '')
            )).sort();
            
            const hasSubcategories = categorySubcategories.length > 0;
            const isExpanded = mobileExpandedCategory === category;
            
            return (
              <div key={category} className="mobile-category-container">
                <div className="mobile-category-header">
                  <button 
                    className={`mobile-menu-item category-main ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => {
                      if (!hasSubcategories) {
                        // Se não tem subcategorias, vai direto
                        const newCategory = category === selectedCategory ? '' : category;
                        setSelectedCategory(newCategory);
                        setSelectedSubcategory('');
                        setSubcategoryOptions([]);
                        setIsMobileMenuOpen(false);
                        handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory, '');
                      } else {
                        // Se tem subcategorias, expande/colapsa
                        setMobileExpandedCategory(isExpanded ? null : category);
                      }
                    }}
                  >
                    <span className="category-text">{category}</span>
                    {hasSubcategories && (
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    )}
                  </button>
                </div>
                
                {hasSubcategories && isExpanded && (
                  <div className="mobile-subcategory-list">
                    <button
                      className={`mobile-submenu-item ${selectedCategory === category && !selectedSubcategory ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSelectedSubcategory('');
                        setSubcategoryOptions(categorySubcategories);
                        setMobileExpandedCategory(null);
                        setIsMobileMenuOpen(false);
                        handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, category, '');
                      }}
                    >
                      Todas de {category}
                    </button>
                    {categorySubcategories.map(sub => (
                      <button
                        key={sub}
                        className={`mobile-submenu-item ${selectedCategory === category && selectedSubcategory === sub ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedSubcategory(sub);
                          setSubcategoryOptions(categorySubcategories);
                          setMobileExpandedCategory(null);
                          setIsMobileMenuOpen(false);
                          handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, category, sub);
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                  // Build subcategory options when category filter changes
                  const newSubcategories = newCategory
                    ? Array.from(new Set(allProducts
                        .filter(p => p.category === newCategory)
                        .map(p => p.subcategory)
                        .filter(sc => sc && sc.trim() !== '')
                      )).sort()
                    : [];
                  setSubcategoryOptions(newSubcategories);
                  setSelectedSubcategory('');
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, newCategory);
                }}
              >
                <option value="">Todas as categorias</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="subcategory-filter">Subcategoria:</label>
              <select
                id="subcategory-filter"
                value={selectedSubcategory}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSelectedSubcategory(newSub);
                  handleSearch(document.querySelector<HTMLInputElement>('.search-input')?.value || '', undefined, selectedCategory, newSub);
                }}
                disabled={!selectedCategory || subcategoryOptions.length === 0}
              >
                <option value="">Todas as subcategorias</option>
                {subcategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
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
                    <p className="product-category">Categoria: {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}</p>
                    {product.imageUrl && product.imageUrl !== 'https://via.placeholder.com/150' && (
                      <div className="product-image">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                    )}
                    <p>{product.description}</p>
                    {product.opiniao && <p className="product-opinion"><strong>Opinião:</strong> {product.opiniao}</p>}
                    {product.opiniao_consulta && (
                      <div className="product-consultation-opinion">
                        <p className="opinion-text">{product.opiniao_consulta}</p>
                      </div>
                    )}
                    {product.link ? (
                      <a 
                        href={product.link.startsWith('http') ? product.link : `https://${product.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="product-link"
                      >
                        Comprar na Amazon
                      </a>
                    ) : (
                      <button 
                        className="product-link disabled"
                        disabled
                      >
                        Link não disponível
                      </button>
                    )}
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
    </div>
  );
};

export default App;
