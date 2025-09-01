import React, { useContext } from "react";
import { editData, fetchDataFromApi } from "../../utils/api";
import { useState } from "react";
import { useEffect } from "react";

import { emphasize, styled } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Pagination from "@mui/material/Pagination";
import Dialog from "@mui/material/Dialog";
import { MdClose } from "react-icons/md";
import Button from "@mui/material/Button";
import { MdOutlineEmail } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { MdOutlineCurrencyRupee, MdPhp } from "react-icons/md";
import { MdOutlineDateRange } from "react-icons/md";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { MyContext } from "../../App";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

//breadcrumb code
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const columns = [
  { id: "orderId", label: "Order Id", minWidth: 150 },
  { id: "paymantId", label: "Paymant Id", minWidth: 100 },
  {
    id: "products",
    label: "Products",
    minWidth: 150,
  },
  {
    id: "name",
    label: "Name",
    minWidth: 130,
  },
  {
    id: "phoneNumber",
    label: "Phone Number",
    minWidth: 150,
  },
  {
    id: "address",
    label: "Address",
    minWidth: 200,
  },
  {
    id: "pincode",
    label: "Pincode",
    minWidth: 120,
  },
  {
    id: "totalAmount",
    label: "Total Amount",
    minWidth: 120,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 120,
  },
  {
    id: "userId",
    label: "User Id",
    minWidth: 120,
  },
  {
    id: "orderStatus",
    label: "Order Status",
    minWidth: 120,
  },
  {
    id: "rider",
    label: "Rider / QR",
    minWidth: 200,
  },
  {
    id: "dateCreated",
    label: "Date Created",
    minWidth: 150,
  },
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setproducts] = useState([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [singleOrder, setSingleOrder] = useState();
  const [statusVal, setstatusVal] = useState(null);

  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);

  const [page1, setPage1] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage1(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage1(0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchDataFromApi(`/api/orders`).then((res) => {
      setOrders(res);
    });

    // fetch riders for assign dropdown (admin-only endpoint)
    fetchDataFromApi(`/api/user/admin/riders`).then((res) => {
      setRiders(res || []);
    });
  }, []);

  const showProducts = (id) => {
    fetchDataFromApi(`/api/orders/${id}`).then((res) => {
      setIsOpenModal(true);
      setproducts(res.products);
    });
  };

  const openRiderModal = async (order) => {
    // fetch latest order details
    const fresh = await fetchDataFromApi(`/api/orders/${order._id}`);
    setSelectedOrderForRider(fresh);
    setSelectedRiderId(fresh?.deliveryRider || null);
    setIsRiderModalOpen(true);
  };

  const handleAssignRider = async () => {
    if (!selectedOrderForRider || !selectedRiderId) return;
    setAssigningLoading(true);
    try {
      await editData(`/api/orders/assign-rider/${selectedOrderForRider._id}`, {
        riderId: selectedRiderId,
      });
      // refresh orders
      const updated = await fetchDataFromApi(`/api/orders`);
      setOrders(updated);
      // refresh selected order
      const fresh = await fetchDataFromApi(`/api/orders/${selectedOrderForRider._id}`);
      setSelectedOrderForRider(fresh);
    } catch (err) {
      console.error('Assign rider error', err);
    } finally {
      setAssigningLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      // simple feedback could be added (snackbar)
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const handleChangeStatus = (e, orderId) => {
    setstatusVal(e.target.value);
    setIsLoading(true);
    context.setProgress(40);
    fetchDataFromApi(`/api/orders/${orderId}`).then((res) => {
      const order = {
        name: res.name,
        phoneNumber: res.phoneNumber,
        address: res.address,
        pincode: res.pincode,
        amount: parseInt(res.amount),
        paymentId: res.paymentId,
        email: res.email,
        userid: res.userId,
        products: res.products,
        status: e.target.value,
      };

      editData(`/api/orders/${orderId}`, order).then((res) => {
        fetchDataFromApi(`/api/orders`).then((res) => {
          setOrders(res);
          // window.scrollTo({
          //   top: 200,
          //   behavior: "smooth",
          // });
        });
        context.setProgress(100);
        setIsLoading(false);
      });

      setSingleOrder(res.products);
    });
  };

  //   const orderStatus = (orderStatus, id) => {
  //     fetchDataFromApi(`/api/orders/${id}`).then((res) => {
  //       const order = {
  //         name: res.name,
  //         phoneNumber: res.phoneNumber,
  //         address: res.address,
  //         pincode: res.pincode,
  //         amount: parseInt(res.amount),
  //         paymentId: res.paymentId,
  //         email: res.email,
  //         userid: res.userId,
  //         products: res.products,
  //         status: orderStatus,
  //       };

  //       editData(`/api/orders/${id}`, order).then((res) => {
  //         fetchDataFromApi(`/api/orders`).then((res) => {
  //           setOrders(res);
  //           window.scrollTo({
  //             top: 200,
  //             behavior: "smooth",
  //           });
  //         });
  //       });

  //       setSingleOrder(res.products);
  //     });
  //   };

  console.log("orderRider", selectedOrderForRider);

  return (
    <>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Orders List</h5>

          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs
              aria-label="breadcrumb"
              className="ml-auto breadcrumbs_"
            >
              <StyledBreadcrumb
                component="a"
                href="#"
                label="Dashboard"
                icon={<HomeIcon fontSize="small" />}
              />

              <StyledBreadcrumb
                label="Orders"
                deleteIcon={<ExpandMoreIcon />}
              />
            </Breadcrumbs>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
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
               
                  {orders?.length !== 0 &&
                    orders
                      ?.slice(
                        page1 * rowsPerPage,
                        page1 * rowsPerPage + rowsPerPage
                      )
                    ?.map((order, index) => {
                        return (
                          <TableRow key={index}>
                          <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?._id}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span className="text-blue fonmt-weight-bold">
                                {order?.paymentId}
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <span
                                className="text-blue fonmt-weight-bold cursor"
                                onClick={() => showProducts(order?._id)}
                              >
                                Click here to view
                              </span>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.name}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <FaPhoneAlt /> {order?.phoneNumber}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {order?.address}
                            </TableCell>
                            <TableCell>{order?.pincode}</TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              {/* <MdOutlineCurrencyRupee /> */}
                              ₱{order?.amount}
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <MdOutlineEmail /> {order?.email}
                            </TableCell>
                            <td>{order?.userid}</td>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <Select
                                disabled={isLoading === true ? true : false}
                                value={ order?.status !== null ? order?.status : statusVal }
                                onChange={(e) =>
                                  handleChangeStatus(e, order?._id)
                                }
                                displayEmpty
                                inputProps={{ "aria-label": "Without label" }}
                                size="small"
                                className="w-100"
                              >
                                <MenuItem value={null}>
                                  <em value={null}>None</em>
                                </MenuItem>

                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="confirm">Confirm</MenuItem>
                                <MenuItem value="in-transit">In Transit</MenuItem>
                                <MenuItem value="delivered">Delivered</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  {order?.deliveryRider ? (
                                    <div style={{ fontSize: 12 }}>
                                      Assigned: {order?.deliveryRider.name}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 12, color: '#666' }}>No rider</div>
                                  )}
                                </div>
                                <div>
                                  <Button size="small" variant="outlined" onClick={() => openRiderModal(order)}>
                                    View / Assign
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell style={{ minWidth: columns.minWidth }}>
                              <MdOutlineDateRange />{" "}
                              {order?.date?.split("T")[0]}
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
              count={orders?.length}
              rowsPerPage={rowsPerPage}
              page={page1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>

         
        </div>
      </div>

      <Dialog open={isOpenModal} className="productModal">
        <Button className="close_" onClick={() => setIsOpenModal(false)}>
          <MdClose />
        </Button>
        <h4 class="mb-1 font-weight-bold pr-5 mb-4">Products</h4>

        <div className="table-responsive orderTable">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>Product Id</th>
                <th>Product Title</th>
                <th>Image</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>SubTotal</th>
              </tr>
            </thead>

            <tbody>
              {products?.length !== 0 &&
                products?.map((item, index) => {
                  return (
                    <tr>
                      <td>{item?.productId}</td>
                      <td style={{ whiteSpace: "inherit" }}>
                        <span>{item?.productTitle?.substr(0, 30) + "..."}</span>
                      </td>
                      <td>
                        <div className="img">
                      
                          <img   src={item.image} />
                        </div>
                      </td>
                      <td>{item?.quantity}</td>
                      <td>{item?.price}</td>
                      <td>{item?.subTotal}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Dialog>
      <Dialog open={isRiderModalOpen} className="riderModal" onClose={() => setIsRiderModalOpen(false)}>
        {/* <Button className="close_" onClick={() => setIsRiderModalOpen(false)}>
          <MdClose />
        </Button> */}
        <h4 className="mb-1 font-weight-bold p-2 mb-4 text-center">Delivery Rider & QR</h4>

        <div style={{ padding: 16, minWidth: 420 }}>
          {selectedOrderForRider ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <strong>Order:</strong> {selectedOrderForRider._id}
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Current Rider:</strong>{' '}
                {selectedOrderForRider.deliveryRider || 'Not assigned'}
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>QR:</strong>
                <div style={{ marginTop: 8 }}>
                  {selectedOrderForRider.qr ? (
                    <div>
                      <img src={selectedOrderForRider.qr} alt="order-qr" style={{ maxWidth: 200 }} />
                      <div style={{ marginTop: 8 }}>
                        <Button size="small" variant="outlined" onClick={() => copyToClipboard(selectedOrderForRider.riderToken)}>
                          Copy Token
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#777' }}>QR not generated</div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Assign Rider</strong>
                <div style={{ marginTop: 8 }}>
                  <Select
                    value={selectedRiderId || ''}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    displayEmpty
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {riders?.map((r) => (
                      <MenuItem key={r._id} value={r._id}>
                        {r.name} - {r.email}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button disabled={assigningLoading} variant="contained" color="primary" onClick={handleAssignRider}>
                  {assigningLoading ? 'Assigning...' : 'Assign Rider'}
                </Button>
                <Button variant="outlined" onClick={() => setIsRiderModalOpen(false)}>Close</Button>
              </div>
            </>
          ) : (
            <div style={{ padding: 12 }}>Loading...</div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default Orders;
