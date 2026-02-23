# folder2txt

این پروژه یک وب‌اپلیکیشن ساده و کاربردی است که به کاربر امکان می‌دهد مسیر یک پوشه را روی سرور وارد کند و در خروجی یک فایل متنی شامل ساختار درختی و محتوای تمام فایل‌های متنی آن پوشه دریافت کند. طراحی بسیار سبک و بدون وابستگی‌های اضافی است.

## اجرای برنامه

### حالت توسعه (با nodemon):

```bash
npm install
cp .env.example .env
# ویرایش .env
npm run dev
```

## ساخت نسخه‌ی نهایی و اجرا:

```bash
npm run build
npm start
```

## تست

برای تست می‌توان از ابزارهایی مانند curl یا Postman استفاده کرد:

```bash
curl -X POST -d "folderPath=/home/user/project" http://localhost:3000/process --output output.txt
```

در مرورگر به آدرس http://localhost:3000 بروید و مسیر یک پوشه را وارد کنید (مثلاً C:\Projects\myapp در ویندوز یا /home/user/myapp در لینوکس/مک). دقت کنید که سرور باید به آن مسیر دسترسی داشته باشد.
