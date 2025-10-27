import time
import hashlib
import cloudinary
import os
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Property
from .serializers import PropertySerializer
from .permissions import IsOwnerOrReadOnly
from .filters import PropertyFilter

class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    - Public users can list and retrieve (search).
    - Authenticated users can create.
    - Property owners can update and delete.
    """
    queryset = Property.objects.filter(status='active').prefetch_related('images')
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
        return self.queryset

class GenerateCloudinarySignatureView(APIView):
    """
    Generates a Cloudinary signature for secure direct uploads.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
        api_key = os.environ.get('CLOUDINARY_API_KEY')
        api_secret = os.environ.get('CLOUDINARY_API_SECRET')

        if not all([cloud_name, api_key, api_secret]):
            return Response(
                {"error": "Cloudinary not configured."}, 
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )

        timestamp = int(time.time())
        folder = f"properties/{request.user.id}"
        
        params_to_sign = {
            'timestamp': timestamp,
            'folder': folder
        }
        
        try:
            signature = cloudinary.utils.api_sign_request(
                params_to_sign, 
                api_secret
            )

            return Response({
                'signature': signature,
                'timestamp': timestamp,
                'api_key': api_key,
                'cloud_name': cloud_name,
                'folder': folder
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

