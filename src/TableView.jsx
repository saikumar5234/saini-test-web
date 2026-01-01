import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { API_ENDPOINTS, TRANSLATION_CONFIG } from './config.js';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

function TableView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editField, setEditField] = useState(null); // 'price' | 'images' | 'both' | null
  const [editedData, setEditedData] = useState([]);
  const [saving, setSaving] = useState(false);
  const priceRefs = useRef([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    category: '',
    name: { en: '', hi: '', te: '' },
    description: { en: '', hi: '', te: '' },
    price: '',
    imageUrls: ['']
  });
  const [adding, setAdding] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageDialogRowIndex, setImageDialogRowIndex] = useState(null);
  const [imageDialogEditMode, setImageDialogEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [newProductId, setNewProductId] = useState(null);
  const [addImageUploading, setAddImageUploading] = useState(false);
  const [addImageUploadSuccess, setAddImageUploadSuccess] = useState(false);
  const [addImageUploadError, setAddImageUploadError] = useState("");
  const [addImageFile, setAddImageFile] = useState(null);
  const [addImageFiles, setAddImageFiles] = useState([]);
  const [addProductImages, setAddProductImages] = useState([]);
  const [pendingNewProductImages, setPendingNewProductImages] = useState([]);
  const [viewImageIds, setViewImageIds] = useState([]);
  const [viewImagesLoading, setViewImagesLoading] = useState(false);
  const [imageEditSaveSuccess, setImageEditSaveSuccess] = useState(false);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [pendingDeleteIndexes, setPendingDeleteIndexes] = useState([]);
  const [imageDeleteSuccess, setImageDeleteSuccess] = useState(false);
  const [deletingImageIdx, setDeletingImageIdx] = useState(null);
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
  const [imageToDeleteIdx, setImageToDeleteIdx] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [priceHistories, setPriceHistories] = useState({});
  const [translating, setTranslating] = useState(false);
  const [translationSuccess, setTranslationSuccess] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    category: '',
    name: { en: '', hi: '', te: '' },
    description: { en: '', hi: '', te: '' },
    price: ''
  });
  const [updatingProduct, setUpdatingProduct] = useState(false);
  // Confirmation dialog states
  const [confirmDeleteSelectedOpen, setConfirmDeleteSelectedOpen] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [confirmEnableOpen, setConfirmEnableOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmAddProductOpen, setConfirmAddProductOpen] = useState(false);
  const [confirmUpdateProductOpen, setConfirmUpdateProductOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  // Helper to check if ID is numeric
  const isNumericId = id => !isNaN(Number(id));

  // Fetch products from Spring Boot backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCTS);
      if (!response.ok) throw new Error('Failed to fetch products');
      const products = await response.json();
      // Adapt the data: imageUrls = imageIds and normalize disabled flag
      const adapted = products
        .filter(p => isNumericId(p.id))
        .map(p => {
          // Normalize various backend flags (boolean, 0/1, string) to a single isDisabled boolean
          const raw =
            p.disabled ??
            p.isDisabled ??
            p.is_disabled;

          let isDisabled = false;
          if (
            raw === true ||
            raw === 'true' ||
            raw === 1 ||
            raw === '1'
          ) {
            isDisabled = true;
          }

          return {
            ...p,
            imageUrls: p.imageIds || [],
            isDisabled,
          };
        });
      setData(adapted);
      setEditedData(adapted);
    } catch (error) {
      setData([]);
      setEditedData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Listen for category creation events
  useEffect(() => {
    const handleCategoryCreated = () => {
      fetchCategories();
    };
    
    window.addEventListener('categoryCreated', handleCategoryCreated);
    
    return () => {
      window.removeEventListener('categoryCreated', handleCategoryCreated);
    };
  }, []);

  // Fetch categories from backend
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const categoriesList = Array.isArray(data) ? data : (data.categories || data.data || []);
        setCategories(categoriesList);
      } else {
        console.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch price history for all products (mini chart)
  useEffect(() => {
    const fetchAllPriceHistories = async () => {
      const ids = (editMode ? editedData : data).map(p => p.id).filter(id => !isNaN(Number(id)));
      const histories = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(API_ENDPOINTS.PRODUCT_PRICE_HISTORY(id));
          if (res.ok) {
            const hist = await res.json();
            histories[id] = hist.map(h => ({
              date: h.changedAt ? h.changedAt.split('T')[0] : '',
              price: h.price
            })).slice(-10); // last 10 points
          }
        } catch {}
      }));
      setPriceHistories(histories);
    };
    fetchAllPriceHistories();
    // eslint-disable-next-line
  }, [data, editedData, editMode]);

  // Focus the first price field when entering edit mode
  useEffect(() => {
    if (editMode && (editField === 'price' || editField === 'both') && priceRefs.current[0]) {
      priceRefs.current[0].focus();
    }
  }, [editMode, editField]);

  const handlePriceChange = (value, rowIndex) => {
    setEditedData(prev => prev.map((row, idx) => idx === rowIndex ? { ...row, price: value } : row));
  };

  const handleImageUrlChange = (value, rowIndex, imgIndex) => {
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        const urls = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
        urls[imgIndex] = value;
        return { ...row, imageUrls: urls };
      }
      return row;
    }));
  };

  const handleAddImageUrl = (rowIndex) => {
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        const urls = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
        urls.push('');
        return { ...row, imageUrls: urls };
      }
      return row;
    }));
  };

  const handleDeleteImageUrl = (rowIndex, imgIndex) => {
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        const urls = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
        urls.splice(imgIndex, 1);
        return { ...row, imageUrls: urls };
      }
      return row;
    }));
  };

  const handleSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      // Only update rows where price has changed
      const updates = editedData.filter((row, idx) =>
        row.price !== data[idx].price
      );
      await Promise.all(updates.map(async (row) => {
        const response = await fetch(API_ENDPOINTS.PRODUCT_PRICE(row.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: parseFloat(row.price) }),
        });
        if (!response.ok) throw new Error('Failed to update price');
      }));
      await fetchProducts(); // Refresh data
      setEditMode(false);
    } catch (error) {
      // Optionally show error
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (row) => {
    console.log('Deleting row:', row);
    if (!row || !row.id) {
      setDeleteDialogOpen(false);
      setSaving(false);
      return;
    }
    setDeleteDialogOpen(false);
    setSaving(true);
    try {
      // Hard delete product using backend API
              const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${row.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      setData(prev => prev.filter(p => p.id !== row.id));
      setEditedData(prev => prev.filter(p => p.id !== row.id));
    } catch (error) {
      // Optionally show error
    }
    setSaving(false);
  };

  // Handle delete for selected products
  const handleDeleteSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    if (selectedIds.length === 0) return;
    setConfirmDeleteSelectedOpen(true);
  };

  const confirmDeleteSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    setConfirmDeleteSelectedOpen(false);
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(async (productId) => {
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to delete product ${productId}`);
      }));
      await fetchProducts(); // Refresh data
      setRowSelection({}); // Clear selection
    } catch (error) {
      console.error('Error deleting products:', error);
    }
    setSaving(false);
  };

  // Handle disable for selected products
  const handleDisableSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    if (selectedIds.length === 0) return;
    setConfirmDisableOpen(true);
  };

  const confirmDisableSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    setConfirmDisableOpen(false);
    setSaving(true);
    try {
      // Call backend to disable and optimistically update UI
      await Promise.all(selectedIds.map(async (productId) => {
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}/disable`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_disable: true }),
        });
        if (!response.ok) {
          console.warn(`Disable endpoint may not exist for product ${productId}`);
          return;
        }
      }));
      // Optimistically mark disabled in UI
      setData(prev =>
        prev.map(p =>
          selectedIds.includes(String(p.id)) ? { ...p, isDisabled: true } : p
        ),
      );
      setEditedData(prev =>
        prev.map(p =>
          selectedIds.includes(String(p.id)) ? { ...p, isDisabled: true } : p
        ),
      );
      setRowSelection({}); // Clear selection
    } catch (error) {
      console.error('Error disabling products:', error);
    }
    setSaving(false);
  };

  // Handle enable for selected products
  const handleEnableSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    if (selectedIds.length === 0) return;
    setConfirmEnableOpen(true);
  };

  const confirmEnableSelectedProducts = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    setConfirmEnableOpen(false);
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(async (productId) => {
        const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${productId}/enable`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_disable: false }),
        });
        if (!response.ok) {
          console.warn(`Enable endpoint may not exist for product ${productId}`);
          return;
        }
      }));
      // Optimistically mark enabled in UI
      setData(prev =>
        prev.map(p =>
          selectedIds.includes(String(p.id)) ? { ...p, isDisabled: false } : p
        ),
      );
      setEditedData(prev =>
        prev.map(p =>
          selectedIds.includes(String(p.id)) ? { ...p, isDisabled: false } : p
        ),
      );
      setRowSelection({}); // Clear selection
    } catch (error) {
      console.error('Error enabling products:', error);
    }
    setSaving(false);
  };

  // Function to translate text using MyMemory API (free, no API key required)
  const translateText = async (text, targetLang) => {
    try {
      // Map language codes for MyMemory API
      const langMap = {
        'hi': 'hi',
        'te': 'te'
      };
      
      const targetLangCode = langMap[targetLang];
      if (!targetLangCode) return '';
      
      const response = await fetch(`${TRANSLATION_CONFIG.MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|${targetLangCode}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200) {
          return data.responseData.translatedText;
        }
      }
      return '';
    } catch (error) {
      console.error('Translation error:', error);
      return '';
    }
  };

  const handleAddProductFieldChange = async (field, value, imgIdx = null, lang = null) => {
    setNewProduct(prev => {
      if (field === 'imageUrls') {
        const urls = [...prev.imageUrls];
        urls[imgIdx] = value;
        return { ...prev, imageUrls: urls };
      }
      if (field === 'name' || field === 'description') {
        const updatedField = { ...prev[field], [lang]: value };
        
        // Auto-translate when English name is changed
        if (field === 'name' && lang === 'en' && value.trim()) {
          setTranslating(true);
          
          // Translate to Hindi and Telugu
          Promise.all([
            translateText(value, 'hi'),
            translateText(value, 'te')
          ]).then(([hindiText, teluguText]) => {
            setNewProduct(current => ({
              ...current,
              name: { 
                ...current.name, 
                hi: hindiText || current.name.hi,
                te: teluguText || current.name.te
              }
            }));
            setTranslating(false);
            if (hindiText || teluguText) {
              setTranslationSuccess(true);
              setTimeout(() => setTranslationSuccess(false), 3000);
            }
          }).catch(() => {
            setTranslating(false);
          });
        }
        
        // Auto-translate when English description is changed
        if (field === 'description' && lang === 'en' && value.trim()) {
          setTranslating(true);
          
          // Translate to Hindi and Telugu
          Promise.all([
            translateText(value, 'hi'),
            translateText(value, 'te')
          ]).then(([hindiText, teluguText]) => {
            setNewProduct(current => ({
              ...current,
              description: { 
                ...current.description, 
                hi: hindiText || current.description.hi,
                te: teluguText || current.description.te
              }
            }));
            setTranslating(false);
            if (hindiText || teluguText) {
              setTranslationSuccess(true);
              setTimeout(() => setTranslationSuccess(false), 3000);
            }
          }).catch(() => {
            setTranslating(false);
          });
        }
        
        return { ...prev, [field]: updatedField };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleAddProductAddImage = () => {
    setNewProduct(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const handleAddProductDeleteImage = (imgIdx) => {
    setNewProduct(prev => {
      const urls = [...prev.imageUrls];
      urls.splice(imgIdx, 1);
      return { ...prev, imageUrls: urls };
    });
  };

  // Handle edit product - open dialog with product data
  const handleEditProduct = (product) => {
    // Helper to get localized value
    const getLocalized = (obj) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      return obj;
    };

    const productName = getLocalized(product.name);
    const productDescription = getLocalized(product.description);

    setEditingProduct(product);
    setEditProductForm({
      category: product.category || '',
      name: {
        en: productName?.en || productName || '',
        hi: productName?.hi || '',
        te: productName?.te || ''
      },
      description: {
        en: productDescription?.en || productDescription || '',
        hi: productDescription?.hi || '',
        te: productDescription?.te || ''
      },
      price: product.price || ''
    });
    setEditProductDialogOpen(true);
  };

  // Handle edit product field changes with auto-translation
  const handleEditProductFieldChange = async (field, value, lang = null) => {
    setEditProductForm(prev => {
      if (field === 'name' || field === 'description') {
        const updatedField = { ...prev[field], [lang]: value };
        
        // Auto-translate when English name is changed
        if (field === 'name' && lang === 'en' && value.trim()) {
          setTranslating(true);
          
          // Translate to Hindi and Telugu
          Promise.all([
            translateText(value, 'hi'),
            translateText(value, 'te')
          ]).then(([hindiText, teluguText]) => {
            setEditProductForm(current => ({
              ...current,
              name: { 
                ...current.name, 
                hi: hindiText || current.name.hi,
                te: teluguText || current.name.te
              }
            }));
            setTranslating(false);
            if (hindiText || teluguText) {
              setTranslationSuccess(true);
              setTimeout(() => setTranslationSuccess(false), 3000);
            }
          }).catch(() => {
            setTranslating(false);
          });
        }
        
        // Auto-translate when English description is changed
        if (field === 'description' && lang === 'en' && value.trim()) {
          setTranslating(true);
          
          // Translate to Hindi and Telugu
          Promise.all([
            translateText(value, 'hi'),
            translateText(value, 'te')
          ]).then(([hindiText, teluguText]) => {
            setEditProductForm(current => ({
              ...current,
              description: { 
                ...current.description, 
                hi: hindiText || current.description.hi,
                te: teluguText || current.description.te
              }
            }));
            setTranslating(false);
            if (hindiText || teluguText) {
              setTranslationSuccess(true);
              setTimeout(() => setTranslationSuccess(false), 3000);
            }
          }).catch(() => {
            setTranslating(false);
          });
        }
        
        return { ...prev, [field]: updatedField };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle update product
  const handleUpdateProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    setConfirmUpdateProductOpen(true);
  };

  const confirmUpdateProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    setConfirmUpdateProductOpen(false);
    setUpdatingProduct(true);
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCT_UPDATE(editingProduct.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editProductForm.category,
          nameJson: JSON.stringify(editProductForm.name),
          descriptionJson: JSON.stringify(editProductForm.description)
        })
      });
      if (!response.ok) throw new Error('Failed to update product');
      await fetchProducts(); // Refresh data
      setEditProductDialogOpen(false);
      setEditingProduct(null);
      setEditProductForm({
        category: '',
        name: { en: '', hi: '', te: '' },
        description: { en: '', hi: '', te: '' },
        price: ''
      });
    } catch (error) {
      console.error('Error updating product:', error);
    }
    setUpdatingProduct(false);
  };

  // Handle close edit product dialog
  const handleCloseEditProductDialog = () => {
    setEditProductDialogOpen(false);
    setEditingProduct(null);
    setEditProductForm({
      category: '',
      name: { en: '', hi: '', te: '' },
      description: { en: '', hi: '', te: '' },
      price: ''
    });
  };

  const handleAddProduct = async () => {
    // Validate that category is selected
    if (!newProduct.category || newProduct.category.trim() === '') {
      alert('Please select a category before adding the product');
      return;
    }
    setConfirmAddProductOpen(true);
  };

  const confirmAddProduct = async () => {
    setConfirmAddProductOpen(false);
    setAdding(true);
    try {
      // Send product details to backend
              const response = await fetch(API_ENDPOINTS.PRODUCTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newProduct.category,
          name: newProduct.name, // Send complete multilingual object
          description: newProduct.description, // Send complete multilingual object
          price: parseFloat(newProduct.price)
        })
      });
      if (!response.ok) throw new Error('Failed to add product');
      const created = await response.json();
      if (isNumericId(created.id)) {
        // Add initial price to price history using the same price update endpoint
        try {
          await fetch(API_ENDPOINTS.PRODUCT_PRICE(created.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              price: parseFloat(newProduct.price)
            }),
          });
        } catch (priceHistoryError) {
          // If price history creation fails, log but don't block product creation
          console.warn('Failed to add initial price to history:', priceHistoryError);
        }
        
        setData(prev => [...prev, { ...created, imageUrls: [] }]);
        setEditedData(prev => [...prev, { ...created, imageUrls: [] }]);
        setNewProductId(created.id);
        setAddProductImages([]);
        
        // Upload all pending images if any
        if (pendingNewProductImages.length > 0) {
          setAddImageUploading(true);
          try {
            const uploadPromises = pendingNewProductImages.map(async (file) => {
              const formData = new FormData();
              formData.append('image', file);
              const response = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(created.id), {
                method: 'POST',
                body: formData,
              });
              if (response.ok) {
                const { imageId } = await response.json();
                return imageId;
              }
              return null;
            });
            
            const uploadedImageIds = (await Promise.all(uploadPromises)).filter(id => id !== null);
            setAddProductImages(uploadedImageIds);
            
            // Update product in table
            setData(prev => prev.map(p => p.id === created.id ? { ...p, imageUrls: uploadedImageIds } : p));
            setEditedData(prev => prev.map(p => p.id === created.id ? { ...p, imageUrls: uploadedImageIds } : p));
            
            // Clear pending images
            setPendingNewProductImages([]);
            fetchProducts();
          } catch (error) {
            console.error('Error uploading pending images:', error);
          }
          setAddImageUploading(false);
        }
        
        // Close dialog and reset form after successful product creation
        setAddDialogOpen(false);
        setNewProductId(null);
        setAddProductImages([]);
        setAddImageFile(null);
        setAddImageFiles([]);
        setPendingNewProductImages([]);
        setAddImageUploadSuccess(false);
        setAddImageUploadError("");
        setNewProduct({
          category: '',
          name: { en: '', hi: '', te: '' },
          description: { en: '', hi: '', te: '' },
          price: '',
          imageUrls: ['']
        });
        // Refresh products to ensure UI is in sync
        await fetchProducts();
      }
    } catch (error) {
      // Optionally show error
      console.error('Error adding product:', error);
    }
    setAdding(false);
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditField('both');
    setRowSelection({}); // Clear selection when entering edit mode
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditField(null);
    setEditedData(data);
    setRowSelection({}); // Clear selection when exiting edit mode
  };

  const handleOpenImageDialog = async (rowIndex, edit = false) => {
    setImageDialogRowIndex(rowIndex);
    setImageDialogEditMode(edit);
    setImageDialogOpen(true);
    // Reset upload states when opening in edit mode
    if (edit) {
      setPendingImageFiles([]);
      setUploadError("");
      setUploadSuccess(false);
      setImageEditSaveSuccess(false);
    }
    // Only fetch images for view mode
    if (!edit) {
      setViewImagesLoading(true);
      setViewImageIds([]);
      const productId = data[rowIndex]?.id;
      if (productId && !isNaN(Number(productId))) {
        try {
          const res = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(productId));
          if (res.ok) {
            const ids = await res.json();
            setViewImageIds(ids);
          }
        } catch (e) {
          setViewImageIds([]);
        }
      }
      setViewImagesLoading(false);
    }
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setImageDialogRowIndex(null);
    setImageDialogEditMode(false);
    setPendingImageFiles([]);
    setUploadError("");
    setUploadSuccess(false);
    setImageEditSaveSuccess(false);
    fetchProducts(); // Ensure UI is in sync after all edits
  };

  const handleImageDialogUrlChange = (value, imgIdx) => {
    if (imageDialogRowIndex === null) return;
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === imageDialogRowIndex) {
        const urls = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
        urls[imgIdx] = value;
        return { ...row, imageUrls: urls };
      }
      return row;
    }));
  };

  const handleImageDialogAddImage = () => {
    if (imageDialogRowIndex === null) return;
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === imageDialogRowIndex) {
        const urls = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
        urls.push('');
        return { ...row, imageUrls: urls };
      }
      return row;
    }));
  };

  // Mark image for deletion (no delete yet)
  const handleImageDialogDeleteImage = async (imgIdx) => {
    if (imageDialogRowIndex === null) return;
    const product = editedData[imageDialogRowIndex];
    const productId = product?.id;
    const imageId = product?.imageUrls?.[imgIdx];
    
    // Validate inputs
    if (!imageId) {
      console.error('No image ID found at index:', imgIdx);
      setUploadError('Cannot delete: No image ID found.');
      return;
    }
    
    if (!productId || isNaN(Number(productId))) {
      console.error('Invalid product ID:', productId);
      setUploadError('Cannot delete: Invalid product ID.');
      return;
    }
    
    // Check if imageId is a valid number (for backend images)
    if (isNaN(Number(imageId))) {
      console.error('Invalid image ID (not a number):', imageId);
      // If it's not a number, it might be a URL or empty string - just remove from local state
      const updatedImageUrls = (product.imageUrls || []).filter((id, idx) => idx !== imgIdx);
      setEditedData(prev => prev.map((row, idx) => {
        if (idx === imageDialogRowIndex) {
          return { ...row, imageUrls: updatedImageUrls };
        }
        return row;
      }));
      return;
    }
    
    setDeletingImageIdx(imgIdx);
    setUploadError("");
    
    try {
      // Delete the image file from backend
      const deleteResponse = await fetch(API_ENDPOINTS.PRODUCT_IMAGE_DELETE(imageId), {
        method: 'DELETE',
      });
      
      if (deleteResponse.ok) {
        // Image deleted successfully - backend should automatically update the product's image list
        setImageDeleteSuccess(true);
        setUploadSuccess(true);
        
        // Refresh products from backend to get the updated image list
        await fetchProducts();
        
        // Update local state to reflect the deletion immediately
        const updatedImageUrls = (product.imageUrls || []).filter((id, idx) => idx !== imgIdx);
        setEditedData(prev => prev.map((row, idx) => {
          if (idx === imageDialogRowIndex) {
            return { ...row, imageUrls: updatedImageUrls };
          }
          return row;
        }));
        
        // Clear success message after a delay
        setTimeout(() => {
          setImageDeleteSuccess(false);
          setUploadSuccess(false);
        }, 2000);
      } else {
        const errorText = await deleteResponse.text();
        console.error('Failed to delete image:', errorText);
        setUploadError('Failed to delete image from server.');
      }
    } catch (e) {
      console.error('Error deleting image:', e);
      setUploadError('Error deleting image. Please try again.');
    }
    setDeletingImageIdx(null);
  };

  const handleSaveImages = async () => {
    if (imageDialogRowIndex === null) return;
    const product = editedData[imageDialogRowIndex];
    const productId = product?.id;
    if (!productId || isNaN(Number(productId))) return;
    // Start with current image IDs, remove those marked for deletion
    let imageIds = (product.imageUrls || []).filter((id, idx) => !!id && !isNaN(Number(id)) && !pendingDeleteIndexes.includes(idx));
    // Upload all pending files
    for (const file of pendingImageFiles) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(productId), {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const { imageId } = await response.json();
          imageIds.push(imageId);
        }
      } catch (e) {
        // Optionally show error
      }
    }
    setPendingImageFiles([]);
    setPendingDeleteIndexes([]);
    
    // Backend should automatically update the product's image list when images are uploaded/deleted
    // Just refresh the data from backend to ensure UI is in sync
    if (imageIds.length > 0 || pendingImageFiles.length > 0) {
      setImageEditSaveSuccess(true);
      await fetchProducts();
      setEditMode(false);
      setEditField(null);
      setImageDialogEditMode(false);
      setImageDialogOpen(false);
    }
  };

  // Add this helper to get image URL from backend
  const getProductImageUrl = (imageId) => imageId ? API_ENDPOINTS.PRODUCT_IMAGE(imageId) : '';

  // In the image dialog, add file upload logic
  // Add image file to pending list (no upload yet)
  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleImageFileUpload = async (file, rowIndex) => {
    if (!file || imageDialogRowIndex === null) return;
    const productId = editMode ? editedData[rowIndex]?.id : data[rowIndex]?.id;
    // Only allow upload if productId is a number
    if (!productId || isNaN(Number(productId))) {
      setUploadError("Cannot upload image: Product ID is not a valid number. Please use products created via backend only.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(productId), {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const { imageId } = await response.json();
        setEditedData(prev => prev.map((row, idx) => {
          if (idx === rowIndex) {
            const imageIds = Array.isArray(row.imageUrls) ? [...row.imageUrls] : [];
            imageIds.push(imageId);
            return { ...row, imageUrls: imageIds };
          }
          return row;
        }));
        setUploadSuccess(true);
        setSelectedImageFile(null);
      }
    } catch (error) {
      // Optionally show error
    }
    setUploading(false);
  };

  const handleAddImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAddImageFile(file);
      setAddImageFiles([file]);
    }
    e.target.value = '';
  };

  const handleAddMultipleImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAddImageFiles(files);
      setAddImageFile(files[0]); // Keep for backward compatibility
    }
    e.target.value = '';
  };

  const handlePendingImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingNewProductImages(prev => [...prev, ...files]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemovePendingImage = (index) => {
    setPendingNewProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllPendingImages = () => {
    setPendingNewProductImages([]);
  };

  const handleAddImageFileUpload = async () => {
    if ((!addImageFile && addImageFiles.length === 0) || !newProductId || isNaN(Number(newProductId))) {
      setAddImageUploadError('Cannot upload image: Product ID is not valid or no image selected.');
      return;
    }
    setAddImageUploading(true);
    setAddImageUploadError('');
    setAddImageUploadSuccess(false);
    
    const filesToUpload = addImageFiles.length > 0 ? addImageFiles : (addImageFile ? [addImageFile] : []);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(newProductId), {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const { imageId } = await response.json();
          return imageId;
        }
        return null;
      });
      
      const uploadedImageIds = (await Promise.all(uploadPromises)).filter(id => id !== null);
      
      if (uploadedImageIds.length > 0) {
        setAddProductImages(prev => [...prev, ...uploadedImageIds]);
        setAddImageUploadSuccess(true);
        // Also update the product in table
        setData(prev => prev.map(p => p.id === newProductId ? { ...p, imageUrls: [...(p.imageUrls || []), ...uploadedImageIds] } : p));
        setEditedData(prev => prev.map(p => p.id === newProductId ? { ...p, imageUrls: [...(p.imageUrls || []), ...uploadedImageIds] } : p));
        // Refetch products to ensure UI is in sync
        fetchProducts();
      } else {
        setAddImageUploadError('Failed to upload images.');
      }
      
      setAddImageFile(null);
      setAddImageFiles([]);
    } catch (error) {
      setAddImageUploadError('Image upload failed.');
    }
    setAddImageUploading(false);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewProductId(null);
    setAddProductImages([]);
    setAddImageFile(null);
    setAddImageFiles([]);
    setPendingNewProductImages([]);
    setAddImageUploadSuccess(false);
    setAddImageUploadError("");
    // Refetch products to ensure UI is in sync
    fetchProducts();
  };

  const handleUploadPendingImage = async () => {
    if (imageDialogRowIndex === null || pendingImageFiles.length === 0) return;
    const product = editedData[imageDialogRowIndex];
    const productId = product?.id;
    if (!productId || isNaN(Number(productId))) return;
    
    setUploading(true);
    let newImageIds = [];
    
    // Upload all pending files
    for (const file of pendingImageFiles) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await fetch(API_ENDPOINTS.PRODUCT_IMAGES(productId), {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const { imageId } = await response.json();
          newImageIds.push(imageId);
        }
      } catch (e) {
        console.error('Error uploading image:', e);
      }
    }
    
    // Update local state with new image IDs immediately for better UX
    const updatedImageIds = [...(product.imageUrls || []).filter(id => !!id && !isNaN(Number(id))), ...newImageIds];
    
    setEditedData(prev => prev.map((row, idx) => {
      if (idx === imageDialogRowIndex) {
        return { ...row, imageUrls: updatedImageIds };
      }
      return row;
    }));
    
    // Backend should automatically update the product's image list when images are uploaded
    // Just refresh the data from backend to ensure UI is in sync
    if (newImageIds.length > 0) {
      setUploadSuccess(true);
      setPendingImageFiles([]);
      // Refresh products from backend to get the updated image list
      await fetchProducts();
    } else {
      setUploadError('No images were uploaded successfully.');
    }
    
    setUploading(false);
  };

  const handleRequestDeleteImage = (imgIdx) => {
    setImageToDeleteIdx(imgIdx);
    setDeleteImageDialogOpen(true);
  };
  const handleConfirmDeleteImage = async () => {
    if (imageToDeleteIdx !== null) {
      await handleImageDialogDeleteImage(imageToDeleteIdx);
    }
    setDeleteImageDialogOpen(false);
    setImageToDeleteIdx(null);
  };
  const handleCancelDeleteImage = () => {
    setDeleteImageDialogOpen(false);
    setImageToDeleteIdx(null);
  };

  // Helper to get all dates in range (copied from PriceAnalytics)
  const getDateRange = (days) => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  // Build chart data with filled missing days (copied from PriceAnalytics)
  const buildContinuousChartData = (history, days = 10) => {
    if (!history.length) return [];
    const dateRange = getDateRange(days);
    const priceMap = {};
    history.forEach(entry => { priceMap[entry.date] = entry.price; });
    let lastPrice = history[0].price;
    return dateRange.map(date => {
      if (priceMap[date] !== undefined) {
        lastPrice = priceMap[date];
      }
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: lastPrice
      };
    });
  };

  const columns = useMemo(
    () => [
      {
        header: 'S. No.',
        id: 'serial',
        size: 60,
        Cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: 'isDisabled',
        header: 'Status',
        size: 90,
        Cell: ({ row }) => {
          const disabled = !!row.original?.isDisabled;
          return (
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: disabled ? 'error.main' : 'success.main' }}
            >
              {disabled ? 'Disabled' : 'Active'}
            </Typography>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Product Name',
        Cell: ({ cell, row }) => {
          const value = cell.getValue();
          const displayValue = typeof value === 'object' && value !== null
            ? value[i18n.language] || value.en || Object.values(value)[0] || ''
            : value;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {displayValue}
              </Typography>
              <Tooltip title="Edit Name">
                <span>
                  <Button
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProduct(row.original);
                    }}
                    disabled={saving || row.original?.isDisabled}
                    sx={{ minWidth: 32, minHeight: 32, p: 0.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </Button>
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        Cell: ({ cell }) => {
          const value = cell.getValue();
          if (typeof value === 'object' && value !== null) {
            return value[i18n.language] || value.en || Object.values(value)[0] || '';
          }
          return value;
        },
      },
      {
        accessorKey: 'imageUrls',
        header: 'Images',
        Cell: ({ cell, row }) => {
          if (!editMode) {
            // View mode: show icon and text with tooltip
            return (
              <Tooltip title="View Images">
                <Button
                  variant="outlined"
                      size="small"
                  sx={{ minWidth: 0, p: 1, borderRadius: 2, gap: 1 }}
                  onClick={() => handleOpenImageDialog(row.index, false)}
                  startIcon={<VisibilityIcon fontSize="small" />}
                >
                  View Images
                </Button>
              </Tooltip>
            );
          }
          // Edit mode: show icon and text with tooltip
          return (
            <Tooltip title="Edit Images">
              <Button
                variant="outlined"
                size="small"
                color="info"
                sx={{ minWidth: 0, p: 1, borderRadius: 2, gap: 1 }}
                onClick={() => handleOpenImageDialog(row.index, true)}
                startIcon={<EditIcon fontSize="small" />}
              >
                Edit Images
              </Button>
            </Tooltip>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'price',
        header: 'Price (₹)',
        Cell: ({ cell, row }) =>
          editMode && (editField === 'price' || editField === 'both') ? (
            <TextField
              type="number"
              size="small"
              value={editedData[row.index]?.price || ''}
              onChange={e => handlePriceChange(e.target.value, row.index)}
              sx={{ width: 100 }}
              inputProps={{ min: 0 }}
              inputRef={el => priceRefs.current[row.index] = el}
              onKeyDown={e => {
                if (e.key === 'ArrowDown' && priceRefs.current[row.index + 1]) {
                  e.preventDefault();
                  e.stopPropagation();
                  priceRefs.current[row.index + 1].focus();
                } else if (e.key === 'ArrowUp' && priceRefs.current[row.index - 1]) {
                  e.preventDefault();
                  e.stopPropagation();
                  priceRefs.current[row.index - 1].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  // Prevent table navigation, allow cursor movement in input
                  e.stopPropagation();
                }
              }}
            />
          ) : (
            cell.getValue()
          ),
      },
      {
        id: 'graph',
        header: 'Graph',
        size: 120,
        Cell: ({ row }) => {
          const id = row.original.id;
          let history = priceHistories[id] || [];
          if (!history.length) {
            // If no price history, show a straight line for the last 10 days at the current price
            const dateRange = getDateRange(10);
            history = dateRange.map(date => ({ date, price: row.original.price }));
          }
          let data = [...history];
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          if (data.length === 0 || data[data.length - 1].date !== todayStr) {
            data.push({ date: todayStr, price: row.original.price });
          }
          data = data.slice(-10).map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }));
          let color = '#2E7D32';
          if (data.length > 1) {
            const prev = data[data.length - 2].price;
            const curr = data[data.length - 1].price;
            if (curr < prev) color = '#D32F2F';
          }
          return (
            <Box
              sx={{ width: 100, height: 40, cursor: 'pointer' }}
              onClick={() => {
                // Navigate to analytics and trigger a refresh
                navigate(`/analytics/${id}`);
                // Add a small delay to ensure navigation completes before any potential refresh
                setTimeout(() => {
                  window.dispatchEvent(new Event('focus'));
                }, 100);
              }}
              title="View analytics for this product"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Area type="monotone" dataKey="price" stroke={color} fill={color + '33'} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 120,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Delete Product">
              <span>
                <Button
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRowToDelete(row.original);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={saving}
                  sx={{ minWidth: 40, minHeight: 40 }}
                >
                  <DeleteForeverIcon fontSize="small" />
                </Button>
              </span>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [editMode, editField, editedData, i18n.language, priceHistories, saving, handleEditProduct]
  );

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={50} />
      </Box>
    );
  }

  // Cancel button style reference
  const cancelButtonSx = {
    fontWeight: 600,
    color: '#111',
    border: '1.5px solid',
    borderColor: 'grey.400',
    borderRadius: 1.5,
    px: 1.5,
    py: 0.7,
    width: 70,
    minHeight: 36,
    fontSize: 15,
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'action.hover',
      transform: 'scale(1.05)',
      boxShadow: 2,
      color: '#111',
      borderColor: 'grey.600',
    },
  };
  // Save button style reference (from AddGreetingDialog)
  const saveButtonSx = {
    fontWeight: 700,
    borderRadius: 1,
    px: 2.5,
    py: 1.2,
    fontSize: 15,
    minWidth: 100,
    minHeight: 36,
    transition: 'all 0.2s',
    boxShadow: 2,
    '&:hover': {
      backgroundColor: 'primary.dark',
      transform: 'scale(1.05)',
      boxShadow: 3,
    },
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="text"
          color="inherit"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setAddDialogOpen(true)}
          disabled={editMode || saving}
          sx={{
            fontWeight: !editMode && !editField ? 700 : 600,
            color: '#111',
            borderBottom: !editMode && !editField ? '3px solid #111' : 'none',
            borderRadius: 2,
            px: 2.5,
            py: 1.2,
            transition: 'all 0.2s',
            backgroundColor: !editMode && !editField ? 'rgba(0,0,0,0.04)' : 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
              transform: 'scale(1.05)',
              boxShadow: 2,
              color: '#111',
            },
          }}
        >
          {t('add_product')}
        </Button>
        {!editMode && (
          <Button
            variant="text"
            color="inherit"
            startIcon={<EditIcon />}
            sx={{
              fontWeight: editField === 'both' ? 700 : 600,
              color: '#111',
              borderBottom: editField === 'both' ? '3px solid #111' : 'none',
              borderRadius: 2,
              px: 2.5,
              py: 1.2,
              transition: 'all 0.2s',
              backgroundColor: editField === 'both' ? 'rgba(0,0,0,0.04)' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'scale(1.05)',
                boxShadow: 2,
                color: '#111',
              },
            }}
            onClick={handleEdit}
            disabled={editMode}
          >
            Edit
          </Button>
        )}
        {editMode && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancelEdit}
            disabled={saving}
            sx={{
              fontWeight: 600,
              color: '#111',
              border: '1.5px solid',
              borderColor: 'grey.400',
              borderRadius: 2,
              px: 2.5,
              py: 1.2,
              transition: 'all 0.2s',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'scale(1.05)',
                boxShadow: 2,
                color: '#111',
                borderColor: 'grey.600',
              },
            }}
          >
            Cancel
          </Button>
        )}
      </Box>
      {/* Show action buttons when products are selected in edit mode */}
      {editMode && Object.keys(rowSelection).filter(key => rowSelection[key]).length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            {Object.keys(rowSelection).filter(key => rowSelection[key]).length} product(s) selected
          </Typography>
          <Button
            variant="contained"
            color="warning"
            onClick={handleDisableSelectedProducts}
            disabled={saving}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Disable Product
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleEnableSelectedProducts}
            disabled={saving}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Enable Product
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSelectedProducts}
            disabled={saving}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Delete Product
          </Button>
        </Box>
      )}
      <MaterialReactTable
        key={i18n.language}
        columns={columns}
        data={editMode ? editedData.filter(p => isNumericId(p.id)) : data.filter(p => isNumericId(p.id))}
        enablePagination={false}
        enableRowSelection={editMode}
        getRowId={(row) => row.id.toString()}
        onRowSelectionChange={setRowSelection}
        state={{
          rowSelection,
        }}
        initialState={{
          density: 'compact',
        }}
        muiTableBodyRowProps={({ row }) => {
          const disabled = row?.original?.isDisabled;
          return {
            sx: {
              '&:nth-of-type(odd)': {
                backgroundColor: disabled ? 'action.disabledBackground' : 'background.default',
              },
              '&:nth-of-type(even)': {
                backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
              },
              '&:hover': {
                backgroundColor: disabled ? 'action.disabledBackground' : 'rgba(46,125,50,0.08)',
                transition: 'background 0.2s',
              },
              opacity: disabled ? 0.6 : 1,
            },
          };
        }}
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            // Make header icons (sort, menu) black
            '& .MuiSvgIcon-root': {
              color: '#111 !important',
            },
            '& .MuiButtonBase-root': {
              color: '#111 !important',
            },
            // Extra specificity for sort icons
            '& .MuiTableSortLabel-root .MuiSvgIcon-root': {
              color: '#111 !important',
            },
            '& .Mui-active .MuiSvgIcon-root': {
              color: '#111 !important',
            },
          },
        }}
        renderBottomToolbar={() => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, gap: 2 }}>
            {editMode && editField !== 'images' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{ fontWeight: 600, borderRadius: 3, px: 2.5, py: 1.2, boxShadow: 3, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'scale(1.08)', boxShadow: 6 } }}
                  onClick={() => setConfirmSaveOpen(true)}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  sx={{
                    fontWeight: 600,
                    color: '#111',
                    border: '1.5px solid',
                    borderColor: 'grey.400',
                    borderRadius: 2,
                    px: 2.5,
                    py: 1.2,
                    transition: 'all 0.2s',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'scale(1.05)',
                      boxShadow: 2,
                      color: '#111',
                      borderColor: 'grey.600',
                    },
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        )}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Delete Product</DialogTitle>
        <DialogContent>Are you sure you want to delete this product?</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            variant="outlined"
            sx={{
              fontWeight: 600,
              color: '#111',
              border: '1.5px solid',
              borderColor: 'grey.400',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.7,
              width: 70,
              minHeight: 36,
              fontSize: 15,
              transition: 'all 0.2s',
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'scale(1.05)',
                boxShadow: 2,
                color: '#111',
                borderColor: 'grey.600',
              },
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => handleDeleteProduct(rowToDelete)} color="error" variant="contained" autoFocus disabled={!rowToDelete || !rowToDelete.id}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} PaperProps={{ sx: { borderRadius: "15px", boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Add Product</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.contrastText', fontSize: 13 }}>
              💡 <strong>Auto-translation:</strong> When you enter product name or description in English, it will automatically translate to Hindi and Telugu.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small" disabled={!!newProductId}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newProduct.category}
                label="Category"
                onChange={e => handleAddProductFieldChange('category', e.target.value)}
                disabled={!!newProductId || categoriesLoading}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id || category.name} value={category.name || category}>
                    {category.name || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Name (EN)"
                value={newProduct.name.en}
                onChange={e => handleAddProductFieldChange('name', e.target.value, null, 'en')}
                size="small"
                fullWidth
                disabled={!!newProductId}
              />
              <TextField
                label="Name (HI)"
                value={newProduct.name.hi}
                onChange={e => handleAddProductFieldChange('name', e.target.value, null, 'hi')}
                size="small"
                fullWidth
                disabled={!!newProductId}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
              <TextField
                label="Name (TE)"
                value={newProduct.name.te}
                onChange={e => handleAddProductFieldChange('name', e.target.value, null, 'te')}
                size="small"
                fullWidth
                disabled={!!newProductId}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
            </Box>
            <TextField
              label="Price"
              type="number"
              value={newProduct.price}
              onChange={e => handleAddProductFieldChange('price', e.target.value)}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
              disabled={!!newProductId}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Description (EN)"
                value={newProduct.description.en}
                onChange={e => handleAddProductFieldChange('description', e.target.value, null, 'en')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={!!newProductId}
              />
              <TextField
                label="Description (HI)"
                value={newProduct.description.hi}
                onChange={e => handleAddProductFieldChange('description', e.target.value, null, 'hi')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={!!newProductId}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
              <TextField
                label="Description (TE)"
                value={newProduct.description.te}
                onChange={e => handleAddProductFieldChange('description', e.target.value, null, 'te')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={!!newProductId}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
            </Box>
            {/* Image upload section - available before and after product creation */}
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: 16 }}>
                Product Images
                {pendingNewProductImages.length > 0 && (
                  <Typography component="span" sx={{ ml: 1, fontSize: 13, color: 'text.secondary', fontWeight: 400 }}>
                    ({pendingNewProductImages.length} {pendingNewProductImages.length === 1 ? 'image' : 'images'} selected)
                  </Typography>
                )}
              </Box>
              
              {!newProductId && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      disabled={adding}
                    >
                      Select Single Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePendingImageSelect}
                        disabled={adding}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      disabled={adding}
                    >
                      Select Multiple Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handlePendingImageSelect}
                        disabled={adding}
                      />
                    </Button>
                    {pendingNewProductImages.length > 0 && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClearAllPendingImages}
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                        disabled={adding}
                      >
                        Clear All
                      </Button>
                    )}
                  </Box>
                  
                  {/* Preview of selected images */}
                  {pendingNewProductImages.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}>
                        Selected images will be uploaded automatically after product is created:
                      </Typography>
                      <Grid container spacing={2}>
                        {pendingNewProductImages.map((file, idx) => (
                          <Grid item xs={6} sm={4} md={3} key={idx}>
                            <Box sx={{ position: 'relative', border: '1px solid #eee', borderRadius: 2, p: 1, bgcolor: '#fafbfc' }}>
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: 100,
                                  objectFit: 'cover',
                                  borderRadius: 4,
                                  boxShadow: '0 2px 8px #0001'
                                }}
                              />
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleRemovePendingImage(idx)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  minWidth: 32,
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                                }}
                                disabled={adding}
                              >
                                <DeleteIcon fontSize="small" />
                              </Button>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  textAlign: 'center',
                                  fontSize: 11,
                                  color: 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {file.name}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Image upload section after product is created */}
              {!!newProductId && (
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      disabled={addImageUploading}
                    >
                      Select Single Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleAddImageFileChange}
                        disabled={addImageUploading}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddCircleOutlineIcon />}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      disabled={addImageUploading}
                    >
                      Select Multiple Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleAddMultipleImageFiles}
                        disabled={addImageUploading}
                      />
                    </Button>
                    {addImageFiles.length > 0 && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {addImageFiles.length} {addImageFiles.length === 1 ? 'image' : 'images'} selected
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddImageFileUpload}
                      disabled={(addImageFiles.length === 0 && !addImageFile) || addImageUploading}
                      sx={{ fontWeight: 600, borderRadius: 2, boxShadow: 1 }}
                    >
                      {addImageUploading ? 'Uploading...' : `Upload ${addImageFiles.length > 0 ? `(${addImageFiles.length})` : ''}`}
                    </Button>
                  </Box>
                  
                  {addImageUploadError && (
                    <Typography variant="body2" color="error" sx={{ mb: 1, fontSize: 13 }}>
                      {addImageUploadError}
                    </Typography>
                  )}
                  
                  {addImageUploadSuccess && (
                    <Typography variant="body2" color="success.main" sx={{ mb: 1, fontSize: 13 }}>
                      Image uploaded successfully!
                    </Typography>
                  )}
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {addProductImages.map((imageId, idx) => (
                      <Grid item xs={6} sm={4} md={3} key={idx}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, border: '1px solid #eee', borderRadius: 2, p: 1, bgcolor: '#fafbfc' }}>
                          <img
                            src={getProductImageUrl(imageId)}
                            alt={`Product ${idx + 1}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: 100,
                              borderRadius: 4,
                              boxShadow: '0 2px 8px #0001',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseAddDialog}
            color="inherit"
            variant="outlined"
            sx={cancelButtonSx}
            disabled={adding}
          >
            Cancel
          </Button>
          {!newProductId && (
            <Button
              onClick={handleAddProduct}
              color="success"
              variant="contained"
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                py: 1.2,
                transition: 'all 0.2s',
                backgroundColor: 'success.main',
                color: '#fff',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: 'success.dark',
                  transform: 'scale(1.05)',
                  boxShadow: 3,
                },
              }}
              disabled={adding || !newProduct.name.en || !newProduct.price}
            >
              {adding ? 'Adding...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Edit Product Dialog */}
      <Dialog open={editProductDialogOpen} onClose={handleCloseEditProductDialog} PaperProps={{ sx: { borderRadius: "15px", boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Edit Product</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.contrastText', fontSize: 13 }}>
              💡 <strong>Auto-translation:</strong> When you change product name or description in English, it will automatically translate to Hindi and Telugu.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small" disabled={updatingProduct}>
              <InputLabel>Category</InputLabel>
              <Select
                value={editProductForm.category}
                label="Category"
                onChange={e => handleEditProductFieldChange('category', e.target.value)}
                disabled={updatingProduct || categoriesLoading}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id || category.name} value={category.name || category}>
                    {category.name || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Name (EN)"
                value={editProductForm.name.en}
                onChange={e => handleEditProductFieldChange('name', e.target.value, 'en')}
                size="small"
                fullWidth
                disabled={updatingProduct}
              />
              <TextField
                label="Name (HI)"
                value={editProductForm.name.hi}
                onChange={e => handleEditProductFieldChange('name', e.target.value, 'hi')}
                size="small"
                fullWidth
                disabled={updatingProduct}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
              <TextField
                label="Name (TE)"
                value={editProductForm.name.te}
                onChange={e => handleEditProductFieldChange('name', e.target.value, 'te')}
                size="small"
                fullWidth
                disabled={updatingProduct}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Description (EN)"
                value={editProductForm.description.en}
                onChange={e => handleEditProductFieldChange('description', e.target.value, 'en')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={updatingProduct}
              />
              <TextField
                label="Description (HI)"
                value={editProductForm.description.hi}
                onChange={e => handleEditProductFieldChange('description', e.target.value, 'hi')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={updatingProduct}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
              <TextField
                label="Description (TE)"
                value={editProductForm.description.te}
                onChange={e => handleEditProductFieldChange('description', e.target.value, 'te')}
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={updatingProduct}
                InputProps={{
                  endAdornment: translating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                        Translating...
                      </Typography>
                    </Box>
                  )
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEditProductDialog}
            color="inherit"
            variant="outlined"
            sx={cancelButtonSx}
            disabled={updatingProduct}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProduct}
            color="primary"
            variant="contained"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              py: 1.2,
              transition: 'all 0.2s',
              backgroundColor: 'primary.main',
              color: '#fff',
              boxShadow: 2,
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'scale(1.05)',
                boxShadow: 3,
              },
            }}
            disabled={updatingProduct || !editProductForm.name.en}
          >
            {updatingProduct ? 'Updating...' : 'Update Product'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={handleCloseImageDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 20, pb: 0.5 }}>
          {imageDialogEditMode ? 'Edit Images' : 'Product Images'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
            {imageDialogRowIndex !== null && (
              <>
                <Box sx={{ mb: 2, fontWeight: 500, color: 'text.secondary', fontSize: 16 }}>
                  Current Images
                </Box>
                <Grid container spacing={2}>
                  {imageDialogEditMode ? (
                    (editedData[imageDialogRowIndex]?.imageUrls || []).map((imageId, idx) => (
                      imageId && (
                        <Grid span={6} sm={4} md={3} key={idx}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, border: '1px solid #eee', borderRadius: 2, p: 1, bgcolor: '#fafbfc' }}>
                            <img
                              src={getProductImageUrl(imageId)}
                              alt={`Product ${idx + 1}`}
                              style={{
                                maxWidth: 80,
                                maxHeight: 60,
                                borderRadius: 4,
                                marginBottom: 4,
                                boxShadow: '0 2px 8px #0001',
                                transition: 'transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s',
                                cursor: 'pointer',
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.transform = 'scale(2.2)';
                                e.currentTarget.style.zIndex = 10;
                                e.currentTarget.style.boxShadow = '0 8px 32px #0003';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.zIndex = 1;
                                e.currentTarget.style.boxShadow = '0 2px 8px #0001';
                              }}
                            />
                            {imageDialogEditMode && (
                              <Tooltip title="Delete Image">
                                <span>
                                  <Button onClick={() => handleImageDialogDeleteImage(idx)} color="error" size="small" sx={{ minWidth: 0 }} disabled={deletingImageIdx === idx}>
                                    {deletingImageIdx === idx ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon fontSize="small" />}
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </Grid>
                      )
                    ))
                  ) : viewImagesLoading ? (
                    <Grid span={12}><Box sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>Loading images...</Box></Grid>
                  ) : viewImageIds.length > 0 ? (
                    viewImageIds.map((imageId, idx) => (
                      <Grid span={6} sm={4} md={3} key={idx}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, border: '1px solid #eee', borderRadius: 2, p: 1, bgcolor: '#fafbfc' }}>
                          <img
                            src={getProductImageUrl(imageId)}
                            alt={`Product ${idx + 1}`}
                            style={{
                              maxWidth: 140,
                              maxHeight: 120,
                              borderRadius: 8,
                              marginBottom: 8,
                              boxShadow: '0 4px 16px #0001',
                              background: '#fff',
                              transition: 'transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s',
                              cursor: 'pointer',
                              border: '2px solid #e0e0e0',
                            }}

                            onClick={() => setFullscreenImage(getProductImageUrl(imageId))}
                          />
                        </Box>
                      </Grid>
                    ))
                  ) : (
                    <Grid span={12}><Box sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>No Images</Box></Grid>
                  )}
                </Grid>
                {imageDialogEditMode && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 1, fontWeight: 500, color: 'text.secondary', fontSize: 16 }}>Add New Images</Box>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ marginBottom: 8 }}
                      multiple
                    />
                    {pendingImageFiles.length > 0 && (
                      <Box sx={{ color: 'text.secondary', fontSize: 14, mb: 1 }}>
                        Pending images: {pendingImageFiles.map(f => f.name).join(', ')}
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={async () => {
                            await handleUploadPendingImage();
                            if (uploadSuccess && !uploadError) {
                              setImageEditSaveSuccess(true);
                              // Close dialog after a brief delay to show success message
                              setTimeout(() => {
                                setEditMode(false);
                                setEditField(null);
                                setImageDialogEditMode(false);
                                setImageDialogOpen(false);
                                setImageEditSaveSuccess(false);
                                setUploadSuccess(false);
                              }, 1000);
                            }
                          }}
                          disabled={uploading}
                          sx={{ ml: 2, fontWeight: 600, borderRadius: 2, boxShadow: 1 }}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </Box>
                    )}
                    {uploadError && (
                      <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: 13 }}>
                        {uploadError}
                      </Typography>
                    )}
                    {uploadSuccess && !uploadError && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 1, fontSize: 13 }}>
                        {imageDeleteSuccess ? 'Image deleted successfully!' : 'Images uploaded successfully!'}
                      </Typography>
                    )}
                    {imageDeleteSuccess && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 1, fontSize: 13 }}>
                        Image deleted successfully!
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ pb: 2, pr: 3 }}>
            <Button onClick={handleCloseImageDialog} color="secondary" variant="outlined" sx={cancelButtonSx}>Close</Button>
          </DialogActions>
        </Dialog>
      {/* Fullscreen image modal */}
      <Dialog open={!!fullscreenImage} onClose={() => setFullscreenImage(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, boxShadow: 2, backgroundColor: 'transparent' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <img src={fullscreenImage} alt="Product Fullscreen" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 8px 32px #0008' }} />
          <Button onClick={() => setFullscreenImage(null)} color="secondary" variant="contained" sx={{ mt: 3, fontWeight: 600, borderRadius: 2 }}>
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Translation Success Snackbar */}
      <Snackbar
        open={translationSuccess}
        autoHideDuration={3000}
        onClose={() => setTranslationSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={() => setTranslationSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          ✅ Product name translated successfully!
        </MuiAlert>
      </Snackbar>

      {/* Confirmation Dialog - Delete Selected Products */}
      <Dialog open={confirmDeleteSelectedOpen} onClose={() => setConfirmDeleteSelectedOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', fontSize: 22 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {Object.keys(rowSelection).filter(key => rowSelection[key]).length} selected product(s)? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteSelectedOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteSelectedProducts} color="error" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Disable Selected Products */}
      <Dialog open={confirmDisableOpen} onClose={() => setConfirmDisableOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'warning.main', fontSize: 22 }}>Confirm Disable</DialogTitle>
        <DialogContent>
          Are you sure you want to disable {Object.keys(rowSelection).filter(key => rowSelection[key]).length} selected product(s)? Disabled products will not be visible to customers.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDisableOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={confirmDisableSelectedProducts} color="warning" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Disable
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Enable Selected Products */}
      <Dialog open={confirmEnableOpen} onClose={() => setConfirmEnableOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'success.main', fontSize: 22 }}>Confirm Enable</DialogTitle>
        <DialogContent>
          Are you sure you want to enable {Object.keys(rowSelection).filter(key => rowSelection[key]).length} selected product(s)? Enabled products will be visible to customers.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEnableOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={confirmEnableSelectedProducts} color="success" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Enable
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Save Changes */}
      <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Confirm Save</DialogTitle>
        <DialogContent>
          Are you sure you want to save all changes? This will update product prices in the database.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Add Product */}
      <Dialog open={confirmAddProductOpen} onClose={() => setConfirmAddProductOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Confirm Add Product</DialogTitle>
        <DialogContent>
          Are you sure you want to add this product? Make sure all required fields are filled correctly.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAddProductOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={confirmAddProduct} color="primary" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Update Product */}
      <Dialog open={confirmUpdateProductOpen} onClose={() => setConfirmUpdateProductOpen(false)} PaperProps={{ sx: { borderRadius: '10px', boxShadow: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22 }}>Confirm Update</DialogTitle>
        <DialogContent>
          Are you sure you want to update this product? This will modify the product name, description, and category.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUpdateProductOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Cancel
          </Button>
          <Button onClick={confirmUpdateProduct} color="primary" variant="contained" autoFocus sx={{ fontWeight: 600, borderRadius: 1.5, px: 1.5, py: 0.7 }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default TableView; 