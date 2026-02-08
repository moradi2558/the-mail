# Backend - Django API

این پوشه شامل تمام فایل‌های backend پروژه Django است.

## ساختار پروژه

```
backend/
├── manage.py          # فایل مدیریت Django
├── dmail/             # تنظیمات اصلی پروژه
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── acoount/           # اپلیکیشن مدیریت کاربران
├── message/           # اپلیکیشن مدیریت پیام‌ها
└── home/              # اپلیکیشن صفحه اصلی
```

## نصب و راه‌اندازی

1. فعال‌سازی محیط مجازی:
```bash
# Windows
..\venv\Scripts\activate

# Linux/Mac
source ../venv/bin/activate
```

2. نصب وابستگی‌ها:
```bash
pip install -r requirements.txt
```

3. اجرای migrations:
```bash
python manage.py migrate
```

4. ایجاد superuser:
```bash
python manage.py createsuperuser
```

5. اجرای سرور:
```bash
python manage.py runserver
```

## API Endpoints

### Account APIs
- `POST /api/account/register/` - ثبت‌نام
- `POST /api/account/login/` - ورود
- `GET /api/account/profile/` - پروفایل کاربر
- `GET/PUT /api/account/profile/detail/` - جزئیات پروفایل
- `POST /api/account/change-password/` - تغییر پسوورد

### Message APIs
- `POST /api/message/send/` - ارسال پیام
- `GET /api/message/list/` - لیست پیام‌ها
- `GET /api/message/contacts/` - لیست کانتکت‌ها
- `GET /api/message/<id>/` - جزئیات پیام
- `POST /api/message/<id>/mark-read/` - علامت‌گذاری به عنوان خوانده شده
- `POST /api/message/<id>/toggle-star/` - ستاره‌دار کردن پیام
- `POST /api/message/block/` - بلاک کردن کاربر
- `POST /api/message/unblock/` - آنبلاک کردن کاربر
- `GET /api/message/public/<public_link>/` - مشاهده پیام با لینک عمومی

## Authentication

تمام APIها (به جز register, login و public message) نیاز به JWT Token دارند:

```
Authorization: Bearer <access_token>
```

