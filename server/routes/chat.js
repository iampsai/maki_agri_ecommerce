const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../models/chatMessage');
const { User } = require('../models/user');
const mongoose = require('mongoose');

// Get all chat messages for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // console.log("Fetching chat messages for userId:", userId);

        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            console.error("User not found with ID:", userId);
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Get chat messages
        const chatMessages = await ChatMessage.find({ userId }).sort({ timestamp: 1 });
        console.log(`Found ${chatMessages.length} messages for userId: ${userId}`);

        return res.status(200).json(chatMessages);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error fetching chat messages: ' + error.message
        });
    }
});

// Send a new message
router.post('/message', async (req, res) => {
    try {
        const { userId, message } = req.body;
        // console.log("Received message request:", { userId, messageLength: message?.length });

        if (!userId) {
            console.error("No userId provided in request");
            return res.status(400).json({
                success: false,
                msg: 'User ID is required'
            });
        }

        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            console.error("User not found with ID:", userId);
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        // Validate message
        if (!message || !message.trim()) {
            console.error("Empty message provided");
            return res.status(400).json({
                success: false,
                msg: 'Message cannot be empty'
            });
        }

        // Create user message
        const newMessage = new ChatMessage({
            userId,
            message,
            sender: 'user'
        });

        await newMessage.save();
        // console.log("User message saved with ID:", newMessage._id);

        // Generate simple automated response
        const autoResponse = new ChatMessage({
            userId,
            message: "Thank you for your message. Our team will get back to you shortly.",
            sender: 'admin'
        });

        await autoResponse.save();
        // console.log("Admin response saved with ID:", autoResponse._id);

        return res.status(201).json({
            success: true,
            userMessage: newMessage,
            adminResponse: autoResponse
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error sending message: ' + error.message
        });
    }
});

// Mark messages as read
router.put('/mark-read/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("Marking messages as read for userId:", userId);

        // Validate userId format
        if (!mongoose.isValidObjectId(userId)) {
            console.error("Invalid user ID format:", userId);
            return res.status(400).json({
                success: false,
                msg: 'Invalid user ID format'
            });
        }

        // Update all unread messages to read
        const result = await ChatMessage.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        console.log(`Marked ${result.modifiedCount} messages as read for userId: ${userId}`);

        return res.status(200).json({
            success: true,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error marking messages as read: ' + error.message
        });
    }
});

// ----- Admin routes -----
// Get all chat messages across users (for admin panel)
router.get('/admin/messages', async (req, res) => {
    try {
        // console.log('Admin messages endpoint hit, headers:', req.headers && Object.keys(req.headers).length ? Object.keys(req.headers) : 'no-headers');
        // Fetch all chat messages and include user basic info
        const chatMessages = await ChatMessage.find({}).sort({ timestamp: 1 }).populate('userId', 'name email');
        // Map to a simpler payload expected by the admin UI
        const payload = chatMessages.map(msg => ({
            _id: msg._id,
            userId: msg.userId ? msg.userId._id : msg.userId,
            userName: msg.userId ? msg.userId.name : 'Unknown User',
            userEmail: msg.userId ? msg.userId.email : 'No Email',
            message: msg.message,
            sender: msg.sender,
            isRead: msg.isRead,
            timestamp: msg.timestamp
        }));

        // console.log(`Admin messages: found ${payload.length} messages`);
        if (payload.length > 0) {
            // console.log('Sample message payload:', JSON.stringify(payload.slice(0,3)).slice(0,1000));
        }

        return res.status(200).json(payload);
    } catch (error) {
        console.error('Error fetching admin chat messages:', error);
        return res.status(500).json({ success: false, msg: 'Error fetching admin chat messages: ' + error.message });
    }
});

// Temporary test endpoint returning mock messages for UI testing
router.get('/admin/messages/test', async (req, res) => {
    const now = new Date().toISOString();
    const mock = [
        { _id: 'm1', userId: 'u1', userName: 'Alice', userEmail: 'alice@example.com', message: 'Hello, I need help', sender: 'user', isRead: false, timestamp: now },
        { _id: 'm2', userId: 'u1', userName: 'Alice', userEmail: 'alice@example.com', message: 'Thanks for the reply', sender: 'admin', isRead: true, timestamp: now },
        { _id: 'm3', userId: 'u2', userName: 'Bob', userEmail: 'bob@example.com', message: 'Order status?', sender: 'user', isRead: false, timestamp: now }
    ];
    return res.status(200).json(mock);
});

// Admin reply to a user's chat
router.post('/admin/reply', async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, msg: 'User ID is required' });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, msg: 'Message cannot be empty' });
        }

        // Validate user exists
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        const adminMessage = new ChatMessage({
            userId,
            message,
            sender: 'admin',
            isRead: false
        });

        await adminMessage.save();

        return res.status(201).json({ success: true, adminMessage });
    } catch (error) {
        console.error('Error sending admin reply:', error);
        return res.status(500).json({ success: false, msg: 'Error sending admin reply: ' + error.message });
    }
});

// Admin mark-read (same semantics as client mark-read but under admin namespace)
router.put('/admin/mark-read/:userId?', async (req, res) => {
    try {
        const userId = req.params.userId;

        // if (!mongoose.isValidObjectId(userId)) {
        //     return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
        // }

        // const result = await ChatMessage.updateMany(
        //     { userId, isRead: false },
        //     { $set: { isRead: true } }
        // );

        let query = { isRead: false };
        if (userId === 'null' || !userId) {
            query.userId = null;
        } else {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ success: false, msg: `Invalid user ID format - userId: ${userId}` });
            }
            query.userId = userId;
        }

        const result = await ChatMessage.updateMany(query, { $set: { isRead: true } });

        return res.status(200).json({ success: true, count: result.modifiedCount });
    } catch (error) {
        console.error('Error marking messages as read (admin):', error);
        return res.status(500).json({ success: false, msg: 'Error marking messages as read: ' + error.message });
    }
});

router.delete('/admin/messages/:userId?', async (req, res) => {
    try {
        const userId = req.params.userId;
        let query = {};

        if (userId === 'null' || !userId) {
            // Delete messages where userId is null
            query.userId = null;
        } else {
            // Only allow valid Mongo ObjectIds
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
            }
            query.userId = userId;
        }

        const result = await ChatMessage.deleteMany(query);

        return res.status(200).json({
            success: true,
            count: result.deletedCount,
            msg: `Deleted ${result.deletedCount} message(s)`
        });
    } catch (error) {
        console.error('Error deleting messages (admin):', error);
        return res.status(500).json({ success: false, msg: 'Error deleting messages: ' + error.message });
    }
});


module.exports = router;
