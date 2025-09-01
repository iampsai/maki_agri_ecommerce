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
  Typography,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Breadcrumbs
} from "@mui/material";
import { FaEye, FaEyeSlash, FaSave } from "react-icons/fa";

const AddRider = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    isVerified: true
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    context.setProgress(30);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        password: formData.password,
        isVerified: formData.isVerified,
      };

      const res = await postData('/api/user/admin/create-rider', userData);
      setLoading(false);
      context.setProgress(100);
      if (res?.success) {
        context.setAlertBox({ open: true, error: false, msg: 'Rider created' });
        navigate('/users');
      } else {
        context.setAlertBox({ open: true, error: true, msg: res.msg || 'Failed to create rider' });
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      context.setProgress(100);
      context.setAlertBox({ open: true, error: true, msg: 'Error creating rider' });
    }
  };

  return (
    <div className="right-content w-100">
      <div className="content-wrapper">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <div>
            <Breadcrumbs aria-label="breadcrumb">
              <Link to="/users" style={{ textDecoration: 'none', color: 'inherit' }}>
                User Management
              </Link>
              <Typography color="textPrimary">Add Rider</Typography>
            </Breadcrumbs>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField label="Name" name="name" value={formData.name} onChange={handleInputChange} fullWidth variant="outlined" required error={!!errors.name} helperText={errors.name} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} fullWidth variant="outlined" required error={!!errors.email} helperText={errors.email} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} fullWidth variant="outlined" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} fullWidth variant="outlined" required error={!!errors.password} helperText={errors.password} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton aria-label="toggle password visibility" onClick={toggleShowPassword} edge="end">{showPassword ? <FaEyeSlash /> : <FaEye />}</IconButton></InputAdornment>) }} />
                </Grid>

                <Grid item xs={12}>
                  <Box mt={2} display="flex" justifyContent="flex-end">
                    <Button type="button" variant="outlined" color="secondary" className="mr-2" onClick={() => navigate('/users')} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSave />} disabled={loading}>{loading ? 'Saving...' : 'Save Rider'}</Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddRider;
