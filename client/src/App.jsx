import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Use standard relative paths
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './index.css'; // Assuming Tailwind setup includes this

// Import Components
import NavBar from './components/NavBar.jsx';

// Import Pages (using relative paths)
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx';
import PropertyForm from './pages/PropertyForm.jsx'; // Used for both create and edit

// Protected Route HOC (Higher Order Component)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Optionally return a loading spinner while auth state is being determined
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}


function App() {
  // NOTE: BrowserRouter wrapper should only be in main.jsx

  return (
    <> {/* Use Fragment */}
      <NavBar />
      <main className="pt-16 font-inter"> {/* Add padding-top */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* --- Specific routes MUST come before dynamic routes --- */}

          {/* Protected Routes (Require Login) */}
          <Route
            path="/add-property" // Specific path for creating
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property/edit/:id" // Edit route
            element={
              <ProtectedRoute>
                <PropertyForm />
              </ProtectedRoute>
            }
          />

          {/* Dynamic route for viewing details - MUST come AFTER specific routes */}
          <Route path="/property/:id" element={<PropertyDetailsPage />} />


          {/* Fallback Route */}
           <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect unknown paths to home */}
        </Routes>
      </main>
    </>
  );
}

export default App;

