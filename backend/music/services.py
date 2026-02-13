from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q
import os
from mutagen import File as MutagenFile
from mutagen.id3 import ID3NoHeaderError
from .models import Song, Playlist, PlaylistInvitation

User = get_user_model()


class MusicService:
    """Service class for music operations"""
    
    # Supported audio extensions
    AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']
    
    @staticmethod
    def extract_metadata(file_path):
        """
        Extract metadata from audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            dict: Metadata containing title, artist, album, duration
        """
        metadata = {
            'title': None,
            'artist': None,
            'album': None,
            'duration': None
        }
        
        try:
            audio_file = MutagenFile(file_path)
            if audio_file is None:
                return metadata
            
            # Extract title
            if 'TIT2' in audio_file or 'TITLE' in audio_file:
                title = audio_file.get('TIT2') or audio_file.get('TITLE')
                if title:
                    metadata['title'] = str(title[0]) if isinstance(title, list) else str(title)
            
            # Extract artist
            if 'TPE1' in audio_file or 'ARTIST' in audio_file:
                artist = audio_file.get('TPE1') or audio_file.get('ARTIST')
                if artist:
                    metadata['artist'] = str(artist[0]) if isinstance(artist, list) else str(artist)
            
            # Extract album
            if 'TALB' in audio_file or 'ALBUM' in audio_file:
                album = audio_file.get('TALB') or audio_file.get('ALBUM')
                if album:
                    metadata['album'] = str(album[0]) if isinstance(album, list) else str(album)
            
            # Extract duration
            if hasattr(audio_file, 'info') and hasattr(audio_file.info, 'length'):
                metadata['duration'] = int(audio_file.info.length)
            
        except (ID3NoHeaderError, Exception) as e:
            # If metadata extraction fails, use filename as title
            filename = os.path.basename(file_path)
            metadata['title'] = os.path.splitext(filename)[0]
        
        return metadata
    
    @staticmethod
    def upload_single_song(user, file, is_public=False, title=None, artist=None, album=None):
        """
        Upload a single song file
        
        Args:
            user: User object (uploader)
            file: File object
            is_public: Boolean - is song public
            title: Optional title override
            artist: Optional artist override
            album: Optional album override
            
        Returns:
            Song object
        """
        # Validate file extension
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in MusicService.AUDIO_EXTENSIONS:
            raise ValidationError(f'فرمت فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: {", ".join(MusicService.AUDIO_EXTENSIONS)}')
        
        # Save file temporarily to extract metadata
        temp_path = None
        try:
            # Create song object first to get ID for file path
            song = Song(
                uploaded_by=user,
                is_public=is_public,
                file=file
            )
            song.save()
            
            # Extract metadata from file
            if song.file:
                temp_path = song.file.path
                metadata = MusicService.extract_metadata(temp_path)
                
                # Use provided values or metadata from file
                song.title = title or metadata.get('title') or os.path.splitext(file.name)[0]
                song.artist = artist or metadata.get('artist')
                song.album = album or metadata.get('album')
                song.duration = metadata.get('duration')
                song.file_size = song.file.size if song.file else None
                
                song.save()
            
            return song
            
        except Exception as e:
            if song and song.pk:
                song.delete()
            raise ValidationError(f'خطا در آپلود فایل: {str(e)}')
    
    @staticmethod
    def upload_multiple_songs(user, files, is_public=False):
        """
        Upload multiple song files
        
        Args:
            user: User object (uploader)
            files: List of file objects
            is_public: Boolean - are songs public
            
        Returns:
            List of Song objects
        """
        uploaded_songs = []
        errors = []
        
        for file in files:
            try:
                song = MusicService.upload_single_song(
                    user=user,
                    file=file,
                    is_public=is_public
                )
                uploaded_songs.append(song)
            except Exception as e:
                errors.append(f'{file.name}: {str(e)}')
        
        if errors and not uploaded_songs:
            raise ValidationError('هیچ فایلی آپلود نشد. خطاها: ' + '; '.join(errors))
        
        return uploaded_songs, errors
    
    @staticmethod
    def upload_folder_songs(user, folder_path, is_public=False):
        """
        Upload all songs from a folder
        
        Args:
            user: User object (uploader)
            folder_path: Path to folder containing audio files
            is_public: Boolean - are songs public
            
        Returns:
            List of Song objects, List of errors
        """
        if not os.path.isdir(folder_path):
            raise ValidationError('مسیر پوشه معتبر نیست')
        
        uploaded_songs = []
        errors = []
        
        # Walk through folder and find all audio files
        for root, dirs, files in os.walk(folder_path):
            for filename in files:
                file_ext = os.path.splitext(filename)[1].lower()
                if file_ext in MusicService.AUDIO_EXTENSIONS:
                    file_path = os.path.join(root, filename)
                    try:
                        # Open file and upload
                        with open(file_path, 'rb') as f:
                            # Create a file-like object for Django
                            from django.core.files import File
                            django_file = File(f, name=filename)
                            
                            song = MusicService.upload_single_song(
                                user=user,
                                file=django_file,
                                is_public=is_public
                            )
                            uploaded_songs.append(song)
                    except Exception as e:
                        errors.append(f'{filename}: {str(e)}')
        
        return uploaded_songs, errors
    
    @staticmethod
    def get_user_songs(user, include_public=True):
        """
        Get all songs accessible to user (own songs + public songs)
        
        Args:
            user: User object
            include_public: Boolean - include public songs from other users
            
        Returns:
            QuerySet of Song objects
        """
        if include_public:
            songs = Song.objects.filter(
                Q(uploaded_by=user) | Q(is_public=True)
            )
        else:
            songs = Song.objects.filter(uploaded_by=user)
        
        return songs.order_by('-created_at')
    
    @staticmethod
    def search_songs(user, query, include_public=True):
        """
        Search songs by title, artist, or album
        
        Args:
            user: User object
            query: Search query string
            include_public: Boolean - include public songs in search
            
        Returns:
            QuerySet of Song objects
        """
        if not query or not query.strip():
            return Song.objects.none()
        
        search_query = query.strip()
        
        # Base queryset
        if include_public:
            songs = Song.objects.filter(
                Q(uploaded_by=user) | Q(is_public=True)
            )
        else:
            songs = Song.objects.filter(uploaded_by=user)
        
        # Apply search filters
        songs = songs.filter(
            Q(title__icontains=search_query) |
            Q(artist__icontains=search_query) |
            Q(album__icontains=search_query)
        )
        
        return songs.order_by('-created_at')
    
    @staticmethod
    def create_playlist(user, name):
        """
        Create a new playlist
        
        Args:
            user: User object (owner)
            name: Playlist name
            
        Returns:
            Playlist object
        """
        if not name or not name.strip():
            raise ValidationError('نام پلی‌لیست الزامی است')
        
        playlist = Playlist.objects.create(
            owner=user,
            name=name.strip()
        )
        
        return playlist
    
    @staticmethod
    def add_song_to_playlist(playlist_id, song_id, user):
        """
        Add a song to a playlist
        
        Args:
            playlist_id: Playlist ID
            song_id: Song ID
            user: User object (must be member of playlist)
            
        Returns:
            Playlist object
        """
        try:
            playlist = Playlist.objects.get(id=playlist_id)
        except Playlist.DoesNotExist:
            raise ValidationError('پلی‌لیست یافت نشد')
        
        # Check if user can edit playlist
        if not playlist.can_edit(user):
            raise ValidationError('شما دسترسی به این پلی‌لیست ندارید')
        
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            raise ValidationError('آهنگ یافت نشد')
        
        # Check if user can access song
        if song.uploaded_by != user and not song.is_public:
            raise ValidationError('شما دسترسی به این آهنگ ندارید')
        
        # Add song to playlist (if not already added)
        if not playlist.songs.filter(id=song_id).exists():
            playlist.songs.add(song)
        
        return playlist
    
    @staticmethod
    def invite_user_to_playlist(playlist_id, invitee_email, inviter):
        """
        Invite a user to a playlist by email
        
        Args:
            playlist_id: Playlist ID
            invitee_email: Email of user to invite
            inviter: User object (inviter)
            
        Returns:
            PlaylistInvitation object
        """
        try:
            playlist = Playlist.objects.get(id=playlist_id)
        except Playlist.DoesNotExist:
            raise ValidationError('پلی‌لیست یافت نشد')
        
        # Check if inviter can invite (must be owner or member)
        if not playlist.can_edit(inviter):
            raise ValidationError('شما دسترسی به این پلی‌لیست ندارید')
        
        # Check if user with email exists
        try:
            invitee = User.objects.get(email=invitee_email)
        except User.DoesNotExist:
            raise ValidationError('کاربری با این ایمیل یافت نشد')
        
        # Check if user is already a member
        if playlist.is_member(invitee):
            raise ValidationError('این کاربر قبلاً عضو این پلی‌لیست است')
        
        # Check if there's a pending invitation
        existing_invitation = PlaylistInvitation.objects.filter(
            playlist=playlist,
            invitee_email=invitee_email,
            status='pending'
        ).first()
        
        if existing_invitation:
            raise ValidationError('دعوت قبلاً برای این کاربر ارسال شده است')
        
        # Create invitation
        invitation = PlaylistInvitation.objects.create(
            playlist=playlist,
            inviter=inviter,
            invitee_email=invitee_email,
            invitee=invitee,
            status='pending'
        )
        
        return invitation
    
    @staticmethod
    def get_user_invitations(user):
        """
        Get all pending invitations for a user
        
        Args:
            user: User object
            
        Returns:
            QuerySet of PlaylistInvitation objects
        """
        invitations = PlaylistInvitation.objects.filter(
            invitee_email=user.email,
            status='pending'
        ).select_related('playlist', 'inviter')
        
        return invitations.order_by('-created_at')
    
    @staticmethod
    def respond_to_invitation(invitation_id, user, accept=True):
        """
        Accept or reject a playlist invitation
        
        Args:
            invitation_id: Invitation ID
            user: User object (must be invitee)
            accept: Boolean - True to accept, False to reject
            
        Returns:
            PlaylistInvitation object
        """
        try:
            invitation = PlaylistInvitation.objects.get(id=invitation_id)
        except PlaylistInvitation.DoesNotExist:
            raise ValidationError('دعوت یافت نشد')
        
        # Check if user is the invitee
        if invitation.invitee_email != user.email:
            raise ValidationError('این دعوت برای شما نیست')
        
        # Check if invitation is still pending
        if invitation.status != 'pending':
            raise ValidationError('این دعوت قبلاً پاسخ داده شده است')
        
        if accept:
            # Accept invitation
            invitation.status = 'accepted'
            invitation.invitee = user
            invitation.save()
            
            # Add user to playlist members
            invitation.playlist.members.add(user)
        else:
            # Reject invitation
            invitation.status = 'rejected'
            invitation.invitee = user
            invitation.save()
        
        return invitation
