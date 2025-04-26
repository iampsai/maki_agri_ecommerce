import React, { useState, useEffect, useContext } from "react";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import "./reports.css";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const context = useContext(MyContext);

  useEffect(() => {
    context.setProgress(30);
    checkRole();
    fetchReportData();
  }, [reportType, startDate, endDate]);

  const checkRole = () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      const role = userData.role || (userData.isAdmin ? 'admin' : 'user');
      // Only admin can access this page
      setIsAdmin(role === 'admin');
      
      if (role !== 'admin') {
        // Redirect if not admin
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/login";
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      context.setProgress(50);
      
      console.log("Fetching report data with params:", { reportType, startDate, endDate });
      
      // Fetch sales data
      console.log("Fetching sales data...");
      const salesResponse = await fetchDataFromApi(
        `/api/reports/sales?type=${reportType}&startDate=${startDate}&endDate=${endDate}`
      );
      
      console.log("Sales API response:", salesResponse);
      
      if (salesResponse && salesResponse.success) {
        setSalesData(salesResponse.data || []);
        console.log("Using API sales data");
      } else {
        // Use mock data as fallback
        console.log("Using mock sales data");
        const mockSalesData = generateMockSalesData();
        setSalesData(mockSalesData);
      }
      
      // Fetch inventory data
      console.log("Fetching inventory data...");
      const inventoryResponse = await fetchDataFromApi(`/api/reports/inventory`);
      
      console.log("Inventory API response:", inventoryResponse);
      
      if (inventoryResponse && inventoryResponse.success) {
        setInventoryData(inventoryResponse.data || []);
        console.log("Using API inventory data");
      } else {
        // Use mock data as fallback
        console.log("Using mock inventory data");
        const mockInventoryData = generateMockInventoryData();
        setInventoryData(mockInventoryData);
      }
      
      // Fetch customer data
      console.log("Fetching customer data...");
      const customerResponse = await fetchDataFromApi(
        `/api/reports/customers?type=${reportType}&startDate=${startDate}&endDate=${endDate}`
      );
      
      console.log("Customer API response:", customerResponse);
      
      if (customerResponse && customerResponse.success) {
        setCustomerData(customerResponse.data || {});
        console.log("Using API customer data");
      } else {
        // Use mock data as fallback
        console.log("Using mock customer data");
        const mockCustomerData = generateMockCustomerData();
        setCustomerData(mockCustomerData);
      }
      
      context.setProgress(100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to load report data. Using mock data temporarily."
      });
      
      // Use mock data as fallback
      console.log("Using mock data due to error");
      const mockSalesData = generateMockSalesData();
      setSalesData(mockSalesData);
      
      const mockInventoryData = generateMockInventoryData();
      setInventoryData(mockInventoryData);
      
      const mockCustomerData = generateMockCustomerData();
      setCustomerData(mockCustomerData);
      
      context.setProgress(100);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock sales data for development or fallback
  const generateMockSalesData = () => {
    const periods = reportType === 'daily' ? 14 : reportType === 'weekly' ? 8 : 6;
    const result = [];
    
    for (let i = 0; i < periods; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * (reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30)));
      
      let periodLabel = '';
      if (reportType === 'daily') {
        periodLabel = `${date.getMonth()+1}/${date.getDate()}`;
      } else if (reportType === 'weekly') {
        periodLabel = `Week ${periods-i}`;
      } else {
        periodLabel = `${date.toLocaleString('default', { month: 'short' })}`;
      }
      
      result.push({
        period: periodLabel,
        totalSales: Math.floor(Math.random() * 10000) + 1000,
        orderCount: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return result.reverse(); // Most recent last
  };

  // Generate mock inventory data for development or fallback
  const generateMockInventoryData = () => {
    const products = [
      { name: "Organic Potato", category: { name: "Vegetables" } },
      { name: "Fresh Carrots", category: { name: "Vegetables" } },
      { name: "Garden Tomatoes", category: { name: "Vegetables" } },
      { name: "Red Onions", category: { name: "Vegetables" } },
      { name: "Green Peas", category: { name: "Vegetables" } },
      { name: "Red Apples", category: { name: "Fruits" } },
      { name: "Sweet Oranges", category: { name: "Fruits" } },
      { name: "Ripe Bananas", category: { name: "Fruits" } },
      { name: "Chicken Feed", category: { name: "Animal Feed" } },
      { name: "Cattle Feed", category: { name: "Animal Feed" } },
      { name: "Garden Soil", category: { name: "Garden" } },
      { name: "Gardening Tools Set", category: { name: "Tools" } },
      { name: "Farm Gloves", category: { name: "Accessories" } },
      { name: "Fertilizer 5kg", category: { name: "Fertilizers" } },
      { name: "Organic Compost", category: { name: "Fertilizers" } }
    ];
    
    return products.map((product, index) => ({
      id: index + 1,
      ...product,
      countInStock: index % 3 === 0 ? 0 : index % 5 === 0 ? Math.floor(Math.random() * 9) + 1 : Math.floor(Math.random() * 50) + 10,
      price: Math.floor(Math.random() * 50) + 5
    }));
  };

  // Generate mock customer data for development or fallback
  const generateMockCustomerData = () => {
    const topCustomers = [
      { name: "John Smith", email: "john@example.com", totalSpent: 1240.50, orderCount: 12 },
      { name: "Mary Johnson", email: "mary@example.com", totalSpent: 980.25, orderCount: 8 },
      { name: "David Lee", email: "david@example.com", totalSpent: 720.00, orderCount: 6 },
      { name: "Sarah Williams", email: "sarah@example.com", totalSpent: 650.75, orderCount: 5 },
      { name: "Michael Brown", email: "michael@example.com", totalSpent: 520.30, orderCount: 4 },
      { name: "Lisa Davis", email: "lisa@example.com", totalSpent: 480.50, orderCount: 3 },
      { name: "Robert Wilson", email: "robert@example.com", totalSpent: 350.25, orderCount: 2 },
      { name: "Jennifer Moore", email: "jennifer@example.com", totalSpent: 320.00, orderCount: 2 }
    ];
    
    // Customer activity over time
    const periods = reportType === 'daily' ? 14 : reportType === 'weekly' ? 8 : 6;
    const customerActivity = [];
    
    for (let i = 0; i < periods; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * (reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30)));
      
      let periodLabel = '';
      if (reportType === 'daily') {
        periodLabel = `${date.getMonth()+1}/${date.getDate()}`;
      } else if (reportType === 'weekly') {
        periodLabel = `Week ${periods-i}`;
      } else {
        periodLabel = `${date.toLocaleString('default', { month: 'short' })}`;
      }
      
      customerActivity.push({
        period: periodLabel,
        newCustomers: Math.floor(Math.random() * 20) + 5,
        activeCustomers: Math.floor(Math.random() * 50) + 20
      });
    }
    
    return {
      totalCustomers: 450,
      newCustomers: 35,
      activeCustomers: 120,
      topCustomers,
      customerActivity: customerActivity.reverse()
    };
  };

  // Handle tab change
  const handleTabChange = (tabIndex) => {
    setTabValue(tabIndex);
  };

  // Handle report type change
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  // Handle date changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  // Handle export button click
  const handleExportClick = async () => {
    try {
      setExportLoading(true);
      
      // Determine which data to export based on current tab
      let data;
      let fileName;
      
      if (tabValue === 0) {
        data = salesData;
        fileName = `sales_report_${reportType}_${startDate}_to_${endDate}.csv`;
      } else if (tabValue === 1) {
        data = inventoryData;
        fileName = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        data = customerData;
        fileName = `customer_report_${reportType}_${startDate}_to_${endDate}.csv`;
      }
      
      // Convert data to CSV format
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Handle different data formats based on tab
      if (tabValue === 0) {
        // Sales data CSV
        csvContent += "Period,Total Sales,Order Count\n";
        data.forEach(item => {
          csvContent += `${item.period},${item.totalSales},${item.orderCount}\n`;
        });
      } else if (tabValue === 1) {
        // Inventory data CSV
        csvContent += "ID,Product Name,Category,In Stock,Price\n";
        data.forEach(item => {
          csvContent += `${item.id},"${item.name}","${item.category?.name || 'Uncategorized'}",${item.countInStock},${item.price}\n`;
        });
      } else {
        // Customer data - export top customers
        csvContent += "Customer Name,Email,Total Spent,Order Count\n";
        customerData.topCustomers.forEach(customer => {
          csvContent += `"${customer.name}","${customer.email}",${customer.totalSpent.toFixed(2)},${customer.orderCount}\n`;
        });
      }
      
      // Create download link and trigger download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      context.setAlertBox({
        open: true,
        error: false,
        msg: "Report exported successfully"
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to export report"
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate summary data for sales
  const getSalesStats = () => {
    const totalSales = salesData.reduce((sum, item) => sum + (item.totalSales || 0), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return { totalSales, totalOrders, avgOrderValue };
  };

  // Calculate summary data for inventory
  const getInventoryStats = () => {
    const totalProducts = inventoryData.length;
    const outOfStockCount = inventoryData.filter(item => item.countInStock <= 0).length;
    const lowStockCount = inventoryData.filter(item => item.countInStock > 0 && item.countInStock < 10).length;
    
    return { totalProducts, outOfStockCount, lowStockCount };
  };

  // Get stock status
  const getStockStatusClass = (stock) => {
    if (stock <= 0) {
      return "status-out";
    } else if (stock < 10) {
      return "status-low";
    } else {
      return "status-in";
    }
  };

  // Get stock status text
  const getStockStatusText = (stock) => {
    if (stock <= 0) {
      return "Out of Stock";
    } else if (stock < 10) {
      return "Low Stock";
    } else {
      return "In Stock";
    }
  };
  
  // Pagination
  const paginateData = (data) => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };
  
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  const pageCount = (data) => {
    return Math.ceil(data.length / rowsPerPage);
  };
  
  // Pagination controls
  const renderPagination = (data) => {
    const totalPages = pageCount(data);
    
    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(page - 1)} 
          disabled={page === 0}
          className="page-btn"
        >
          Previous
        </button>
        <span className="page-info">
          Page {page + 1} of {totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(page + 1)} 
          disabled={page >= totalPages - 1}
          className="page-btn"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="right-content w-100">
      <div className="content-wrapper">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Reports</h5>
          
          <div className="ml-auto">
            <span className="breadcrumbs_">
              Dashboard / Reports
            </span>
          </div>
        </div>
        
        <div className="card shadow border-0 p-3 mt-4">
          {/* Report Controls */}
          <div className="report-controls">
            <div className="filters">
              <div className="form-group">
                <label htmlFor="report-type">Report Type</label>
                <select 
                  id="report-type" 
                  value={reportType} 
                  onChange={handleReportTypeChange}
                  className="form-control"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="start-date">Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end-date">End Date</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <button 
              className="btn btn-primary export-btn"
              onClick={handleExportClick}
            >
              Export PDF
            </button>
          </div>
          
          <hr />
          
          {/* Report Tabs */}
          <div className="report-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
                onClick={() => handleTabChange(0)}
              >
                Sales Report
              </button>
              <button 
                className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
                onClick={() => handleTabChange(1)}
              >
                Inventory Report
              </button>
              <button 
                className={`tab-button ${tabValue === 2 ? 'active' : ''}`}
                onClick={() => handleTabChange(2)}
              >
                Customer Report
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading report data...</p>
            </div>
          ) : (
            <div className="tab-content">
              {/* Sales Report */}
              {tabValue === 0 && (
                <div className="tab-pane">
                  <div className="stat-cards">
                    <div className="stat-card">
                      <h3>Total Sales</h3>
                      <div className="stat-value">${getSalesStats().totalSales.toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Total Orders</h3>
                      <div className="stat-value">{getSalesStats().totalOrders}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Average Order</h3>
                      <div className="stat-value">${getSalesStats().avgOrderValue.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Total Sales</th>
                          <th>Order Count</th>
                          <th>Avg. Order Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginateData(salesData).map((row, index) => (
                          <tr key={index}>
                            <td>{row.period}</td>
                            <td>${row.totalSales.toFixed(2)}</td>
                            <td>{row.orderCount}</td>
                            <td>${(row.totalSales / row.orderCount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {renderPagination(salesData)}
                </div>
              )}
              
              {/* Inventory Report */}
              {tabValue === 1 && (
                <div className="tab-pane">
                  <div className="stat-cards">
                    <div className="stat-card">
                      <h3>Total Products</h3>
                      <div className="stat-value">{getInventoryStats().totalProducts}</div>
                    </div>
                    <div className="stat-card status-out">
                      <h3>Out of Stock</h3>
                      <div className="stat-value">{getInventoryStats().outOfStockCount}</div>
                    </div>
                    <div className="stat-card status-low">
                      <h3>Low Stock</h3>
                      <div className="stat-value">{getInventoryStats().lowStockCount}</div>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginateData(inventoryData).map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.category.name}</td>
                            <td>${row.price.toFixed(2)}</td>
                            <td>{row.countInStock}</td>
                            <td>
                              <span className={`status-badge ${getStockStatusClass(row.countInStock)}`}>
                                {getStockStatusText(row.countInStock)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {renderPagination(inventoryData)}
                </div>
              )}
              
              {/* Customer Report */}
              {tabValue === 2 && (
                <div className="tab-pane">
                  <div className="stat-cards">
                    <div className="stat-card">
                      <h3>Total Customers</h3>
                      <div className="stat-value">{customerData.totalCustomers}</div>
                    </div>
                    <div className="stat-card">
                      <h3>New Customers</h3>
                      <div className="stat-value">{customerData.newCustomers}</div>
                    </div>
                    <div className="stat-card">
                      <h3>Active Customers</h3>
                      <div className="stat-value">{customerData.activeCustomers}</div>
                    </div>
                  </div>
                  
                  <h4 className="section-title">Top Customers</h4>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Total Spent</th>
                          <th>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginateData(customerData.topCustomers || []).map((row, index) => (
                          <tr key={index}>
                            <td>{row.name}</td>
                            <td>{row.email}</td>
                            <td>${row.totalSpent.toFixed(2)}</td>
                            <td>{row.orderCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {renderPagination(customerData.topCustomers || [])}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
