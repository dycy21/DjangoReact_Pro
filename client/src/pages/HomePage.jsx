import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient.js';
import PropertyCard from '../components/PropertyCard.jsx';
import PropertyFilter from '../components/PropertyFilter.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const HomePage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      // Use new endpoint
      const response = await apiClient.get(`/api/v1/property_details/properties/?${queryParams}`);
      setProperties(response.data);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError("Failed to load properties. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(); // Fetch on initial render
  }, []);

  return (
    <>
      {/* Hero Section */}
      <div className="h-64 bg-blue-700 bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
        <h1 className="text-5xl font-bold text-white shadow-text">Find Your Dream Home</h1>
      </div>
      
      <div className="container mx-auto px-6">
        <PropertyFilter onFilterChange={fetchProperties} />
        
        {loading && <Spinner />}
        {error && <ErrorMessage message={error} />}
        
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {properties.length > 0 ? (
              properties.map(prop => (
                <PropertyCard 
                  key={prop.id} 
                  property={prop} 
                />
              ))
            ) : (
              <p className="text-gray-600 col-span-full text-center text-lg">No properties found matching your criteria.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;

