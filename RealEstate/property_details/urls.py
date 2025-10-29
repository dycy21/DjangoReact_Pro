from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Ensure both views are imported correctly
from .views import PropertyViewSet, GenerateCloudinarySignatureView

# Create a router and register our viewset with it.
router = DefaultRouter()
# Ensure basename is simple if queryset/serializer change often during debug
router.register(r'properties', PropertyViewSet, basename='property')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # --- Ensure this path is correctly defined ---
    # /api/v1/generate-upload-signature/
    path('generate-upload-signature/', GenerateCloudinarySignatureView.as_view(), name='generate-upload-signature'),

    # /api/v1/... (includes /properties/, /properties/<id>/, etc.)
    path('', include(router.urls)),
]

