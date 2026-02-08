from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Manager for custom user model"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with email and password"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)
    
    def create_guest_user(self):
        """Create a guest user with temporary email"""
        guest_email = f"guest_{uuid.uuid4().hex[:12]}@guest.local"
        user = self.model(
            email=guest_email,
            is_guest=True,
            is_active=True
        )
        user.set_unusable_password()
        user.save(using=self._db)
        return user


class User(AbstractUser):
    """Custom User model with email as username"""
    
    username = None  # Remove username field
    email = models.EmailField(unique=True, verbose_name='ایمیل')
    is_guest = models.BooleanField(default=False, verbose_name='کاربر مهمان')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='آخرین ورود')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        ordering = ['-created_at']
    
    def __str__(self):
        if self.is_guest:
            return f"Guest ({self.email})"
        return self.email
    
    def get_full_name(self):
        """Return the email as full name"""
        return self.email
    
    def get_short_name(self):
        """Return the email as short name"""
        return self.email.split('@')[0] if '@' in self.email else self.email
