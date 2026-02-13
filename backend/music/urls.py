from django.urls import path
from .views import (
    UploadSongView, UploadMultipleSongsView, SongListView,
    PlaylistListView, PlaylistDetailView, CreatePlaylistView, UpdatePlaylistView,
    AddSongToPlaylistView, RemoveSongFromPlaylistView,
    InviteToPlaylistView, InvitationsListView, RespondToInvitationView,
    UpdateSongsPublicStatusView
)

app_name = 'music'

urlpatterns = [
    # Song endpoints
    path('upload/', UploadSongView.as_view(), name='upload'),
    path('upload-multiple/', UploadMultipleSongsView.as_view(), name='upload-multiple'),
    path('songs/', SongListView.as_view(), name='songs'),
    path('songs/update-public-status/', UpdateSongsPublicStatusView.as_view(), name='update-songs-public-status'),
    
    # Playlist endpoints
    path('playlists/', PlaylistListView.as_view(), name='playlists'),
    path('playlists/create/', CreatePlaylistView.as_view(), name='create-playlist'),
    path('playlists/<int:playlist_id>/', PlaylistDetailView.as_view(), name='playlist-detail'),
    path('playlists/<int:playlist_id>/update/', UpdatePlaylistView.as_view(), name='update-playlist'),
    path('playlists/<int:playlist_id>/add-song/', AddSongToPlaylistView.as_view(), name='add-song'),
    path('playlists/<int:playlist_id>/remove-song/', RemoveSongFromPlaylistView.as_view(), name='remove-song'),
    path('playlists/<int:playlist_id>/invite/', InviteToPlaylistView.as_view(), name='invite'),
    
    # Invitation endpoints
    path('invitations/', InvitationsListView.as_view(), name='invitations'),
    path('invitations/<int:invitation_id>/respond/', RespondToInvitationView.as_view(), name='respond-invitation'),
]
