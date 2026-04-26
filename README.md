# Webhook Logger Application

## Overview
This application consists of:
- A Node.js webhook listener (Express-based)
- A Bash script client that sends structured logs to the webhook

---

## Prerequisites

- Node.js (v16+ recommended)
- npm
- curl
- jq (for bash script)
- PM2 (for production use)

---

## Installation

```bash
git clone <your-repo-url>
cd <your-repo-folder>
npm install
```

Create a `.env` file (optional):

```bash
PORT=3000
```

---

## Running WITHOUT PM2 (Testing / Development)

### 1. Start the Node.js server

```bash
node app.js
```

You should see:
```
Webhook listener running on port 3000
```

---

### 2. Test with curl

```bash
curl -X POST -H "Content-Type: application/json"     -d '{"vscl_logger":"2*12345678*"}'     http://localhost:3000/bbyWebhook
```

Expected response:
```
Webhook received
```

---

### 3. Run the Bash script

```bash
chmod +x script.sh
./script.sh
```

Follow prompts to send data to the webhook.

---

## Running WITH PM2 (Production)

### 1. Install PM2 globally

```bash
npm install -g pm2
```

---

### 2. Start the application with PM2

```bash
pm2 start app.js --name webhook-listener
```

---

### 3. Verify it's running

```bash
pm2 list
```

---

### 4. View logs

```bash
pm2 logs webhook-listener
```

---

### 5. Enable startup on boot

```bash
pm2 startup
pm2 save
```

---

## Stopping the Application

```bash
pm2 stop webhook-listener
```

---

## Restarting the Application

```bash
pm2 restart webhook-listener
```

---

## Notes

- Logs are written to:
  - `webhook-logger.log` (via Winston)
  - System logs (via `logger`)
- Rate limiting is enabled (100 requests/min per IP)
- Pressing `q` in the bash script sends a honeypot payload

---

## Takeaways

- Simple webhook ingestion system
- Safe testing without daemonization
- Production-ready with PM2 process management
- Includes logging, rate limiting, and observability


---

## SSL Setup (Production)

It is strongly recommended to secure your webhook endpoint using HTTPS. The most common approach is to use a reverse proxy like NGINX with Let's Encrypt.

### 1. Install NGINX

```bash
sudo apt update
sudo apt install nginx
```

---

### 2. Install Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
```

---

### 3. Configure NGINX Reverse Proxy

Edit your NGINX config:

```bash
sudo nano /etc/nginx/sites-available/webhook
```

Example configuration:

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the config:

```bash
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 4. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will:
- Automatically configure HTTPS
- Redirect HTTP → HTTPS
- Install and renew certificates

---

### 5. Verify SSL

Visit:

```
https://your-domain.com/bbyWebhook
```

---

### 6. Auto-Renewal Check

```bash
sudo certbot renew --dry-run
```

---

## SSL Takeaways

- Always use HTTPS in production
- NGINX acts as a secure reverse proxy
- Let's Encrypt provides free, auto-renewing certificates
- Protects webhook data in transit
