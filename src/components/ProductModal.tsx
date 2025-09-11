import React from 'react';
import './ProductModal.css';
import { Product } from '../services/ProductService';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {product.imageUrl && product.imageUrl !== 'https://via.placeholder.com/150' && (
            <div className="modal-image">
              <img src={product.imageUrl} alt={product.name} />
            </div>
          )}
          
          <div className="modal-details">
            {product.marca && (
              <p className="modal-brand"><strong>Marca:</strong> {product.marca}</p>
            )}
            <p className="modal-category"><strong>Categoria:</strong> {product.category}</p>
            
            {product.description && (
              <div className="modal-description">
                <h3>Descrição:</h3>
                <p>{product.description}</p>
              </div>
            )}
            
            {product.opiniao_consulta && (
              <div className="modal-opinion">
                <h3>Opinião da Elisa:</h3>
                <div className="opinion-content">
                  <p>{product.opiniao_consulta}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          {product.link && (
            <a 
              href={product.link.startsWith('http') ? product.link : `https://${product.link}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="modal-link-button"
            >
              Comprar Produto
            </a>
          )}
          <button className="modal-close-button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
