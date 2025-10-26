import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '/src/contexts/AuthContext.jsx';

// Layout & Components
import NavBar from '/src/components/NavBar.jsx';

// Pages
import HomePage from '/src/pages/HomePage.jsx';
import LoginPage from '/src/pages/LoginPage.jsx';
import RegisterPage from '/src/pages/RegisterPage.jsx';
import PropertyDetailsPage from '/src/pages/PropertyDetailsPage.jsx';
import PropertyForm from '/src/pages/PropertyForm.jsx';

// This component ensures a user is logged in to access certain routes
const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return <Outlet />; // Render the child route (e.g., PropertyForm)
};

// This component includes the Navbar and Footer for all pages
const MainLayout = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <Outlet /> {/* Child routes will render here */}
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 RealEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/property/:propertyId" element={<PropertyDetailsPage />} />
        
        {/* Protected Routes (Require Login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/property/create" element={<PropertyForm />} />
          <Route path="/property/edit/:propertyId" element={<PropertyForm />} />
        </Route>
        
        {/* Not Found Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;


