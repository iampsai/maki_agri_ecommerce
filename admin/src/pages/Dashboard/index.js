import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// MUI Components
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

// Icons
import { FaUserCircle, FaEye, FaPencilAlt } from "react-icons/fa";
import { IoMdCart } from "react-icons/io";
import { MdShoppingBag, MdDelete } from "react-icons/md";
import { GiStarsStack } from "react-icons/gi";

// Custom Components
import DashboardBox from "./components/dashboardBox";
import SearchBox from "../../components/SearchBox";

import { MyContext } from "../../App";

import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

import Rating from "@mui/material/Rating";
import { deleteData, fetchDataFromApi } from "../../utils/api";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
} from "recharts";

export const options = {
  backgroundColor: "transparent",
  chartArea: { width: "100%", height: "100%" },
};

const columns = [
  { id: "product", label: "PRODUCT", minWidth: 150 },
  { id: "category", label: "CATEGORY", minWidth: 100 },
  {
    id: "subcategory",
    label: "SUB CATEGORY",
    minWidth: 150,
  },
  {
    id: "brand",
    label: "BRAND",
    minWidth: 130,
  },
  {
    id: "price",
    label: "PRICE",
    minWidth: 100,
  },
  {
    id: "rating",
    label: "RATING",
    minWidth: 80,
  },
  {
    id: "action",
    label: "ACTION",
    minWidth: 120,
  },
];

