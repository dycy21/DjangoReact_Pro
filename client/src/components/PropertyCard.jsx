import React from 'react';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/property/${property.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      <img 
        src={property.images[0]?.image_url || 'https://placehold.co/600x400/eeeeee/cccccc?text=No+Image'}
        alt={property.address}
        className="w-full h-56 object-cover"
      />
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-bold text-blue-600">
            ${new Intl.NumberFormat().format(parseFloat(property.price))}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            FOR SALE
          </span>
        </div>
        <p className="text-lg font-semibold text-gray-800 truncate">{property.address}</p>
        <p className="text-gray-600 text-sm truncate">{property.city}, {property.state}</p>
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between text-sm text-gray-700">
          <span><i className="fas fa-bed mr-1"></i> {property.bedrooms} Beds</span>
          <span><i className="fas fa-bath mr-1"></i> {property.bathrooms} Baths</span>
          <span><i className="fas fa-ruler-combined mr-1"></i> {property.size} sqft</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
