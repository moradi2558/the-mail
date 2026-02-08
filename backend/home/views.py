from django.shortcuts import render, redirect
from django.views.generic import TemplateView


class AuthView(TemplateView):
    template_name = 'account/auth.html'
    
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class HomeView(TemplateView):
    template_name = 'account/home.html'
    
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class InboxView(TemplateView):
    template_name = 'account/inbox.html'
    
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class MessageDetailView(TemplateView):
    template_name = 'account/message_detail.html'
    
    def get(self, request, message_id, *args, **kwargs):
        return render(request, self.template_name, {'message_id': message_id})
