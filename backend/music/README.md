# 🎵 Music Service

A comprehensive music management and playback system built with Django REST Framework.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)

---

## 🚀 Getting Started

### Requirements

- Python 3.8+
- Django 4.2+
- Django REST Framework
- PostgreSQL (recommended) or SQLite

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
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

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

The service will be available at `http://localhost:8000/api/music/`

---

## ✨ Features

### Song Management
- **Single & Multiple Upload**: Upload one or multiple music files simultaneously
- **Automatic Metadata Extraction**: Auto-extract title, artist, album, and duration from audio files using Mutagen
- **Supported Formats**: MP3, WAV, FLAC, M4A, OGG, AAC
- **Access Control**: Private and public songs with granular permissions
- **Batch Operations**: Update public/private status of multiple songs at once
- **File Size Tracking**: Automatic file size calculation and storage

### Playlists
- **Create & Manage**: Build unlimited personal playlists
- **Collaborative Sharing**: Invite users to playlists for collaborative management
- **Song Management**: Add and remove songs from playlists with ease
- **Member Management**: Control who can edit and view your playlists
- **Playlist Editing**: Rename playlists and manage members dynamically

### Favorites System
- **Automatic Favorites**: Quick access to your favorite songs
- **One-Click Toggle**: Add or remove songs from favorites instantly
- **Dedicated Playlist**: Favorites are managed through a special playlist

### Playback State
- **Position Tracking**: Automatically save last played song and playback position
- **Resume Playback**: Seamlessly continue from where you left off
- **Cross-Device Sync**: Playback state is synced across all your devices

### Invitation System
- **Playlist Invitations**: Send email-based invitations to users for playlist membership
- **Invitation Management**: View, accept, and reject invitations with status tracking
- **Pending Invitations**: Track all pending invitations in one place

---

## 📦 Requirements

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- mutagen 1.47.0 (for audio metadata extraction)
- Pillow 10.1.0 (for image processing if needed)

---

# 🎵 سرویس موزیک

سیستم جامع مدیریت و پخش موسیقی ساخته شده با Django REST Framework.

---

## 📋 فهرست مطالب

- [شروع کار](#شروع-کار)
- [ویژگی‌ها](#ویژگیها)
- [نیازمندی‌ها](#نیازمندیها)
- [نصب](#نصب)

---

## 🚀 شروع کار

### نیازمندی‌ها

- Python 3.8+
- Django 4.2+
- Django REST Framework
- PostgreSQL (توصیه می‌شود) یا SQLite

### نصب

1. **رفتن به پوشه backend:**
   ```bash
   cd backend
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

3. **نصب وابستگی‌ها:**
   ```bash
   pip install -r requirements.txt
   ```

4. **اجرای migrations:**
   ```bash
   python manage.py migrate
   ```

5. **ایجاد superuser (اختیاری):**
   ```bash
   python manage.py createsuperuser
   ```

6. **اجرای سرور توسعه:**
   ```bash
   python manage.py runserver
   ```

سرویس در آدرس `http://localhost:8000/api/music/` در دسترس خواهد بود.

---

## ✨ ویژگی‌ها

### مدیریت آهنگ‌ها
- **آپلود تک و چندتایی**: آپلود یک یا چند فایل موزیک به صورت همزمان
- **استخراج خودکار متادیتا**: استخراج خودکار عنوان، خواننده، آلبوم و مدت زمان از فایل‌های صوتی با استفاده از Mutagen
- **فرمت‌های پشتیبانی شده**: MP3, WAV, FLAC, M4A, OGG, AAC
- **کنترل دسترسی**: آهنگ‌های خصوصی و عمومی با مجوزهای دقیق
- **عملیات دسته‌ای**: تغییر وضعیت عمومی/خصوصی چند آهنگ به صورت همزمان
- **ردیابی حجم فایل**: محاسبه و ذخیره خودکار حجم فایل

### پلی‌لیست‌ها
- **ایجاد و مدیریت**: ساخت پلی‌لیست‌های شخصی نامحدود
- **اشتراک‌گذاری مشترک**: دعوت کاربران به پلی‌لیست برای مدیریت مشترک
- **مدیریت آهنگ‌ها**: افزودن و حذف آهنگ از پلی‌لیست به راحتی
- **مدیریت اعضا**: کنترل اینکه چه کسانی می‌توانند پلی‌لیست شما را ویرایش و مشاهده کنند
- **ویرایش پلی‌لیست**: تغییر نام پلی‌لیست و مدیریت اعضا به صورت پویا

### سیستم علاقه‌مندی‌ها
- **علاقه‌مندی خودکار**: دسترسی سریع به آهنگ‌های مورد علاقه شما
- **تغییر یک کلیکی**: افزودن یا حذف آهنگ از علاقه‌مندی‌ها به صورت فوری
- **پلی‌لیست اختصاصی**: علاقه‌مندی‌ها از طریق یک پلی‌لیست ویژه مدیریت می‌شوند

### وضعیت پخش
- **ردیابی موقعیت**: ذخیره خودکار آخرین آهنگ پخش شده و موقعیت پخش
- **ادامه پخش**: ادامه بدون وقفه از جایی که متوقف شده‌اید
- **همگام‌سازی بین دستگاه‌ها**: وضعیت پخش در تمام دستگاه‌های شما همگام می‌شود

### سیستم دعوت
- **دعوت به پلی‌لیست**: ارسال دعوت مبتنی بر ایمیل به کاربران برای عضویت در پلی‌لیست
- **مدیریت دعوت‌ها**: مشاهده، پذیرش و رد دعوت‌ها با ردیابی وضعیت
- **دعوت‌های در انتظار**: ردیابی تمام دعوت‌های در انتظار در یک مکان

---

## 📦 نیازمندی‌ها

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- mutagen 1.47.0 (برای استخراج متادیتای صوتی)
- Pillow 10.1.0 (برای پردازش تصویر در صورت نیاز)

