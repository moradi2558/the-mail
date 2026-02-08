from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ProfileSerializer,
    ChangePasswordSerializer
)
from .tokens import CustomRefreshToken
from .models import Profile
from .services import AccountService

User = get_user_model()


class RegisterView(APIView):
    """
    API View for user registration
    POST /api/account/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Register a new user with email and password
        Body: {email, password, password_confirm}
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens with user information
            refresh = CustomRefreshToken.for_user(user)
            
            return Response({
                'message': 'ثبت‌نام با موفقیت انجام شد',
                'data': {
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username
                    },
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    API View for user login
    POST /api/account/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Login user with email and password
        Body: {email, password}
        """
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens with user information
            refresh = CustomRefreshToken.for_user(user)
            
            return Response({
                'message': 'ورود با موفقیت انجام شد',
                'data': {
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username
                    },
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """
    API View for user profile
    GET /api/account/profile/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get authenticated user profile from token
        Requires: Bearer Token
        """
        # Get user from token (JWT authentication automatically sets request.user)
        user = request.user
        
        # Also get token payload to show what's in the token
        token_data = {}
        try:
            # Get raw token from header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                # Decode token to get payload
                token = UntypedToken(raw_token)
                token_data = {
                    'user_id': token.get('user_id'),
                    'username': token.get('username'),
                    'email': token.get('email'),
                    'is_admin': token.get('is_admin'),
                    'is_active': token.get('is_active'),
                }
        except (InvalidToken, TokenError, IndexError):
            pass
        
        serializer = UserProfileSerializer(user)
        return Response({
            'message': 'اطلاعات کاربر از توکن دریافت شد',
            'data': {
                'user': serializer.data,
                'token_payload': token_data
            }
        }, status=status.HTTP_200_OK)


class ProfileDetailView(APIView):
    """
    API View for user profile details
    GET /api/account/profile/detail/
    PUT/PATCH /api/account/profile/detail/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        """
        Get user profile details
        Requires: Bearer Token
        """
        profile = AccountService.get_or_create_profile(request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        
        return Response({
            'message': 'پروفایل با موفقیت دریافت شد',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        """
        Update user profile
        Body: {name, profile_image, theme_image}
        """
        profile = AccountService.update_profile(
            user=request.user,
            name=request.data.get('name'),
            profile_image=request.FILES.get('profile_image'),
            theme_image=request.FILES.get('theme_image')
        )
        
        serializer = ProfileSerializer(profile, context={'request': request})
        
        return Response({
            'message': 'پروفایل با موفقیت به‌روزرسانی شد',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Partial update user profile"""
        return self.put(request)


class ChangePasswordView(APIView):
    """
    API View for changing password
    POST /api/account/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Change user password
        Body: {old_password, new_password, new_password_confirm}
        """
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                AccountService.change_password(
                    user=request.user,
                    old_password=serializer.validated_data['old_password'],
                    new_password=serializer.validated_data['new_password']
                )
                
                return Response({
                    'message': 'رمز عبور با موفقیت تغییر کرد'
                }, status=status.HTTP_200_OK)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
