import os
import time
import hashlib
import cloudinary
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Property, PropertyImage
from .serializers import PropertySerializer
from .permissions import IsOwnerOrReadOnly
from .filters import PropertyFilter

# --- Property ViewSet (Main API Logic) ---
class PropertyViewSet(viewsets.ModelViewSet):
    """
    Handles Listing, Creation, Retrieval, Update, and Deletion of properties.
    Includes performance fixes for image fetching.
    """
    queryset = Property.objects.all().prefetch_related('images').order_by('-created_at')
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_class = PropertyFilter
    search_fields = ['address', 'city', 'state', 'description']
    
    def get_serializer_context(self):
        # Pass request context, needed for setting 'owner' during creation
        return {'request': self.request}

    def get_queryset(self):
        """
        Retrieves properties, applying permissions and performance fixes.
        """
        user = self.request.user
        
        # --- FIX: Prefetch Related Images for Efficiency (Fixes blank images) ---
        base_queryset = Property.objects.all().prefetch_related('images').order_by('-created_at')
        
        if user.is_authenticated:
            # Authenticated users see active properties OR their own properties
            return base_queryset.filter(
                Q(status=Property.PropertyStatus.ACTIVE) | Q(owner=user)
            ).distinct()
        
        # Public users only see active properties
        return base_queryset.filter(status=Property.PropertyStatus.ACTIVE)

# --- Cloudinary Signature View (For Frontend Uploads) ---
class GenerateCloudinarySignatureView(APIView):
    """
    Generates a signed signature for secure direct uploads to Cloudinary.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Retrieve Cloudinary credentials from environment variables (set on Render or local .env)
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')

        if not all([cloud_name, api_key, api_secret]):
            return Response(
                {"error": "Cloudinary credentials not available."},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        try:
            timestamp = int(time.time())
            
            # The string to sign must ONLY contain the parameters that are sent by the frontend (timestamp)
            # This is the string required to generate a valid signature for Cloudinary.
            string_to_sign = f"timestamp={timestamp}{api_secret}"
            
            # Generate the signature
            signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

            return Response({
                'signature': signature,
                'timestamp': timestamp,
                'api_key': api_key,
                'cloud_name': cloud_name,
            })
        except Exception as e:
            print(f"Error generating Cloudinary signature: {e}")
            return Response({"error": "Failed to generate upload signature."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
