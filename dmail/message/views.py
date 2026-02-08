from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError
from django.db import models
from .serializers import MessageCreateSerializer, MessageListSerializer, MessageDetailSerializer, ContactSerializer, BlockUserSerializer
from .services import MessageService


class SendMessageView(APIView):
    """
    API View for sending a message
    POST /api/message/send/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request):
        """
        Send a new message
        Body: {
            subject: string (required),
            body: string (required),
            is_private: boolean (default: true),
            receiver_email: string (required if is_private=true),
            attachment: file (optional, max 10MB)
        }
        """
        serializer = MessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                message = MessageService.create_message(
                    sender=request.user,
                    subject=serializer.validated_data['subject'],
                    body=serializer.validated_data['body'],
                    is_private=serializer.validated_data.get('is_private', True),
                    receiver_email=serializer.validated_data.get('receiver_email'),
                    attachment=serializer.validated_data.get('attachment')
                )
                
                # Serialize response
                response_serializer = MessageListSerializer(message, context={'request': request})
                
                return Response({
                    'message': 'پیام با موفقیت ارسال شد',
                    'data': response_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageListView(APIView):
    """
    API View for listing user messages (inbox/home page)
    GET /api/message/list/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all messages for authenticated user
        Query params:
            - type: 'all', 'sent', 'received', 'inbox' (default: 'inbox')
        """
        message_type = request.query_params.get('type', 'inbox')
        
        try:
            messages = MessageService.get_user_messages(
                user=request.user,
                message_type=message_type
            )
            
            serializer = MessageListSerializer(messages, many=True, context={'request': request})
            
            return Response({
                'message': 'لیست پیام‌ها با موفقیت دریافت شد',
                'count': messages.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class MessageDetailView(APIView):
    """
    API View for viewing a single message
    GET /api/message/<id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, message_id):
        """
        Get message details by ID
        Requires: Bearer Token
        Checks: User must be sender or receiver if private
        """
        try:
            message = MessageService.get_message_by_id(
                message_id=message_id,
                user=request.user
            )
            
            serializer = MessageDetailSerializer(message, context={'request': request})
            
            return Response({
                'message': 'پیام با موفقیت دریافت شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class MessagePublicView(APIView):
    """
    API View for viewing a message via public link
    GET /api/message/public/<public_link>/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, public_link):
        """
        Get message details by public link
        No authentication required for public messages
        Authentication required for private messages (must be sender or receiver)
        """
        try:
            user = request.user if request.user.is_authenticated else None
            message = MessageService.get_message_by_public_link(
                public_link=public_link,
                user=user
            )
            
            serializer = MessageDetailSerializer(message, context={'request': request})
            
            return Response({
                'message': 'پیام با موفقیت دریافت شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class MarkAsReadView(APIView):
    """
    API View for marking a message as read
    POST /api/message/<id>/mark-read/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, message_id):
        """
        Mark message as read
        Requires: Bearer Token
        User must be receiver of the message
        """
        try:
            message = MessageService.get_message_by_id(
                message_id=message_id,
                user=request.user
            )
            
            MessageService.mark_as_read(message, request.user)
            
            serializer = MessageDetailSerializer(message, context={'request': request})
            
            return Response({
                'message': 'پیام به عنوان خوانده شده علامت زده شد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ContactListView(APIView):
    """
    API View for listing user contacts
    GET /api/message/contacts/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get all contacts for authenticated user
        Contacts are users who have sent or received messages from the user
        """
        try:
            contacts = MessageService.get_user_contacts(user=request.user)
            
            serializer = ContactSerializer(contacts, many=True, context={'request': request, 'user': request.user})
            
            return Response({
                'message': 'لیست کانتکت‌ها با موفقیت دریافت شد',
                'count': contacts.count(),
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ToggleStarView(APIView):
    """
    API View for toggling star status of a message
    POST /api/message/<id>/toggle-star/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, message_id):
        """
        Toggle star status of a message
        Requires: Bearer Token
        User must be sender or receiver of the message
        """
        try:
            message = MessageService.get_message_by_id(
                message_id=message_id,
                user=request.user
            )
            
            MessageService.toggle_star(message, request.user)
            
            serializer = MessageDetailSerializer(message, context={'request': request})
            
            return Response({
                'message': 'وضعیت ستاره پیام تغییر کرد',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        except ValidationError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class BlockUserView(APIView):
    """
    API View for blocking a user
    POST /api/message/block/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Block a user (prevent them from sending messages)
        Body: {email, is_spam}
        """
        serializer = BlockUserSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                block = MessageService.block_user(
                    blocker=request.user,
                    blocked_email=serializer.validated_data['email'],
                    is_spam=serializer.validated_data.get('is_spam', False)
                )
                
                return Response({
                    'message': 'کاربر با موفقیت بلاک شد',
                    'data': {
                        'blocked_email': serializer.validated_data['email'],
                        'is_spam': block.is_spam
                    }
                }, status=status.HTTP_200_OK)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnblockUserView(APIView):
    """
    API View for unblocking a user
    POST /api/message/unblock/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Unblock a user
        Body: {email}
        """
        serializer = BlockUserSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                MessageService.unblock_user(
                    blocker=request.user,
                    blocked_email=serializer.validated_data['email']
                )
                
                return Response({
                    'message': 'کاربر با موفقیت آنبلاک شد'
                }, status=status.HTTP_200_OK)
            
            except ValidationError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
