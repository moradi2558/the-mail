# 📬 D-Mail Project

A comprehensive Django-based platform combining email/messaging and music management services with RESTful API architecture.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Services](#services)

---

## 🎯 Overview

D-Mail is a full-stack web application built with Django REST Framework that provides two main services:

- **📧 Email/Message Service**: A complete messaging system with advanced features for communication
- **🎵 Music Service**: A comprehensive music management and playback system

Both services are integrated into a single Django project with shared authentication and user management.

---

## ✨ Features

### Email/Message Service
- Private and public messaging
- File attachments (up to 10MB)
- Message organization (star, archive, important)
- Spam management and user blocking
- Contact management
- Public message links

### Music Service
- Music file upload (single and batch)
- Automatic metadata extraction
- Playlist management with collaborative sharing
- Favorites system
- Playback state tracking
- Playlist invitations

### Shared Features
- JWT-based authentication
- User profile management
- RESTful API architecture
- Admin panel with Jazzmin

---

## 📁 Project Structure

```
the-mail/
├── backend/                 # Django backend application
│   ├── acoount/            # User account management
│   ├── message/            # Email/message service
│   ├── music/              # Music service
│   ├── home/               # Home page and dashboard
│   ├── dmail/              # Django project settings
│   ├── manage.py           # Django management script
│   └── requirements.txt    # Python dependencies
├── frontend/               # Frontend application (ready for development)
├── venv/                   # Python virtual environment
└── README.md               # This file
```

---

## 🚀 Getting Started

### Requirements

- **Python**: 3.8 or higher
- **Django**: 4.2+
- **Database**: PostgreSQL (recommended) or SQLite
- **Package Manager**: pip

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd the-mail
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

### Running the Project

**Start the development server:**
```bash
python manage.py runserver
```

The application will be available at:
- **API Base URL**: `http://localhost:8000/api/`
- **Admin Panel**: `http://localhost:8000/admin/`
- **Home Page**: `http://localhost:8000/`

---

## 📦 Requirements

Key dependencies include:

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- django-cors-headers 4.4.0
- django-jazzmin 2.6.0
- mutagen 1.47.0 (for audio metadata)
- Pillow 10.1.0 (for image processing)

See `backend/requirements.txt` for the complete list.

---

## 🔧 Services

### Account Service (`/api/account/`)
User authentication, registration, profile management, and JWT token handling.

### Message Service (`/api/message/`)
Complete messaging system with inbox, sent messages, attachments, and organization features.

**Documentation**: See [backend/message/README.md](backend/message/README.md)

### Music Service (`/api/music/`)
Music file management, playlists, favorites, and playback state tracking.

**Documentation**: See [backend/music/README.md](backend/music/README.md)

---

## 🔐 Authentication

The project uses JWT (JSON Web Tokens) for authentication. Most API endpoints require authentication:

```
Authorization: Bearer <access_token>
```

Public endpoints:
- User registration
- User login
- Public message viewing (via public links)

---

---

# 📬 پروژه D-Mail

پلتفرم جامع مبتنی بر Django که سرویس‌های ایمیل/پیام‌رسانی و مدیریت موزیک را با معماری RESTful API ترکیب می‌کند.

---

## 📋 فهرست مطالب

- [نمای کلی](#نمای-کلی)
- [ویژگی‌ها](#ویژگیها)
- [ساختار پروژه](#ساختار-پروژه)
- [شروع کار](#شروع-کار)
- [نیازمندی‌ها](#نیازمندیها)
- [نصب](#نصب)
- [اجرای پروژه](#اجرای-پروژه)
- [سرویس‌ها](#سرویسها)

---

## 🎯 نمای کلی

D-Mail یک برنامه وب full-stack ساخته شده با Django REST Framework است که دو سرویس اصلی ارائه می‌دهد:

- **📧 سرویس ایمیل/پیام**: یک سیستم پیام‌رسانی کامل با قابلیت‌های پیشرفته برای ارتباط
- **🎵 سرویس موزیک**: یک سیستم جامع مدیریت و پخش موسیقی

هر دو سرویس در یک پروژه Django یکپارچه شده‌اند با احراز هویت و مدیریت کاربر مشترک.

---

## ✨ ویژگی‌ها

### سرویس ایمیل/پیام
- پیام‌رسانی خصوصی و عمومی
- فایل ضمیمه (تا 10 مگابایت)
- سازماندهی پیام‌ها (ستاره، آرشیو، مهم)
- مدیریت اسپم و بلاک کاربران
- مدیریت کانتکت‌ها
- لینک‌های پیام عمومی

### سرویس موزیک
- آپلود فایل موزیک (تک و دسته‌ای)
- استخراج خودکار متادیتا
- مدیریت پلی‌لیست با اشتراک‌گذاری مشترک
- سیستم علاقه‌مندی‌ها
- ردیابی وضعیت پخش
- دعوت به پلی‌لیست

### ویژگی‌های مشترک
- احراز هویت مبتنی بر JWT
- مدیریت پروفایل کاربر
- معماری RESTful API
- پنل ادمین با Jazzmin

---

## 📁 ساختار پروژه

```
the-mail/
├── backend/                 # برنامه backend Django
│   ├── acoount/            # مدیریت حساب کاربری
│   ├── message/            # سرویس ایمیل/پیام
│   ├── music/              # سرویس موزیک
│   ├── home/               # صفحه اصلی و داشبورد
│   ├── dmail/              # تنظیمات پروژه Django
│   ├── manage.py           # اسکریپت مدیریت Django
│   └── requirements.txt    # وابستگی‌های Python
├── frontend/               # برنامه frontend (آماده برای توسعه)
├── venv/                   # محیط مجازی Python
└── README.md               # این فایل
```

---

## 🚀 شروع کار

### نیازمندی‌ها

- **Python**: 3.8 یا بالاتر
- **Django**: 4.2+
- **پایگاه داده**: PostgreSQL (توصیه می‌شود) یا SQLite
- **مدیر بسته**: pip

### نصب

1. **کلون کردن مخزن:**
   ```bash
   git clone <repository-url>
   cd the-mail
   ```

2. **ایجاد و فعال‌سازی محیط مجازی:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **رفتن به پوشه backend:**
   ```bash
   cd backend
   ```

4. **نصب وابستگی‌ها:**
   ```bash
   pip install -r requirements.txt
   ```

5. **اجرای migrations پایگاه داده:**
   ```bash
   python manage.py migrate
   ```

6. **ایجاد superuser (اختیاری، برای دسترسی ادمین):**
   ```bash
   python manage.py createsuperuser
   ```

### اجرای پروژه

**شروع سرور توسعه:**
```bash
python manage.py runserver
```

برنامه در آدرس‌های زیر در دسترس خواهد بود:
- **آدرس پایه API**: `http://localhost:8000/api/`
- **پنل ادمین**: `http://localhost:8000/admin/`
- **صفحه اصلی**: `http://localhost:8000/`

---

## 📦 نیازمندی‌ها

وابستگی‌های کلیدی شامل:

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- django-cors-headers 4.4.0
- django-jazzmin 2.6.0
- mutagen 1.47.0 (برای متادیتای صوتی)
- Pillow 10.1.0 (برای پردازش تصویر)

برای لیست کامل، `backend/requirements.txt` را ببینید.

---

## 🔧 سرویس‌ها

### سرویس حساب کاربری (`/api/account/`)
احراز هویت کاربر، ثبت‌نام، مدیریت پروفایل و مدیریت توکن JWT.

### سرویس پیام (`/api/message/`)
سیستم پیام‌رسانی کامل با صندوق ورودی، پیام‌های ارسالی، ضمیمه‌ها و ویژگی‌های سازماندهی.

**مستندات**: [backend/message/README.md](backend/message/README.md) را ببینید

### سرویس موزیک (`/api/music/`)
مدیریت فایل موزیک، پلی‌لیست‌ها، علاقه‌مندی‌ها و ردیابی وضعیت پخش.

**مستندات**: [backend/music/README.md](backend/music/README.md) را ببینید

---

## 🔐 احراز هویت

پروژه از JWT (JSON Web Tokens) برای احراز هویت استفاده می‌کند. اکثر endpoint‌های API نیاز به احراز هویت دارند:

```
Authorization: Bearer <access_token>
```

Endpoint‌های عمومی:
- ثبت‌نام کاربر
- ورود کاربر
- مشاهده پیام عمومی (از طریق لینک‌های عمومی)
