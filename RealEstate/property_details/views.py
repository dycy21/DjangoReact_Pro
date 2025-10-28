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

# This ViewSet is correct and working
class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    """
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_class = PropertyFilter
    search_fields = ['address', 'city', 'state', 'description']

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Property.objects.filter(
                Q(status='active') | Q(owner=user)
            ).prefetch_related('images').distinct()
        return Property.objects.filter(status='active').prefetch_related('images')


# --- This is the view that needs to be fixed ---
class GenerateCloudinarySignatureView(APIView):
    """
    Generates a signature for Cloudinary uploads.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            timestamp = int(time.time())
            
            # Get secrets from environment
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            api_key = os.environ.get('CLOUDINARY_API_KEY')
            api_secret = os.environ.get('CLOUDINARY_API_SECRET')

            if not all([cloud_name, api_key, api_secret]):
                return Response(
                    {"error": "Cloudinary not configured."},
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )

            # --- THE FIX IS HERE ---
            # The string to sign must *only* contain the parameters
            # that are also being sent to Cloudinary.
            # Your error message confirms Cloudinary is only expecting the timestamp.
            string_to_sign = f"timestamp={timestamp}{api_secret}"
            
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

