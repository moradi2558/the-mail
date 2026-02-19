# 📧 Email/Message Service

A comprehensive communication system with advanced features for sending, receiving, and managing messages.

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

The service will be available at `http://localhost:8000/api/message/`

---

## ✨ Features

### Sending & Receiving
- **Private & Public Messages**: Send messages to specific users or create public messages accessible via unique links
- **File Attachments**: Send attachments up to 10MB with support for multiple file types
- **Supported Formats**: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, ZIP, RAR
- **Public Links**: Each message has a unique UUID-based public link for easy sharing
- **Message Status Tracking**: Track sent, delivered, and read status for all messages

### Message Management
- **Inbox**: Centralized inbox for all received messages
- **Sent Messages**: Access and manage all sent messages
- **Advanced Search**: Full-text search across message subjects and bodies
- **Filter by Type**: Filter messages by type (all, received, sent, inbox)
- **Message Threading**: Organize conversations efficiently

### Organization
- **Star Messages**: Mark important messages with stars for quick access
- **Archive System**: Archive and unarchive messages to keep your inbox clean
- **Read Status**: Automatic tracking of message read status with timestamps
- **Important Flag**: Mark messages as important for priority handling
- **Spam Detection**: Automatic spam filtering and management

### Security & Privacy
- **User Blocking**: Block specific users to prevent unwanted messages
- **Spam Management**: Mark senders as spam with automatic filtering
- **Auto Filter**: Automatically move spam messages to spam folder
- **Blocked List Management**: View and manage your blocked users list
- **Privacy Controls**: Control who can send you messages

### Contacts
- **Automatic Contact Management**: Automatically build contact list from message history
- **Email Search**: Quick email autocomplete search for fast message composition
- **Contact Details**: View contact information and message history

---

## 📦 Requirements

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- Pillow 10.1.0 (for image processing)

---

# 📧 سرویس ایمیل/پیام

سیستم جامع ارتباطی با قابلیت‌های پیشرفته برای ارسال، دریافت و مدیریت پیام‌ها.

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

سرویس در آدرس `http://localhost:8000/api/message/` در دسترس خواهد بود.

---

## ✨ ویژگی‌ها

### ارسال و دریافت
- **پیام‌های خصوصی و عمومی**: ارسال پیام به کاربران خاص یا ایجاد پیام عمومی قابل دسترسی از طریق لینک‌های منحصر به فرد
- **فایل ضمیمه**: ارسال فایل‌های ضمیمه تا 10 مگابایت با پشتیبانی از انواع مختلف فایل
- **فرمت‌های پشتیبانی شده**: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, ZIP, RAR
- **لینک‌های عمومی**: هر پیام دارای یک لینک عمومی مبتنی بر UUID برای اشتراک‌گذاری آسان
- **ردیابی وضعیت پیام**: ردیابی وضعیت ارسال، تحویل و خوانده شدن برای تمام پیام‌ها

### مدیریت پیام‌ها
- **صندوق ورودی**: صندوق ورودی متمرکز برای تمام پیام‌های دریافتی
- **پیام‌های ارسالی**: دسترسی و مدیریت تمام پیام‌های ارسال شده
- **جستجوی پیشرفته**: جستجوی متن کامل در موضوع و متن پیام‌ها
- **فیلتر بر اساس نوع**: فیلتر پیام‌ها بر اساس نوع (همه، دریافتی، ارسالی، صندوق ورودی)
- **رشته‌بندی پیام‌ها**: سازماندهی مکالمات به صورت کارآمد

### سازماندهی
- **ستاره‌دار کردن پیام‌ها**: علامت‌گذاری پیام‌های مهم با ستاره برای دسترسی سریع
- **سیستم آرشیو**: آرشیو و خارج کردن از آرشیو پیام‌ها برای تمیز نگه داشتن صندوق ورودی
- **وضعیت خوانده شده**: ردیابی خودکار وضعیت خوانده شدن پیام با برچسب زمان
- **پرچم مهم**: علامت‌گذاری پیام‌ها به عنوان مهم برای مدیریت اولویت
- **تشخیص اسپم**: فیلتر و مدیریت خودکار اسپم

### امنیت و حریم خصوصی
- **بلاک کاربران**: بلاک کاربران خاص برای جلوگیری از دریافت پیام‌های ناخواسته
- **مدیریت اسپم**: علامت‌گذاری فرستندگان به عنوان اسپم با فیلتر خودکار
- **فیلتر خودکار**: انتقال خودکار پیام‌های اسپم به پوشه اسپم
- **مدیریت لیست بلاک شده‌ها**: مشاهده و مدیریت لیست کاربران بلاک شده شما
- **کنترل حریم خصوصی**: کنترل اینکه چه کسانی می‌توانند به شما پیام ارسال کنند

### کانتکت‌ها
- **مدیریت خودکار کانتکت‌ها**: ساخت خودکار لیست کانتکت از تاریخچه پیام‌ها
- **جستجوی ایمیل**: جستجوی سریع autocomplete ایمیل برای نوشتن سریع پیام
- **جزئیات کانتکت**: مشاهده اطلاعات کانتکت و تاریخچه پیام

---

## 📦 نیازمندی‌ها

- Django 4.2.7
- djangorestframework 3.14.0
- djangorestframework-simplejwt 5.3.0
- Pillow 10.1.0 (برای پردازش تصویر)

