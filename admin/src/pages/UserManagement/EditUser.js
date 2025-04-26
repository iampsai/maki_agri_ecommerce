import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MyContext } from "../../App";
import { fetchDataFromApi, editData } from "../../utils/api";
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Breadcrumbs,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { FaArrowLeft, FaEye, FaEyeSlash, FaSave } from "react-icons/fa";

const EditUser = () => {
  const { id } = useParams();
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
    isVerified: true
  });
  const [errors, setErrors] = useState({});
  const [originalEmail, setOriginalEmail] = useState("");

  useEffect(() => {
    context.setProgress(30);
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const user = await fetchDataFromApi(`/api/user/${id}`);
      
      // Determine role based on existing data
      let role = "user";
      if (user.role) {
        // If role field exists, use it
        role = user.role;
      } else if (user.isAdmin) {
        // Legacy support - if only isAdmin exists
        role = user.isAdmin ? "admin" : "user";
      }
      
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "", // Password field is empty by default when editing
        role: role,
        isVerified: user.isVerified || false
      });
      setOriginalEmail(user.email || "");
      setFetchLoading(false);
      context.setProgress(100);
    } catch (error) {
      console.error("Error fetching user:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to fetch user details",
      });
      setFetchLoading(false);
      context.setProgress(100);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when value changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    
    // Password is optional when editing
    if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    context.setProgress(30);
    
    try {
      // Set isAdmin based on role for backward compatibility
      const isAdmin = formData.role === 'admin';
      
      // Prepare user data, password will only be updated if provided
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        role: formData.role,
        isAdmin: isAdmin,
        isVerified: formData.isVerified
      };
      
      console.log("Sending user update data:", userData);
      
      // Only include password if it's provided
      if (formData.password && formData.password.trim().length > 0) {
        userData.password = formData.password;
      }
      
      const response = await editData(`/api/user/admin/${id}`, userData);
      
      setLoading(false);
      context.setProgress(100);
      
      if (response && !response.error) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: "User updated successfully",
        });
        
        // Navigate back to user list
        navigate("/users");
      } else {
        console.error("Update failed with response:", response);
        context.setAlertBox({
          open: true,
          error: true,
          msg: response?.msg || "Failed to update user",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setLoading(false);
      context.setProgress(100);
      
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Error updating user. Please try again.",
      });
    }
  };

  if (fetchLoading) {
    return (
      <div className="content-wrapper">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="page-header mb-4">
        <div>
          <Breadcrumbs aria-label="breadcrumb">
            <Link to="/users" style={{ textDecoration: 'none', color: 'inherit' }}>
              User Management
            </Link>
            <Typography color="textPrimary">Edit User</Typography>
          </Breadcrumbs>
          <h1 className="mt-2">Edit User</h1>
        </div>
        <Link to="/users">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FaArrowLeft />}
          >
            Back to Users
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password (Leave blank to keep unchanged)"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="role-select-label">User Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label="User Role"
                  >
                    <MenuItem value="user">Regular User (Client)</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVerified}
                      onChange={handleSwitchChange}
                      name="isVerified"
                      color="primary"
                    />
                  }
                  label="Verified User"
                />
              </Grid>
              <Grid item xs={12}>
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    className="me-2"
                    onClick={() => navigate("/users")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSave />}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Update User"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUser;
