from django.urls import path, include
from rest_framework.routers import DefaultRouter
# --- FIX ---
# We are commenting out GenerateCloudinarySignatureView because it is
# currently commented out in your views.py file and causing a crash.
from .views import PropertyViewSet #, GenerateCloudinarySignatureView

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(r'properties', PropertyViewSet, basename='property')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # --- FIX ---
    # Commenting out the path for the view we just removed.
    # path('generate-upload-signature/', GenerateCloudinarySignatureView.as_view(), name='generate-upload-signature'),
    
    # /api/v1/... (includes /properties/, /properties/<id>/, etc.)
    path('', include(router.urls)),
]

