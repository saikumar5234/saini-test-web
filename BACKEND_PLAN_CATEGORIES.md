# Backend Implementation Plan: Category Management

## Overview
This document outlines the backend implementation plan for adding category management functionality to the dry fruits application. The backend should support creating, fetching, updating, and deleting product categories.

## API Endpoints

### 1. Create Category
**Endpoint:** `POST /api/categories`

**Request Body:**
```json
{
  "name": "Nuts"
}
```

**Response (Success - 201 Created):**
```json
{
  "id": 1,
  "name": "Nuts",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "error": "Category name is required",
  "message": "Category name cannot be empty"
}
```

**Response (Error - 409 Conflict):**
```json
{
  "error": "Category already exists",
  "message": "A category with this name already exists"
}
```

---

### 2. Get All Categories
**Endpoint:** `GET /api/categories`

**Response (Success - 200 OK):**
```json
[
  {
    "id": 1,
    "name": "Nuts",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Dried Fruits",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

**Response (Empty - 200 OK):**
```json
[]
```

---

### 3. Get Category by ID
**Endpoint:** `GET /api/categories/{categoryId}`

**Response (Success - 200 OK):**
```json
{
  "id": 1,
  "name": "Nuts",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Response (Error - 404 Not Found):**
```json
{
  "error": "Category not found",
  "message": "Category with ID 1 does not exist"
}
```

---

### 4. Update Category
**Endpoint:** `PUT /api/categories/{categoryId}`

**Request Body:**
```json
{
  "name": "Premium Nuts"
}
```

**Response (Success - 200 OK):**
```json
{
  "id": 1,
  "name": "Premium Nuts",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Response (Error - 404 Not Found):**
```json
{
  "error": "Category not found",
  "message": "Category with ID 1 does not exist"
}
```

---

### 5. Delete Category
**Endpoint:** `DELETE /api/categories/{categoryId}`

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Response (Error - 404 Not Found):**
```json
{
  "error": "Category not found",
  "message": "Category with ID 1 does not exist"
}
```

**Response (Error - 409 Conflict):**
```json
{
  "error": "Cannot delete category",
  "message": "Category is in use by one or more products"
}
```

---

## Database Schema

### Category Entity/Table

**SQL (MySQL/PostgreSQL):**
```sql
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_name ON categories(name);
```

**JPA Entity (Java/Spring Boot):**
```java
@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Getters and Setters
}
```

---

## Backend Implementation Steps

### Step 1: Create Category Entity/Model
1. Create `Category` entity class with fields:
   - `id` (Long, Primary Key, Auto-generated)
   - `name` (String, Required, Unique)
   - `createdAt` (Timestamp)
   - `updatedAt` (Timestamp)

### Step 2: Create Category Repository
1. Create `CategoryRepository` interface extending `JpaRepository<Category, Long>`
2. Add custom query methods if needed:
   ```java
   Optional<Category> findByName(String name);
   boolean existsByName(String name);
   ```

### Step 3: Create Category Service
1. Create `CategoryService` class with methods:
   - `createCategory(String name)` - Create new category
   - `getAllCategories()` - Get all categories
   - `getCategoryById(Long id)` - Get category by ID
   - `updateCategory(Long id, String name)` - Update category
   - `deleteCategory(Long id)` - Delete category
   - `categoryExists(String name)` - Check if category exists

2. **Business Logic:**
   - Validate category name (not null, not empty, trimmed)
   - Check for duplicate category names
   - Before deletion, check if category is used by any products
   - Handle exceptions and return appropriate error messages

### Step 4: Create Category Controller
1. Create `CategoryController` class with REST endpoints:
   - `POST /api/categories` - Create category
   - `GET /api/categories` - Get all categories
   - `GET /api/categories/{id}` - Get category by ID
   - `PUT /api/categories/{id}` - Update category
   - `DELETE /api/categories/{id}` - Delete category

2. **Controller Features:**
   - Use `@RestController` annotation
   - Add proper HTTP status codes
   - Handle exceptions with `@ExceptionHandler`
   - Add request validation
   - Return consistent response format

### Step 5: Update Product Entity (if needed)
1. Ensure `Product` entity has a relationship with `Category`:
   ```java
   @ManyToOne
   @JoinColumn(name = "category_id")
   private Category category;
   ```

2. Or keep it as a simple string field if you prefer:
   ```java
   @Column(name = "category")
   private String category;
   ```

### Step 6: Add Validation
1. Add validation annotations to Category entity:
   ```java
   @NotBlank(message = "Category name is required")
   @Size(min = 1, max = 255, message = "Category name must be between 1 and 255 characters")
   private String name;
   ```

2. Add `@Valid` annotation to controller methods

### Step 7: Add Error Handling
1. Create custom exceptions:
   - `CategoryNotFoundException`
   - `CategoryAlreadyExistsException`
   - `CategoryInUseException`

2. Create global exception handler:
   ```java
   @ControllerAdvice
   public class CategoryExceptionHandler {
       @ExceptionHandler(CategoryNotFoundException.class)
       public ResponseEntity<ErrorResponse> handleCategoryNotFound(CategoryNotFoundException ex) {
           // Return 404
       }
       
       @ExceptionHandler(CategoryAlreadyExistsException.class)
       public ResponseEntity<ErrorResponse> handleCategoryExists(CategoryAlreadyExistsException ex) {
           // Return 409
       }
   }
   ```

### Step 8: Add Security (Optional but Recommended)
1. Add authentication/authorization checks:
   - Only admins can create/update/delete categories
   - All users can view categories

2. Example:
   ```java
   @PreAuthorize("hasRole('ADMIN')")
   @PostMapping("/api/categories")
   public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
       // Implementation
   }
   ```

---

## Sample Implementation (Spring Boot)

### CategoryController.java
```java
@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {
    
    @Autowired
    private CategoryService categoryService;
    
    @PostMapping
    public ResponseEntity<?> createCategory(@Valid @RequestBody CategoryRequest request) {
        try {
            Category category = categoryService.createCategory(request.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(category);
        } catch (CategoryAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("Category already exists", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        try {
            Category category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (CategoryNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Category not found", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, 
                                           @Valid @RequestBody CategoryRequest request) {
        try {
            Category category = categoryService.updateCategory(id, request.getName());
            return ResponseEntity.ok(category);
        } catch (CategoryNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Category not found", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(new SuccessResponse("Category deleted successfully"));
        } catch (CategoryNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Category not found", e.getMessage()));
        } catch (CategoryInUseException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("Cannot delete category", e.getMessage()));
        }
    }
}
```

### CategoryService.java
```java
@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public Category createCategory(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }
        
        String trimmedName = name.trim();
        
        if (categoryRepository.existsByName(trimmedName)) {
            throw new CategoryAlreadyExistsException("Category with name '" + trimmedName + "' already exists");
        }
        
        Category category = new Category();
        category.setName(trimmedName);
        return categoryRepository.save(category);
    }
    
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new CategoryNotFoundException("Category with ID " + id + " not found"));
    }
    
    public Category updateCategory(Long id, String name) {
        Category category = getCategoryById(id);
        
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }
        
        String trimmedName = name.trim();
        
        // Check if another category with the same name exists
        Optional<Category> existingCategory = categoryRepository.findByName(trimmedName);
        if (existingCategory.isPresent() && !existingCategory.get().getId().equals(id)) {
            throw new CategoryAlreadyExistsException("Category with name '" + trimmedName + "' already exists");
        }
        
        category.setName(trimmedName);
        return categoryRepository.save(category);
    }
    
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        
        // Check if category is used by any products
        long productCount = productRepository.countByCategory(category.getName());
        if (productCount > 0) {
            throw new CategoryInUseException("Cannot delete category. It is used by " + productCount + " product(s)");
        }
        
        categoryRepository.delete(category);
    }
}
```

### CategoryRepository.java
```java
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    boolean existsByName(String name);
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Test category creation with valid name
- [ ] Test category creation with duplicate name (should fail)
- [ ] Test category creation with empty name (should fail)
- [ ] Test fetching all categories
- [ ] Test fetching category by ID (existing and non-existing)
- [ ] Test category update
- [ ] Test category deletion (with and without products)

