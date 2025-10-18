// FIX: Add imports for React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = React.lazy(() => import('./App.tsx'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);