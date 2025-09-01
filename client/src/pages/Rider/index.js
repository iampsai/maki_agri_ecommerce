import React, { useState, useRef, useEffect } from 'react';
import { postData } from '../../utils/api';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Rider = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('in-transit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);

  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    // check existing login
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    try {
      const userObj = userRaw ? JSON.parse(userRaw) : null;
      // only treat as logged in if token exists and user role is 'rider'
      if (token && userObj && (userObj.role === 'rider' || userObj.role === 'RIDER')) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
    return () => {
      stopScanner();
    };
  }, []);

  const login = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const res = await postData('/api/user/signin', { email, password });
      if (res?.token && res?.user) {
        // allow only users with role 'rider'
        const userRole = res.user.role || res.user?.role?.toString();
        if (userRole && (userRole === 'rider' || userRole === 'RIDER')) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          setIsLoggedIn(true);
          setMessage({ type: 'success', text: 'Logged in' });
        } else {
          setAuthError('Account is not a Rider. Please use rider credentials.');
        }
      } else if (res?.error || res?.msg) {
        setAuthError(res.msg || 'Login failed');
      } else {
        setAuthError('Login failed');
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const submitStatus = async (useToken, useStatus) => {
    if (!useToken) {
      setMessage({ type: 'error', text: 'Token required' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL || '';
      const url = `${baseUrl}/api/orders/scan/${useToken}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ status: useStatus }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMessage({ type: 'success', text: data.message || 'Status updated' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update status' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleScanAction = async () => submitStatus(token, status);

  const onScanSuccess = (decodedText, decodedResult) => {
    // decodedText may be JSON like { orderId, token } or a plain token
    try {
      let parsed;
      try {
        parsed = JSON.parse(decodedText);
      } catch (e) {
        parsed = null;
      }
      const extractedToken = parsed?.token || parsed?.orderId || decodedText;
      // stop scanner after successful read
      stopScanner();
      setToken(extractedToken);
      // optionally auto-submit — here we just set token; user can pick status and submit
      setMessage({ type: 'info', text: `Scanned token: ${extractedToken}` });
    } catch (err) {
      console.error('scan parse error', err);
    }
  };

  const onScanError = (errorMessage) => {
    // silent for now
    // console.warn('QR Scan Error', errorMessage);
  };

  const startScanner = () => {
    if (scannerInstanceRef.current) return;
    const config = { fps: 10, qrbox: 250 };
    scannerInstanceRef.current = new Html5QrcodeScanner('qr-reader', config, false);
    scannerInstanceRef.current.render(onScanSuccess, onScanError);
  };

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      }
    } catch (err) {
      console.warn('Error stopping scanner', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setMessage({ type: 'info', text: 'Logged out' });
  };

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <Typography variant="h5" gutterBottom>Rider Portal</Typography>

      {!isLoggedIn ? (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', maxWidth: 420 }}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={login} disabled={loading}>{loading ? 'Signing...' : 'Sign in'}</Button>
          </Box>
          {authError && <div style={{ color: 'red' }}>{authError}</div>}
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Button variant="contained" color="primary" onClick={() => window.location.href = '/rider/dashboard'}>My Dashboard</Button>
            <Button variant="contained" onClick={startScanner}>Start Camera Scan</Button>
            <Button variant="outlined" onClick={stopScanner}>Stop Camera</Button>
            {/* <Button variant="outlined" color="secondary" onClick={logout}>Logout</Button> */}
          </Box>

          <div id="qr-reader" ref={scannerRef} style={{ width: '100%', maxWidth: 500 }} />

          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', mt: 2 }}>
            <TextField label="Scanned Token or paste token" value={token} onChange={(e) => setToken(e.target.value)} fullWidth />

            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} SelectProps={{ native: true }}>
              <option value="in-transit">In-transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </TextField>

            <Button variant="contained" disabled={loading} onClick={handleScanAction}>{loading ? 'Processing...' : 'Submit Status'}</Button>
            {message && (<div style={{ marginTop: 8, color: message.type === 'error' ? 'red' : message.type === 'info' ? '#333' : 'green' }}>{message.text}</div>)}
          </Box>
        </>
      )}
    </div>
  );
};

export default Rider;
