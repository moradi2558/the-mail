from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import models
from .models import Message, Block

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
            
            # Check if sender is blocked by receiver
            if MessageService.is_blocked(blocker=receiver, blocked=sender):
                raise ValidationError('شما توسط این کاربر بلاک شده‌اید و نمی‌توانید پیام ارسال کنید')
        
        # Check if sender is marked as spam by receiver
        is_spam = False
        if receiver:
            is_spam = MessageService.is_spam_sender(blocker=receiver, blocked=sender)
        
        # Create message
        message = Message.objects.create(
            sender=sender,
            receiver=receiver,
            subject=subject,
            body=body,
            is_private=is_private,
            attachment=attachment,
            status='sent',
            sent_at=timezone.now(),
            is_spam=is_spam
        )
        
        return message
    
    @staticmethod
    def get_user_messages(user, message_type='all', search_query=None):
        """
        Get all messages for a user (sent and received)
        
        Args:
            user: User object
            message_type: 'all', 'sent', 'received', 'inbox'
            search_query: Optional search query string
        
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
            # Inbox: received private messages + public messages (excluding spam and archived)
            messages = Message.objects.filter(
                models.Q(receiver=user) | models.Q(is_private=False)
            ).exclude(is_spam=True).exclude(status='archived')
        elif message_type == 'starred':
            # Only starred messages
            messages = Message.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user) | models.Q(is_private=False),
                is_starred=True
            )
        elif message_type == 'spam':
            # Only spam messages
            messages = Message.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user) | models.Q(is_private=False),
                is_spam=True
            )
        elif message_type == 'archived':
            # Only archived messages
            messages = Message.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user) | models.Q(is_private=False),
                status='archived'
            )
        else:
            # All messages (sent and received)
            messages = Message.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user) | models.Q(is_private=False)
            )
        
        # Exclude deleted messages
        messages = messages.exclude(status='deleted')
        
        # Apply search query if provided
        if search_query and search_query.strip():
            search_query = search_query.strip()
            messages = messages.filter(
                models.Q(subject__icontains=search_query) |
                models.Q(body__icontains=search_query) |
                models.Q(sender__email__icontains=search_query) |
                models.Q(sender__username__icontains=search_query) |
                models.Q(receiver__email__icontains=search_query) |
                models.Q(receiver__username__icontains=search_query)
            )
        
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
    
    @staticmethod
    def is_blocked(blocker, blocked):
        """Check if a user is blocked by another user"""
        return Block.objects.filter(blocker=blocker, blocked=blocked).exists()
    
    @staticmethod
    def get_user_contacts(user):
        """Get all contacts for a user (users who have sent or received messages)"""
        sent_to = User.objects.filter(received_messages__sender=user).distinct()
        received_from = User.objects.filter(sent_messages__receiver=user).distinct()
        contacts = (sent_to | received_from).distinct().exclude(id=user.id)
        return contacts
    
    @staticmethod
    def toggle_star(message, user):
        """Toggle star status of a message"""
        if message.sender != user and message.receiver != user:
            raise ValidationError('شما دسترسی به این پیام ندارید')
        
        message.is_starred = not message.is_starred
        message.save()
        return message
    
    @staticmethod
    def block_user(blocker, blocked_email, is_spam=False):
        """Block a user"""
        try:
            blocked = User.objects.get(email=blocked_email)
        except User.DoesNotExist:
            raise ValidationError('کاربر با این ایمیل یافت نشد')
        
        if blocker == blocked:
            raise ValidationError('شما نمی‌توانید خودتان را بلاک کنید')
        
        block, created = Block.objects.get_or_create(
            blocker=blocker,
            blocked=blocked,
            defaults={'is_spam': is_spam}
        )
        
        if not created:
            block.is_spam = is_spam
            block.save()
        
        return block
    
    @staticmethod
    def unblock_user(blocker, blocked_email):
        """Unblock a user"""
        try:
            blocked = User.objects.get(email=blocked_email)
        except User.DoesNotExist:
            raise ValidationError('کاربر با این ایمیل یافت نشد')
        
        try:
            block = Block.objects.get(blocker=blocker, blocked=blocked)
            block.delete()
        except Block.DoesNotExist:
            raise ValidationError('این کاربر بلاک نشده است')
    
    @staticmethod
    def get_blocked_users(user):
        """Get all users blocked by a user"""
        blocks = Block.objects.filter(blocker=user).select_related('blocked')
        return [block.blocked for block in blocks]
    
    @staticmethod
    def mark_sender_as_spam(receiver, sender):
        """
        Mark a sender as spam for a receiver
        This will:
        1. Create/update Block with is_spam=True
        2. Mark all existing messages from sender to receiver as spam
        """
        if receiver == sender:
            raise ValidationError('شما نمی‌توانید خودتان را به عنوان اسپم علامت بزنید')
        
        # Create or update block with is_spam=True
        block, created = Block.objects.get_or_create(
            blocker=receiver,
            blocked=sender,
            defaults={'is_spam': True}
        )
        
        if not created:
            block.is_spam = True
            block.save()
        
        # Mark all existing messages from sender to receiver as spam
        Message.objects.filter(
            sender=sender,
            receiver=receiver
        ).update(is_spam=True)
        
        return block
    
    @staticmethod
    def unmark_sender_as_spam(receiver, sender):
        """
        Unmark a sender as spam for a receiver
        This will:
        1. Update Block with is_spam=False (or delete if only spam was set)
        2. Unmark all existing messages from sender to receiver as spam
        """
        if receiver == sender:
            raise ValidationError('شما نمی‌توانید خودتان را از اسپم خارج کنید')
        
        try:
            block = Block.objects.get(blocker=receiver, blocked=sender)
            # If block exists, set is_spam to False
            # If block was only for spam, we can delete it, but let's keep it with is_spam=False
            # in case user wants to block them later
            block.is_spam = False
            block.save()
        except Block.DoesNotExist:
            # If no block exists, nothing to do
            pass
        
        # Unmark all existing messages from sender to receiver as spam
        Message.objects.filter(
            sender=sender,
            receiver=receiver
        ).update(is_spam=False)
        
        return True
    
    @staticmethod
    def is_spam_sender(blocker, blocked):
        """Check if a user is marked as spam by another user"""
        try:
            block = Block.objects.get(blocker=blocker, blocked=blocked)
            return block.is_spam
        except Block.DoesNotExist:
            return False
    
    @staticmethod
    def archive_message(message, user):
        """Archive a message"""
        if message.sender != user and message.receiver != user:
            raise ValidationError('شما دسترسی به این پیام ندارید')
        
        message.status = 'archived'
        message.save()
        return message
    
    @staticmethod
    def unarchive_message(message, user):
        """Unarchive a message (restore to previous status)"""
        if message.sender != user and message.receiver != user:
            raise ValidationError('شما دسترسی به این پیام ندارید')
        
        # Restore to read if it was read, otherwise sent
        if message.read_at:
            message.status = 'read'
        else:
            message.status = 'sent'
        message.save()
        return message

