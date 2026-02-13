from django.urls import path
from .views import AuthView, DashboardView, HomeView, InboxView, MessageDetailView, MusicView

app_name = 'home'

urlpatterns = [
    path('', AuthView.as_view(), name='auth'),
    path('login/', AuthView.as_view(), name='login'),
    path('register/', AuthView.as_view(), name='register'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('home/', HomeView.as_view(), name='home'),
    path('inbox/', InboxView.as_view(), name='inbox'),
    path('music/', MusicView.as_view(), name='music'),
    path('message/<int:message_id>/', MessageDetailView.as_view(), name='message_detail'),
]

