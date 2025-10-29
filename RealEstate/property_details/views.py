import os
import time
import hashlib
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.conf import settings
from django.db.models import Q # Keep this import
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Property, PropertyImage # Keep this import
# from .serializers import PropertySerializer, PropertyImageSerializer # Using TempPropertySerializer for now
from .permissions import IsOwnerOrReadOnly # Keep this import
# from .filters import PropertyFilter # Keep commented out for now

# --- Simplified Serializer (Temporary for Debugging) ---
from rest_framework import serializers # Import serializers here
class TempPropertySerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    # Exclude images for now to simplify
    class Meta:
        model = Property
        fields = (
            'id', 'owner', 'owner_username', 'address', 'city', 'state',
            'zip_code', 'price', 'bedrooms', 'bathrooms', 'size',
            'description', 'status', 'created_at', 'updated_at'
            # 'images', 'image_urls' # Temporarily exclude complex fields
        )
        read_only_fields = ('owner',)

# --- Main Property ViewSet ---
class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties. Simplified for debugging.
    """
    # queryset = Property.objects.filter(status='active').prefetch_related('images') # More complex
    queryset = Property.objects.all() # Simplest possible query
    serializer_class = TempPropertySerializer # Use the temporary serializer
    permission_classes = [IsAuthenticatedOrReadOnly] # Use built-in permission for now
    # filterset_class = PropertyFilter # Temporarily disabled
    # search_fields = ['address', 'city', 'state', 'description'] # Temporarily disabled

    def perform_create(self, serializer):
         # Automatically set the owner to the current user on creation
        serializer.save(owner=self.request.user)

    # get_queryset method removed for simplification for now
    # get_serializer_context method removed for simplification


# --- Cloudinary Signature View ---
class GenerateCloudinarySignatureView(APIView):
    """
    Generates a Cloudinary upload signature.
    """
    permission_classes = [IsAuthenticated] # Must be logged in

    def post(self, request, *args, **kwargs):
        # Retrieve Cloudinary credentials from environment variables (set on Render)
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')

        # Check if credentials are set
        if not all([cloud_name, api_key, api_secret]):
            return Response(
                {"error": "Cloudinary not configured on the server."},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        # Configure Cloudinary (should ideally be done once at startup, but fine here for now)
        try:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True # Use https
            )
        except Exception as e:
             return Response({"error": f"Failed to configure Cloudinary: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        # --- Generate Signature ---
        try:
            # Create a timestamp for the signature
            timestamp = int(time.time())

            # --- Corrected String to Sign ---
            # Cloudinary's direct upload signature only needs the timestamp and API secret
            string_to_sign = f"timestamp={timestamp}{api_secret}"

            # Create the SHA1 signature and hex digest
            signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

            # Return the necessary parameters for the frontend upload
            return Response({
                'signature': signature,
                'timestamp': timestamp,
                'api_key': api_key, # Send api_key too
                'cloud_name': cloud_name # Send cloud_name too
            })

        except Exception as e:
            # Log the exception for debugging on the server
            print(f"Error generating Cloudinary signature: {e}")
            return Response({"error": f"Error generating upload signature: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