const Dashboard = () => {
  const [productList, setProductList] = useState([]);
  const [categoryVal, setcategoryVal] = useState("all");
  const [loading, setLoading] = useState(false);

  const [totalUsers, setTotalUsers] = useState();
  const [totalOrders, setTotalOrders] = useState();
  const [totalProducts, setTotalProducts] = useState();
  const [totalProductsReviews, setTotalProductsReviews] = useState();
  const [totalSales, setTotalSales] = useState();

  const [salesData, setSalesData] = useState([]);

  const [page1, setPage1] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [year, setYear] = useState(new Date().getFullYear());

  const handleChangeYear = (event) => {
    const selectedYear = parseInt(event.target.value);
    setYear(selectedYear);
  };

  const context = useContext(MyContext);

  const handleChangePage = (event, newPage) => {
    setPage1(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage1(0);
  };

  // Initial data fetch - runs only once on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (loading) return;
      
      try {
        setLoading(true);
        
        // Initialize UI
        context.setisHideSidebarAndHeader(false);
        window.scrollTo(0, 0);
        
        // Start loading
        context.setProgress(40);
        
        // Fetch initial data (excluding sales data)
        const [
          products,
          users,
          orders,
          orderAmounts,
          productsCount,
          reviews
        ] = await Promise.all([
          fetchDataFromApi(`/api/products`),
          fetchDataFromApi("/api/user/get/count"),
          fetchDataFromApi("/api/orders/get/count"),
          fetchDataFromApi("/api/orders/"),
          fetchDataFromApi("/api/products/get/count"),
          fetchDataFromApi("/api/productReviews/get/count")
        ]);

        // Update states with fetched data
        setProductList(products);
        setTotalUsers(users.userCount);
        setTotalOrders(orders.orderCount);
        
        // Calculate and set total sales
        const totalSales = orderAmounts?.reduce((sum, item) => 
          sum + parseInt(item.amount || 0), 0);
        setTotalSales(totalSales);
        
        setTotalProducts(productsCount.productsCount);
        setTotalProductsReviews(reviews.productsReviews);

      } catch (error) {
        console.error("Error fetching initial dashboard data:", error);
      } finally {
        context.setProgress(100);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Only run once on mount

  // Separate effect for sales data that depends on year
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // console.log(`🔍 Fetching sales data for year: ${year}`); // Debug log
        context.setProgress(20);
        
        const salesByYear = await fetchDataFromApi(`/api/orders/sales?year=${year}`);
        
        // console.log('📊 Raw sales data received:', JSON.stringify(salesByYear, null, 2)); // Debug log
        
        // Process sales data
        if (salesByYear?.monthlySales?.length > 0) {
          const sales = salesByYear.monthlySales
            .map(item => ({
              name: item?.month,
              sales: parseInt(item?.sale || 0), // Ensure we handle undefined sales
            }))
            .filter((obj, index, self) => 
              index === self.findIndex((t) => t.name === obj.name)
            );
          
          // console.log('✅ Processed sales data:', sales); // Debug log
          // console.log(`📈 Found ${sales.length} months with data for ${year}`);
          setSalesData(sales);
        } else {
          console.log(`❌ No sales data found for year: ${year}`); // Debug log
          console.log('Raw response structure:', Object.keys(salesByYear || {}));
          
          // Set empty data with months for visualization
          const emptyMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ].map(month => ({ name: month, sales: 0 }));
          
          setSalesData(emptyMonths);
        }
      } catch (error) {
        console.error(`❌ Error fetching sales data for year ${year}:`, error);
        
        // Set empty data with months for visualization even on error
        const emptyMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].map(month => ({ name: month, sales: 0 }));
        
        setSalesData(emptyMonths);
      } finally {
        context.setProgress(100);
      }
    };

    fetchSalesData();
  }, [year]); // This will run whenever year changes

  const deleteProduct = async (id) => {
    const userInfo = JSON.parse(localStorage.getItem("user"));
    if (userInfo?.email === "rinkuv37@gmail.com") {
      try {
        context.setProgress(40);
        await deleteData(`/api/products/${id}`);
        
        context.setAlertBox({
          open: true,
          error: false,
          msg: "Product Deleted!",
        });
        
        // Refresh product list
        const res = await fetchDataFromApi(`/api/products`);
        setProductList(res);
      } catch (error) {
        console.error("Error deleting product:", error);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Error deleting product",
        });
      } finally {
        context.setProgress(100);
      }
    } else {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Only Admin can delete Product",
      });
    }
  };

  const handleChangeCategory = async (event) => {
    try {
      context.setProgress(40);
      setcategoryVal(event.target.value);
      
      let res;
      if (event.target.value !== "all") {
        res = await fetchDataFromApi(`/api/products/catId?catId=${event.target.value}`);
      } else {
        res = await fetchDataFromApi(`/api/products`);
      }
      
      setProductList(res);
    } catch (error) {
      console.error("Error filtering by category:", error);
    } finally {
      context.setProgress(100);
    }
  };

  const searchProducts = async (keyword) => {
    try {
      let res;
      if (keyword !== "") {
        res = await fetchDataFromApi(`/api/search?q=${keyword}&page=1&perPage=${10000}`);
      } else {
        res = await fetchDataFromApi(`/api/products`);
      }
      setProductList(res);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  return (
    <>
      <div className="right-content w-100">
        <div className="row dashboardBoxWrapperRow dashboard_Box dashboardBoxWrapperRowV2">
          <div className="col-md-12">
            <div className="dashboardBoxWrapper d-flex">
              <DashboardBox
                color={["#1da256", "#48d483"]}
                icon={<FaUserCircle />}
                grow={true}
                title="Total Users"
                count={totalUsers}
              />
              <DashboardBox
                color={["#c012e2", "#eb64fe"]}
                icon={<IoMdCart />}
                title="Total Orders"
                count={totalOrders}
              />
              <DashboardBox
                color={["#2c78e5", "#60aff5"]}
                icon={<MdShoppingBag />}
                title="Total Products"
                count={totalProducts}
              />
              <DashboardBox
                color={["#e1950e", "#f3cd29"]}
                icon={<GiStarsStack />}
                title="Total Reviews"
                count={totalProductsReviews}
              />
            </div>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <h3 className="hd">Best Selling Products</h3>

          <div className="row cardFilters mt-2 mb-3">
            <div className="col-md-3">
              <h4>CATEGORY BY</h4>
              <FormControl size="small" className="w-100">
                <Select
                  value={categoryVal}
                  onChange={handleChangeCategory}
                  displayEmpty
                  inputProps={{ "aria-label": "Without label" }}
                  className="w-100"
                >
                  <MenuItem value="all">
                    <em>All</em>
                  </MenuItem>
                  {context.catData?.categoryList?.length !== 0 &&
                    context.catData?.categoryList?.map((cat, index) => {
                      return (
                        <MenuItem
                          className="text-capitalize"
                          value={cat._id}
                          key={index}
                        >
                          {cat.name}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </div>

            <div className="col-md-9 d-flex justify-content-end">
              <div className="searchWrap d-flex">
                <SearchBox searchProducts={searchProducts} />
              </div>
            </div>
          </div>

          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {productList?.products?.length !== 0 &&
                    productList?.products
                      ?.slice(
                        page1 * rowsPerPage,
                        page1 * rowsPerPage + rowsPerPage
                      )
                      ?.reverse()
                      ?.map((item, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <div className="d-flex align-items-center productBox">
                                <div className="imgWrapper">
                                  <div className="img card shadow m-0">
                                    <LazyLoadImage
                                      alt={"image"}
                                      effect="blur"
                                      className="w-100"
                                      src={item.images[0]}
                                    />
                                  </div>
                                </div>
                                <div className="info pl-3">
                                  <Link to={`/product/details/${item.id}`}>
                                    <h6>{item?.name}</h6>
                                  </Link>
                                  <p>{item?.description}</p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {item?.catName}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {item?.subCatName}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="badge badge-secondary">
                                {item?.brand}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <div style={{ width: "70px" }}>
                                <del className="old">₱ {item?.oldPrice}</del>
                                <span className="new text-danger d-block w-100">
                                ₱ {item?.price}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <Rating
                                name="read-only"
                                defaultValue={item?.rating}
                                precision={0.5}
                                size="small"
                                readOnly
                              />
                            </TableCell>

                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <div className="actions d-flex align-items-center">
                                <Link to={`/product/details/${item.id}`}>
                                  <Button
                                    className="secondary"
                                    color="secondary"
                                  >
                                    <FaEye />
                                  </Button>
                                </Link>

                                <Link to={`/product/edit/${item.id}`}>
                                  <Button className="success" color="success">
                                    <FaPencilAlt />
                                  </Button>
                                </Link>

                                <Button
                                  className="error"
                                  color="error"
                                  onClick={() => deleteProduct(item?.id)}
                                >
                                  <MdDelete />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={productList?.products?.length || 0}
              rowsPerPage={rowsPerPage}
              page={productList?.products?.length ? page1 : 0}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </div>

        <div className="card p-3">
          <div className="d-flex align-items-center">
            <h3 className="hd">Total Sales</h3>

            <div className="ml-auto res-full" style={{width:'100px'}}>
              <Select
                size="small"
                className="w-100"
                value={year}
                onChange={handleChangeYear}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
              >
                <MenuItem value={2020}>2020</MenuItem>
                <MenuItem value={2021}>2021</MenuItem>
                <MenuItem value={2022}>2022</MenuItem>
                <MenuItem value={2023}>2023</MenuItem>
                <MenuItem value={2024}>2024</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
              </Select>
            </div>
          </div>
          <br />

          <div className="chartWrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>Loading sales data for {year}...</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  Showing data for: <strong>{year}</strong>
                  {salesData?.every(item => item.sales === 0) && (
                    <span style={{ color: '#ff9800', marginLeft: '10px' }}>
                      ⚠️ No sales data available for this year
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={400} key={year}>
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      style={{ fill: context?.theme === "dark" ? "white" : "#000" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      style={{ fill: context?.theme === "dark" ? "white" : "#000" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#071739",
                        color: "white",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                      labelStyle={{ color: "#fff", fontWeight: "bold" }}
                      itemStyle={{ color: "#8abbff" }}
                      formatter={(value, name) => [
                        value === 0 ? 'No sales' : `₱${value}`,
                        `Sales for ${name.split(' - ')[0]}`
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="sales"
                      fill={salesData?.every(item => item.sales === 0) ? "#cccccc" : "#0858f7"}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      name={`Monthly Sales - ${year}`}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                  Total months with data: {salesData?.filter(item => item.sales > 0).length || 0} / 12
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;