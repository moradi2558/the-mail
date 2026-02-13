from rest_framework import serializers
from .models import Message
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import models
import os


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new message"""
    receiver_email = serializers.EmailField(
        write_only=True,
        required=False,
        allow_null=True,
        label='ایمیل گیرنده'
    )
    attachment = serializers.FileField(
        required=False,
        allow_null=True,
        label='فایل ضمیمه'
    )
    
    class Meta:
        model = Message
        fields = (
            'subject',
            'body',
            'is_private',
            'receiver_email',
            'attachment'
        )
        extra_kwargs = {
            'subject': {'required': True},
            'body': {'required': True},
        }
    
    def validate_attachment(self, value):
        """Validate attachment file size (max 10MB)"""
        if value:
            max_size = 10 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError(
                    f'حجم فایل باید کمتر از 10 مگابایت باشد. حجم فایل فعلی: {round(value.size / (1024 * 1024), 2)} مگابایت'
                )
        return value
    
    def validate(self, attrs):
        """Validate message data"""
        is_private = attrs.get('is_private', True)
        receiver_email = attrs.get('receiver_email')
        
        if is_private and not receiver_email:
            raise serializers.ValidationError({
                'receiver_email': 'برای پیام خصوصی، گیرنده الزامی است'
            })
        
        if not is_private and receiver_email:
            raise serializers.ValidationError({
                'receiver_email': 'برای پیام عمومی، گیرنده نباید مشخص شود'
            })
        
        return attrs


class ContactSerializer(serializers.Serializer):
    """Serializer for contact list"""
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    def get_name(self, obj):
        """Get contact's name"""
        if hasattr(obj, 'profile'):
            return obj.profile.get_full_name()
        return obj.username
    
    def get_profile_image(self, obj):
        """Get contact's profile image URL"""
        if hasattr(obj, 'profile') and obj.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_image.url)
        return None
    
    def get_last_message(self, obj):
        """Get last message with this contact"""
        user = self.context.get('user')
        if not user:
            return None
        
        last_message = Message.objects.filter(
            models.Q(sender=user, receiver=obj) | models.Q(sender=obj, receiver=user)
        ).exclude(status='deleted').order_by('-created_at').first()
        
        if last_message:
            return {
                'id': last_message.id,
                'subject': last_message.subject,
                'body': last_message.body[:100] if last_message.body else None,
                'created_at': last_message.created_at,
                'is_sent_by_me': last_message.sender == user,
            }
        return None


class MessageListSerializer(serializers.ModelSerializer):
    """Serializer for listing messages"""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_profile_image = serializers.SerializerMethodField()
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True, allow_null=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True, allow_null=True)
    receiver_name = serializers.SerializerMethodField()
    receiver_profile_image = serializers.SerializerMethodField()
    attachment_size = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    has_attachment = serializers.SerializerMethodField()
    public_link_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = (
            'id',
            'subject',
            'body',
            'sender_email',
            'sender_username',
            'sender_name',
            'sender_profile_image',
            'receiver_email',
            'receiver_username',
            'receiver_name',
            'receiver_profile_image',
            'is_private',
            'status',
            'created_at',
            'sent_at',
            'delivered_at',
            'read_at',
            'updated_at',
            'is_starred',
            'is_important',
            'is_spam',
            'has_attachment',
            'attachment_size',
            'attachment_name',
            'public_link',
            'public_link_url',
        )
        read_only_fields = fields
    
    def get_attachment_size(self, obj):
        """Get attachment size in MB"""
        return obj.get_attachment_size()
    
    def get_attachment_name(self, obj):
        """Get attachment file name"""
        if obj.attachment:
            return os.path.basename(obj.attachment.name)
        return None
    
    def get_has_attachment(self, obj):
        """Check if message has attachment"""
        return bool(obj.attachment)
    
    def get_public_link_url(self, obj):
        """Get public link URL"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/message/public/{obj.public_link}/')
        return None
    
    def get_sender_name(self, obj):
        """Get sender's name"""
        if hasattr(obj.sender, 'profile'):
            return obj.sender.profile.get_full_name()
        return obj.sender.username
    
    def get_sender_profile_image(self, obj):
        """Get sender's profile image URL"""
        if hasattr(obj.sender, 'profile') and obj.sender.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.profile.profile_image.url)
        return None
    
    def get_receiver_name(self, obj):
        """Get receiver's name"""
        if obj.receiver and hasattr(obj.receiver, 'profile'):
            return obj.receiver.profile.get_full_name()
        return obj.receiver.username if obj.receiver else None
    
    def get_receiver_profile_image(self, obj):
        """Get receiver's profile image URL"""
        if obj.receiver and hasattr(obj.receiver, 'profile') and obj.receiver.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receiver.profile.profile_image.url)
        return None


class MessageDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed message view"""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_profile_image = serializers.SerializerMethodField()
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True, allow_null=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True, allow_null=True)
    receiver_name = serializers.SerializerMethodField()
    receiver_profile_image = serializers.SerializerMethodField()
    attachment_size = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    has_attachment = serializers.SerializerMethodField()
    public_link_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = (
            'id',
            'subject',
            'body',
            'sender_email',
            'sender_username',
            'sender_name',
            'sender_profile_image',
            'receiver_email',
            'receiver_username',
            'receiver_name',
            'receiver_profile_image',
            'is_private',
            'status',
            'created_at',
            'sent_at',
            'delivered_at',
            'read_at',
            'updated_at',
            'is_starred',
            'is_important',
            'is_spam',
            'is_sender_spam',
            'is_sender_blocked',
            'has_attachment',
            'attachment_size',
            'attachment_name',
            'attachment_url',
            'public_link',
            'public_link_url',
        )
        read_only_fields = fields
    
    def get_attachment_size(self, obj):
        """Get attachment size in MB"""
        return obj.get_attachment_size()
    
    def get_attachment_name(self, obj):
        """Get attachment file name"""
        if obj.attachment:
            return os.path.basename(obj.attachment.name)
        return None
    
    def get_attachment_url(self, obj):
        """Get attachment download URL"""
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
        return None
    
    def get_has_attachment(self, obj):
        """Check if message has attachment"""
        return bool(obj.attachment)
    
    def get_public_link_url(self, obj):
        """Get public link URL"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/message/public/{obj.public_link}/')
        return None
    
    def get_sender_name(self, obj):
        """Get sender's name"""
        if hasattr(obj.sender, 'profile'):
            return obj.sender.profile.get_full_name()
        return obj.sender.username
    
    def get_sender_profile_image(self, obj):
        """Get sender's profile image URL"""
        if hasattr(obj.sender, 'profile') and obj.sender.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.profile.profile_image.url)
        return None
    
    def get_receiver_name(self, obj):
        """Get receiver's name"""
        if obj.receiver and hasattr(obj.receiver, 'profile'):
            return obj.receiver.profile.get_full_name()
        return obj.receiver.username if obj.receiver else None
    
    def get_receiver_profile_image(self, obj):
        """Get receiver's profile image URL"""
        if obj.receiver and hasattr(obj.receiver, 'profile') and obj.receiver.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receiver.profile.profile_image.url)
        return None
    
    is_sender_spam = serializers.SerializerMethodField()
    is_sender_blocked = serializers.SerializerMethodField()
    
    def get_is_sender_spam(self, obj):
        """Check if sender is marked as spam by receiver"""
        if obj.receiver:
            from .services import MessageService
            return MessageService.is_spam_sender(blocker=obj.receiver, blocked=obj.sender)
        return False
    
    def get_is_sender_blocked(self, obj):
        """Check if sender is blocked by receiver"""
        if obj.receiver:
            from .services import MessageService
            return MessageService.is_blocked(blocker=obj.receiver, blocked=obj.sender)
        return False


class BlockUserSerializer(serializers.Serializer):
    """Serializer for blocking/unblocking a user"""
    email = serializers.EmailField(required=True, label='ایمیل کاربر')
    is_spam = serializers.BooleanField(default=False, required=False, label='اسپم')


class BlockedUserSerializer(serializers.Serializer):
    """Serializer for blocked users list"""
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)
    name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    is_spam = serializers.BooleanField(read_only=True)
    blocked_at = serializers.DateTimeField(read_only=True)
    
    def get_name(self, obj):
        """Get blocked user's name"""
        if hasattr(obj, 'profile'):
            return obj.profile.get_full_name()
        return obj.username
    
    def get_profile_image(self, obj):
        """Get blocked user's profile image URL"""
        if hasattr(obj, 'profile') and obj.profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile.profile_image.url)
        return None
