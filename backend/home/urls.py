from django.urls import path
from .views import AuthView, HomeView, InboxView, MessageDetailView

app_name = 'home'

urlpatterns = [
    path('', AuthView.as_view(), name='auth'),
    path('login/', AuthView.as_view(), name='login'),
    path('register/', AuthView.as_view(), name='register'),
    path('home/', HomeView.as_view(), name='home'),
    path('inbox/', InboxView.as_view(), name='inbox'),
    path('message/<int:message_id>/', MessageDetailView.as_view(), name='message_detail'),
]

