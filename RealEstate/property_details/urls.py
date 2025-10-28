from django.urls import path, include
from rest_framework.routers import DefaultRouter
# We are now re-importing the upload view
from .views import PropertyViewSet, GenerateCloudinarySignatureView

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # Re-enabling the upload signature path
    path('generate-upload-signature/', GenerateCloudinarySignatureView.as_view(), name='generate-upload-signature'),
    
    # /api/v1/... (includes /properties/, /properties/<id>/, etc.)
    path('', include(router.urls)),
]

