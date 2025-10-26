from django.urls import path
from .views import UserRegistrationView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # /api/v1/user_details/register/
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    
    # /api/v1/user_details/login/
    # Uses 'email' and 'password'
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # /api/v1/user_details/login/refresh/
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password reset would be added here.
    # It requires an email service (like SendGrid/Mailgun) and is a
    # two-step process (request-token, confirm-token).
]