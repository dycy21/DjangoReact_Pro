import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

const PropertyDetailsPage = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { propertyId } = useParams(); // Get ID from URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use new endpoint
        const response = await apiClient.get(`/api/v1/property_details/properties/${propertyId}/`);
        setProperty(response.data);
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setError("Property not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        // Use new endpoint
        await apiClient.delete(`/api/v1/property_details/properties/${propertyId}/`);
        alert("Property deleted successfully.");
        navigate('/');
      } catch (err) {
        console.error("Failed to delete property:", err);
        setError("Failed to delete property. You may not be the owner.");
      }
    }
  };

  const handleEdit = () => {
    navigate(`/property/edit/${property.id}`);
  };

  if (loading) return <Spinner />;
  if (error) return <div className="container mx-auto px-6 py-12"><ErrorMessage message={error} /></div>;
  if (!property) return null;
  
  const isOwner = user && user.id === property.owner;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <img 
            src={property.images[0]?.image_url || 'https://placehold.co/800x600/eeeeee/cccccc?text=No+Image'} 
            alt={property.address}
            className="w-full h-96 object-cover rounded-lg shadow-md"
          />
          <div className="grid grid-cols-2 gap-4">
            {property.images.slice(1, 5).map((img, index) => (
              <img 
                key={index}
                src={img.image_url} 
                alt={`${property.address} ${index + 1}`}
                className="w-full h-44 object-cover rounded-lg shadow-sm"
              />
            ))}
            {property.images.length === 0 && Array(4).fill(0).map((_, i) => (
               <div key={i} className="w-full h-44 bg-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-500">No Image</div>
            ))}
          </div>
        </div>
        
        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{property.address}</h1>
            <p className="text-xl text-gray-600 mb-6">{property.city}, {property.state} {property.zip_code}</p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {property.description || 'No description provided.'}
            </p>
          </div>
          
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200 sticky top-24">
              <h2 className="text-4xl font-bold text-blue-600 mb-6">
                ${new Intl.NumberFormat().format(parseFloat(property.price))}
              </h2>
              <div className="space-y-4 text-lg text-gray-800">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Bedrooms:</span>
                  <span className="font-bold">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Bathrooms:</span>
                  <span className="font-bold">{property.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Size (sqft):</span>
                  <span className="font-bold">{property.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className="font-bold capitalize">{property.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Owner:</span>
                  <span className="font-bold">{property.owner_username}</span>
                </div>
              </div>
              
              {isOwner && (
                <div className="mt-8 pt-6 border-t flex space-x-4">
                  <button
                    onClick={handleEdit}
                    className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-yellow-600 font-semibold"
                  >
                    <i className="fas fa-edit mr-2"></i>Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-700 font-semibold"
                  >
                    <i className="fas fa-trash mr-2"></i>Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
