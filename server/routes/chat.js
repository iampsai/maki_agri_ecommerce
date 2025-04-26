const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../models/chatMessage');
const { User } = require('../models/user');
const mongoose = require('mongoose');

// Get all chat messages for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("Fetching chat messages for userId:", userId);

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
        console.log("Received message request:", { userId, messageLength: message?.length });
        
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
        console.log("User message saved with ID:", newMessage._id);

        // Generate simple automated response
        const autoResponse = new ChatMessage({
            userId,
            message: "Thank you for your message. Our team will get back to you shortly.",
            sender: 'admin'
        });
        
        await autoResponse.save();
        console.log("Admin response saved with ID:", autoResponse._id);

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

module.exports = router;
