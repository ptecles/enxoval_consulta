// Simple CSV parsing without external dependencies

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  opiniao: string;
  link: string;
  marca: string;
}

class ProductService {
  private csvUrl: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQTgpNbNTKQOynY4nuZWn3CSjkygt-SMtfH6GpXAqn0ghkyeY_5yAkh8SxGpVkHrUIJQYeiW7nUP89R/pub?output=csv';

  async fetchProducts(): Promise<Product[]> {
    try {
      const response = await fetch(this.csvUrl);
      const csvText = await response.text();
      
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  private parseCSV(csvText: string): Product[] {
    // Split text by lines and filter out empty lines
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return [];
    }
    
    // Get headers from the first line
    const headers = this.parseCSVLine(lines[0]);
    const products: Product[] = [];
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue; // Skip malformed lines
      
      // Create a row object mapping headers to values
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index];
      });
      
      // Map CSV data to our Product interface
      // Map 'Nome' column to name property, with fallbacks to other potential column names
      products.push({
        id: row.id ? parseInt(row.id) : i,
        name: row.Nome || row.nome || row.name || '',
        description: row.description || row.Descricao || row.descricao || '',
        price: row.price || row.Preco || row.preco ? parseFloat(row.price || row.Preco || row.preco) : 0,
        imageUrl: row.imageUrl || row.Imagem || row.imagem || 'https://via.placeholder.com/150',
        category: row.category || row.Categoria || row.categoria || 'Uncategorized',
        opiniao: row.Opiniao || row.opiniao || row.Opinion || row.opinion || '',
        link: row.Link || row.link || row.URL || row.url || '',
        marca: row.Marca || row.marca || row.Brand || row.brand || ''
      });
    }
    
    return products;
  }
  
  // Helper function to parse CSV line considering quoted values
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
        continue;
      }
      
      current += char;
    }
    
    // Don't forget the last value
    values.push(current);
    
    return values;
  }
}

export default new ProductService();
