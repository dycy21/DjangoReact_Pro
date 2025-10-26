import django_filters
from .models import Property
from django.db.models import Q

class PropertyFilter(django_filters.FilterSet):
    # Price range
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    
    # Size range
    min_size = django_filters.NumberFilter(field_name="size", lookup_expr='gte')
    max_size = django_filters.NumberFilter(field_name="size", lookup_expr='lte')
    
    # Min bedrooms
    bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr='gte')
    
    # General location search (address, city, or state)
    location = django_filters.CharFilter(method='filter_by_location')

    class Meta:
        model = Property
        fields = ['city', 'state', 'zip_code', 'status', 'bedrooms']

    def filter_by_location(self, queryset, name, value):
        # Case-insensitive search
        return queryset.filter(
            Q(address__icontains=value) |
            Q(city__icontains=value) |
            Q(state__icontains=value)
        )