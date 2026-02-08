from rest_framework import serializers
from .models import Message
from django.core.files.uploadedfile import InMemoryUploadedFile
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
            # Check file size (10MB = 10 * 1024 * 1024 bytes)
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


class MessageListSerializer(serializers.ModelSerializer):
    """Serializer for listing messages"""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True, allow_null=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True, allow_null=True)
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
            'receiver_email',
            'receiver_username',
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


class MessageDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed message view"""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True, allow_null=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True, allow_null=True)
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
            'receiver_email',
            'receiver_username',
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

