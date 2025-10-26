from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView

# Custom Email-based Login View
class CustomTokenObtainPairView(TokenObtainPairView):
    # We use the default serializer, but tell it to use 'email'
    username_field = 'email' 

# User Registration View
class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer