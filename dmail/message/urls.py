from django.urls import path
from .views import SendMessageView, MessageListView, MessageDetailView, MessagePublicView, MarkAsReadView, ContactListView

app_name = 'message'

urlpatterns = [
    path('send/', SendMessageView.as_view(), name='send'),
    path('list/', MessageListView.as_view(), name='list'),
    path('contacts/', ContactListView.as_view(), name='contacts'),
    path('<int:message_id>/', MessageDetailView.as_view(), name='detail'),
    path('<int:message_id>/mark-read/', MarkAsReadView.as_view(), name='mark-read'),
    path('public/<uuid:public_link>/', MessagePublicView.as_view(), name='public'),
]

