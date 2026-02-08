from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError
from django import forms
from .models import User


class UserCreationForm(UserCreationForm):
    """Form for creating new users"""
    password1 = forms.CharField(
        label='password',
        widget=forms.PasswordInput
    )
    password2 = forms.CharField(
        label='passwordconfirm',
        widget=forms.PasswordInput
    )
    
    class Meta:
        model = User
        fields = ('username', 'email')
    
    def clean_email(self):
        """Validate email uniqueness"""
        email = self.cleaned_data.get('email')
        if email:
            if User.objects.filter(email=email).exists():
                raise forms.ValidationError('این ایمیل از قبل وجود دارد')
        return email
    
    def clean_password2(self):
        """Validate password confirmation"""
        cleaned_data = self.cleaned_data
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        
        if password1 and len(password1) < 8:
            raise ValidationError('پسوورد شما باید حداقل 8 کاراکتر باشد')
        
        if password1 and password2 and password1 != password2:
            raise ValidationError('پسوورد ها شبیه هم نیستند')
        
        return password2
    
    def save(self, commit=True):
        """Save user with password"""
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class UserChangeForm(UserChangeForm):
    """Form for changing user information"""
    password = ReadOnlyPasswordHashField(
        help_text="you can change the password with this <a href=\"../password/\"> link </a>"
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'last_login')

