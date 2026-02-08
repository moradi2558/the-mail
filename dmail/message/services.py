from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import models
from .models import Message

User = get_user_model()


class MessageService:
    """Service class for message operations"""
    
    @staticmethod
    def create_message(sender, subject, body, is_private=True, receiver_email=None, attachment=None):
        """
        Create a new message
        
        Args:
            sender: User object (sender)
            subject: Message subject
            body: Message body
            is_private: Boolean - is message private
            receiver_email: Email of receiver (required if private)
            attachment: File object (max 10MB)
        
        Returns:
            Message object
        """
        # Validate receiver if private message
        receiver = None
        if is_private:
            if not receiver_email:
                raise ValidationError('برای پیام خصوصی، گیرنده الزامی است')
            
            try:
                receiver = User.objects.get(email=receiver_email)
            except User.DoesNotExist:
                raise ValidationError('گیرنده با این ایمیل یافت نشد')
        
        # Create message
        message = Message.objects.create(
            sender=sender,
            receiver=receiver,
            subject=subject,
            body=body,
            is_private=is_private,
            attachment=attachment,
            status='sent',
            sent_at=timezone.now()
        )
        
        return message
    
    @staticmethod
    def get_user_messages(user, message_type='all'):
        """
        Get all messages for a user (sent and received)
        
        Args:
            user: User object
            message_type: 'all', 'sent', 'received', 'inbox'
        
        Returns:
            QuerySet of Message objects
        """
        if message_type == 'sent':
            # Only sent messages
            messages = Message.objects.filter(sender=user)
        elif message_type == 'received':
            # Only received messages
            messages = Message.objects.filter(receiver=user)
        elif message_type == 'inbox':
            # Inbox: received private messages + public messages
            messages = Message.objects.filter(
                models.Q(receiver=user) | models.Q(is_private=False)
            )
        else:
            # All messages (sent and received)
            messages = Message.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user) | models.Q(is_private=False)
            )
        
        # Exclude deleted messages
        messages = messages.exclude(status='deleted')
        
        return messages.order_by('-created_at')
    
    @staticmethod
    def mark_as_read(message, user):
        """
        Mark message as read
        
        Args:
            message: Message object
            user: User object (must be receiver)
        """
        if message.receiver != user:
            raise ValidationError('فقط گیرنده می‌تواند پیام را به عنوان خوانده شده علامت بزند')
        
        message.mark_as_read()
        return message
    
    @staticmethod
    def get_message_by_id(message_id, user=None):
        """
        Get message by ID with access control
        
        Args:
            message_id: Message ID
            user: User object (optional, None for public access)
        
        Returns:
            Message object
        """
        try:
            message = Message.objects.get(id=message_id)
            
            if message.is_private:
                if not user:
                    raise ValidationError('این پیام خصوصی است و نیاز به احراز هویت دارد')
                if message.sender != user and message.receiver != user:
                    raise ValidationError('شما دسترسی به این پیام ندارید')
            
            return message
        except Message.DoesNotExist:
            raise ValidationError('پیام یافت نشد')
    
    @staticmethod
    def get_message_by_public_link(public_link, user=None):
        """
        Get message by public link
        
        Args:
            public_link: UUID public link
            user: User object (optional)
        
        Returns:
            Message object
        """
        try:
            message = Message.objects.get(public_link=public_link)
            
            if message.is_private:
                if not user:
                    raise ValidationError('این پیام خصوصی است و نیاز به احراز هویت دارد')
                if message.sender != user and message.receiver != user:
                    raise ValidationError('شما دسترسی به این پیام ندارید')
            
            return message
        except Message.DoesNotExist:
            raise ValidationError('پیام یافت نشد')

