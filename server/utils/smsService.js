const twilio = require('twilio');
const axios = require('axios'); // You'll need to install axios: npm install axios

// Initialize Twilio client with your credentials
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// SMS Provider configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio'; // 'twilio' or 'iprog'

/**
 * Send SMS using Twilio
 * @param {string} to - The recipient phone number (must be in E.164 format)
 * @param {string} message - The message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMSTwilio(to, message) {
    try {
        const response = await client.messages.create({
            body: message,
            to: to, // Phone number in E.164 format (e.g., +1234567890)
            from: process.env.TWILIO_PHONE_NUMBER // Your Twilio phone number
        });

        return {
            success: true,
            messageId: response.sid,
            provider: 'twilio'
        };
    } catch (error) {
        console.error('Error sending SMS via Twilio:', error);
        return {
            success: false,
            error: error.message,
            provider: 'twilio'
        };
    }
}

/**
 * Send SMS using IPROG SMS API
 * @param {string} to - The recipient phone number
 * @param {string} message - The message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMSIprog(to, message) {
    try {
        // Format phone number for IPROG (remove + if present)
        let formattedPhone = to.replace(/^\+/, '');
        
        const data = {
            api_token: process.env.IPROG_API_TOKEN,
            message: message,
            phone_number: formattedPhone
        };

        const response = await axios.post('https://sms.iprogtech.com/api/v1/sms_messages', 
            new URLSearchParams(data), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Parse the response (adjust based on IPROG's actual response format)
        const responseData = response.data;
        
        // Assuming IPROG returns success indicator and message ID
        // You may need to adjust this based on their actual response format
        if (response.status === 200) {
            return {
                success: true,
                messageId: responseData.message_id || responseData.id || 'iprog_' + Date.now(),
                provider: 'iprog',
                response: responseData
            };
        } else {
            throw new Error('IPROG API returned non-200 status');
        }

    } catch (error) {
        console.error('Error sending SMS via IPROG:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            provider: 'iprog'
        };
    }
}

/**
 * Send SMS using the configured provider
 * @param {string} to - The recipient phone number
 * @param {string} message - The message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMS(to, message) {
    // Ensure phone number is properly formatted
    let formattedPhone = to;
    if (!to.startsWith('+') && SMS_PROVIDER === 'twilio') {
        formattedPhone = '+' + to;
    }

    switch (SMS_PROVIDER.toLowerCase()) {
        case 'iprog':
            return sendSMSIprog(formattedPhone, message);
        case 'twilio':
        default:
            return sendSMSTwilio(formattedPhone, message);
    }
}

/**
 * Send SMS with fallback support (try primary provider, fallback to secondary)
 * @param {string} to - The recipient phone number
 * @param {string} message - The message to send
 * @param {string} primaryProvider - Primary provider to try ('twilio' or 'iprog')
 * @param {string} fallbackProvider - Fallback provider ('twilio' or 'iprog')
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMSWithFallback(to, message, primaryProvider = 'iprog', fallbackProvider = 'twilio') {
    // Format phone number
    let formattedPhone = to;
    if (to.startsWith('+') && primaryProvider === 'iprog') {
        formattedPhone = to.replace(/^\+/, ''); 
    }

    // Try primary provider
    let result;
    switch (primaryProvider.toLowerCase()) {
        case 'iprog':
            result = await sendSMSIprog(formattedPhone, message);
            break;
        case 'twilio':
        default:
            result = await sendSMSTwilio(formattedPhone, message);
    }

    // If primary fails, try fallback
    if (!result.success && fallbackProvider !== primaryProvider) {
        console.log(`Primary provider (${primaryProvider}) failed, trying fallback (${fallbackProvider})`);
        
        switch (fallbackProvider.toLowerCase()) {
            case 'iprog':
                result = await sendSMSIprog(formattedPhone, message);
                break;
            case 'twilio':
                result = await sendSMSTwilio(formattedPhone, message);
                break;
        }
    }

    return result;
}

/**
 * Send order status notification via SMS
 * @param {string} phone - The recipient phone number
 * @param {string} orderNumber - The order number/ID
 * @param {string} status - The new order status
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOrderStatusNotification(phone, orderNumber, status) {
    let message;
    switch (status.toLowerCase()) {
        case 'confirm':
            message = `Your order #${orderNumber} has been confirmed! We're preparing your items for delivery. Thank you for shopping with Rich Agri Supply!`;
            break;
        case 'delivered':
            message = `Great news! Your order #${orderNumber} has been delivered. Thank you for choosing Rich Agri Supply! We hope you enjoy your purchase.`;
            break;
        default:
            message = `Order #${orderNumber} status update: ${status}`;
    }

    return sendSMSWithFallback(phone, message);
}

/**
 * Send order status notification with fallback support
 * @param {string} phone - The recipient phone number
 * @param {string} orderNumber - The order number/ID
 * @param {string} status - The new order status
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOrderStatusNotificationWithFallback(phone, orderNumber, status) {
    let message;
    switch (status.toLowerCase()) {
        case 'confirmed':
            message = `Your order #${orderNumber} has been confirmed! We're preparing your items for delivery. Thank you for shopping with Rich Agri Supply!`;
            break;
        case 'delivered':
            message = `Great news! Your order #${orderNumber} has been delivered. Thank you for choosing Rich Agri Supply! We hope you enjoy your purchase.`;
            break;
        default:
            message = `Order #${orderNumber} status update: ${status}`;
    }

    return sendSMSWithFallback(phone, message);
}

/**
 * Generate a random OTP
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
function generateOTP(length = 6) {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

/**
 * Send OTP verification SMS
 * @param {string} phone - The recipient phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOTPVerification(phone, otp) {
    const message = `Your Rich Agri Supply verification code is: ${otp}. This code will expire in 10 minutes.`;
    return sendSMSWithFallback(phone, message);
}

module.exports = { 
    sendSMS, 
    sendSMSTwilio,
    sendSMSIprog,
    sendSMSWithFallback,
    sendOrderStatusNotification,
    sendOrderStatusNotificationWithFallback,
    generateOTP,
    sendOTPVerification
};