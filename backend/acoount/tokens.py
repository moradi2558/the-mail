from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user information in the token
    """
    
    @classmethod
    def get_token(cls, user):
        """
        Generate token with custom claims (user information)
        """
        token = super().get_token(user)
        
        # Add custom claims - user information in token
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['is_admin'] = user.is_admin
        token['is_active'] = user.is_active
        
        return token
    
    def validate(self, attrs):
        """
        Validate credentials and return token with user data
        """
        data = super().validate(attrs)
        
        # Add user information to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_admin': self.user.is_admin,
            'is_active': self.user.is_active
        }
        
        return data


class CustomRefreshToken(RefreshToken):
    """
    Custom Refresh Token that includes user information in access token
    """
    
    @classmethod
    def for_user(cls, user):
        """
        Generate refresh token with user information in access token
        """
        token = super().for_user(user)
        
        # Add custom claims to access token (user information)
        token.access_token['user_id'] = user.id
        token.access_token['username'] = user.username
        token.access_token['email'] = user.email
        token.access_token['is_admin'] = user.is_admin
        token.access_token['is_active'] = user.is_active
        
        return token

