from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with email and password"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        label='رمز عبور'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        label='تکرار رمز عبور'
    )
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "رمزهای عبور مطابقت ندارند"})
        return attrs
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("این ایمیل از قبل وجود دارد")
        return value
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        email = validated_data['email']
        
        # Create username from email (part before @)
        username = email.split('@')[0]
        # Make username unique if needed
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login with email and password"""
    email = serializers.EmailField(required=True, label='ایمیل')
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label='رمز عبور'
    )
    
    def validate(self, attrs):
        """Validate credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Find user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('ایمیل یا رمز عبور اشتباه است')
            
            # Authenticate using username (since USERNAME_FIELD is username)
            user = authenticate(
                request=self.context.get('request'),
                username=user.username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('ایمیل یا رمز عبور اشتباه است')
            
            if not user.is_active:
                raise serializers.ValidationError('حساب کاربری غیرفعال است')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('ایمیل و رمز عبور الزامی است')


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_active', 'is_admin')
        read_only_fields = ('id', 'username', 'is_active', 'is_admin')
