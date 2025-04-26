import React, { useState, useEffect, useContext } from "react";
import { MyContext } from "../../App";
import { fetchDataFromApi, editData } from "../../utils/api";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Breadcrumbs,
  Typography,
  IconButton,
  Box
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { FaSearch, FaEdit, FaSave } from "react-icons/fa";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import FilterListIcon from "@mui/icons-material/FilterList";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { Link } from "react-router-dom";

const StyledBreadcrumb = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800],
  height: theme.spacing(3),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover, &:focus': {
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
  },
  '&:active': {
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[600],
  },
}));

const columns = [
  { id: "product", label: "Product", minWidth: 200 },
  { id: "category", label: "Category", minWidth: 120 },
  { id: "sku", label: "SKU", minWidth: 100 },
  { id: "currentStock", label: "Current Stock", minWidth: 100, align: "center" },
  { id: "status", label: "Status", minWidth: 120 },
  { id: "actions", label: "Actions", minWidth: 120, align: "center" }
];

const StockManagement = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [isStaffRole, setIsStaffRole] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  
  const context = useContext(MyContext);

  useEffect(() => {
    context.setProgress(30);
    checkRole();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      filterProducts();
    }
  }, [searchQuery, products, lowStockOnly]);

  const checkRole = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      const role = userData.role || (userData.isAdmin ? 'admin' : 'user');
      // Access allowed for both staff and admin roles
      setIsStaffRole(role === 'staff' || role === 'admin');
      
      if (role !== 'staff' && role !== 'admin') {
        // Redirect if not staff/admin
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/login";
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      context.setProgress(50);
      const response = await fetchDataFromApi("/api/products");
      
      // Check if the response is an array or an object with nested products array
      const productsData = Array.isArray(response) ? response : 
                           response.products ? response.products : [];
      
      // Enhance product data with stock information
      const enhancedProducts = productsData.map(product => ({
        ...product,
        currentStock: product.countInStock || 0,
        status: getStockStatus(product.countInStock || 0)
      }));
      
      setProducts(enhancedProducts);
      setFilteredProducts(enhancedProducts);
      context.setProgress(100);
    } catch (error) {
      console.error("Error fetching products:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to load products"
      });
      context.setProgress(100);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) {
      return { label: "Out of Stock", color: "error" };
    } else if (stock < 10) {
      return { label: "Low Stock", color: "warning" };
    } else {
      return { label: "In Stock", color: "success" };
    }
  };

  const filterProducts = () => {
    if (!products.length) return;
    
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(query) ||
        product.category?.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      );
    }
    
    // Apply low stock filter
    if (lowStockOnly) {
      filtered = filtered.filter(product => product.currentStock < 10);
    }
    
    setFilteredProducts(filtered);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setStockValue(product.currentStock.toString());
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setStockValue("");
  };

  const handleStockUpdate = async () => {
    if (!currentProduct) return;
    
    const newStockValue = parseInt(stockValue);
    if (isNaN(newStockValue) || newStockValue < 0) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter a valid stock quantity"
      });
      return;
    }
    
    try {
      setSaving(true);
      context.setProgress(30);
      
      // Update product stock
      const response = await editData(`/api/products/${currentProduct.id}`, {
        countInStock: newStockValue
      });
      
      if (response && !response.error) {
        // Update local state
        const updatedProducts = products.map(product => {
          if (product.id === currentProduct.id) {
            return {
              ...product,
              currentStock: newStockValue,
              countInStock: newStockValue,
              status: getStockStatus(newStockValue)
            };
          }
          return product;
        });
        
        setProducts(updatedProducts);
        filterProducts();
        
        context.setAlertBox({
          open: true,
          error: false,
          msg: "Stock updated successfully"
        });
        
        handleEditClose();
      } else {
        throw new Error(response?.msg || "Failed to update stock");
      }
      
      context.setProgress(100);
    } catch (error) {
      console.error("Error updating stock:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Failed to update stock"
      });
      context.setProgress(100);
    } finally {
      setSaving(false);
    }
  };

  const handleLowStockToggle = () => {
    setLowStockOnly(!lowStockOnly);
  };

  // Log stock activity (for audit purposes)
  const logStockActivity = async (productId, oldStock, newStock, userId) => {
    try {
      await fetchDataFromApi("/api/stock/log", {
        method: "POST",
        body: JSON.stringify({
          productId,
          oldStock,
          newStock,
          userId,
          action: "update"
        })
      });
    } catch (error) {
      console.error("Error logging stock activity:", error);
    }
  };

  return (
    <div className="right-content w-100">
      <div className="content-wrapper">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Stock Management</h5>
          
          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
              <StyledBreadcrumb 
                component="a" 
                href="/" 
                label="Dashboard" 
                icon={<HomeIcon fontSize="small" />}
              />
              <StyledBreadcrumb
                label="Stock Management"
                icon={<InventoryIcon fontSize="small" />}
              />
            </Breadcrumbs>
          </div>
        </div>
        
        <div className="card shadow border-0 p-3 mt-4">
          <Box className="d-flex justify-content-between align-items-center mb-4">
            <div className="search-bar" style={{ flexGrow: 1, marginRight: '16px' }}>
              <TextField
                className="searchWrap"
                fullWidth
                variant="outlined"
                placeholder="Search by product name, category, or SKU"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            
            <Button
              variant={lowStockOnly ? "contained" : "outlined"}
              color="warning"
              onClick={handleLowStockToggle}
              startIcon={<ReportProblemIcon />}
            >
              Low Stock Only
            </Button>
          </Box>
          
          <Paper>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
                <CircularProgress />
              </div>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              minWidth: column.minWidth,
                              fontWeight: "bold",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((product) => (
                            <TableRow hover tabIndex={-1} key={product.id}>
                              <TableCell>
                                <div className="d-flex align-items-center">
                                  <img 
                                    src={product.images[0] || "https://via.placeholder.com/50"} 
                                    alt={product.name}
                                    style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 10 }}
                                  />
                                  <div>
                                    <Typography variant="body2" fontWeight="bold">
                                      {product.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      P{product.price ? product.price.toFixed(2) : "N/A"}
                                    </Typography>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{product.catName || "Uncategorized"}</TableCell>
                              <TableCell>{product.sku || "No SKU"}</TableCell>
                              <TableCell align="center">
                                <Typography 
                                  variant="body1" 
                                  fontWeight="bold"
                                  color={product.currentStock <= 0 ? "error" : 
                                         product.currentStock < 10 ? "warning.main" : "inherit"}
                                >
                                  {product.currentStock}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={product.status.label}
                                  color={product.status.color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <div className="d-flex justify-content-center">
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleEditClick(product)}
                                    startIcon={<FaEdit />}
                                  >
                                    Update Stock
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No products found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredProducts.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Paper>
        </div>
        
        {/* Edit Stock Dialog */}
        <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <div className="d-flex align-items-center">
              <InventoryIcon className="mr-2" />
              Update Stock: {currentProduct?.name}
            </div>
          </DialogTitle>
          <DialogContent>
            <div className="mb-3">
              <Box className="d-flex my-3">
                <Typography variant="subtitle2" className="mr-2">Current Stock:</Typography>
                <Chip
                  label={currentProduct?.currentStock || 0}
                  color={
                    !currentProduct?.currentStock ? "error" : 
                    currentProduct?.currentStock < 10 ? "warning" : "success"
                  }
                />
              </Box>
              
              <TextField
                autoFocus
                margin="dense"
                label="New Stock Quantity"
                type="number"
                fullWidth
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                variant="outlined"
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleStockUpdate} 
              color="primary"
              variant="contained"
              disabled={!stockValue.trim() || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <FaSave />}
            >
              {saving ? "Updating..." : "Update Stock"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default StockManagement;
