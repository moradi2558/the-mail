from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    
    list_display = ('email', 'is_guest', 'is_active', 'is_staff', 'is_superuser', 'created_at', 'last_login')
    list_filter = ('is_guest', 'is_active', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('email',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('وضعیت', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_guest')}),
        ('تاریخ‌ها', {'fields': ('created_at', 'updated_at', 'last_login')}),
        ('دسترسی‌ها', {'fields': ('groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make email readonly for guest users"""
        readonly = list(self.readonly_fields)
        if obj and obj.is_guest:
            readonly.append('email')
        return readonly
