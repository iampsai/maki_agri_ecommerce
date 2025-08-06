import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { fetchDataFromApi, deleteData } from "../../utils/api";
import { MyContext } from "../../App";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { emphasize, styled } from "@mui/material/styles";

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
  { id: "name", label: "Name", minWidth: 150 },
  { id: "email", label: "Email", minWidth: 200 },
  { id: "phone", label: "Phone", minWidth: 150 },
  { id: "role", label: "Role", minWidth: 100 },
  { id: "status", label: "Status", minWidth: 120 },
  { id: "actions", label: "Actions", minWidth: 150, align: "center" },
];

const UserList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const context = useContext(MyContext);

  useEffect(() => {
    context.setProgress(30);
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetchDataFromApi("/api/user");
      setUsers(response);
      setFilteredUsers(response);
      setLoading(false);
      context.setProgress(100);
    } catch (error) {
      console.error("Error fetching users:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to fetch users",
      });
      setLoading(false);
      context.setProgress(100);
    }
  };

  const filterUsers = () => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery))
    );
    setFilteredUsers(filtered);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    context.setProgress(30);
    try {
      await deleteData(`/api/user/${userToDelete.id}`);

      setUsers(users.filter(user => user.id !== userToDelete.id));
      setOpenDeleteDialog(false);
      setUserToDelete(null);

      context.setAlertBox({
        open: true,
        error: false,
        msg: "User deleted successfully",
      });
      context.setProgress(100);
    } catch (error) {
      console.error("Error deleting user:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to delete user",
      });
      context.setProgress(100);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  // Helper function to determine user role for display
  const getUserRole = (user) => {
    if (user.role) {
      return user.role;
    } else {
      return user.isAdmin ? "admin" : "user";
    }
  };

  // Helper function to get role display color
  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "primary";
      case "staff":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <>
      <div className="right-content w-100">
        <div className="content-wrapper">
          <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
            <h5 className="mb-0">User Management</h5>

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
                  label="User Management"
                  deleteIcon={<ExpandMoreIcon />}
                />
              </Breadcrumbs>

              <Link to="/users/add">
                <Button className="btn-blue  ml-3 pl-3 pr-3">Add User</Button>
              </Link>
            </div>
          </div>

          <div className="card shadow border-0 p-3 mt-4">
            <div className="search-bar mb-4">
              <TextField
                className="searchWrap"
                fullWidth
                variant="outlined"
                placeholder="Search users by name, email or phone"
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
                        {filteredUsers.length > 0 ? (
                          filteredUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                              <TableRow
                                hover
                                role="checkbox"
                                tabIndex={-1}
                                key={user.id}
                              >
                                <TableCell>{user.name || "N/A"}</TableCell>
                                <TableCell>{user.email || "N/A"}</TableCell>
                                <TableCell>{user.phone || "N/A"}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={getUserRole(user).charAt(0).toUpperCase() + getUserRole(user).slice(1)}
                                    color={getRoleColor(getUserRole(user))}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.isVerified ? "Verified" : "Unverified"}
                                    color={user.isVerified ? "success" : "warning"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <div className="action-buttons">
                                    <Link to={`/users/edit/${user.id}`}>
                                      <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        className="mr-2"
                                      >
                                        <FaEdit />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      size="small"
                                      onClick={() => handleDeleteClick(user)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              )}
            </Paper>
          </div>
        </div>


        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteCancel}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Confirm User Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary" className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default UserList;
