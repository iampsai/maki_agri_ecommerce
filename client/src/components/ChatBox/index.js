import React, { useState, useEffect, useRef, useContext } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";
import "./style.css";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messageContainerRef = useRef(null);
  const context = useContext(MyContext);
  
  // Fetch chat history when user logs in or chat opens
  useEffect(() => {
    if (context.isLogin && context.user && isOpen) {
      fetchChatHistory();
      markMessagesAsRead();
    }
  }, [context.isLogin, context.user, isOpen]);
  
  // Auto-scroll to latest message
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initial greeting message for new chat
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          id: "welcome",
          text: "Hello! How can we help you today?",
          sender: "admin",
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  }, [isOpen]);
  
  // Fetch chat history from API
  const fetchChatHistory = async () => {
    // Get correct userId
    const userId = context.user?._id || context.user?.userId || context.user?.id;
    
    if (!userId) {
      console.error("User ID not found for chat history");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Fetching chat history for userId:", userId);
      const chatHistory = await fetchDataFromApi(`/api/chat/${userId}`);
      
      console.log("Received chat history:", chatHistory);
      
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        // Format messages for display
        const formattedMessages = chatHistory.map(msg => ({
          id: msg._id,
          text: msg.message,
          sender: msg.sender,
          timestamp: msg.timestamp,
          isRead: msg.isRead
        }));
        
        setMessages(formattedMessages);
        
        // Calculate unread messages
        const unread = formattedMessages.filter(msg => 
          msg.sender === 'admin' && !msg.isRead
        ).length;
        
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to load chat history",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Mark all messages as read
  const markMessagesAsRead = async () => {
    // Get correct userId
    const userId = context.user?._id || context.user?.userId || context.user?.id;
    
    if (!userId) {
      console.error("User ID not found for marking messages as read");
      return;
    }
    
    try {
      console.log("Marking messages as read for userId:", userId);
      await fetchDataFromApi(`/api/chat/mark-read/${userId}`);
      setUnreadCount(0);
      
      // Update local message state to mark all as read
      setMessages(prevMessages => 
        prevMessages.map(msg => ({
          ...msg,
          isRead: true
        }))
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };
  
  const toggleChat = () => {
    if (!isOpen && context.isLogin && context.user) {
      fetchChatHistory();
    }
    
    if (isOpen && unreadCount > 0) {
      markMessagesAsRead();
    }
    
    setIsOpen(!isOpen);
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Check if user is logged in
    if (!context.isLogin) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please log in to send messages",
      });
      return;
    }
    
    // Debug user object
    console.log("User object:", context.user);
    
    // Add user message to chat immediately for responsive UI
    const tempId = `temp-${Date.now()}`;
    const userMessage = {
      id: tempId,
      text: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setLoading(true);
    
    try {
      // Get userId correctly
      const userId = context.user?._id || context.user?.userId || context.user?.id;
      
      if (!userId) {
        throw new Error("User ID not found. Please try logging in again.");
      }
      
      console.log("Sending message with userId:", userId);
      
      // Send message to API
      const response = await postData('/api/chat/message', { 
        userId: userId,
        message: newMessage
      });
      
      console.log("Message response:", response);
      
      if (response && response.success) {
        // Replace temp message with confirmed message from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {
                  id: response.userMessage._id,
                  text: response.userMessage.message,
                  sender: response.userMessage.sender,
                  timestamp: response.userMessage.timestamp,
                }
              : msg
          )
        );
        
        // Add admin response from server
        setMessages(prev => [
          ...prev, 
          {
            id: response.adminResponse._id,
            text: response.adminResponse.message,
            sender: response.adminResponse.sender,
            timestamp: response.adminResponse.timestamp,
          }
        ]);
      } else {
        // Handle error
        throw new Error(response?.msg || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Failed to send message",
      });
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // If user is not logged in, don't show chat option
  if (!context.isLogin && !isOpen) {
    return null;
  }
  
  return (
    <div className={`chat-box-container ${isOpen ? 'open' : ''}`}>
      {/* Chat toggle button */}
      <button 
        className="chat-toggle-btn"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FaTimes /> : <FaComments />}
        {!isOpen && unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </button>
      
      {/* Chat window */}
      <div className="chat-window">
        <div className="chat-header">
          <h3>Customer Support</h3>
          <button className="close-btn" onClick={toggleChat}>
            <FaTimes />
          </button>
        </div>
        
        {/* Messages container */}
        <div className="messages-container" ref={messageContainerRef}>
          {messages.length === 0 && !loading ? (
            <div className="empty-chat">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'user' ? 'user-message' : 'admin-message'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="timestamp">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="message admin-message">
              <div className="message-content typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>
        
        {/* Login prompt if not logged in */}
        {!context.isLogin && isOpen ? (
          <div className="login-prompt">
            <p>Please <a href="/signin">sign in</a> to chat with us</p>
          </div>
        ) : (
          /* Message input */
          <form className="message-input-container" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={loading || !context.isLogin}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || loading || !context.isLogin}
              className="send-btn"
            >
              <FaPaperPlane />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
