from django.urls import path
from .views import SendMessageView, MessageListView, MessageDetailView, MessagePublicView, MarkAsReadView, ContactListView, ToggleStarView, BlockUserView, UnblockUserView, MarkSenderAsSpamView, ArchiveMessageView, BlockedUsersListView, SearchEmailsView

app_name = 'message'

urlpatterns = [
    path('send/', SendMessageView.as_view(), name='send'),
    path('list/', MessageListView.as_view(), name='list'),
    path('contacts/', ContactListView.as_view(), name='contacts'),
    path('search-emails/', SearchEmailsView.as_view(), name='search-emails'),
    path('block/', BlockUserView.as_view(), name='block'),
    path('blocked/', BlockedUsersListView.as_view(), name='blocked-list'),
    path('unblock/', UnblockUserView.as_view(), name='unblock'),
    path('<int:message_id>/', MessageDetailView.as_view(), name='detail'),
    path('<int:message_id>/mark-read/', MarkAsReadView.as_view(), name='mark-read'),
    path('<int:message_id>/toggle-star/', ToggleStarView.as_view(), name='toggle-star'),
    path('<int:message_id>/archive/', ArchiveMessageView.as_view(), name='archive'),
    path('<int:message_id>/mark-sender-spam/', MarkSenderAsSpamView.as_view(), name='mark-sender-spam'),
    path('public/<uuid:public_link>/', MessagePublicView.as_view(), name='public'),
]

