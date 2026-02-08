from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    """Manager for custom user model"""
    
    def create_user(self, username, email=None, password=None):
        """Create and save a regular user"""
        if not username:
            raise ValidationError('missing username')
        
        user = self.model(
            username=username,
            email=self.normalize_email(email) if email else None
        )
        
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None):
        """Create and save a superuser"""
        user = self.create_user(username, email, password)
        user.is_admin = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

