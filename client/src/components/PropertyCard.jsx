import React from 'react';
import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  // --- Debugging logs ---
  // console.log("PropertyCard received:", property);
  // console.log("PropertyCard ID:", property?.id, "Type:", typeof property?.id);

  // --- Safety Check ---
  // Ensure property and property.id exist before rendering
  if (!property || typeof property.id === 'undefined') {
    console.error("PropertyCard received invalid property data:", property);
    return <div className="border rounded-lg p-4 shadow-md bg-red-100 text-red-700">Invalid property data</div>; // Or return null
  }

  // --- Safely access the first image ---
  // Check if images array exists and has at least one item
  const imageUrl = (property.images && property.images.length > 0)
    ? property.images[0].image_url
    : 'https://placehold.co/600x400/eee/ccc?text=No+Image'; // Provide a placeholder

  const placeholderErrorUrl = 'https://placehold.co/600x400/eee/ccc?text=Image+Error';

  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white font-inter">
      <Link to={`/property/${property.id}`}>
        <img
          // Use the safely determined imageUrl
          src={imageUrl}
          alt={`Property at ${property.address}`}
          className="w-full h-48 object-cover"
          // Add error handling for broken image URLs
          onError={(e) => {
             if (e.target.src !== placeholderErrorUrl) {
                e.target.onerror = null; // prevents looping
                e.target.src = placeholderErrorUrl;
             }
          }}
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{property.address}</h3>
          <p className="text-sm text-gray-500">{property.city}, {property.state} {property.zip_code}</p>
          <p className="text-xl font-bold text-indigo-600 mt-2">
            ${Number(property.price).toLocaleString()}
          </p>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{property.bedrooms} Bed</span>
            <span>{property.bathrooms} Bath</span>
            <span>{property.size.toLocaleString()} sqft</span>
          </div>
           {/* Optionally show status if needed, checking it exists */}
           {property.status && (
             <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
               property.status === 'active' ? 'bg-green-100 text-green-800' :
               property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
               'bg-gray-100 text-gray-800'
             }`}>
               {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
             </span>
           )}
        </div>
      </Link>
    </div>
  );
}

export default PropertyCard;

