from django.contrib import admin
from django.urls import path, include
from django.urls import path, include
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Routes
    path('api/v1/User_details/', include('User_details.urls')),
    path('api/v1/', include('property_details.urls')),
]