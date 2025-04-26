import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import { postData } from "../../utils/api";
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

const AddUser = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
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
      
      // Hash the password on the server side
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        password: formData.password,
        role: formData.role,
        isAdmin: isAdmin,
        isVerified: formData.isVerified,
        images: []
      };
      
      const response = await postData("/api/user/admin/create", userData);
      
      setLoading(false);
      context.setProgress(100);
      
      if (response.success) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: "User created successfully",
        });
        
        // Navigate back to user list
        navigate("/users");
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: response.msg || "Failed to create user",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setLoading(false);
      context.setProgress(100);
      
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Error creating user. Please try again.",
      });
    }
  };

  return (
    <div className="content-wrapper">
      <div className="page-header mb-4">
        <div>
          <Breadcrumbs aria-label="breadcrumb">
            <Link to="/users" style={{ textDecoration: 'none', color: 'inherit' }}>
              User Management
            </Link>
            <Typography color="textPrimary">Add New User</Typography>
          </Breadcrumbs>
          <h1 className="mt-2">Add New User</h1>
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
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  required
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
                    {loading ? "Saving..." : "Save User"}
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

export default AddUser;
