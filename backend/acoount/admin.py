from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .forms import UserChangeForm, UserCreationForm
from .models import User, Profile


class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    form = UserChangeForm
    add_form = UserCreationForm
    
    list_display = ('email', 'username', 'is_admin')
    list_filter = ['is_admin']
    
    fieldsets = (
        ('main', {
            "fields": (
                'username', 'email', 'password'
            ),
        }),
        ('premission', {
            "fields": (
                'is_admin', 'is_active', 'last_login'
            )
        })
    )
    
    add_fieldsets = (
        ('main', {
            "fields": (
                'username', 'email', 'password1', 'password2'
            ),
        }),
    )
    
    search_fields = ('email', 'username')
    ordering = ['username']
    filter_horizontal = ()


# Register models
admin.site.register(User, UserAdmin)
admin.site.unregister(Group)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'name')
    readonly_fields = ('created_at', 'updated_at')
