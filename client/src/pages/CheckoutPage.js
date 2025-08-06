import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Stepper, Step, StepLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import axios from 'axios';

const steps = ['Shipping Information', 'Review Order', 'Payment'];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the current cart/order details
    const fetchOrderDetails = async () => {
      try {
        const { data } = await axios.get('/api/cart'); // Adjust this endpoint as needed
        setOrderDetails(data);
      } catch (err) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      // Update order status or perform any other necessary actions
      await axios.post('/api/orders/complete', { orderId: orderDetails.id });
      
      // Navigate to success page
      navigate('/checkout/success');
    } catch (err) {
      setError('Failed to complete order');
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 2 && orderDetails && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Order Summary
            </Typography>
            
            <Box sx={{ my: 2 }}>
              <Typography>
                Total Amount: ₱{orderDetails.totalAmount.toFixed(2)}
              </Typography>
            </Box>

            <PaymentForm
              orderId={orderDetails.id}
              amount={orderDetails.totalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CheckoutPage;
