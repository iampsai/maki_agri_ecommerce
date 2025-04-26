const express = require('express');
const router = express.Router();
const { Orders } = require('../models/orders');
const { Product } = require('../models/products');
const { User } = require('../models/user');
const authJwt = require('../helper/jwt');
const jwtMiddleware = authJwt();

// Middleware to ensure only admins can access reports
const verifyAdminRole = async (req, res, next) => {
    try {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get user from database using the ID from the token
        const user = await User.findById(req.auth.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Add user to request for later use
        req.user = user;
        return next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Sales Report
router.get('/sales', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        const { type = 'daily', startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        
        // Query orders within date range
        const orders = await Orders.find({
            date: { $gte: start, $lte: end },
            status: { $nin: ['cancelled', 'refunded'] }
        }).sort({ date: 1 });
        
        // Process data based on report type
        const salesData = processOrdersByTimePeriod(orders || [], type);
        
        // Calculate summary data
        const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0);
        const totalOrders = salesData.reduce((sum, item) => sum + item.orderCount, 0);
        
        return res.status(200).json({
            success: true,
            data: {
                periods: salesData,
                summary: {
                    totalSales,
                    totalOrders,
                    avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
                }
            }
        });
    } catch (error) {
        console.error("Error in sales report:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Inventory Report
router.get('/inventory', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        // Get all products with their stock info
        const products = await Product.find().populate('category');
        
        // Format product data for the report
        const inventoryData = products.map(product => ({
            id: product._id,
            name: product.name,
            category: product.category ? { name: product.category.name } : { name: "Uncategorized" },
            countInStock: product.countInStock,
            price: product.price
        }));
        
        return res.status(200).json({
            success: true,
            data: inventoryData
        });
    } catch (error) {
        console.error("Error in inventory report:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Customer Report
router.get('/customers', jwtMiddleware, verifyAdminRole, async (req, res) => {
    try {
        const { type = 'daily', startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        
        // Get all users
        const users = await User.find({ isAdmin: { $ne: true } });
        
        // Get all orders for calculation
        const orders = await Orders.find({
            date: { $gte: start, $lte: end }
        });
        
        // Process users who have placed orders
        const customerOrders = {};
        
        // Get all relevant users first
        const allUsers = await User.find();
        const userMap = {};
        
        // Create a map of users by ID for quick lookup
        allUsers.forEach(user => {
            userMap[user._id.toString()] = {
                name: user.name,
                email: user.email
            };
        });
        
        orders.forEach(order => {
            if (!order.userid) return;
            
            const userId = order.userid;
            const userInfo = userMap[userId] || { name: order.name, email: order.email || 'unknown@email.com' };
            
            if (!customerOrders[userId]) {
                customerOrders[userId] = {
                    name: userInfo.name,
                    email: userInfo.email,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            
            customerOrders[userId].totalSpent += Number(order.amount);
            customerOrders[userId].orderCount += 1;
        });
        
        // Get top customers by spend
        const topCustomers = Object.values(customerOrders)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 8);
        
        // Get new customers in date range
        const newCustomers = users.filter(user => 
            user.dateCreated >= start && user.dateCreated <= end
        ).length;
        
        // Calculate active customers (placed at least one order)
        const activeCustomers = Object.keys(customerOrders).length;
        
        // Get customer activity over time
        const customerActivity = processCustomerActivityByTimePeriod(users, orders, type, start, end);
        
        return res.status(200).json({
            success: true,
            data: {
                totalCustomers: users.length,
                newCustomers,
                activeCustomers,
                topCustomers,
                customerActivity
            }
        });
    } catch (error) {
        console.error("Error in customer report:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Helper functions
function processOrdersByTimePeriod(orders, type) {
    const result = [];
    const periods = {};
    
    orders.forEach(order => {
        const date = new Date(order.date);
        let periodKey;
        
        if (type === 'daily') {
            // Format: MM/DD
            periodKey = `${date.getMonth()+1}/${date.getDate()}`;
        } else if (type === 'weekly') {
            // Get the week number
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            periodKey = `Week ${weekNum}`;
        } else {
            // Monthly, format: MMM (abbreviated month name)
            periodKey = date.toLocaleString('default', { month: 'short' });
        }
        
        if (!periods[periodKey]) {
            periods[periodKey] = {
                period: periodKey,
                totalSales: 0,
                orderCount: 0
            };
        }
        
        periods[periodKey].totalSales += Number(order.amount);
        periods[periodKey].orderCount += 1;
    });
    
    // Convert to array and sort chronologically
    Object.values(periods).forEach(period => {
        result.push(period);
    });
    
    return result.sort((a, b) => {
        // Special handling for week format
        if (a.period.startsWith('Week') && b.period.startsWith('Week')) {
            return parseInt(a.period.split(' ')[1]) - parseInt(b.period.split(' ')[1]);
        }
        return 0; // Keep original order for other formats
    });
}

function processCustomerActivityByTimePeriod(users, orders, type, startDate, endDate) {
    const result = [];
    const periods = {};
    
    // Calculate the number of periods based on report type
    let periodCount;
    let periodDuration;
    
    if (type === 'daily') {
        periodCount = 14; // Show 14 days
        periodDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    } else if (type === 'weekly') {
        periodCount = 8; // Show 8 weeks
        periodDuration = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
    } else {
        periodCount = 6; // Show 6 months
        periodDuration = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
    }
    
    // Create period buckets
    for (let i = 0; i < periodCount; i++) {
        const periodEndDate = new Date(endDate.getTime() - (i * periodDuration));
        const periodStartDate = new Date(periodEndDate.getTime() - periodDuration);
        
        let periodKey;
        if (type === 'daily') {
            periodKey = `${periodEndDate.getMonth()+1}/${periodEndDate.getDate()}`;
        } else if (type === 'weekly') {
            periodKey = `Week ${periodCount-i}`;
        } else {
            periodKey = periodEndDate.toLocaleString('default', { month: 'short' });
        }
        
        // Count new users in this period
        const newCustomers = users.filter(user => 
            user.dateCreated >= periodStartDate && user.dateCreated <= periodEndDate
        ).length;
        
        // Count active users (placed orders) in this period
        const activeCustomers = new Set(
            orders.filter(order => 
                order.date >= periodStartDate && order.date <= periodEndDate && order.user
            ).map(order => order.user._id.toString())
        ).size;
        
        periods[periodKey] = {
            period: periodKey,
            newCustomers,
            activeCustomers
        };
    }
    
    // Convert to array and sort chronologically
    Object.values(periods).forEach(period => {
        result.push(period);
    });
    
    return result.sort((a, b) => {
        // Special handling for week format
        if (a.period.startsWith('Week') && b.period.startsWith('Week')) {
            return parseInt(a.period.split(' ')[1]) - parseInt(b.period.split(' ')[1]);
        }
        return 0; // Keep original order for other formats
    });
}

module.exports = router;
