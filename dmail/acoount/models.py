from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .manager import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model"""
    username = models.CharField(max_length=250, unique=True)
    email = models.EmailField(max_length=250, unique=True, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
    
    def __str__(self):
        return self.username
    
    def has_perm(self, perm, obj=None):
        """Check if user has specific permission"""
        return True
    
    def has_module_perms(self, app_label):
        """Check if user has permissions for app"""
        return True
    
    @property
    def is_staff(self):
        """Check if user is staff (admin)"""
        return self.is_admin
