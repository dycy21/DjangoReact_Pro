# import cloudinary  # <--- FIX: Temporarily comment out
# import time        # <--- FIX: Temporarily comment out
# import hashlib     # <--- FIX: Temporarily comment out
# import os          # <--- FIX: Temporarily comment out
from rest_framework import viewsets, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
# <--- FIX: Comment out IsAuthenticated, it's not used by our simple view
from rest_framework.permissions import IsAuthenticatedOrReadOnly 
from .models import Property
# from .serializers import PropertySerializer
# from .permissions import IsOwnerOrReadOnly
# from .filters import PropertyFilter
# from django.db.models import Q

# --- FIX: TEMPORARY SERIALIZER ---
class TempPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'address', 'city', 'state', 'zip_code', 'price', 'bedrooms', 'bathrooms', 'size', 'status']
# --- END FIX ---


class PropertyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for properties.
    """
    serializer_class = TempPropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    # --- FINAL FIX ---
    # This is the simplest possible queryset. We are removing all filters.
    # If this still fails, the error is 100% in your models.py file or
    # your database has not been migrated.
    queryset = Property.objects.all()
    # --- END FINAL FIX ---
    
    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}


# --- FIX: View for Cloudinary Signature (TEMPORARILY COMMENTED OUT) ---
# The crash might be happening in this view when the file is imported.
#
# class GenerateCloudinarySignatureView(APIView):
#     """
#     Generates a signature for direct-to-Cloudinary uploads.
#     """
#     permission_classes = [IsAuthenticated]
# 
#     def post(self, request, *args, **kwargs):
#         # Get info from .env
#         cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
#         api_key = os.environ.get('CLOUDINARY_API_KEY')
#         api_secret = os.environ.get('CLOUDINARY_API_SECRET')
#         
#         if not all([cloud_name, api_key, api_secret]):
#             return Response(
#                 {"error": "Cloudinary not configured."}, 
#                 status=status.HTTP_501_NOT_IMPLEMENTED
#             )
# 
#         # Generate a timestamp
#         timestamp = int(time.time())
#         
#         # Get folder from request, default to 'properties'
#         folder = request.data.get('folder', 'properties')
# 
#         # Create a string to sign
#         to_sign = f"folder={folder}&timestamp={timestamp}{api_secret}"
#         
#         # Generate signature
#         signature = hashlib.sha1(to_sign.encode('utf-8')).hexdigest()
# 
#         return Response({
#             'signature': signature,
#             'timestamp': timestamp,
#             'api_key': api_key,
#             'cloud_name': cloud_name,
#             'folder': folder
#         })

