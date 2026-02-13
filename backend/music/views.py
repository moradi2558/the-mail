from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError
from django.db.models import Q
from .serializers import (
    SongSerializer, SongCreateSerializer,
    PlaylistSerializer, PlaylistDetailSerializer, PlaylistCreateSerializer,
    PlaylistInvitationSerializer, PlaylistInvitationCreateSerializer
)
from .services import MusicService
from .models import Song, Playlist, PlaylistInvitation, UserPlaybackState


class UploadSongView(APIView):
    """
    API View for uploading a single song
    POST /api/music/upload/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Upload a single song file
        Body: {
            file: file (required),
            title: string (optional),
            artist: string (optional),
            album: string (optional),
            is_public: boolean (default: false)
        }
        """
        serializer = SongCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                song = MusicService.upload_single_song(
                    user=request.user,
                    file=serializer.validated_data['file'],
                    is_public=serializer.validated_data.get('is_public', False),
                    title=serializer.validated_data.get('title'),
                    artist=serializer.validated_data.get('artist'),
                    album=serializer.validated_data.get('album')
                )
                
                response_serializer = SongSerializer(song, context={'request': request})
                
                return Response({
                    'message': 'آهنگ با موفقیت آپلود شد',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadMultipleSongsView(APIView):
    """
    API View for uploading multiple songs
    POST /api/music/upload-multiple/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Upload multiple song files
        Body: {
            files: [file1, file2, ...] (required),
            is_public: boolean (default: false)
        }
        """
        files = request.FILES.getlist('files')
        if not files:
            return Response({
                'error': 'حداقل یک فایل باید انتخاب شود'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        is_public = request.data.get('is_public', 'false').lower() == 'true'
        
        try:
            uploaded_songs, errors = MusicService.upload_multiple_songs(
                user=request.user,
                files=files,
                is_public=is_public
            )
            
            response_serializer = SongSerializer(uploaded_songs, many=True, context={'request': request})
            
            response_data = {
                'message': f'{len(uploaded_songs)} آهنگ با موفقیت آپلود شد',
                'count': len(uploaded_songs),
                'data': response_serializer.data
            }
            
            if errors:
                response_data['errors'] = errors
                response_data['message'] += f' ({len(errors)} خطا)'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class SongListView(APIView):
    """
    API View for listing songs
    GET /api/music/songs/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all songs accessible to user
        Query params:
            - type: 'all', 'my', 'public' (default: 'all')
            - search: Optional search query
        """
        song_type = request.query_params.get('type', 'all')
        search_query = request.query_params.get('search', None)
        
        try:
            if song_type == 'my':
                songs = MusicService.get_user_songs(user=request.user, include_public=False)
            elif song_type == 'public':
                songs = Song.objects.filter(is_public=True)
            else:
                songs = MusicService.get_user_songs(user=request.user, include_public=True)
            
            if search_query:
                songs = MusicService.search_songs(
                    user=request.user,
                    query=search_query,
                    include_public=(song_type != 'my')
                )
            
            serializer = SongSerializer(songs, many=True, context={'request': request})
            
            return Response({
                'message': 'لیست آهنگ‌ها با موفقیت دریافت شد',
                'count': songs.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PlaylistListView(APIView):
    """
    API View for listing user playlists
    GET /api/music/playlists/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all playlists for user (owned + shared)
        """
        try:
            # Get owned playlists
            owned_playlists = Playlist.objects.filter(owner=request.user)
            
            # Get shared playlists
            shared_playlists = Playlist.objects.filter(members=request.user)
            
            # Combine and remove duplicates
            all_playlists = (owned_playlists | shared_playlists).distinct()
            
            serializer = PlaylistSerializer(all_playlists, many=True, context={'request': request})
            
            return Response({
                'message': 'لیست پلی‌لیست‌ها با موفقیت دریافت شد',
                'count': all_playlists.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PlaylistDetailView(APIView):
    """
    API View for viewing playlist details
    GET /api/music/playlists/<id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, playlist_id):
        """
        Get playlist details with songs
        """
        try:
            playlist = Playlist.objects.get(id=playlist_id)
            
            # Check if user has access
            if not playlist.is_member(request.user):
                return Response({
                    'error': 'شما دسترسی به این پلی‌لیست ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get songs with added_by info
            # We need to track who added each song to playlist
            # For now, we'll use uploaded_by as added_by
            songs = playlist.songs.all().order_by('-created_at')
            
            # Add added_by info to each song
            for song in songs:
                song._added_by_username = song.uploaded_by.username
                song._added_by_email = song.uploaded_by.email
            
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            
            return Response({
                'message': 'جزئیات پلی‌لیست با موفقیت دریافت شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Playlist.DoesNotExist:
            return Response({
                'error': 'پلی‌لیست یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CreatePlaylistView(APIView):
    """
    API View for creating a playlist
    POST /api/music/playlists/create/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request):
        """
        Create a new playlist
        Body: {
            name: string (required)
        }
        """
        serializer = PlaylistCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                playlist = MusicService.create_playlist(
                    user=request.user,
                    name=serializer.validated_data['name']
                )
                
                response_serializer = PlaylistSerializer(playlist, context={'request': request})
                
                return Response({
                    'message': 'پلی‌لیست با موفقیت ایجاد شد',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdatePlaylistView(APIView):
    """
    API View for updating a playlist
    PUT /api/music/playlists/<id>/update/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def put(self, request, playlist_id):
        """
        Update playlist name
        Body: {
            name: string (required)
        }
        """
        try:
            playlist = Playlist.objects.get(id=playlist_id)
            
            # Check if user can edit
            if not playlist.can_edit(request.user):
                return Response({
                    'error': 'شما دسترسی به ویرایش این پلی‌لیست ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            name = request.data.get('name')
            if not name or not name.strip():
                return Response({
                    'error': 'نام پلی‌لیست الزامی است'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            playlist.name = name.strip()
            playlist.save()
            
            serializer = PlaylistSerializer(playlist, context={'request': request})
            
            return Response({
                'message': 'پلی‌لیست با موفقیت به‌روزرسانی شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Playlist.DoesNotExist:
            return Response({
                'error': 'پلی‌لیست یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AddSongToPlaylistView(APIView):
    """
    API View for adding a song to playlist
    POST /api/music/playlists/<id>/add-song/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request, playlist_id):
        """
        Add a song to playlist
        Body: {
            song_id: integer (required)
        }
        """
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({
                'error': 'شناسه آهنگ الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            playlist = MusicService.add_song_to_playlist(
                playlist_id=playlist_id,
                song_id=song_id,
                user=request.user
            )
            
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            
            return Response({
                'message': 'آهنگ با موفقیت به پلی‌لیست اضافه شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RemoveSongFromPlaylistView(APIView):
    """
    API View for removing a song from playlist
    POST /api/music/playlists/<id>/remove-song/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request, playlist_id):
        """
        Remove a song from playlist
        Body: {
            song_id: integer (required)
        }
        """
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({
                'error': 'شناسه آهنگ الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            playlist = Playlist.objects.get(id=playlist_id)
            
            # Check if user can edit
            if not playlist.can_edit(request.user):
                return Response({
                    'error': 'شما دسترسی به ویرایش این پلی‌لیست ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                song = Song.objects.get(id=song_id)
            except Song.DoesNotExist:
                return Response({
                    'error': 'آهنگ یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)
            
            playlist.songs.remove(song)
            
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            
            return Response({
                'message': 'آهنگ با موفقیت از پلی‌لیست حذف شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Playlist.DoesNotExist:
            return Response({
                'error': 'پلی‌لیست یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class InviteToPlaylistView(APIView):
    """
    API View for inviting a user to playlist
    POST /api/music/playlists/<id>/invite/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request, playlist_id):
        """
        Invite a user to playlist
        Body: {
            invitee_email: string (required)
        }
        """
        serializer = PlaylistInvitationCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                invitation = MusicService.invite_user_to_playlist(
                    playlist_id=playlist_id,
                    invitee_email=serializer.validated_data['invitee_email'],
                    inviter=request.user
                )
                
                response_serializer = PlaylistInvitationSerializer(invitation, context={'request': request})
                
                return Response({
                    'message': 'دعوت با موفقیت ارسال شد',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvitationsListView(APIView):
    """
    API View for listing user invitations
    GET /api/music/invitations/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all pending invitations for user
        """
        try:
            invitations = MusicService.get_user_invitations(user=request.user)
            
            serializer = PlaylistInvitationSerializer(invitations, many=True, context={'request': request})
            
            return Response({
                'message': 'لیست دعوت‌ها با موفقیت دریافت شد',
                'count': invitations.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RespondToInvitationView(APIView):
    """
    API View for responding to invitation
    POST /api/music/invitations/<id>/respond/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request, invitation_id):
        """
        Accept or reject invitation
        Body: {
            accept: boolean (required) - true to accept, false to reject
        }
        """
        accept = request.data.get('accept')
        if accept is None:
            return Response({
                'error': 'پارامتر accept الزامی است (true یا false)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invitation = MusicService.respond_to_invitation(
                invitation_id=invitation_id,
                user=request.user,
                accept=bool(accept)
            )
            
            serializer = PlaylistInvitationSerializer(invitation, context={'request': request})
            
            message = 'دعوت پذیرفته شد' if accept else 'دعوت رد شد'
            
            return Response({
                'message': message,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UpdateSongsPublicStatusView(APIView):
    """
    API View for updating multiple songs' public status
    POST /api/music/songs/update-public-status/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request):
        """
        Update multiple songs' is_public status
        Body: {
            song_ids: [1, 2, 3, ...] (required),
            is_public: boolean (required)
        }
        """
        song_ids = request.data.get('song_ids', [])
        is_public = request.data.get('is_public')
        
        if not song_ids or not isinstance(song_ids, list):
            return Response({
                'error': 'لیست شناسه آهنگ‌ها الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if is_public is None:
            return Response({
                'error': 'وضعیت عمومی (is_public) الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get songs that belong to the user
            songs = Song.objects.filter(id__in=song_ids, uploaded_by=request.user)
            
            if not songs.exists():
                return Response({
                    'error': 'هیچ آهنگی یافت نشد یا شما دسترسی به این آهنگ‌ها ندارید'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Update all songs
            updated_count = songs.update(is_public=bool(is_public))
            
            return Response({
                'message': f'{updated_count} آهنگ با موفقیت به‌روزرسانی شد',
                'count': updated_count,
                'is_public': bool(is_public)
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ToggleFavoriteSongView(APIView):
    """
    API View for toggling favorite status of a song
    POST /api/music/songs/<id>/toggle-favorite/
    Uses a playlist named "علاقه‌مندی‌ها" for favorites
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request, song_id):
        """
        Toggle favorite status of a song
        Creates or uses a playlist named "علاقه‌مندی‌ها"
        """
        try:
            song = Song.objects.get(id=song_id)
            
            # Get or create favorites playlist
            favorites_playlist, created = Playlist.objects.get_or_create(
                owner=request.user,
                name='علاقه‌مندی‌ها',
                defaults={'name': 'علاقه‌مندی‌ها'}
            )
            
            # Check if song is already in favorites
            is_favorite = favorites_playlist.songs.filter(id=song.id).exists()
            
            if is_favorite:
                # Remove from favorites
                favorites_playlist.songs.remove(song)
                is_favorite = False
                message = 'آهنگ از علاقه‌مندی‌ها حذف شد'
            else:
                # Add to favorites
                favorites_playlist.songs.add(song)
                is_favorite = True
                message = 'آهنگ به علاقه‌مندی‌ها اضافه شد'
            
            return Response({
                'message': message,
                'is_favorite': is_favorite
            }, status=status.HTTP_200_OK)
        
        except Song.DoesNotExist:
            return Response({
                'error': 'آهنگ یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class FavoriteSongsListView(APIView):
    """
    API View for listing user's favorite songs
    GET /api/music/favorites/
    Returns songs from "علاقه‌مندی‌ها" playlist
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all favorite songs for authenticated user from favorites playlist
        """
        try:
            # Get favorites playlist
            favorites_playlist = Playlist.objects.filter(
                owner=request.user,
                name='علاقه‌مندی‌ها'
            ).first()
            
            if not favorites_playlist:
                # Return empty list if playlist doesn't exist
                return Response({
                    'message': 'لیست علاقه‌مندی‌ها خالی است',
                    'count': 0,
                    'data': []
                }, status=status.HTTP_200_OK)
            
            songs = favorites_playlist.songs.all()
            serializer = SongSerializer(songs, many=True, context={'request': request})
            
            return Response({
                'message': 'لیست آهنگ‌های مورد علاقه با موفقیت دریافت شد',
                'count': songs.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class SavePlaybackStateView(APIView):
    """
    API View for saving user's playback state
    POST /api/music/playback-state/save/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]
    
    def post(self, request):
        """
        Save playback state (song and position)
        Body: {
            song_id: integer (required),
            position: float (required) - position in seconds
        }
        """
        song_id = request.data.get('song_id')
        position = request.data.get('position', 0.0)
        
        if not song_id:
            return Response({
                'error': 'شناسه آهنگ الزامی است'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            song = Song.objects.get(id=song_id)
            
            # Get or create playback state
            playback_state, created = UserPlaybackState.objects.get_or_create(
                user=request.user,
                defaults={'last_song': song, 'last_position': float(position)}
            )
            
            if not created:
                playback_state.last_song = song
                playback_state.last_position = float(position)
                playback_state.save()
            
            return Response({
                'message': 'وضعیت پخش ذخیره شد',
                'data': {
                    'song_id': song.id,
                    'position': playback_state.last_position
                }
            }, status=status.HTTP_200_OK)
        
        except Song.DoesNotExist:
            return Response({
                'error': 'آهنگ یافت نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class GetPlaybackStateView(APIView):
    """
    API View for getting user's playback state
    GET /api/music/playback-state/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get user's last playback state
        """
        try:
            playback_state = UserPlaybackState.objects.filter(
                user=request.user
            ).select_related('last_song').first()
            
            if not playback_state or not playback_state.last_song:
                return Response({
                    'message': 'وضعیت پخشی یافت نشد',
                    'data': None
                }, status=status.HTTP_200_OK)
            
            # Check if user has access to the song
            song = playback_state.last_song
            if song.uploaded_by != request.user and not song.is_public:
                return Response({
                    'message': 'دسترسی به آهنگ قبلی وجود ندارد',
                    'data': None
                }, status=status.HTTP_200_OK)
            
            serializer = SongSerializer(song, context={'request': request})
            
            return Response({
                'message': 'وضعیت پخش با موفقیت دریافت شد',
                'data': {
                    'song': serializer.data,
                    'position': playback_state.last_position,
                    'last_played_at': playback_state.last_played_at
                }
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)