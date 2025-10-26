import React, { useState } from 'react';

const PropertyFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    location: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Remove empty keys before submitting
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    onFilterChange(activeFilters);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-lg -mt-16 z-10 relative mb-12 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
    >
      <div className="md:col-span-2">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          name="location"
          id="location"
          value={filters.location}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter address, city, or state..."
        />
      </div>
      <div>
        <label htmlFor="min_price" className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
        <input
          type="number"
          name="min_price"
          id="min_price"
          value={filters.min_price}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="$100,000"
        />
      </div>
      <div>
        <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
        <input
          type="number"
          name="max_price"
          id="max_price"
          value={filters.max_price}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="$500,000"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold transition-colors"
      >
        <i className="fas fa-search mr-2"></i>Search
      </button>
    </form>
  );
};

export default PropertyFilter;
