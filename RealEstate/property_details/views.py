import cloudinary
import time
import hashlib
import os
from rest_framework import viewsets, status, serializers # <--- Import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Property
# from .serializers import PropertySerializer # <--- Temporarily bypass this file
from .permissions import IsOwnerOrReadOnly
from .filters import PropertyFilter
from django.db.models import Q

# --- FIX: TEMPORARY SERIALIZER ---
# We are creating a very simple serializer here to bypass the
# PropertySerializer in serializers.py, which is likely causing the crash.
# This serializer does NOT include the nested 'images' field.
class TempPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        # Only include simple, non-relational fields
        fields = ['id', 'address', 'city', 'state', 'zip_code', 'price', 'bedrooms', 'bathrooms', 'size', 'status']
# --- END FIX ---


class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    """
    
    # --- FIX ---
    # Use the temporary, simple serializer we just defined.
    serializer_class = TempPropertySerializer
    # --- END FIX ---
    
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # This simplified queryset will run.
    # If this works, the error is likely in your PropertySerializer's
    # 'images' field or 'PropertyImageSerializer'.
    queryset = Property.objects.filter(status='active').order_by('-created_at')
    
    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}


# --- View for Cloudinary Signature ---
# (This part is unchanged)
class GenerateCloudinarySignatureView(APIView):
    """
    Generates a signature for direct-to-Cloudinary uploads.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Get info from .env
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')
        
        if not all([cloud_name, api_key, api_secret]):
            return Response(
                {"error": "Cloudinary not configured."}, 
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        # Generate a timestamp
        timestamp = int(time.time())
        
        # Get folder from request, default to 'properties'
        folder = request.data.get('folder', 'properties')

        # Create a string to sign
        # Note: 'folder' must be included if you use it in the frontend upload
        to_sign = f"folder={folder}&timestamp={timestamp}{api_secret}"
        
        # Generate signature
        signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()

        return Response({
            'signature': signature,
            'timestamp': timestamp,
            'api_key': api_key,
            'cloud_name': cloud_name,
            'folder': folder
        })


