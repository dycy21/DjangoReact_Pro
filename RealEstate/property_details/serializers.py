from rest_framework import serializers
from .models import Property, PropertyImage

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ('id', 'image_url')

class PropertySerializer(serializers.ModelSerializer):
    # Read-only field to show the owner's username
    owner_username = serializers.ReadOnlyField(source='owner.username')
    
    # Read-only field to show associated image URLs
    images = PropertyImageSerializer(many=True, read_only=True)
    
    # Write-only field for *receiving* a list of new image URLs
    # The frontend will get presigned URLs, upload, and send back the final URLs.
    image_urls = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = Property
        fields = (
            'id', 'owner', 'owner_username', 'address', 'city', 'state', 
            'zip_code', 'price', 'bedrooms', 'bathrooms', 'size', 
            'description', 'status', 'created_at', 'updated_at',
            'images', 'image_urls'
        )
        read_only_fields = ('owner',) # Set owner automatically

    def create(self, validated_data):
        # Get image URLs from data, or an empty list
        image_urls = validated_data.pop('image_urls', [])
        
        # Set the owner from the authenticated user
        validated_data['owner'] = self.context['request'].user
        
        # Create the property instance
        property_instance = Property.objects.create(**validated_data)
        
        # Create PropertyImage objects for each URL
        for url in image_urls:
            PropertyImage.objects.create(property=property_instance, image_url=url)
            
        return property_instance

    def update(self, instance, validated_data):
        # Handle image updates
        image_urls = validated_data.pop('image_urls', None)
        
        # Update all other fields
        instance = super().update(instance, validated_data)

        # If image_urls were provided, replace existing images
        if image_urls is not None:
            # Delete old images
            instance.images.all().delete()
            # Create new ones
            for url in image_urls:
                PropertyImage.objects.create(property=instance, image_url=url)

        return instance