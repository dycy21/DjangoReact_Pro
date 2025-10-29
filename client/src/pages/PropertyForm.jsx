import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Use absolute paths from src directory
import apiClient from '/src/api/apiClient.js';
import Spinner from '/src/components/Spinner.jsx';
import ErrorMessage from '/src/components/ErrorMessage.jsx';
// No need to import useAuth here unless specifically needed for validation

function PropertyForm() {
    // Check if there's an ID in the URL (for editing)
    const { id: propertyId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        address: '',
        city: '',
        state: '',
        zip_code: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        size: '',
        description: '',
        status: 'active', // Default status
        // image_urls handled separately
    });
    const [images, setImages] = useState([]); // Store File objects
    const [existingImageUrls, setExistingImageUrls] = useState([]); // Store URLs for editing
    const [loading, setLoading] = useState(false); // For fetching data during edit
    const [submitLoading, setSubmitLoading] = useState(false); // For form submission
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // --- Fetch existing property data if editing ---
    useEffect(() => {
        if (propertyId) {
            setIsEditing(true);
            setLoading(true);
            setError('');
            const fetchPropertyData = async () => {
                try {
                     // Use correct API path
                    const response = await apiClient.get(`/api/v1/properties/${propertyId}/`);
                    const data = response.data;
                    setFormData({
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || '',
                        zip_code: data.zip_code || '',
                        price: data.price ? parseFloat(data.price).toString() : '', // API might return decimal string
                        bedrooms: data.bedrooms || '',
                        bathrooms: data.bathrooms ? parseFloat(data.bathrooms).toString() : '', // API might return decimal string
                        size: data.size || '',
                        description: data.description || '',
                        status: data.status || 'active',
                    });
                    // Store existing image URLs to display
                    setExistingImageUrls(data.images ? data.images.map(img => img.image_url) : []);
                } catch (err) {
                    console.error("Failed to fetch property for editing:", err);
                    setError("Failed to load property data for editing.");
                    // Optionally navigate back or show a persistent error
                } finally {
                    setLoading(false);
                }
            };
            fetchPropertyData();
        }
    }, [propertyId]); // Only run when propertyId changes
    // --- End Fetch ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        // Allow multiple files, convert FileList to Array
        setImages(Array.from(e.target.files));
        // Clear existing image URLs if new images are selected during edit
        if (isEditing) {
            setExistingImageUrls([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');
        let uploadedImageUrls = [];

        try {
            // --- Upload Images (only if new images are selected) ---
            if (images.length > 0) {
                uploadedImageUrls = await Promise.all(
                    images.map(async (imageFile) => {
                        try {
                            // 1. Get signature from backend
                             // Use correct API path
                            const sigResponse = await apiClient.post('/api/v1/generate-upload-signature/', {
                                // Optional: pass params if needed by backend, e.g., folder
                            });
                            const { signature, timestamp, api_key, cloud_name } = sigResponse.data;

                            // 2. Prepare form data for Cloudinary
                            const imageFormData = new FormData();
                            imageFormData.append('file', imageFile);
                            imageFormData.append('api_key', api_key);
                            imageFormData.append('timestamp', timestamp);
                            imageFormData.append('signature', signature);
                            // Add folder if needed: imageFormData.append('folder', 'properties');

                            // 3. Upload directly to Cloudinary
                            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
                            const uploadResponse = await fetch(cloudinaryUrl, {
                                method: 'POST',
                                body: imageFormData,
                            });

                            if (!uploadResponse.ok) {
                                const errorData = await uploadResponse.json();
                                console.error('Cloudinary upload error data:', errorData);
                                throw new Error(`Cloudinary upload failed: ${errorData.error?.message || uploadResponse.statusText}`);
                            }

                            const uploadResult = await uploadResponse.json();
                            return uploadResult.secure_url; // Return the secure URL

                        } catch (uploadError) {
                            console.error(`Error uploading file ${imageFile.name}:`, uploadError);
                            throw new Error(`Failed to upload ${imageFile.name}. ${uploadError.message}`); // Re-throw to stop Promise.all
                        }
                    })
                );
            }
             // --- End Upload ---

            // Combine form data with image URLs
            const finalData = {
                ...formData,
                // Only include image_urls if new images were uploaded
                ...(uploadedImageUrls.length > 0 && { image_urls: uploadedImageUrls }),
                // Ensure numeric fields are numbers if backend expects them
                price: parseFloat(formData.price) || 0,
                bedrooms: parseInt(formData.bedrooms) || 0,
                bathrooms: parseFloat(formData.bathrooms) || 0,
                size: parseInt(formData.size) || 0,
            };

            // --- Submit to Backend (Create or Update) ---
            let response;
            if (isEditing) {
                // PUT request for updating
                 // Use correct API path
                response = await apiClient.put(`/api/v1/properties/${propertyId}/`, finalData);
                console.log('Property updated:', response.data);
            } else {
                // POST request for creating
                 // Use correct API path
                response = await apiClient.post('/api/v1/properties/', finalData);
                console.log('Property created:', response.data);
            }
            // --- End Submit ---

            // Navigate to the details page of the created/updated property
            navigate(`/property/${response.data.id}`);

        } catch (err) {
            console.error(isEditing ? "Failed to update property:" : "Failed to create property:", err.response ? err.response.data : err.message);
            // Try to extract more specific error messages from DRF
             let detailError = 'An unexpected error occurred.';
             if (err.response && err.response.data) {
                 if (typeof err.response.data === 'string') {
                     detailError = err.response.data;
                 } else if (err.response.data.detail) {
                     detailError = err.response.data.detail;
                 } else {
                     // Handle field errors (show first one found)
                     const firstKey = Object.keys(err.response.data)[0];
                     if (firstKey && Array.isArray(err.response.data[firstKey])) {
                         detailError = `${firstKey}: ${err.response.data[firstKey][0]}`;
                     }
                 }
             } else if (err.message) {
                 detailError = err.message; // Network or upload errors
             }
             setError(`Failed to ${isEditing ? 'update' : 'create'} property. ${detailError}`);
        } finally {
            setSubmitLoading(false);
        }
    };


    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg"/></div>; // Show spinner while fetching data for edit

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl font-inter">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                {isEditing ? 'Edit Property' : 'Add New Property'}
            </h1>

            {error && <ErrorMessage message={error} className="mb-4"/>}

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8">
                {/* Address Fields */}
                <div className="mb-4">
                    <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">City</label>
                        <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-gray-700 text-sm font-bold mb-2">State</label>
                        <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label htmlFor="zip_code" className="block text-gray-700 text-sm font-bold mb-2">Zip Code</label>
                        <input type="text" id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                </div>

                {/* Property Details */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                         <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price ($)</label>
                         <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                     </div>
                     <div>
                         <label htmlFor="bedrooms" className="block text-gray-700 text-sm font-bold mb-2">Bedrooms</label>
                         <input type="number" id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange} required min="0" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                     </div>
                     <div>
                         <label htmlFor="bathrooms" className="block text-gray-700 text-sm font-bold mb-2">Bathrooms</label>
                         <input type="number" id="bathrooms" name="bathrooms" value={formData.bathrooms} onChange={handleChange} required min="0" step="0.5" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                     </div>
                    <div>
                        <label htmlFor="size" className="block text-gray-700 text-sm font-bold mb-2">Size (sqft)</label>
                        <input type="number" id="size" name="size" value={formData.size} onChange={handleChange} required min="0" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"></textarea>
                </div>

                 {/* Status (Optional, could be hidden or admin-only) */}
                 <div className="mb-6">
                    <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                    <label htmlFor="images" className="block text-gray-700 text-sm font-bold mb-2">
                        {isEditing ? 'Replace Images (Optional)' : 'Upload Images'}
                    </label>
                     {/* Display existing images if editing */}
                     {isEditing && existingImageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {existingImageUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Existing property ${index + 1}`} className="w-20 h-20 object-cover rounded shadow" />
                            ))}
                        </div>
                    )}
                    <input
                        type="file"
                        id="images"
                        name="images"
                        multiple // Allow multiple files
                        onChange={handleImageChange}
                        accept="image/*" // Accept only image files
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {isEditing ? 'Selecting new images will replace all existing ones.' : 'You can select multiple images.'}
                     </p>
                </div>


                {/* Submit Button */}
                <div className="flex items-center justify-center mt-6">
                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center shadow-md transition duration-300"
                    >
                        {submitLoading && <Spinner size="sm" color="white" className="mr-2"/>}
                        {submitLoading ? 'Saving...' : (isEditing ? 'Update Property' : 'Add Property')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PropertyForm;

