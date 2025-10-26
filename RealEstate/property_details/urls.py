from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, GeneratePresignedUrlView # <-- Import the view

# Create a router and register our viewset with it.
router = DefaultRouter()
# Note: 'properties' is the base name for the URL
# This creates /api/v1/properties/ and /api/v1/properties/<id>/
router.register(r'properties', PropertyViewSet, basename='property')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # /api/v1/generate-upload-url/
    # --- THIS URL PATTERN IS THE FIX ---
    path('generate-upload-url/', GeneratePresignedUrlView.as_view(), name='generate-upload-url'),
    
    # /api/v1/... (includes /properties/, /properties/<id>/, etc.)
    path('', include(router.urls)),
]
