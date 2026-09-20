# Fitopia Dashboard — Docker Deploy

Frontend React (Vite) را با nginx در یک ایمیج production اجرا می‌کند.
بک‌اند فعلی: `https://fitopiaapi.pythonanywhere.com/api`

## پیش‌نیاز روی سرور

- Docker Engine 24+
- Docker Compose v2 (`docker compose`)

```bash
# Ubuntu/Debian مثال
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# logout/login بعد از اضافه شدن به گروه docker
```

## استقرار سریع

```bash
# 1) کلون از گیت‌هاب
git clone https://github.com/MErfanPld/Fitopia-Dashboard-React-App.git
cd Fitopia-Dashboard-React-App

# 2) (اختیاری) تنظیم پورت / API
cp .env.docker.example .env.docker
# ویرایش .env.docker در صورت نیاز

# 3) بیلد و اجرا
chmod +x docker-deploy.sh
./docker-deploy.sh

# یا دستی:
docker compose up -d --build
```

## دستورات مفید

```bash
docker compose ps
docker compose logs -f fitopia-web
docker compose restart
docker compose down

# ری‌بیلد بعد از تغییر کد
docker compose up -d --build
```

## پورت

پیش‌فرض: **80** روی هاست → کانتینر 80

```bash
# مثال پورت 8080
echo "HOST_PORT=8080" >> .env.docker
docker compose up -d --build
```

## Healthcheck

```
GET /health  →  200 ok
```

## تغییر آدرس API

در `.env.docker`:

```
VITE_API_BASE_URL=https://your-api.example.com/api
```

سپس دوباره بیلد کنید (`VITE_*` فقط در زمان build اعمال می‌شود).

## HTTPS (پیشنهاد)

روی سرور با Nginx/Caddy/Traefik به‌عنوان reverse proxy جلوی کانتینر SSL بگذارید
یا پورت 80 را پشت Cloudflare/LB قرار دهید.

## فایل‌ها

| فایل | نقش |
|------|-----|
| `Dockerfile` | multi-stage: npm build → nginx |
| `nginx.conf` | SPA + cache + /health + پروکسی اختیاری `/api` |
| `docker-compose.yml` | سرویس `fitopia-web` |
| `.dockerignore` | سبک‌تر شدن کانتکست بیلد |
| `docker-deploy.sh` | یک‌کلیکی بیلد و اجرا |
