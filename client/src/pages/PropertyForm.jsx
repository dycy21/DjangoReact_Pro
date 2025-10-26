import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

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
    status: 'active',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      setError('');
      // Fetches existing data for a property being edited
      apiClient.get(`/api/v1/properties/${id}/`)
        .then(res => {
          const { images, ...data } = res.data;
          setFormData(data);
          setExistingImages(images || []);
        })
        .catch(err => setError('Failed to fetch property details.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  // --- UPDATED UPLOAD LOGIC FOR CLOUDINARY ---
  const uploadImages = async () => {
    setUploading(true);
    const uploadedImageUrls = [];

    try {
      // 1. Get signature from our Django backend
      // Note the updated URL
      const sigRes = await apiClient.post('/api/v1/generate-upload-signature/', {});
      const { signature, timestamp, api_key, cloud_name } = sigRes.data;

      // 2. Define the Cloudinary upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

      for (const file of imageFiles) {
        // 3. Create FormData for each file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        // Optional: add a folder (must match params_to_sign in Django if you use it)
        // formData.append('folder', 'real_estate_properties');

        // 4. POST directly to Cloudinary
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Cloudinary upload failed.');
        }

        const uploadData = await uploadRes.json();
        
        // 5. Collect the secure URL
        uploadedImageUrls.push(uploadData.secure_url);
      }
      
      setUploading(false);
      return uploadedImageUrls;

    } catch (err) {
      console.error('Error uploading image:', err);
      setError('One or more image uploads failed.');
      setUploading(false);
      return null; // Indicate failure
    }
  };
  // --- END OF UPDATED LOGIC ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let newImageUrls = [];
    if (imageFiles.length > 0) {
      // Upload images if new ones are selected
      const urls = await uploadImages();
      if (urls === null) { // Upload failed
        setLoading(false);
        return; 
      }
      newImageUrls = urls;
    }

    const finalData = { ...formData };
    
    // Logic to handle image URLs for create vs. edit
    if (isEditing) {
      // If new images were uploaded, send them. 
      // Otherwise, send back the list of existing images.
      if (newImageUrls.length > 0) {
         finalData.image_urls = newImageUrls;
      } else {
         finalData.image_urls = existingImages.map(img => img.image_url);
      }
    } else {
      // For new properties, just send the new URLs
      finalData.image_urls = newImageUrls;
    }

    try {
      // Submit the property data to our Django backend
      if (isEditing) {
        await apiClient.put(`/api/v1/properties/${id}/`, finalData);
      } else {
        await apiClient.post('/api/v1/properties/', finalData);
      }
      navigate('/'); // Go back to homepage on success
    } catch (err) {
      setError('Failed to save property. Please check all fields.');
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.address) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {isEditing ? 'Edit Property' : 'Create New Property'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorMessage message={error} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            placeholder="Zip Code"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            placeholder="Bedrooms"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            name="bathrooms"
            step="0.5"
            value={formData.bathrooms}
            onChange={handleChange}
            placeholder="Bathrooms"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <input
            type="number"
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="Size (sqft)"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Property Description"
          rows="4"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isEditing ? 'Upload New Images (replaces old)' : 'Upload Images'}
          </label>
          <input
            type="file"
            name="images"
            onChange={handleImageChange}
            multiple
            className="w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {uploading && <Spinner />}
          {isEditing && existingImages.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Current Images:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {existingImages.map(img => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt="Property"
                    className="w-24 h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {loading || uploading
            ? (uploading ? 'Uploading...' : 'Saving...')
            : (isEditing ? 'Update Property' : 'Create Property')}
        </button>
      </form>
    </div>
  );
}

export default PropertyForm;


