import cloudinary
import time
import hashlib
import os
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Property
from .serializers import PropertySerializer
from .permissions import IsOwnerOrReadOnly
from .filters import PropertyFilter
from django.db.models import Q # Make sure this import is present

class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    - Public users can list and retrieve (search).
    - Authenticated users can create.
    - Property owners can update and delete.
    """
    # --- FIX ---
    # 1. Provide a SIMPLE, unfiltered base queryset for the class.
    #    The .order_by() is good to have here.
    queryset = Property.objects.all().prefetch_related('images').order_by('-created_at')
    # --- END FIX ---
    
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_class = PropertyFilter
    
    # Allows for simple search like /?search=downtown
    search_fields = ['address', 'city', 'state', 'description']

    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}

    def get_queryset(self):
        # --- FIX ---
        # 2. Start with the base queryset (which might already be
        #    filtered by django-filter if query params are present)
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_authenticated:
            # 3. If the user is logged in, show 'active' properties OR their own properties
            return queryset.filter(
                Q(status='active') | Q(owner=user)
            ).distinct()
        
        # 4. If anonymous, ONLY show 'active' properties
        return queryset.filter(status='active')
        # --- END FIX ---

# --- View for Cloudinary Signature ---

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

