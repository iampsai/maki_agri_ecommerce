import React, { useState, useEffect, useContext, useCallback } from "react";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData, editData } from "../../utils/api";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Breadcrumbs,
  Typography
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { FaSearch, FaReply } from "react-icons/fa";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";

const StyledBreadcrumb = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800],
  height: theme.spacing(3),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover, &:focus': {
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
  },
  '&:active': {
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[600],
  },
}));

const columns = [
  { id: "user", label: "User", minWidth: 170 },
  { id: "message", label: "Message", minWidth: 200 },
  { id: "timestamp", label: "Date & Time", minWidth: 150 },
  { id: "status", label: "Status", minWidth: 100 },
  { id: "actions", label: "Actions", minWidth: 100, align: "center" }
];

const ChatMessages = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const context = useContext(MyContext);
  const { setProgress, setAlertBox } = context;
  const fetchAllChatMessages = useCallback(async () => {
    try {
      setLoading(true);
      setProgress(50);
      // This endpoint would need to be created on the server to get all chat messages
      let response = await fetchDataFromApi("/api/chat/admin/messages");

      // If main endpoint returns empty, continue with empty array (don't fallback to test)
      if (!response) {
        console.warn('Admin messages endpoint returned no response');
      }

      // Normalize response: accept array, or { success: true, data: [...] }
      let messagesPayload = [];
      if (Array.isArray(response)) {
        messagesPayload = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        messagesPayload = response.data;
      } else if (response && Array.isArray(response.messages)) {
        messagesPayload = response.messages;
      } else {
        // Unexpected response shape
        console.error('Unexpected response for chat admin messages:', response);
        setAlertBox({ open: true, error: true, msg: (response && (response.msg || response.message)) || 'Failed to load chat messages' });
        setLoading(false);
        return;
      }

      // Debug: log received payload size
      console.debug('fetchAllChatMessages: received response shape', Array.isArray(response) ? `array(${response.length})` : typeof response);
      // Group messages by user and sort by timestamp
      const processedMessages = processMessages(messagesPayload);

      setChatMessages(processedMessages);
      setFilteredMessages(processedMessages);
      setProgress(100);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      setAlertBox({
        open: true,
        error: true,
        msg: "Failed to load chat messages"
      });
      setProgress(100);
    } finally {
      setLoading(false);
    }
  }, [setProgress, setAlertBox]);

  // Trigger initial load of chat messages once fetchAllChatMessages is defined
  // Trigger initial load once fetchAllChatMessages is stable
  useEffect(() => {
    setProgress(30);
    fetchAllChatMessages();
  }, [fetchAllChatMessages, setProgress]);

  // fetchAllChatMessages effect moved below the function declaration to avoid
  // referencing it before initialization (TDZ) — see bottom of this file.

  // Process messages to group by user and include user info
  const processMessages = (messages) => {
    // Group messages by userId
    const userGroups = {};

    messages.forEach(msg => {
      if (!userGroups[msg.userId]) {
        userGroups[msg.userId] = {
          userId: msg.userId,
          userName: msg.userName || "Unknown User", // Include user name if available
          userEmail: msg.userEmail || "No Email",
          messages: [],
          hasUnread: false,
          lastMessageTime: null
        };
      }

      // Add message to user's group
      userGroups[msg.userId].messages.push(msg);

      // Check if this is an unread message from user
      if (msg.sender === 'user' && !msg.isRead) {
        userGroups[msg.userId].hasUnread = true;
      }

      // Update last message time if newer
      const msgTime = new Date(msg.timestamp).getTime();
      if (!userGroups[msg.userId].lastMessageTime ||
        msgTime > userGroups[msg.userId].lastMessageTime) {
        userGroups[msg.userId].lastMessageTime = msgTime;
      }
    });

    // Convert to array and sort by last message time (newest first)
    return Object.values(userGroups).sort((a, b) =>
      b.lastMessageTime - a.lastMessageTime
    );
  };

  const filterMessages = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(chatMessages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = chatMessages.filter(userChat =>
      userChat.userName.toLowerCase().includes(query) ||
      userChat.userEmail.toLowerCase().includes(query) ||
      userChat.messages.some(msg =>
        msg.message.toLowerCase().includes(query)
      )
    );

    setFilteredMessages(filtered);
    setPage(0);
  }, [searchQuery, chatMessages]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      filterMessages();
    }
  }, [searchQuery, chatMessages, filterMessages]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleReplyClick = (userChat) => {
    setCurrentUser(userChat);
    setReplyDialogOpen(true);
  };

  const handleReplyClose = () => {
    setReplyDialogOpen(false);
    setReplyMessage("");
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !currentUser) return;

    try {
      setSendingReply(true);
      context.setProgress(30);

      // Send admin reply
      await postData('/api/chat/admin/reply', {
        userId: currentUser.userId,
        message: replyMessage
      });

      // Success
      setAlertBox({
        open: true,
        error: false,
        msg: "Reply sent successfully"
      });

      // Refresh messages
      await fetchAllChatMessages();

      // Close dialog
      handleReplyClose();
      context.setProgress(100);
    } catch (error) {
      console.error("Error sending reply:", error);
      setAlertBox({
        open: true,
        error: true,
        msg: "Failed to send reply"
      });
      context.setProgress(100);
    } finally {
      setSendingReply(false);
    }
  };

  const markAsRead = async (userChat) => {
    try {
      context.setProgress(30);

      // Mark all messages as read for this user
      const res = await editData(`/api/chat/admin/mark-read/${userChat.userId}`, {});
      console.debug('markAsRead: api response', res);

      // Update local state optimistically
      const updatedMessages = chatMessages.map(chat => {
        if (chat.userId === userChat.userId) {
          return {
            ...chat,
            hasUnread: false,
            messages: chat.messages.map(msg => ({
              ...msg,
              isRead: true
            }))
          };
        }
        return chat;
      });

      setChatMessages(updatedMessages);

      // Re-fetch from server to ensure persistence and canonical state
      // Re-fetch from server to ensure persistence and canonical state
      try {
        await fetchAllChatMessages();
        // notify other components (sidebar badge) to refresh
        try { window.dispatchEvent(new Event('chat:updated')); } catch (e) { /* ignore */ }
      } catch (e) {
        console.debug('Error reloading messages after markAsRead', e);
      }

      // Re-apply current search filter to updated messages
      if (!searchQuery.trim()) {
        setFilteredMessages(updatedMessages);
      } else {
        const q = searchQuery.toLowerCase();
        const filtered = updatedMessages.filter(userChat =>
          userChat.userName.toLowerCase().includes(q) ||
          userChat.userEmail.toLowerCase().includes(q) ||
          userChat.messages.some(msg => msg.message.toLowerCase().includes(q))
        );
        setFilteredMessages(filtered);
      }

      setAlertBox({
        open: true,
        error: false,
        msg: "Messages marked as read"
      });

      context.setProgress(100);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      setAlertBox({
        open: true,
        error: true,
        msg: "Failed to mark messages as read"
      });
      context.setProgress(100);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLastMessage = (userChat) => {
    if (!userChat.messages || userChat.messages.length === 0) {
      return "No messages";
    }

    // Sort by timestamp (newest first)
    const sortedMessages = [...userChat.messages].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return sortedMessages[0].message;
  };

  const getLastMessageTime = (userChat) => {
    if (!userChat.messages || userChat.messages.length === 0) {
      return "N/A";
    }

    // Sort by timestamp (newest first)
    const sortedMessages = [...userChat.messages].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return formatDate(sortedMessages[0].timestamp);
  };

  return (
    <div className="right-content w-100">
      <div className="content-wrapper">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Customer Messages</h5>

          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
              <StyledBreadcrumb
                component="a"
                href="/"
                label="Dashboard"
                icon={<HomeIcon fontSize="small" />}
              />
              <StyledBreadcrumb
                label="Customer Messages"
                icon={<MarkChatReadIcon fontSize="small" />}
              />
            </Breadcrumbs>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <div className="search-bar mb-4">
            <TextField
              className="searchWrap"
              fullWidth
              variant="outlined"
              placeholder="Search by user name, email, or message content"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <Paper>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
                <CircularProgress />
              </div>
            ) : (
              <>
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{
                              minWidth: column.minWidth,
                              fontWeight: "bold",
                              backgroundColor: "#f5f5f5",
                            }}
                          >
                            {column.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMessages.length > 0 ? (
                        filteredMessages
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((userChat) => (
                            <TableRow hover tabIndex={-1} key={userChat.userId}>
                              <TableCell>
                                <div className="d-flex align-items-center">
                                  <PersonIcon className="mr-2" />
                                  <div>
                                    <Typography variant="body2" fontWeight="bold">
                                      {userChat.userName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {userChat.userEmail}
                                    </Typography>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  noWrap
                                  style={{
                                    maxWidth: 300,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: userChat.hasUnread ? 'bold' : 'normal'
                                  }}
                                >
                                  {getLastMessage(userChat)}
                                </Typography>
                              </TableCell>
                              <TableCell>{getLastMessageTime(userChat)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={userChat.hasUnread ? "Unread" : "Read"}
                                  color={userChat.hasUnread ? "error" : "success"}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <div className="d-flex justify-content-center">
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    className="mr-2"
                                    onClick={() => handleReplyClick(userChat)}
                                    startIcon={<FaReply />}
                                  >
                                    Reply
                                  </Button>
                                  {userChat.hasUnread && (
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      size="small"
                                      onClick={() => markAsRead(userChat)}
                                      startIcon={<MarkChatReadIcon />}
                                    >
                                      Mark Read
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No messages found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredMessages.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Paper>
        </div>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onClose={handleReplyClose} maxWidth="md" fullWidth>
          <DialogTitle>
            <div className="d-flex align-items-center">
              <PersonIcon className="mr-2" />
              Reply to {currentUser?.userName}
            </div>
          </DialogTitle>
          <DialogContent>
            <div className="mb-3">
              <Typography variant="subtitle2">Recent Conversation:</Typography>
              <div className="chat-history p-3" style={{ maxHeight: 200, overflowY: 'auto', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                {currentUser?.messages
                  .slice()
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .slice(-5)
                  .map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message mb-2 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}
                    >
                      <Chip
                        label={`${msg.sender === 'user' ? currentUser.userName : 'Admin'}: ${msg.message}`}
                        color={msg.sender === 'user' ? 'primary' : 'secondary'}
                        variant={msg.sender === 'user' ? 'outlined' : 'filled'}
                      />
                      <div className="timestamp">
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(msg.timestamp)}
                        </Typography>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <DialogContentText>
              Enter your reply message below:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Reply"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReplyClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleReplySubmit}
              color="primary"
              variant="contained"
              disabled={!replyMessage.trim() || sendingReply}
            >
              {sendingReply ? <CircularProgress size={24} /> : "Send Reply"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default ChatMessages;
