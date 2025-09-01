import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const statusColor = (s) => {
  if (!s) return 'default';
  const v = s.toString().toLowerCase();
  if (v === 'completed') return 'success';
  if (v === 'in-transit' || v === 'in-transit') return 'primary';
  if (v === 'cancelled') return 'error';
  return 'default';
}

const RiderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [confirm, setConfirm] = useState({ open: false, order: null, action: null });

  const baseUrl = process.env.REACT_APP_BASE_URL || '';

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem('user');
      if (!stored) throw new Error('Not logged in');
      const user = JSON.parse(stored);
      const riderId = user.userId || user.id || user._id;
      if (!riderId) throw new Error('Rider id not found in stored user');

      const token = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/orders?deliveryRider=${riderId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doStatusUpdate = async (order, newStatus) => {
    const token = order.riderToken;
    if (!token) {
      alert('Missing rider token for order');
      return;
    }

    setActionLoading((s) => ({ ...s, [order._id]: true }));
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${baseUrl}/api/orders/scan/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');

      // update local state
      setOrders((prev) => prev.map(o => o._id === data.order._id ? data.order : o));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error updating status');
    } finally {
      setActionLoading((s) => ({ ...s, [order._id]: false }));
      setConfirm({ open: false, order: null, action: null });
    }
  };

  const handleActionClick = (order, action) => {
    // require confirmation for 'cancelled' and 'completed'
    if (action === 'cancelled' || action === 'completed') {
      setConfirm({ open: true, order, action });
    } else {
      doStatusUpdate(order, action);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, margin: '24px auto', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Rider Dashboard</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchOrders} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className='text-nowrap'>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Products</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell sx={{ maxWidth: 220, wordBreak: 'break-all' }} className='text-nowrap'>{order._id}</TableCell>
                <TableCell>{order.name}</TableCell>
                <TableCell>{order.phoneNumber}</TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>
                  <Chip label={order.status || 'pending'} color={statusColor(order.status)} size="small" />
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }} className='text-nowrap'>
                  {order.products?.map((p, i) => (
                    <Typography key={i} variant="body2">
                      {p.name || p.productTitle || p.productId} (x{p.quantity})
                    </Typography>
                  ))}
                </TableCell>
                <TableCell align="right" className='text-nowrap'>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button size="small" variant="outlined" href={`/rider`} title="Open Scanner">Scanner</Button>
                      {/* <Tooltip title="Open order detail">
                      <IconButton size="small" component="a" href={`/orders/${order._id}`} target="_blank">
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip> */}

                      <Button size="small" variant="contained" onClick={() => handleActionClick(order, 'in-transit')} disabled={actionLoading[order._id] || order.status === 'in-transit' || order.status === 'completed'}>
                        {actionLoading[order._id] && confirm.order?._id !== order._id ? <CircularProgress size={16} /> : 'In-transit'}
                      </Button>

                      <Button size="small" color="success" variant="contained" onClick={() => handleActionClick(order, 'completed')} disabled={actionLoading[order._id] || order.status === 'completed'}>
                        Complete
                      </Button>

                      <Button size="small" color="error" variant="contained" onClick={() => handleActionClick(order, 'cancelled')} disabled={actionLoading[order._id] || order.status === 'cancelled' || order.status === 'completed'}>
                        Cancel
                      </Button>
                    </div>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, order: null, action: null })}>
        <DialogTitle>Confirm {confirm.action}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark order <strong>{confirm.order?._id}</strong> as <strong>{confirm.action}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, order: null, action: null })}>No</Button>
          <Button variant="contained" color={confirm.action === 'cancelled' ? 'error' : 'primary'} onClick={() => doStatusUpdate(confirm.order, confirm.action)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiderDashboard;
