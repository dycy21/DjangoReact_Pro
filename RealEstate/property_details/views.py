import boto3
import uuid
import os # Make sure to import os
from django.conf import settings
from django.db.models import Q # Import Q
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
    # Use prefetch_related for 'images' to optimize DB queries
    queryset = Property.objects.filter(status='active').prefetch_related('images')
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]
    filterset_class = PropertyFilter
    
    # Allows for simple search like /?search=downtown
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
        # Use the base queryset defined above
        return self.queryset.filter(status='active')

# --- View for S3 Presigned URL ---

class GeneratePresignedUrlView(APIView):
    """
    Generates a presigned S3 URL for file uploads.
    """
    permission_classes = [IsAuthenticated]

    # --- THIS POST METHOD IS THE FIX ---
    def post(self, request, *args, **kwargs):
        # Get info from .env
        bucket_name = os.environ.get('AWS_STORAGE_BUCKET_NAME')
        region = os.environ.get('AWS_S3_REGION_NAME')
        
        if not bucket_name or not region:
            return Response(
                {"error": "AWS S3 not configured."}, 
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        try:
            s3_client = boto3.client(
                's3',
                region_name=region,
                config=boto3.config.Config(signature_version='s3v4'),
                # Ensure you configure credentials if not using IAM roles
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
            )
            
            file_name = request.data.get('file_name', 'unknown-file')
            file_type = request.data.get('file_type', 'application/octet-stream')

            # Create a unique object key
            object_key = f"properties/{request.user.id}/{uuid.uuid4()}-{file_name}"
            
            # Generate the presigned URL
            url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': object_key,
                    'ContentType': file_type
                },
                ExpiresIn=3600  # 1 hour
            )

            # The final URL the file will have after upload
            final_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{object_key}"

            return Response({
                'presigned_url': url,
                'final_url': final_url
            })
            
        except Exception as e:
            # Log the exception for debugging
            print(f"Error generating presigned URL: {e}") 
            return Response({"error": "Could not generate upload URL."}, status=status.HTTP_400_BAD_REQUEST)
