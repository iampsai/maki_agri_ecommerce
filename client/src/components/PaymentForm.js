import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import axios from 'axios';

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'gcash', label: 'GCash' },
  { value: 'grab_pay', label: 'GrabPay' }
];

const PaymentForm = ({ orderId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });

  const handleInputChange = (field) => (event) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const validateCardDetails = () => {
    if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length !== 16) {
      throw new Error('Invalid card number');
    }
    if (!cardDetails.expMonth || !cardDetails.expYear) {
      throw new Error('Invalid expiration date');
    }
    if (!cardDetails.cvc || cardDetails.cvc.length !== 3) {
      throw new Error('Invalid CVC');
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (paymentMethod === 'card') {
        validateCardDetails();
      }

      // Create a payment intent
      const { data } = await axios.post('/api/payments/create-payment-intent', {
        orderId,
        amount,
        paymentMethod
      });

      // For card payments, create a payment method first
      if (paymentMethod === 'card') {
        const paymentMethodResponse = await axios.post('/api/payments/create-payment-method', {
          type: 'card',
          details: {
            ...cardDetails,
            number: cardDetails.number.replace(/\s/g, '')
          }
        });

        // Confirm the payment with the created payment method
        const confirmResult = await axios.post('/api/payments/confirm-payment', {
          paymentIntentId: data.paymentIntentId,
          paymentMethodId: paymentMethodResponse.data.id
        });

        if (confirmResult.data.status === 'succeeded') {
          onSuccess();
        } else {
          setError('Payment failed. Please try again.');
        }
      } else if (paymentMethod === 'gcash' || paymentMethod === 'grab_pay') {
        // For e-wallets, redirect to the payment URL
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      
      {error && (
        <Typography color="error" gutterBottom sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Payment Method</InputLabel>
        <Select
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
          label="Payment Method"
        >
          {PAYMENT_METHODS.map(method => (
            <MenuItem key={method.value} value={method.value}>
              {method.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {paymentMethod === 'card' && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Card Number"
              value={cardDetails.number}
              onChange={handleInputChange('number')}
              placeholder="1234 5678 9012 3456"
              inputProps={{ maxLength: 19 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Month"
              value={cardDetails.expMonth}
              onChange={handleInputChange('expMonth')}
              placeholder="MM"
              inputProps={{ maxLength: 2 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="Year"
              value={cardDetails.expYear}
              onChange={handleInputChange('expYear')}
              placeholder="YY"
              inputProps={{ maxLength: 2 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label="CVC"
              value={cardDetails.cvc}
              onChange={handleInputChange('cvc')}
              placeholder="123"
              inputProps={{ maxLength: 3 }}
            />
          </Grid>
        </Grid>
      )}

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
    </Box>
  );

      // Handle form submission
      form.on('submit', async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
          const { paymentMethod } = await form.createPaymentMethod();

          // Confirm the payment
          const confirmResult = await axios.post('/api/payments/confirm-payment', {
            paymentIntentId: data.paymentIntentId,
            paymentMethodId: paymentMethod.id
          });

          if (confirmResult.data.status === 'succeeded') {
            onSuccess();
          } else {
            setError('Payment failed. Please try again.');
          }
        } catch (err) {
          setError(err.message || 'Payment failed. Please try again.');
        } finally {
          setLoading(false);
        }
      });

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <div id="payment-form">
        {/* PayMongo Elements will mount here */}
      </div>

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Pay Now'}
      </Button>
    </Box>
  );
};

export default PaymentForm;
