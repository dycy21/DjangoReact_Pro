import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '/src/api/apiClient.js'; // Use absolute path from src
import { useAuth } from '/src/contexts/AuthContext.jsx'; // Use absolute path from src
import Spinner from '/src/components/Spinner.jsx'; // Use absolute path from src
import ErrorMessage from '/src/components/ErrorMessage.jsx'; // Use absolute path from src

function PropertyDetailsPage() {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { auth } = useAuth(); // Get auth state
    const navigate = useNavigate();

    // Debugging log for ID
    console.log("PropertyDetailsPage received ID:", id, "Type:", typeof id);

    useEffect(() => {
        const fetchProperty = async () => {
            // Safety check for ID
            if (!id || id === 'undefined') {
                 console.error("Invalid property ID:", id);
                 setError('Invalid property ID provided.');
                 setLoading(false);
                 return;
            }
            setLoading(true);
            setError('');
            try {
                // Use the correct API path
                const response = await apiClient.get(`/api/v1/properties/${id}/`);
                setProperty(response.data);
            } catch (err) {
                console.error("Failed to fetch property:", err.response ? err.response.data : err.message);
                setError('Failed to load property details. It might not exist.');
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]); // Re-run effect if ID changes

     // --- Delete Handler ---
     const handleDelete = async () => {
        // Simple confirmation dialog
        // IMPORTANT: window.confirm might not work well in all environments/iframes.
        // Consider implementing a custom modal for confirmation in production.
        if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }

        setError(''); // Clear previous errors
        try {
            await apiClient.delete(`/api/v1/properties/${id}/`);
            console.log('Property deleted successfully');
            navigate('/'); // Redirect to homepage after successful deletion
        } catch (err) {
            console.error("Failed to delete property:", err.response ? err.response.data : err.message);
            setError('Failed to delete property. Please try again.');
        }
     };
     // --- End Delete Handler ---

    // Determine if the current user is the owner
    const isOwner = auth.isAuthenticated && property && auth.user && String(auth.user.id) === String(property.owner);
     // Debugging ownership check
     // console.log("Auth User ID:", auth.user?.id, "Property Owner ID:", property?.owner, "Is Owner:", isOwner);


    if (loading) return <Spinner />;
    if (error && !property) return <ErrorMessage message={error} />; // Show error prominently if property fetch failed
    if (!property) return <ErrorMessage message="Property not found." />; // Handle case where property is null after loading

    // Format price and bathrooms nicely
    const formattedPrice = property.price ? parseFloat(property.price).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A';
    const formattedBathrooms = property.bathrooms ? parseFloat(property.bathrooms) : 'N/A';

    return (
        <div className="container mx-auto px-4 py-8 font-inter">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Image Carousel (Simplified: showing first image) */}
                {property.images && property.images.length > 0 ? (
                    <img
                        src={property.images[0].image_url}
                        alt={`Property at ${property.address}`}
                        className="w-full h-64 md:h-96 object-cover rounded-t-lg" // Added rounded top
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/800x600/cccccc/ffffff?text=Image+Not+Found` }}
                     />
                ) : (
                     <img
                         src={`https://placehold.co/800x600/cccccc/ffffff?text=No+Image`}
                         alt="Placeholder"
                         className="w-full h-64 md:h-96 object-cover rounded-t-lg" // Added rounded top
                     />
                )}

                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{property.address || 'Address not available'}</h1>
                    <p className="text-lg text-gray-600 mb-4">{`${property.city || 'N/A'}, ${property.state || 'N/A'} ${property.zip_code || 'N/A'}`}</p>

                    <div className="flex flex-wrap items-center justify-between mb-6 text-gray-700">
                        <span className="text-2xl font-semibold text-indigo-600">{formattedPrice}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Unknown'}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-center">
                        <div className="bg-gray-100 p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Bedrooms</p>
                            <p className="text-lg font-semibold text-gray-800">{property.bedrooms || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-500">Bathrooms</p>
                            <p className="text-lg font-semibold text-gray-800">{formattedBathrooms}</p>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg shadow-sm col-span-2 sm:col-span-1">
                            <p className="text-sm text-gray-500">Area</p>
                            <p className="text-lg font-semibold text-gray-800">{property.size ? property.size.toLocaleString() : 'N/A'} sqft</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-2 mt-6 border-t pt-4">Description</h2>
                    <p className="text-gray-600 mb-6">{property.description || 'No description available.'}</p>

                    <div className="border-t pt-4 text-sm text-gray-500 space-y-1">
                         <p>Listed by: <span className="font-medium text-gray-700">{property.owner_username || 'Unknown'}</span></p>
                         <p>Listed on: {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>


                     {/* --- Edit and Delete Buttons (Visible only to owner) --- */}
                     {isOwner && (
                         <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                             <Link
                                 to={`/property/edit/${id}`} // Link to the edit page
                                 className="w-full sm:w-auto text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md"
                             >
                                 Edit Property
                             </Link>
                             <button
                                 onClick={handleDelete}
                                 className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 shadow-md"
                             >
                                 Delete Property
                             </button>
                         </div>
                     )}
                     {/* --- End Edit and Delete Buttons --- */}

                     {/* Display general errors (like fetch failure) if not loading and property exists (delete error shown separately) */}
                     {error && !loading && property && <ErrorMessage message={error} className="mt-4"/>}

                      {/* Display delete error specifically */}
                     {error && error.includes('delete') && <ErrorMessage message={error} className="mt-4"/>}
                </div>
            </div>

        </div>
    );
}

export default PropertyDetailsPage;

