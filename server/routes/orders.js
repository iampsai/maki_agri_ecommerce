const { Orders } = require('../models/orders');
const { Product } = require('../models/products'); // Import Product model
const { User } = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sendOrderStatusNotification } = require('../utils/smsService');
const express = require('express');
const router = express.Router();

router.get(`/sales`, async (req, res) => {
    try {
        const ordersList = await Orders.find();

        let totalSales = 0;
        let monthlySales = [
            {
                month: 'JAN',
                sale: 0
            },
            {
                month: 'FEB',
                sale: 0
            },
            {
                month: 'MAR',
                sale: 0
            },
            {
                month: 'APRIL',
                sale: 0
            },
            {
                month: 'MAY',
                sale: 0
            },
            {
                month: 'JUNE',
                sale: 0
            },
            {
                month: 'JULY',
                sale: 0
            },
            {
                month: 'AUG',
                sale: 0
            },
            {
                month: 'SEP',
                sale: 0
            },
            {
                month: 'OCT',
                sale: 0
            },
            {
                month: 'NOV',
                sale: 0
            },
            {
                month: 'DEC',
                sale: 0
            },
        ]

        const currentYear = new Date().getFullYear();

        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].amount);
            const str = JSON.stringify(ordersList[i]?.date);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            let amt = parseInt(ordersList[i].amount);



            if (month === 1) {
                monthlySales[0] = {
                    month: 'JAN',
                    sale: monthlySales[0].sale = parseInt(monthlySales[0].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 2) {

                monthlySales[1] = {
                    month: 'FEB',
                    sale: monthlySales[1].sale = parseInt(monthlySales[1].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 3) {
                monthlySales[2] = {
                    month: 'MAR',
                    sale: monthlySales[2].sale = parseInt(monthlySales[2].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 4) {
                monthlySales[3] = {
                    month: 'APRIL',
                    sale: monthlySales[3].sale = parseInt(monthlySales[3].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 5) {
                monthlySales[4] = {
                    month: 'MAY',
                    sale: monthlySales[4].sale = parseInt(monthlySales[4].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 6) {
                monthlySales[5] = {
                    month: 'JUNE',
                    sale: monthlySales[5].sale = parseInt(monthlySales[5].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 7) {
                monthlySales[6] = {
                    month: 'JULY',
                    sale: monthlySales[6].sale = parseInt(monthlySales[6].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 8) {
                monthlySales[7] = {
                    month: 'AUG',
                    sale: monthlySales[7].sale = parseInt(monthlySales[7].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 9) {
                monthlySales[8] = {
                    month: 'SEP',
                    sale: monthlySales[8].sale = parseInt(monthlySales[8].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 10) {
                monthlySales[9] = {
                    month: 'OCT',
                    sale: monthlySales[9].sale = parseInt(monthlySales[9].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 11) {
                monthlySales[10] = {
                    month: 'NOV',
                    sale: monthlySales[10].sale = parseInt(monthlySales[10].sale) + parseInt(ordersList[i].amount)
                }
            }

            if (month === 12) {
                monthlySales[11] = {
                    month: 'DEC',
                    sale: monthlySales[11].sale = parseInt(monthlySales[11].sale) + parseInt(ordersList[i].amount)
                }
            }


            //  console.log(monthDtr.substr(0,2));
            // console.log(currentYear)

        }



        return res.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales
        })

    } catch (error) {
        console.log(error);
    }
})

router.get(`/`, async (req, res) => {

    try {


        const ordersList = await Orders.find(req.query).populate('deliveryRider', 'name').sort({ date: -1 })


        if (!ordersList) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json(ordersList);

    } catch (error) {
        res.status(500).json({ success: false })
    }


});


router.get('/:id', async (req, res) => {

    const order = await Orders.findById(req.params.id);

    if (!order) {
        res.status(500).json({ message: 'The order with the given ID was not found.' })
    }
    return res.status(200).send(order);
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Orders.countDocuments()

    if (!orderCount) {
        res.status(500).json({ success: false })
    } else {
        res.send({
            orderCount: orderCount
        });
    }

})



router.post('/create', async (req, res) => {
    const session = await Product.startSession();
    session.startTransaction();
    try {
        // Validate stock for each product
        for (const item of req.body.products) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                throw new Error('Product not found: ' + item.productId);
            }
            if (product.countInStock < item.quantity) {
                throw new Error('Insufficient stock for product: ' + product.name);
            }
        }
        // Deduct stock for each product
        for (const item of req.body.products) {
            const product = await Product.findById(item.productId).session(session);
            product.countInStock -= item.quantity;
            await product.save({ session });
        }
        // Create a short rider token and QR data
        const riderToken = crypto.randomBytes(10).toString('hex');
        const qrData = JSON.stringify({ orderId: null, token: riderToken });

        // Create the order
        let order = new Orders({
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            pincode: req.body.pincode,
            amount: req.body.amount,
            paymentId: req.body.paymentId,
            email: req.body.email,
            userid: req.body.userid,
            products: req.body.products,
            date: req.body.date,
            riderToken: riderToken
        });
        order = await order.save({ session });

        // Generate QR that includes the orderId and token (update qrData with real id)
        const fullQrData = JSON.stringify({ orderId: order._id.toString(), token: riderToken });
        try {
            const qrUrl = await QRCode.toDataURL(fullQrData);
            order.qr = qrUrl;
            await order.save({ session });
        } catch (qrErr) {
            // don't fail order creation if QR generation fails
            console.error('QR generation failed', qrErr);
        }
        await session.commitTransaction();
        session.endSession();
        res.status(201).json(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
});


// Endpoint for delivery riders to scan QR and update status
// The rider will scan a QR (contains orderId and token) and hit this endpoint with { status }
// Middleware to verify rider JWT and attach rider user to req
const verifyRider = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
        }
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY, async (err, decoded) => {
            if (err) return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
            const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
            if (!userId) return res.status(401).json({ success: false, message: 'Invalid token payload' });
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            if (user.role !== 'rider') return res.status(403).json({ success: false, message: 'Forbidden - Rider access required' });
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('verifyRider error', error);
        return res.status(500).json({ success: false, message: 'Server error during rider verification' });
    }
};

router.post('/scan/:token', verifyRider, async (req, res) => {
    const token = req.params.token;
    const { status } = req.body; // expected: cancelled | in-transit | completed

    if (!['cancelled', 'in-transit', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const session = await Product.startSession();
    session.startTransaction();

    try {
        const order = await Orders.findOne({ riderToken: token }).session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Order not found for token' });
        }

        // Ensure the authenticated rider matches the order's assigned rider
        if (order.deliveryRider) {
            const deliveryRiderId = order.deliveryRider.toString();
            if (req.user && req.user._id.toString() !== deliveryRiderId) {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ success: false, message: 'Forbidden - This order is not assigned to you' });
            }
        } else {
            // If no deliveryRider assigned, we allow the rider who scanned to take ownership (optional)
            // Assign the scanning rider as the deliveryRider for audit and future checks
            order.deliveryRider = req.user._id;
        }

        // If order already completed or cancelled, don't allow changes
        if (['completed', 'cancelled'].includes(order.status)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: `Order already ${order.status}` });
        }

        // If cancelling, revert stock
        if (status === 'cancelled') {
            for (const item of order.products) {
                const product = await Product.findById(item.productId).session(session);
                if (product) {
                    product.countInStock += item.quantity;
                    await product.save({ session });
                }
            }
        }

        order.status = status;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ success: true, message: 'Order status updated', order });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Scan endpoint error', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Assign a delivery rider to an order and regenerate token/QR
router.put('/assign-rider/:id', async (req, res) => {
    const { riderId } = req.body;
    try {
        const order = await Orders.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const riderToken = crypto.randomBytes(10).toString('hex');
        order.deliveryRider = riderId;
        order.riderToken = riderToken;

        const fullQrData = JSON.stringify({ orderId: order._id.toString(), token: riderToken });
        try {
            const qrUrl = await QRCode.toDataURL(fullQrData);
            order.qr = qrUrl;
        } catch (qrErr) {
            console.error('QR generation failed', qrErr);
        }

        await order.save();
        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.error('Assign rider error', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    const session = await Product.startSession();
    session.startTransaction();
    try {
        const order = await Orders.findById(req.params.id).session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Order not found!', success: false });
        }
        // Restore stock for each product in the order
        for (const item of order.products) {
            const product = await Product.findById(item.productId).session(session);
            if (product) {
                product.countInStock += item.quantity;
                await product.save({ session });
            }
        }
        await Orders.findByIdAndDelete(req.params.id).session(session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'Order Deleted and stock restored!' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const order = await Orders.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                phoneNumber: req.body.phoneNumber,
                address: req.body.address,
                pincode: req.body.pincode,
                amount: req.body.amount,
                paymentId: req.body.paymentId,
                email: req.body.email,
                userid: req.body.userid,
                products: req.body.products,
                status: req.body.status
            },
            { new: true }
        );

        if (!order) {
            return res.status(500).json({
                message: 'Order cannot be updated!',
                success: false
            });
        }

        // Send SMS notification for confirmed and delivered status
        if (req.body.status && ['confirm', 'delivered'].includes(req.body.status.toLowerCase())) {
            try {
                await sendOrderStatusNotification(
                    order.phoneNumber,
                    order._id,
                    req.body.status.toLowerCase()
                );
            } catch (smsError) {
                console.error('Failed to send SMS notification:', smsError);
                // Don't fail the order update if SMS fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated to ' + req.body.status,
            order: order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
})



module.exports = router;

