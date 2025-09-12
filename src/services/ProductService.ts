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
  opiniao_consulta: string;
}

class ProductService {
  private csvUrl: string = 'https://docs.google.com/spreadsheets/d/1btIezyZKBgMJpLwQ6xyZ2_zqkeo6p6Yv9i3Zei7WviI/export?format=csv';

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
      const product = {
        id: row.id ? parseInt(row.id) : i,
        name: row.Nome || row.nome || row.name || '',
        description: row.description || row.Descricao || row.descricao || '',
        price: row.price || row.Preco || row.preco ? parseFloat(row.price || row.Preco || row.preco) : 0,
        imageUrl: row.imagem || row.Imagem || row.imageUrl || row.ImageUrl || 'https://via.placeholder.com/150',
        category: row.category || row.Categoria || row.categoria || 'Uncategorized',
        opiniao: row.Opiniao || row.opiniao || row.Opinion || row.opinion || '',
        link: row.Link || row.link || row.URL || row.url || '',
        marca: row.Marca || row.marca || row.Brand || row.brand || '',
        opiniao_consulta: row.opiniao_consulta || row.Opiniao_consulta || row.OPINIAO_CONSULTA || row['opiniao_consulta'] || ''
      };
      
      // Debug: Log the headers and opiniao_consulta value for first few products
      if (i <= 3) {
        console.log('Headers found:', headers);
        console.log(`Product ${i} - opiniao_consulta:`, `"${product.opiniao_consulta}"`);
        console.log('Raw row data:', row);
      }
      
      // Only add product if opiniao_consulta is not "NA" (trim and check case-insensitive)
      const opiniaoConsultaTrimmed = product.opiniao_consulta.toString().trim().toUpperCase();
      if (opiniaoConsultaTrimmed !== 'NA') {
        products.push(product);
      } else {
        console.log(`Filtered out product: ${product.name} (opiniao_consulta: "${product.opiniao_consulta}")`);
      }
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

const productService = new ProductService();
export default productService;
