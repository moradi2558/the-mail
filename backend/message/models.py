from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils import timezone
import os
import uuid


def message_file_upload_path(instance, filename):
    """Generate upload path for message attachments"""
    return f'messages/{instance.id}/{filename}'


class Message(models.Model):
    """Message/Email model"""
    
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('sent', 'ارسال شده'),
        ('delivered', 'تحویل داده شده'),
        ('read', 'خوانده شده'),
        ('archived', 'آرشیو شده'),
        ('deleted', 'حذف شده'),
    ]
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='فرستنده')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True, verbose_name='گیرنده')
    subject = models.CharField(max_length=255, verbose_name='موضوع')
    body = models.TextField(verbose_name='متن پیام')
    is_private = models.BooleanField(default=True, verbose_name='خصوصی')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent', verbose_name='وضعیت')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='زمان ارسال')
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name='زمان تحویل')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='زمان خواندن')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='زمان به‌روزرسانی')
    attachment = models.FileField(upload_to=message_file_upload_path, null=True, blank=True, validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar'])], verbose_name='فایل ضمیمه', help_text='حداکثر حجم فایل: 10 مگابایت')
    is_starred = models.BooleanField(default=False, verbose_name='ستاره‌دار')
    is_important = models.BooleanField(default=False, verbose_name='مهم')
    is_spam = models.BooleanField(default=False, verbose_name='اسپم')
    public_link = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name='لینک عمومی')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'پیام'
        verbose_name_plural = 'پیام‌ها'
        indexes = [
            models.Index(fields=['sender', '-created_at']),
            models.Index(fields=['receiver', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.sender.email}"
    
    def save(self, *args, **kwargs):
        """Override save to set sent_at on first save"""
        if not self.pk and not self.sent_at:
            self.sent_at = timezone.now()
        super().save(*args, **kwargs)
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.read_at:
            self.read_at = timezone.now()
            self.status = 'read'
            self.save()
    
    def get_attachment_size(self):
        """Get attachment file size in MB"""
        if self.attachment:
            try:
                size = self.attachment.size
                return round(size / (1024 * 1024), 2)
            except:
                return 0
        return 0


class Block(models.Model):
    """Model for blocking users"""
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_users', verbose_name='بلاک کننده')
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_by_users', verbose_name='بلاک شده')
    is_spam = models.BooleanField(default=False, verbose_name='اسپم')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان ایجاد')
    
    class Meta:
        unique_together = ('blocker', 'blocked')
        verbose_name = 'بلاک'
        verbose_name_plural = 'بلاک‌ها'
        indexes = [
            models.Index(fields=['blocker', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
