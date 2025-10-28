import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Use absolute paths from the /src root
import apiClient from '/src/api/apiClient.js';
import PropertyCard from '/src/components/PropertyCard.jsx';
import PropertyFilter from '/src/components/PropertyFilter.jsx';
import Spinner from '/src/components/Spinner.jsx';
import ErrorMessage from '/src/components/ErrorMessage.jsx';

function HomePage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProperties = async (filters = {}) => {
    setLoading(true);
    setError('');
    
    // Convert filters object to query string
    const queryParams = new URLSearchParams(filters).toString();

    try {
      // --- FIX ---
      // The URL was '/api/v1/property_details/properties/'.
      // The correct URL (from your urls.py) is '/api/v1/properties/'.
      const response = await apiClient.get(`/api/v1/properties/?${queryParams}`);
      // --- END FIX ---
      
      // Handle paginated or non-paginated response
      const data = response.data.results || response.data;
      setProperties(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error('Failed to fetch properties:', err);
      // Check for specific error message structure
      const errorMessage = err.message || 'Failed to load properties. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <PropertyFilter onSearch={fetchProperties} />

      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.length > 0 ? (
            // --- FIX ---
            // Filter out any null or undefined items in the array before mapping
            properties.filter(Boolean).map(property => (
              <PropertyCard key={property.id} property={property} />
            ))
            // --- END FIX ---
          ) : (
            <p className="col-span-full text-center text-gray-500">No properties found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage;

