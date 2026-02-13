from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils import timezone
import os
import uuid


def song_file_upload_path(instance, filename):
    """Generate upload path for song files"""
    return f'music/songs/{instance.id}/{filename}'


class Song(models.Model):
    """Song model for storing music files"""
    
    title = models.CharField(max_length=255, verbose_name='عنوان آهنگ')
    artist = models.CharField(max_length=255, null=True, blank=True, verbose_name='خواننده')
    album = models.CharField(max_length=255, null=True, blank=True, verbose_name='آلبوم')
    file = models.FileField(
        upload_to=song_file_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'flac', 'm4a', 'ogg', 'aac'])],
        verbose_name='فایل موزیک'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_songs',
        verbose_name='آپلود کننده'
    )
    is_public = models.BooleanField(default=False, verbose_name='عمومی')
    duration = models.IntegerField(null=True, blank=True, verbose_name='مدت زمان (ثانیه)')
    file_size = models.BigIntegerField(null=True, blank=True, verbose_name='حجم فایل (بایت)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='زمان به‌روزرسانی')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'آهنگ'
        verbose_name_plural = 'آهنگ‌ها'
        indexes = [
            models.Index(fields=['uploaded_by', '-created_at']),
            models.Index(fields=['is_public', '-created_at']),
            models.Index(fields=['artist']),
            models.Index(fields=['album']),
            models.Index(fields=['title']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.artist or 'Unknown'}"
    
    def get_file_size_mb(self):
        """Get file size in MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0


class Playlist(models.Model):
    """Playlist model"""
    
    name = models.CharField(max_length=255, verbose_name='نام پلی‌لیست')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_playlists',
        verbose_name='مالک'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_playlists',
        blank=True,
        verbose_name='اعضا'
    )
    songs = models.ManyToManyField(
        Song,
        related_name='playlists',
        blank=True,
        verbose_name='آهنگ‌ها'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='زمان به‌روزرسانی')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'پلی‌لیست'
        verbose_name_plural = 'پلی‌لیست‌ها'
        indexes = [
            models.Index(fields=['owner', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.owner.username}"
    
    def is_member(self, user):
        """Check if user is a member of the playlist"""
        return self.owner == user or self.members.filter(id=user.id).exists()
    
    def can_edit(self, user):
        """Check if user can edit the playlist"""
        return self.is_member(user)


class PlaylistInvitation(models.Model):
    """Playlist invitation model"""
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('accepted', 'پذیرفته شده'),
        ('rejected', 'رد شده'),
    ]
    
    playlist = models.ForeignKey(
        Playlist,
        on_delete=models.CASCADE,
        related_name='invitations',
        verbose_name='پلی‌لیست'
    )
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        verbose_name='دعوت کننده'
    )
    invitee_email = models.EmailField(verbose_name='ایمیل دعوت شونده')
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_invitations',
        null=True,
        blank=True,
        verbose_name='دعوت شونده'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='وضعیت'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='زمان به‌روزرسانی')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'دعوت پلی‌لیست'
        verbose_name_plural = 'دعوت‌های پلی‌لیست'
        unique_together = ('playlist', 'invitee_email', 'status')
        indexes = [
            models.Index(fields=['invitee_email', 'status']),
            models.Index(fields=['invitee', 'status']),
            models.Index(fields=['playlist', 'status']),
        ]
    
    def __str__(self):
        return f"{self.playlist.name} - {self.invitee_email} - {self.status}"


class UserPlaybackState(models.Model):
    """Model for storing user's last played song and position"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='playback_state',
        verbose_name='کاربر'
    )
    last_song = models.ForeignKey(
        Song,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='playback_states',
        verbose_name='آخرین آهنگ پخش شده'
    )
    last_position = models.FloatField(default=0.0, verbose_name='آخرین موقعیت (ثانیه)')
    last_played_at = models.DateTimeField(auto_now=True, verbose_name='زمان آخرین پخش')
    
    class Meta:
        verbose_name = 'وضعیت پخش کاربر'
        verbose_name_plural = 'وضعیت‌های پخش کاربران'
        indexes = [
            models.Index(fields=['user', '-last_played_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.last_song.title if self.last_song else 'None'} - {self.last_position:.1f}s"


class FavoriteSong(models.Model):
    """Favorite songs model for users"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorite_songs',
        verbose_name='کاربر'
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='آهنگ'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    
    class Meta:
        unique_together = ('user', 'song')
        ordering = ['-created_at']
        verbose_name = 'آهنگ مورد علاقه'
        verbose_name_plural = 'آهنگ‌های مورد علاقه'
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.song.title}"