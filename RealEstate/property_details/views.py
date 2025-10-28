from rest_framework import viewsets, permissions
from .models import Property
from rest_framework import serializers

# We are commenting out all other imports for now to find the crash.
# from django.db.models import Q
# from .permissions import IsOwnerOrReadOnly
# from .filters import PropertyFilter
# import cloudinary
# import hashlib
# import time
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status


# --- TEMPORARY DEBUGGING SERIALIZER ---
# We are defining a simple serializer here to bypass any
# potential crashes in your real 'serializers.py' file.
class TempPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        # Using a very simple, safe list of fields
        fields = ('id', 'address', 'city', 'price', 'bedrooms', 'bathrooms', 'status')


class PropertyViewSet(viewsets.ModelViewSet):
    """
    A simplified viewset for debugging.
    This viewset only supports listing properties.
    """
    # Use the simple serializer
    serializer_class = TempPropertySerializer
    
    # Use a simple, built-in permission
    permission_classes = [permissions.AllowAny]
    
    # Use the simplest possible queryset.
    # If this fails, the 'Property' model itself or the
    # database connection is the problem.
    queryset = Property.objects.all()


# --- TEMPORARILY COMMENTED OUT ---
# We are leaving this commented out until the 500 error on the
# homepage is fixed.

# class GenerateCloudinarySignatureView(APIView):
#     """
#     Generates a signature for Cloudinary uploads.
#     """
#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, *args, **kwargs):
#         # Get params from request
#         timestamp = int(time.time())
#         public_id = request.data.get('public_id')
#         eager = request.data.get('eager')
        
#         try:
#             # Get secrets from environment
#             cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
#             api_key = os.environ.get('CLOUDINARY_API_KEY')
#             api_secret = os.environ.get('CLOUDINARY_API_SECRET')

#             if not all([cloud_name, api_key, api_secret]):
#                 return Response(
#                     {"error": "Cloudinary not configured."},
#                     status=status.HTTP_501_NOT_IMPLEMENTED
#                 )

#             # Create the string to sign
#             string_to_sign = f"eager={eager}&public_id={public_id}&timestamp={timestamp}{api_secret}"
            
#             # Create signature
#             signature = hashlib.sha1(string_to_sign.encode('utf-8')).hexdigest()

#             return Response({
#                 'signature': signature,
#                 'timestamp': timestamp,
#                 'api_key': api_key,
#                 'cloud_name': cloud_name,
#             })
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

