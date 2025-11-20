import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

/**
 * Top-level router that mounts your existing App as the root element.
 * This enables the React Router "future" flags (v7_startTransition, v7_relativeSplatPath)
 * and should stop the console warnings produced by BrowserRouter usage elsewhere.
 *
 * If you prefer to migrate routes to route objects later, we can do that too.
 */

const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: (
        <AuthProvider>
          <App />
        </AuthProvider>
      )
    }
  ],
  {
    // opt in to v7 behavior to silence warnings and test changes early
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} fallbackElement={<div className="text-neutral-500">Loading…</div>} />
  </React.StrictMode>
);