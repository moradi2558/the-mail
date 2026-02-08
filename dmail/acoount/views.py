from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer
)
from .tokens import CustomRefreshToken

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
