from django.urls import path
from .views import SendMessageView, MessageListView, MessageDetailView, MessagePublicView

app_name = 'message'

urlpatterns = [
    path('send/', SendMessageView.as_view(), name='send'),
    path('list/', MessageListView.as_view(), name='list'),
    path('<int:message_id>/', MessageDetailView.as_view(), name='detail'),
    path('public/<uuid:public_link>/', MessagePublicView.as_view(), name='public'),
]

