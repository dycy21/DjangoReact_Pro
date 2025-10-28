import os
import time
import hashlib
import cloudinary
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Property
from .serializers import PropertySerializer
from .permissions import IsOwnerOrReadOnly
from .filters import PropertyFilter

# --- We are now restoring the full, working viewset ---
class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    - Public users can list and retrieve (search).
    - Authenticated users can create.
    - Property owners can update and delete.
    """
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_class = PropertyFilter
    search_fields = ['address', 'city', 'state', 'description']

    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}

    def get_queryset(self):
        # Allow authenticated users to see their non-active properties
        user = self.request.user
        if user.is_authenticated:
            return Property.objects.filter(
                Q(status='active') | Q(owner=user)
            ).prefetch_related('images').distinct()
        
        # Public users only see active properties
        return Property.objects.filter(status='active').prefetch_related('images')


# --- We are now re-enabling the file upload view ---
class GenerateCloudinarySignatureView(APIView):
    """
    Generates a signature for Cloudinary uploads.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Get params from request
        timestamp = int(time.time())
        public_id = request.data.get('public_id')
        eager = request.data.get('eager')
        
        try:
            # Get secrets from environment
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            api_key = os.environ.get('CLOUDINARY_API_KEY')
            api_secret = os.environ.get('CLOUDINARY_API_SECRET')

            if not all([cloud_name, api_key, api_secret]):
                return Response(
                    {"error": "Cloudinary not configured."},
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )

            # Create the string to sign
            string_to_sign = f"eager={eager}&public_id={public_id}&timestamp={timestamp}{api_secret}"
            
            # Create signature
            signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

            return Response({
                'signature': signature,
                'timestamp': timestamp,
                'api_key': api_key,
                'cloud_name': cloud_name,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

