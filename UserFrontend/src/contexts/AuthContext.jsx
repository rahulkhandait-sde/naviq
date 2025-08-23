import { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../lib/appwrite';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      console.log('Auth check failed:', error.message);
      // Don't log CORS errors as they're expected in development
      if (!error.message.includes('CORS')) {
        console.error('Authentication error:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      setUser(session);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = error.message;
      
      // Handle CORS errors specifically
      if (error.message.includes('CORS') || error.type === 'network') {
        errorMessage = 'Connection error. Please ensure you\'re accessing the app via localhost.';
      } else if (error.code === 401) {
        errorMessage = 'Invalid email or password.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, name) => {
    try {
      await account.create('unique()', email, password, name);
      return await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = error.message;
      
      // Handle CORS errors specifically
      if (error.message.includes('CORS') || error.type === 'network') {
        errorMessage = 'Connection error. Please ensure you\'re accessing the app via localhost.';
      } else if (error.code === 409) {
        errorMessage = 'An account with this email already exists.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
