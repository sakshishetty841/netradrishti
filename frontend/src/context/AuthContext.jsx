import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({ backend: 'OK', aiService: 'UNKNOWN', model: 'NOT_READY' });

  const fetchHealth = async () => {
    try {
      const data = await fetchApi('/health');
      setSystemHealth(data);
    } catch {
      setSystemHealth({ backend: 'ERROR', aiService: 'OFFLINE', model: 'NOT_READY' });
    }
  };

  const loadUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchApi('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.warn('Failed to load user session:', err.message);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) {
      setAuthToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, systemHealth, refreshHealth: fetchHealth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
