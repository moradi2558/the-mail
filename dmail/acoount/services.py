from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .models import Profile

User = get_user_model()


class AccountService:
    """Service class for account operations"""
    
    @staticmethod
    def change_password(user, old_password, new_password):
        """
        Change user password
        
        Args:
            user: User object
            old_password: Current password
            new_password: New password
        
        Returns:
            None
        
        Raises:
            ValidationError: If old password is incorrect
        """
        if not user.check_password(old_password):
            raise ValidationError('رمز عبور فعلی اشتباه است')
        
        user.set_password(new_password)
        user.save()
    
    @staticmethod
    def get_or_create_profile(user):
        """
        Get or create user profile
        
        Args:
            user: User object
        
        Returns:
            Profile object
        """
        profile, created = Profile.objects.get_or_create(user=user)
        return profile
    
    @staticmethod
    def update_profile(user, name=None, profile_image=None, theme_image=None):
        """
        Update user profile
        
        Args:
            user: User object
            name: Name (optional)
            profile_image: Profile image file (optional)
            theme_image: Theme image file (optional)
        
        Returns:
            Profile object
        """
        profile, created = Profile.objects.get_or_create(user=user)
        
        if name is not None:
            profile.name = name
        if profile_image is not None:
            profile.profile_image = profile_image
        if theme_image is not None:
            profile.theme_image = theme_image
        
        profile.save()
        return profile

