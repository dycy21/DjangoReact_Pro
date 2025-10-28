import cloudinary
import time
import hashlib
import os
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly # <-- Import IsAuthenticatedOrReadOnly
from .models import Property
from .serializers import PropertySerializer
from .permissions import IsOwnerOrReadOnly # <-- This will be unused
from .filters import PropertyFilter # <-- This will be unused
from django.db.models import Q # Make sure this import is present

class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    - Public users can list and retrieve (search).
    - Authenticated users can create.
    - Property owners can update and delete.
    """
    
    serializer_class = PropertySerializer
    
    # --- FIX ---
    # The view is still crashing with a 500 error.
    # Let's simplify it as much as possible to find the error.
    # I am temporarily removing permissions, filters, and search fields.
    
    permission_classes = [IsAuthenticatedOrReadOnly] # Use the simple, built-in permission
    # filterset_class = PropertyFilter  # <-- Temporarily removed
    # search_fields = ['address', 'city', 'state', 'description'] # <-- Temporarily removed

    # This simplified queryset will run.
    # If this works, the error is likely in your PropertyFilter class.
    queryset = Property.objects.filter(status='active').prefetch_related('images').order_by('-created_at')
    # --- END FIX ---
    

    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}

    # --- TEMPORARILY REMOVED FOR DEBUGGING ---
    # The logic below was causing the 500 error. We are replacing it
    # with the simpler `queryset` attribute above.
    #
    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     user = self.request.user
        
    #     if user.is_authenticated:
    #         return queryset.filter(
    #             Q(status='active') | Q(owner=user)
    #         ).distinct()
        
    #     return queryset.filter(status='active')
    # --- END REMOVED ---


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

