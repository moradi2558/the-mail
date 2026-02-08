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


def profile_image_upload_path(instance, filename):
    """Generate upload path for profile images"""
    return f'profiles/{instance.user.id}/profile_{filename}'


def theme_image_upload_path(instance, filename):
    """Generate upload path for theme images"""
    return f'profiles/{instance.user.id}/theme_{filename}'


class Profile(models.Model):
    """User Profile model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='کاربر')
    name = models.CharField(max_length=100, null=True, blank=True, verbose_name='نام')
    profile_image = models.ImageField(upload_to=profile_image_upload_path, null=True, blank=True, verbose_name='عکس پروفایل')
    theme_image = models.ImageField(upload_to=theme_image_upload_path, null=True, blank=True, verbose_name='عکس تم')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='زمان به‌روزرسانی')
    
    class Meta:
        verbose_name = 'پروفایل'
        verbose_name_plural = 'پروفایل‌ها'
    
    def __str__(self):
        return f"{self.user.username} - Profile"
    
    def get_full_name(self):
        """Get user's full name"""
        if self.name:
            return self.name
        return self.user.username
