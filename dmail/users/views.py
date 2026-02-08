from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    GuestUserSerializer
)
from .services import UserService


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user operations
    All user-related endpoints are in this single class
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['register', 'login', 'create_guest']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """
        Register a new user
        POST /api/users/register/
        Body: {email, password, password_confirm}
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = UserService.register_user(
                    email=serializer.validated_data['email'],
                    password=serializer.validated_data['password']
                )
                # Generate tokens
                tokens = UserService.login_user(user)
                return Response({
                    'message': 'ثبت‌نام با موفقیت انجام شد',
                    'data': tokens
                }, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """
        Login user
        POST /api/users/login/
        Body: {email, password}
        """
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                user = serializer.validated_data['user']
                tokens = UserService.login_user(user)
                return Response({
                    'message': 'ورود با موفقیت انجام شد',
                    'data': tokens
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='guest')
    def create_guest(self, request):
        """
        Create a guest user
        POST /api/users/guest/
        """
        try:
            tokens = UserService.create_guest_user()
            return Response({
                'message': 'کاربر مهمان با موفقیت ایجاد شد',
                'data': tokens
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='profile')
    def profile(self, request):
        """
        Get user profile
        GET /api/users/profile/
        """
        try:
            profile = UserService.get_user_profile(request.user)
            return Response({
                'data': profile
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put', 'patch'], url_path='update-profile')
    def update_profile(self, request):
        """
        Update user profile
        PUT/PATCH /api/users/update-profile/
        Body: {email}
        """
        serializer = UserUpdateSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            try:
                user = UserService.update_user_profile(
                    user=request.user,
                    email=serializer.validated_data.get('email')
                )
                profile = UserService.get_user_profile(user)
                return Response({
                    'message': 'پروفایل با موفقیت به‌روزرسانی شد',
                    'data': profile
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """
        Change user password
        POST /api/users/change-password/
        Body: {old_password, new_password, new_password_confirm}
        """
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                UserService.change_password(
                    user=request.user,
                    old_password=serializer.validated_data['old_password'],
                    new_password=serializer.validated_data['new_password']
                )
                return Response({
                    'message': 'رمز عبور با موفقیت تغییر کرد'
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='delete-account')
    def delete_account(self, request):
        """
        Delete user account
        DELETE /api/users/delete-account/
        """
        try:
            UserService.delete_user(request.user)
            return Response({
                'message': 'حساب کاربری با موفقیت حذف شد'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