### Integration Tests
- [ ] Test complete flow: Create → Fetch → Update → Delete
- [ ] Test category deletion when products exist (should fail)
- [ ] Test concurrent category creation

### API Tests (Postman/curl)
- [ ] Test all endpoints with valid data
- [ ] Test all endpoints with invalid data
- [ ] Test error responses
- [ ] Test authentication/authorization (if implemented)

---

## Migration Script (if using database migrations)

```sql
-- Migration: Create categories table
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_name ON categories(name);

-- Optional: Migrate existing category strings to category table
-- This depends on your current product table structure
```

---

## Notes

1. **Category Name Uniqueness:** Ensure category names are unique to avoid confusion
2. **Case Sensitivity:** Decide if category names should be case-sensitive (recommend case-insensitive)
3. **Category Deletion:** Consider soft delete instead of hard delete if you want to preserve history
4. **Caching:** Consider caching categories list if categories don't change frequently
5. **Pagination:** If you expect many categories, add pagination to GET /api/categories
6. **Search/Filter:** Consider adding search functionality: GET /api/categories?search=nuts

---

## Frontend Integration Notes

The frontend expects:
- `POST /api/categories` to return the created category object with `id` and `name` fields
- `GET /api/categories` to return an array of category objects with `id` and `name` fields
- The frontend uses the `name` field for the dropdown values

Make sure your backend response matches this structure.

