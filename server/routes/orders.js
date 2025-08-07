const { Orders } = require('../models/orders');
const { Product } = require('../models/products'); // Import Product model
const { sendOrderStatusNotification } = require('../utils/smsService');
const express = require('express');
const router = express.Router();

router.get(`/sales`, async (req, res) => {
    try{
        const ordersList = await Orders.find();

        let totalSales = 0;
        let monthlySales = [
            {
                month:'JAN',
                sale:0
            },
            {
                month:'FEB',
                sale:0
            },
            {
                month:'MAR',
                sale:0
            },
            {
                month:'APRIL',
                sale:0
            },
            {
                month:'MAY',
                sale:0
            },
            {
                month:'JUNE',
                sale:0
            },
            {
                month:'JULY',
                sale:0
            },
            {
                month:'AUG',
                sale:0
            },
            {
                month:'SEP',
                sale:0
            },
            {
                month:'OCT',
                sale:0
            },
            {
                month:'NOV',
                sale:0
            },
            {
                month:'DEC',
                sale:0
            },
        ]

        const currentYear = new Date().getFullYear();

        for(let i=0; i<ordersList.length; i++){
            totalSales = totalSales+parseInt(ordersList[i].amount);
            const str = JSON.stringify(ordersList[i]?.date);
            const monthStr = str.substr(6,8);
            const month = parseInt(monthStr.substr(0,2));

            let amt = parseInt(ordersList[i].amount);

          

            if(month===1){
                monthlySales[0] = {
                    month:'JAN',
                    sale:monthlySales[0].sale = parseInt(monthlySales[0].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===2){
         
                monthlySales[1] = {
                    month:'FEB',
                    sale:monthlySales[1].sale = parseInt(monthlySales[1].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===3){
                monthlySales[2] = {
                    month:'MAR',
                    sale:monthlySales[2].sale = parseInt(monthlySales[2].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===4){
                monthlySales[3] = {
                    month:'APRIL',
                    sale:monthlySales[3].sale = parseInt(monthlySales[3].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===5){
                monthlySales[4] = {
                    month:'MAY',
                    sale:monthlySales[4].sale = parseInt(monthlySales[4].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===6){
                monthlySales[5] = {
                    month:'JUNE',
                    sale:monthlySales[5].sale = parseInt(monthlySales[5].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===7){
                monthlySales[6] = {
                    month:'JULY',
                    sale:monthlySales[6].sale = parseInt(monthlySales[6].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===8){
                monthlySales[7] = {
                    month:'AUG',
                    sale:monthlySales[7].sale = parseInt(monthlySales[7].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===9){
                monthlySales[8] = {
                    month:'SEP',
                    sale:monthlySales[8].sale = parseInt(monthlySales[8].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===10){
                monthlySales[9] = {
                    month:'OCT',
                    sale:monthlySales[9].sale = parseInt(monthlySales[9].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===11){
                monthlySales[10] = {
                    month:'NOV',
                    sale:monthlySales[10].sale = parseInt(monthlySales[10].sale) + parseInt(ordersList[i].amount)
                }
            }

            if(month===12){
                monthlySales[11] = {
                    month:'DEC',
                    sale:monthlySales[11].sale = parseInt(monthlySales[11].sale) + parseInt(ordersList[i].amount)
                }
            }

          
          //  console.log(monthDtr.substr(0,2));
           // console.log(currentYear)
         
        }

  

        return res.status(200).json({
            totalSales:totalSales,
            monthlySales:monthlySales
        })

    }catch(error){
        console.log(error);
    }
})

router.get(`/`, async (req, res) => {

    try {
    

        const ordersList = await Orders.find(req.query)


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

router.get(`/get/count`, async (req, res) =>{
    const orderCount = await Orders.countDocuments()

    if(!orderCount) {
        res.status(500).json({success: false})
    } else{
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
            date: req.body.date
        });
        order = await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.status(201).json(order);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
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

