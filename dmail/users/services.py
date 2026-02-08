from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from .models import User


class UserService:
    """Service class for user operations"""
    
    @staticmethod
    def register_user(email, password):
        """Register a new user"""
        if User.objects.filter(email=email).exists():
            raise ValueError('کاربری با این ایمیل قبلاً ثبت‌نام کرده است')
        
        user = User.objects.create_user(email=email, password=password)
        return user
    
    @staticmethod
    def login_user(user):
        """Login user and return tokens"""
        if user.is_guest:
            raise ValueError('کاربران مهمان نمی‌توانند وارد شوند')
        
        refresh = RefreshToken.for_user(user)
        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'is_guest': user.is_guest
            }
        }
    
    @staticmethod
    def create_guest_user():
        """Create a guest user"""
        user = User.objects.create_guest_user()
        refresh = RefreshToken.for_user(user)
        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'is_guest': user.is_guest
            }
        }
    
    @staticmethod
    def get_user_profile(user):
        """Get user profile"""
        return {
            'id': user.id,
            'email': user.email,
            'is_guest': user.is_guest,
            'is_active': user.is_active,
            'created_at': user.created_at,
            'updated_at': user.updated_at,
            'last_login': user.last_login
        }
    
    @staticmethod
    def update_user_profile(user, email=None):
        """Update user profile"""
        if email and email != user.email:
            if User.objects.filter(email=email).exists():
                raise ValueError('کاربری با این ایمیل قبلاً وجود دارد')
            user.email = email
        
        user.save()
        return user
    
    @staticmethod
    def change_password(user, old_password, new_password):
        """Change user password"""
        if not user.check_password(old_password):
            raise ValueError('رمز عبور فعلی اشتباه است')
        
        user.set_password(new_password)
        user.save()
        return user
    
    @staticmethod
    def delete_user(user):
        """Delete user account"""
        user.delete()
        return True

