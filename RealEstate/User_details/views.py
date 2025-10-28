from rest_framework import generics
from rest_framework.permissions import AllowAny
# Import the new serializers from your serializers.py file
from .serializers import UserRegistrationSerializer, CustomTokenObtainPairSerializer
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView

# Custom Email-based Login View
class CustomTokenObtainPairView(TokenObtainPairView):
    # Tell this view to use your new custom serializer
    serializer_class = CustomTokenObtainPairSerializer

# User Registration View
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

