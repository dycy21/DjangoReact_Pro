from django.db import models
from django.conf import settings

class Property(models.Model):
    class PropertyStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        PENDING = 'pending', 'Pending'
        SOLD = 'sold', 'Sold'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties'
    )
    
    # Location
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    
    # Details
    price = models.DecimalField(max_digits=12, decimal_places=2)
    bedrooms = models.PositiveIntegerField()
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1) # For 1.5 baths
    size = models.PositiveIntegerField() # e.g., in sqft
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=10,
        choices=PropertyStatus.choices,
        default=PropertyStatus.ACTIVE
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Properties"
        ordering = ['-created_at']
        # Add indexes for common search fields
        indexes = [
            models.Index(fields=['city', 'state']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return self.address

class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField(max_length=1024)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.property.address}"