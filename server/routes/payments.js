const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Order = require('../models/orders');
const axios = require('axios');
require('dotenv').config();

// Initialize PayMongo API configuration
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`
};

// Create a payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;

        // Create PayMongo payment intent
        const response = await axios.post(`${PAYMONGO_API_URL}/payment_intents`, {
            data: {
                attributes: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'PHP',
                    payment_method_allowed: [paymentMethod],
                    description: `Payment for order ${orderId}`,
                    capture_type: 'automatic'
                }
            }
        }, { headers });

        const paymentIntent = response.data.data;
        
        // Create payment record
        const payment = new Payment({
            orderId,
            paymentIntentId: paymentIntent.id,
            amount,
            paymentMethod,
            status: 'pending'
        });
        await payment.save();

        // For e-wallets, create a payment source
        if (paymentMethod === 'gcash' || paymentMethod === 'grab_pay') {
            const sourceResponse = await axios.post(`${PAYMONGO_API_URL}/sources`, {
                data: {
                    attributes: {
                        amount: Math.round(amount * 100),
                        currency: 'PHP',
                        type: paymentMethod,
                        redirect: {
                            success: `${process.env.CLIENT_BASE_URL}/checkout/success?order=${orderId}`,
                            failed: `${process.env.CLIENT_BASE_URL}/checkout/failed?order=${orderId}`
                        }
                    }
                }
            }, { headers });

            return res.json({
                paymentIntentId: paymentIntent.id,
                checkoutUrl: sourceResponse.data.data.attributes.redirect.checkout_url
            });
        }

        res.json({
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Create payment method
router.post('/create-payment-method', async (req, res) => {
    try {
        const { type, details } = req.body;

        const response = await axios.post(`${PAYMONGO_API_URL}/payment_methods`, {
            data: {
                attributes: {
                    type,
                    details: {
                        card_number: details.number,
                        exp_month: parseInt(details.expMonth),
                        exp_year: parseInt(details.expYear),
                        cvc: details.cvc
                    }
                }
            }
        }, { headers });

        res.json(response.data.data);
    } catch (error) {
        console.error('Payment method creation error:', error.response?.data || error);
        res.status(500).json({ error: 'Failed to create payment method' });
    }
});

// Confirm payment
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;

        const response = await axios.post(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`, {
            data: {
                attributes: {
                    payment_method: paymentMethodId
                }
            }
        }, { headers });

        const paymentIntent = response.data.data;

        // Update payment record
        const payment = await Payment.findOne({ paymentIntentId });
        if (payment) {
            payment.status = paymentIntent.status === 'succeeded' ? 'paid' : 'failed';
            payment.paymentDetails = paymentIntent;
            await payment.save();

            // Update order if payment successful
            if (payment.status === 'paid') {
                await Order.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: 'paid',
                    paymentId: paymentIntentId
                });
            }
        }

        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// Webhook handler for payment status updates
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['paymongo-signature'];
        
        // Verify webhook signature
        const event = paymongo.webhooks.constructEvent(
            req.body,
            signature,
            process.env.PAYMONGO_WEBHOOK_SECRET
        );

        if (event.type === 'payment.paid') {
            const paymentIntent = event.data;
            const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
            
            if (payment) {
                payment.status = 'paid';
                payment.paymentDetails = paymentIntent;
                await payment.save();

                // Update order
                await Order.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: 'paid',
                    paymentId: paymentIntent.id
                });
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
});

module.exports = router;
