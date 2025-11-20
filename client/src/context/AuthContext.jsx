import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jobmug_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
      }
    } catch (e) {}
  }, []);

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('jobmug_auth', JSON.stringify({ token, user }));
    setUser(user);
    return res.data;
  }

  async function register(payload) {
    const res = await api.post('/api/auth/register', payload);
    const { token, user } = res.data;
    localStorage.setItem('jobmug_auth', JSON.stringify({ token, user }));
    setUser(user);
    return res.data;
  }

  function logout() {
    localStorage.removeItem('jobmug_auth');
    setUser(null);
  }

  // helper to update user both in state and localStorage (useful after profile edits)
  function updateUser(newUser) {
    try {
      const raw = localStorage.getItem('jobmug_auth');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.user = newUser;
      localStorage.setItem('jobmug_auth', JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}