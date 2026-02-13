from rest_framework import serializers
from .models import Song, Playlist, PlaylistInvitation
import os


class SongSerializer(serializers.ModelSerializer):
    """Serializer for Song model"""
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = (
            'id',
            'title',
            'artist',
            'album',
            'file',
            'file_url',
            'file_name',
            'uploaded_by',
            'uploaded_by_username',
            'uploaded_by_email',
            'is_public',
            'duration',
            'file_size',
            'file_size_mb',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'uploaded_by', 'created_at', 'updated_at', 'file_size', 'duration')
    
    def get_file_url(self, obj):
        """Get file URL"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_size_mb(self, obj):
        """Get file size in MB"""
        return obj.get_file_size_mb()
    
    def get_file_name(self, obj):
        """Get file name"""
        if obj.file:
            return os.path.basename(obj.file.name)
        return None


class SongCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a song"""
    file = serializers.FileField(required=True)
    
    class Meta:
        model = Song
        fields = ('file', 'title', 'artist', 'album', 'is_public')
    
    def validate_file(self, value):
        """Validate file extension and size"""
        file_ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']
        if file_ext not in allowed_extensions:
            raise serializers.ValidationError(
                f'فرمت فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: {", ".join(allowed_extensions)}'
            )
        
        # Check file size (max 50MB)
        max_size = 50 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f'حجم فایل باید کمتر از 50 مگابایت باشد. حجم فایل فعلی: {round(value.size / (1024 * 1024), 2)} مگابایت'
            )
        
        return value


class PlaylistSongSerializer(serializers.ModelSerializer):
    """Serializer for songs in playlist with added_by info"""
    added_by_username = serializers.SerializerMethodField()
    added_by_email = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = (
            'id',
            'title',
            'artist',
            'album',
            'file_url',
            'uploaded_by',
            'added_by_username',
            'added_by_email',
            'is_public',
            'duration',
            'file_size_mb',
            'created_at',
        )
    
    def get_added_by_username(self, obj):
        """Get username of user who added song to playlist"""
        # This will be set in view
        return getattr(obj, '_added_by_username', obj.uploaded_by.username)
    
    def get_added_by_email(self, obj):
        """Get email of user who added song to playlist"""
        return getattr(obj, '_added_by_email', obj.uploaded_by.email)
    
    def get_file_url(self, obj):
        """Get file URL"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_size_mb(self, obj):
        """Get file size in MB"""
        return obj.get_file_size_mb()


class PlaylistSerializer(serializers.ModelSerializer):
    """Serializer for Playlist model"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    songs_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = (
            'id',
            'name',
            'owner',
            'owner_username',
            'owner_email',
            'members',
            'members_count',
            'songs_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')
    
    def get_songs_count(self, obj):
        """Get number of songs in playlist"""
        return obj.songs.count()
    
    def get_members_count(self, obj):
        """Get number of members in playlist"""
        return obj.members.count()
    
    def get_can_edit(self, obj):
        """Check if current user can edit playlist"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False
    
    def get_members(self, obj):
        """Get list of members"""
        members = obj.members.all()
        return [
            {
                'id': member.id,
                'username': member.username,
                'email': member.email
            }
            for member in members
        ]


class PlaylistDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed playlist view with songs"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    songs = PlaylistSongSerializer(many=True, read_only=True)
    members = serializers.SerializerMethodField()
    songs_count = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = (
            'id',
            'name',
            'owner',
            'owner_username',
            'owner_email',
            'members',
            'members_count',
            'songs',
            'songs_count',
            'can_edit',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')
    
    def get_members(self, obj):
        """Get list of members"""
        members = obj.members.all()
        return [
            {
                'id': member.id,
                'username': member.username,
                'email': member.email
            }
            for member in members
        ]
    
    def get_songs_count(self, obj):
        """Get number of songs in playlist"""
        return obj.songs.count()
    
    def get_members_count(self, obj):
        """Get number of members in playlist"""
        return obj.members.count()
    
    def get_can_edit(self, obj):
        """Check if current user can edit playlist"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False


class PlaylistCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a playlist"""
    
    class Meta:
        model = Playlist
        fields = ('name',)


class PlaylistInvitationSerializer(serializers.ModelSerializer):
    """Serializer for PlaylistInvitation"""
    playlist_name = serializers.CharField(source='playlist.name', read_only=True)
    inviter_username = serializers.CharField(source='inviter.username', read_only=True)
    inviter_email = serializers.EmailField(source='inviter.email', read_only=True)
    invitee_username = serializers.CharField(source='invitee.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PlaylistInvitation
        fields = (
            'id',
            'playlist',
            'playlist_name',
            'inviter',
            'inviter_username',
            'inviter_email',
            'invitee_email',
            'invitee',
            'invitee_username',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'inviter', 'invitee', 'status', 'created_at', 'updated_at')


class PlaylistInvitationCreateSerializer(serializers.Serializer):
    """Serializer for creating playlist invitation"""
    invitee_email = serializers.EmailField(required=True, label='ایمیل دعوت شونده')
