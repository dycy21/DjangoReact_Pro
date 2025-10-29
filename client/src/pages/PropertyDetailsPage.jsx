import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Use absolute paths from /src/
import apiClient from '/src/api/apiClient.js';
import { useAuth } from '/src/contexts/AuthContext.jsx';
import Spinner from '/src/components/Spinner.jsx';
import ErrorMessage from '/src/components/ErrorMessage.jsx';

function PropertyDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth(); // Destructure auth state and loading status
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false); // State for delete loading indicator

    // Debugging log
    console.log("PropertyDetailsPage received ID:", id, "Type:", typeof id);

    useEffect(() => {
        // Clear previous error
        setError('');

        // Validate ID early - prevents API call with "create" or other invalid IDs
        if (!id || isNaN(id)) {
            setError(`Invalid Property ID: ${id}. Cannot fetch details.`);
            setLoading(false);
            return;
        }

        const fetchProperty = async () => {
            setLoading(true);
            try {
                // Use the correct API path
                const response = await apiClient.get(`/api/v1/properties/${id}/`);
                setProperty(response.data);
            } catch (err) {
                console.error("Failed to fetch property details:", err);
                setError(err.response?.status === 404 ? 'Property not found.' : 'Failed to fetch property details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
    }, [id]); // Re-run effect if ID changes

    const handleDelete = async () => {
        // Confirmation dialog
        if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            setIsDeleting(true);
            setError(''); // Clear previous errors
            try {
                // Use the correct API path for deletion
                await apiClient.delete(`/api/v1/properties/${id}/`);
                navigate('/'); // Redirect to homepage on successful deletion
            } catch (err) {
                console.error("Failed to delete property:", err);
                setError('Failed to delete property. You may not have permission or the server encountered an error.');
                setIsDeleting(false);
            }
            // No finally block needed here as we navigate away on success
        }
    };

    // Show spinner while auth state is loading
    if (authLoading) {
      return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    // Use the error state set in useEffect or handleDelete
    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!property) {
        // This case might be covered by error, but good to keep as a fallback
        return <ErrorMessage message="Property data is unavailable." />;
    }

    // Check if the current user is the owner (ensure both user and property are loaded)
    // Compare IDs as strings to avoid type mismatches
    const isOwner = user && property && String(user.id) === String(property.owner);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-4">{property.address}</h1>
            <p className="text-xl text-gray-700 mb-2">{property.city}, {property.state} {property.zip_code}</p>
            <p className="text-2xl font-semibold text-indigo-600 mb-4">${parseFloat(property.price).toLocaleString()}</p>

            {/* Image Carousel/Gallery */}
            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                {property.images && property.images.length > 0 ? (
                    // Simple display for now, can be enhanced with a carousel library
                    property.images.map((img) => (
                        <img key={img.id} src={img.image_url} alt={`Property at ${property.address}`} className="w-full h-auto object-cover mb-2" />
                    ))
                ) : (
                    <img src={`https://placehold.co/800x600/e2e8f0/64748b?text=No+Image+Available`} alt="Placeholder" className="w-full h-auto object-cover" />
                )}
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow">
                <div><span className="font-semibold">Bedrooms:</span> {property.bedrooms}</div>
                <div><span className="font-semibold">Bathrooms:</span> {property.bathrooms}</div>
                <div><span className="font-semibold">Size:</span> {property.size} sqft</div>
                <div><span className="font-semibold">Status:</span> <span className="capitalize">{property.status}</span></div>
                <div><span className="font-semibold">Listed By:</span> {property.owner_username || 'N/A'}</div>
                <div><span className="font-semibold">Listed On:</span> {new Date(property.created_at).toLocaleDateString()}</div>
            </div>

            {/* Description */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{property.description || 'No description available.'}</p>
            </div>

            {/* Owner Actions */}
            {isOwner && (
                <div className="flex space-x-4">
                    <Link
                        to={`/property/edit/${property.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Edit Property
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`font-bold py-2 px-4 rounded-lg transition duration-200 ${
                            isDeleting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        {isDeleting ? (
                            <>
                                <Spinner size="sm" /> Deleting...
                            </>
                        ) : (
                            'Delete Property'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default PropertyDetailsPage;

