from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm')
        extra_kwargs = {
            'email': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "رمزهای عبور مطابقت ندارند"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('ایمیل یا رمز عبور اشتباه است')
            
            if not user.is_active:
                raise serializers.ValidationError('حساب کاربری غیرفعال است')
            
            if user.is_guest:
                raise serializers.ValidationError('کاربران مهمان نمی‌توانند وارد شوند')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('ایمیل و رمز عبور الزامی است')


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'is_guest', 'is_active', 'created_at', 'updated_at', 'last_login')
        read_only_fields = ('id', 'email', 'is_guest', 'created_at', 'updated_at', 'last_login')


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = ('email',)
        extra_kwargs = {
            'email': {'required': False}
        }


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "رمزهای عبور جدید مطابقت ندارند"})
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('رمز عبور فعلی اشتباه است')
        return value


class GuestUserSerializer(serializers.ModelSerializer):
    """Serializer for guest user"""
    access_token = serializers.SerializerMethodField()
    refresh_token = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'is_guest', 'access_token', 'refresh_token', 'created_at')
        read_only_fields = ('id', 'email', 'is_guest', 'access_token', 'refresh_token', 'created_at')
    
    def get_access_token(self, obj):
        refresh = RefreshToken.for_user(obj)
        return str(refresh.access_token)
    
    def get_refresh_token(self, obj):
        refresh = RefreshToken.for_user(obj)
        return str(refresh)

