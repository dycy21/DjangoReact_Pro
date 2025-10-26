from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # We use email as the primary identifier, not username
    email = models.EmailField(unique=True)

    # You can add more fields here later (e.g., profile_picture)
    
    # Use email for login
    USERNAME_FIELD = 'email'
    # 'username' is still required by AbstractUser, but email is needed for signup
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email