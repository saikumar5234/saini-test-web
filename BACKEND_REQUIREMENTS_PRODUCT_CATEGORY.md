# Backend Requirements: Product Category Integration

## Current Frontend Implementation ✅

The frontend is **already correctly** sending the category when creating/updating products:

### Create Product Request:
```json
POST /api/products
{
  "category": "Nuts",  // ✅ Category is being sent
  "name": { "en": "...", "hi": "...", "te": "..." },
  "description": { "en": "...", "hi": "...", "te": "..." },
  "price": 100.0
}
```

### Update Product Request:
```json
PUT /api/products/{id}
{
  "category": "Nuts",  // ✅ Category is being sent
  "nameJson": "...",
  "descriptionJson": "..."
}
```

---

## Backend Requirements

### 1. Product Entity Must Store Category

Your `Product` entity needs to have a `category` field. You have two options:

#### Option A: Store Category as String (Simpler - Recommended)
```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "category")
    private String category;  // Store category name as string
    
    // ... other fields (name, description, price, etc.)
}
```

#### Option B: Store Category as Relationship (More Complex)
```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;  // Relationship to Category entity
    
    // ... other fields
}
```

**Recommendation:** Use **Option A (String)** for simplicity, unless you need referential integrity.

---

### 2. Product DTO/Request Must Accept Category

Your Product creation/update DTO should include the category field:

```java
public class ProductRequest {
    private String category;  // ✅ Must include this
    private String nameJson;
    private String descriptionJson;
    private Double price;
    
    // Getters and setters
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    // ... other getters/setters
}
```

---

### 3. Product Service Must Save Category

When creating/updating a product, ensure the category is saved:

```java
@Service
public class ProductService {
    
    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        product.setCategory(request.getCategory());  // ✅ Save category
        product.setNameJson(request.getNameJson());
        product.setDescriptionJson(request.getDescriptionJson());
        product.setPrice(request.getPrice());
        return productRepository.save(product);
    }
    
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);
        product.setCategory(request.getCategory());  // ✅ Update category
        product.setNameJson(request.getNameJson());
        product.setDescriptionJson(request.getDescriptionJson());
        return productRepository.save(product);
    }
}
```

---

### 4. Product Response Must Include Category

When returning products, ensure the category is included:

```java
@GetMapping("/api/products")
public ResponseEntity<List<Product>> getAllProducts() {
    List<Product> products = productService.getAllProducts();
    // Make sure Product entity has category field and it's being returned
    return ResponseEntity.ok(products);
}
```

**Important:** Make sure your Product entity's `category` field is:
- Not marked as `@JsonIgnore`
- Properly serialized in JSON responses

---

### 5. Filter Products by Category (For Mobile App)

Add an endpoint to filter products by category:

```java
@GetMapping("/api/products")
public ResponseEntity<List<Product>> getProducts(
        @RequestParam(required = false) String category) {
    List<Product> products;
    if (category != null && !category.isEmpty()) {
        products = productService.getProductsByCategory(category);
    } else {
        products = productService.getAllProducts();
    }
    return ResponseEntity.ok(products);
}
```

**Service Method:**
```java
public List<Product> getProductsByCategory(String category) {
    return productRepository.findByCategory(category);
}
```

**Repository Method:**
```java
List<Product> findByCategory(String category);
```

---

## Database Migration

If your `products` table doesn't have a `category` column, add it:

```sql
ALTER TABLE products 
ADD COLUMN category VARCHAR(255) NULL;

-- Optional: Add index for faster filtering
CREATE INDEX idx_product_category ON products(category);
```

---

## Testing Checklist

### ✅ Verify Category is Saved
1. Create a product with category "Nuts"
2. Check database - category should be stored
3. Fetch the product - category should be in response

### ✅ Verify Category Filtering
1. Create products with different categories
2. Call `GET /api/products?category=Nuts`
3. Should return only products with category "Nuts"

### ✅ Verify Category Update
1. Update a product's category
2. Check database - category should be updated
3. Fetch the product - new category should be in response

---

## Example API Responses

### Get All Products (with category):
```json
[
  {
    "id": 1,
    "category": "Nuts",  // ✅ Category included
    "name": { "en": "Almonds", "hi": "...", "te": "..." },
    "description": { "en": "...", "hi": "...", "te": "..." },
    "price": 500.0
  },
  {
    "id": 2,
    "category": "Dried Fruits",  // ✅ Category included
    "name": { "en": "Raisins", "hi": "...", "te": "..." },
    "description": { "en": "...", "hi": "...", "te": "..." },
    "price": 300.0
  }
]
```

### Filter by Category:
```json
GET /api/products?category=Nuts

[
  {
    "id": 1,
    "category": "Nuts",
    "name": { "en": "Almonds", ... },
    "price": 500.0
  }
]
```

---

## Summary

✅ **Frontend is already correct** - it's sending the category

**Backend needs to:**
1. ✅ Store category in Product entity
2. ✅ Accept category in ProductRequest DTO
3. ✅ Save category when creating/updating products
4. ✅ Return category in product responses
5. ✅ Add filtering endpoint for mobile app: `GET /api/products?category={categoryName}`

The frontend will work automatically once the backend properly stores and returns the category field!

