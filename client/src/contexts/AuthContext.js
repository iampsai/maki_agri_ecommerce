import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  registerWithEmailAndPassword, 
  loginWithEmailAndPassword, 
  logoutUser, 
  resetPassword, 
  signInWithGoogle, 
  signInWithFacebook 
} from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { postData } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register with email and password
  const signup = async (name, email, password) => {
    setError('');
    const result = await registerWithEmailAndPassword(name, email, password);
    
    if (!result.error) {
      // Sync with your backend
      const fields = {
        name: name,
        email: email,
        password: password,
        images: [],
        phone: ''
      };
      
      try {
        const res = await postData("/api/user/signup", fields);
        return res;
      } catch (err) {
        setError('Failed to create an account with backend');
        return { error: true, msg: 'Failed to create an account with backend' };
      }
    } else {
      setError(result.message);
      return { error: true, msg: result.message };
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    setError('');
    // Try backend authentication first (supports admin-created users that may not exist in Firebase)
    try {
      const res = await postData('/api/user/signin', { email, password });
      if (!res.error && res.token) {
        const user = {
          userName: res?.user?.name,
          email: res?.user?.email,
          userId: res.user?.id,
          image: res?.user?.images?.length > 0 ? res?.user?.images[0] : "",
          isAdmin: res.user?.isAdmin,
          role: res.user?.role || res.user?.role?.toString?.()
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(user));

        return { error: false, user: user, msg: 'User Login Successfully!' };
      }
      // If backend returned an error, fall back to Firebase sign-in below
    } catch (err) {
      // ignore and try firebase fallback
      console.warn('Backend signin failed, attempting Firebase signin as fallback', err?.message || err);
    }

    // Fallback: try Firebase auth (for users created via client-side Firebase flows)
    const result = await loginWithEmailAndPassword(email, password);
    if (!result.error) {
      try {
        // Sync with your backend after successful Firebase sign-in
        const res = await postData('/api/user/signin', { email, password });
        if (!res.error) {
          const user = {
            userName: res?.user?.name,
            email: res?.user?.email,
            userId: res.user?.id,
            image: res?.user?.images?.length > 0 ? res?.user?.images[0] : "",
            isAdmin: res.user?.isAdmin,
            role: res.user?.role || res.user?.role?.toString?.()
          };

          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(user));

          return { error: false, user: user, msg: 'User Login Successfully!' };
        } else {
          setError(res.msg);
          return res;
        }
      } catch (err) {
        setError('Failed to login with backend after Firebase auth');
        return { error: true, msg: 'Failed to login with backend after Firebase auth' };
      }
    } else {
      setError(result.message);
      return { error: true, msg: result.message };
    }
  };

  // Logout
  const logout = async () => {
    setError('');
    const result = await logoutUser();
    
    if (!result.error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isLogin");
      return { error: false };
    } else {
      setError(result.message);
      return result;
    }
  };

  // Password reset
  const forgotPassword = async (email) => {
    setError('');
    const result = await resetPassword(email);
    
    if (!result.error) {
      try {
        // Sync with your backend
        const res = await postData("/api/user/forgotPassword", { email });
        return res;
      } catch (err) {
        setError('Failed to reset password with backend');
        return { error: true, msg: 'Failed to reset password with backend' };
      }
    } else {
      setError(result.message);
      return { error: true, msg: result.message };
    }
  };

  // Google Sign In
  const googleSignIn = async () => {
    setError('');
    const result = await signInWithGoogle();
    
    if (!result.error) {
      try {
        const user = result.user;
        
        // Sync with your backend
        const fields = {
          name: user.displayName,
          email: user.email,
          password: null,
          images: user.photoURL,
          phone: user.phoneNumber || ''
        };
        
        const res = await postData("/api/user/authWithGoogle", fields);
        
        if (!res.error) {
          const userData = {
            userName: res.user?.name,
            email: res.user?.email,
            userId: res.user?.id,
            image: res?.user?.images?.length > 0 ? res?.user?.images[0] : "",
            isAdmin: res.user?.isAdmin,
          };
          
          localStorage.setItem("token", res.token);
          localStorage.setItem("user", JSON.stringify(userData));
          
          return { error: false, user: userData, msg: res.msg || "User Login Successfully!" };
        } else {
          setError(res.msg);
          return res;
        }
      } catch (err) {
        setError('Failed to login with Google through backend');
        return { error: true, msg: 'Failed to login with Google through backend' };
      }
    } else {
      setError(result.message);
      return { error: true, msg: result.message };
    }
  };

  // Facebook Sign In
  const facebookSignIn = async () => {
    setError('');
    const result = await signInWithFacebook();
    
    if (!result.error) {
      try {
        const user = result.user;
        
        // Sync with your backend
        const fields = {
          name: user.displayName,
          email: user.email,
          password: null,
          images: user.photoURL,
          phone: user.phoneNumber || ''
        };
        
        const res = await postData("/api/user/authWithFacebook", fields);
        
        if (!res.error) {
          const userData = {
            userName: res.user?.name,
            email: res.user?.email,
            userId: res.user?.id,
            image: res?.user?.images?.length > 0 ? res?.user?.images[0] : "",
            isAdmin: res.user?.isAdmin,
          };
          
          localStorage.setItem("token", res.token);
          localStorage.setItem("user", JSON.stringify(userData));
          
          return { error: false, user: userData, msg: res.msg || "User Login Successfully!" };
        } else {
          setError(res.msg);
          return res;
        }
      } catch (err) {
        setError('Failed to login with Facebook through backend');
        return { error: true, msg: 'Failed to login with Facebook through backend' };
      }
    } else {
      setError(result.message);
      return { error: true, msg: result.message };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    error,
    signup,
    login,
    logout,
    forgotPassword,
    googleSignIn,
    facebookSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
