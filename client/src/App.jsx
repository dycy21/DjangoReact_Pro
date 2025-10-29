import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// Use relative paths for imports within the src directory
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './index.css';

// Import Components and Pages using relative paths
import NavBar from './components/NavBar.jsx';
// import ProtectedRoute from './components/ProtectedRoute'; // If needed later

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx';
import PropertyForm from './pages/PropertyForm.jsx';

// A simple wrapper for routes that require authentication
function RequireAuth({ children }) {
  const { auth } = useAuth();
  // Redirect to login if not authenticated and not currently loading auth state
  if (!auth.loading && !auth.isAuthenticated) {
     return <Navigate to="/login" replace />;
  }
  // Optionally show a loading state while auth is loading
  // if (auth.loading) {
  //   return <div>Loading...</div>; // Or a spinner
  // }
  return children;
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50 font-inter"> {/* Changed bg color slightly */}
          <NavBar />
          <main className="flex-grow container mx-auto px-4 py-8"> {/* Added container for consistent padding */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* Use :id parameter for property details */}
              <Route path="/property/:id" element={<PropertyDetailsPage />} />

              {/* Protected Routes */}
              <Route
                path="/add-property"
                element={
                  <RequireAuth>
                    <PropertyForm />
                  </RequireAuth>
                }
              />
               {/* --- Add Edit Route --- */}
               <Route
                 path="/property/edit/:id"
                 element={
                   <RequireAuth>
                     {/* Reuse PropertyForm for editing */}
                     <PropertyForm />
                   </RequireAuth>
                 }
               />
               {/* --- End Edit Route --- */}

              {/* Optional: Add a 404 Not Found Route */}
              <Route path="*" element={<div className="text-center py-10"><h2 className="text-2xl font-semibold">404 - Page Not Found</h2></div>} />
            </Routes>
          </main>
          {/* Optional Footer */}
           <footer className="bg-gray-800 text-white p-4 text-center mt-auto"> {/* Ensure footer sticks to bottom */}
             © 2025 RealEstate Pro
           </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

