# 🚂 Vigilance Awareness Week (VAW) Online Quiz & Certification Portal

A comprehensive, production-ready full-stack web application designed for Indian Railways, Government Undertakings, and Corporate Organizations to conduct **Vigilance Awareness Week Online Competitions, Live Multiplayer Quizzes, Integrity Pledges, and Instant Verifiable Certificate Generation**.

---

## 📋 Table of Contents
- [✨ Key Features](#-key-features)
- [💻 System Requirements](#-system-requirements)
- [🚀 Quick Start (Local PC)](#-quick-start-local-pc)
- [🖥️ Detailed Local Installation Guide](#️-detailed-local-installation-guide)
  - [Windows (PowerShell / Command Prompt)](#windows)
  - [macOS (Terminal)](#macos)
  - [Linux (Ubuntu / Debian / CentOS / Arch)](#linux)
- [🌐 Step-by-Step Production Server Deployment](#-step-by-step-production-server-deployment)
  - [1. Prerequisites on Linux VPS](#1-prerequisites-on-linux-vps)
  - [2. Clone & Build the Application](#2-clone--build-the-application)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Process Management with PM2](#4-process-management-with-pm2)
  - [5. Nginx Reverse Proxy with WebSocket & SSL](#5-nginx-reverse-proxy-with-websocket--ssl)
  - [6. Firewall Configuration](#6-firewall-configuration)
- [🐳 Alternative: Docker Deployment](#-alternative-docker-deployment)
- [🔐 Default Admin & Access Credentials](#-default-admin--access-credentials)
- [⚙️ Configuration & Customization via Admin Portal](#️-configuration--customization-via-admin-portal)
- [💾 Data Persistence & Backup](#-data-persistence--backup)
- [❓ Troubleshooting & FAQ](#-troubleshooting--faq)
- [📜 License & Credits](#-license--credits)

---

## ✨ Key Features

1. **Live Multiplayer Quiz Room**:
   - Real-time question synchronization via WebSockets (`ws`).
   - Live countdown timer, synchronized question progress, and instant score updates.
   - Dynamic real-time leaderboard and post-quiz **Honour Roll**.

2. **Self-Paced Departmental Quizzes**:
   - Department-specific or general vigilance question bank.
   - Randomized questions, instant scoring, and performance analytics.

3. **Digital Integrity Pledge**:
   - Bilingual (English & Hindi) Central Vigilance Commission (CVC) integrity pledge.
   - Instant downloadable certificate with custom seal, organization logo, and CVO signature.

4. **Authentic Verifiable Certificates**:
   - High-resolution HTML5 Canvas rendering.
   - Dynamic QR Code containing unique verification URL and certificate serial number.
   - One-click certificate search by Employee/PF Number or Mobile Number.

5. **Universal Admin Management Portal**:
   - **Custom Branding**: Modify Organization Name, Program Title, Theme Slogans (Hindi & English), CVO Details, and Logos dynamically without editing code.
   - **Question Bank Management**: Add, edit, delete, or bulk-import questions via CSV.
   - **Departmental Schedules**: Set start/end dates for each department or keep open access.
   - **Participant Records & Export**: View all attempts, scores, and export detailed results to CSV.
   - **Audit Logs**: Tamper-proof tracking of all administrative actions.

6. **Self-Contained Data Architecture**:
   - Persistent file-based database (`data/clw_vaw.json`) with zero external SQL/NoSQL setup overhead.

---

## 💻 System Requirements

- **Node.js**: `v18.18.0` or higher (LTS versions `v20.x` or `v22.x` strongly recommended).
- **Package Manager**: `npm` (comes with Node.js) or `pnpm` / `yarn` / `bun`.
- **Memory (RAM)**: Minimum 512 MB (1 GB+ recommended for live multiplayer quizzes with >500 participants).
- **Disk Space**: At least 300 MB free disk space.
- **Web Browser**: Any modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, Opera).

---

## 🚀 Quick Start (Local PC)

If you have Node.js installed, you can start the application in 3 commands:

```bash
# 1. Install dependencies
npm install

# 2. Build frontend assets
npm run build

# 3. Start the application
npm start
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 🖥️ Detailed Local Installation Guide

### Windows

1. **Install Node.js**:
   - Download the LTS installer from [nodejs.org](https://nodejs.org/).
   - Run the installer and ensure the option *"Add to PATH"* is checked.
   - Verify installation in PowerShell:
     ```powershell
     node -v
     npm -v
     ```

2. **Clone or Extract Project Files**:
   - Open PowerShell or Command Prompt, and navigate to the project directory:
     ```powershell
     cd C:\path\to\clw-vaw-quiz
     ```

3. **Install Dependencies**:
   ```powershell
   npm install
   ```

4. **Setup Environment File**:
   - Copy `.env.example` to `.env`:
     ```powershell
     copy .env.example .env
     ```
   - (Optional) Open `.env` in Notepad to change the port if `3000` is already in use.

5. **Run the Development Server**:
   ```powershell
   npm run dev
   ```
   *(Or run `npm run build` followed by `npm start` for production mode).*

6. **Open in Browser**:
   - Visit `http://localhost:3000`

---

### macOS

1. **Install Node.js**:
   - Using Homebrew:
     ```bash
     brew install node
     ```
   - Or download the macOS `.pkg` installer from [nodejs.org](https://nodejs.org/).

2. **Navigate to Project Directory & Install**:
   ```bash
   cd ~/Documents/clw-vaw-quiz
   npm install
   ```

3. **Create Environment File**:
   ```bash
   cp .env.example .env
   ```

4. **Launch Application**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:3000`.

---

### Linux

1. **Install Node.js (Ubuntu / Debian)**:
   ```bash
   # Add NodeSource repository for Node.js 20 LTS
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```

2. **Install & Run**:
   ```bash
   cd /path/to/clw-vaw-quiz
   npm install
   cp .env.example .env
   npm run build
   npm start
   ```

---

## 🌐 Step-by-Step Production Server Deployment

This section walks you through deploying to a Linux server (Ubuntu 22.04 / 24.04 LTS) using **PM2** for process uptime and **Nginx** as a reverse proxy with WebSocket support and **SSL (HTTPS)**.

```
       Internet / Users (HTTPS / WSS)
                    │
                    ▼
          ┌───────────────────┐
          │    Nginx Proxy    │ (Ports 80 & 443 with Let's Encrypt SSL)
          └─────────┬─────────┘
                    │ Reverse Proxy & WebSocket Upgrade
                    ▼
          ┌───────────────────┐
          │  Node.js + PM2    │ (Port 3000: Express + WebSocket Server)
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │  data/clw_vaw.json│ (Persistent Local Database)
          └───────────────────┘
```

---

### 1. Prerequisites on Linux VPS

Log in to your server via SSH:
```bash
ssh username@your-server-ip
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js 20 LTS, Git, and build tools:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
```

Verify versions:
```bash
node -v   # Should show v20.x.x
npm -v    # Should show v10.x.x
```

Install PM2 globally:
```bash
sudo npm install -g pm2
```

---

### 2. Clone & Build the Application

Navigate to `/var/www` or your chosen deployment directory:
```bash
sudo mkdir -p /var/www/vaw-quiz
sudo chown -R $USER:$USER /var/www/vaw-quiz
cd /var/www/vaw-quiz
```

Copy your project files here (or clone via Git):
```bash
# Example if using git:
# git clone <your-repo-url> .
```

Install production dependencies:
```bash
npm install
```

Build optimized static production bundle:
```bash
npm run build
```

Verify that the `/data` directory exists and has write permissions:
```bash
mkdir -p data
chmod -R 775 data
```

---

### 3. Configure Environment Variables

Create the production environment file:
```bash
cp .env.example .env
nano .env
```

Set the values:
```env
PORT=3000
NODE_ENV=production
```
Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

### 4. Process Management with PM2

Start the application using PM2:
```bash
pm2 start npm --name "vaw-quiz" -- run start
```

Verify that the process is running:
```bash
pm2 status
pm2 logs vaw-quiz --lines 30
```

Configure PM2 to restart automatically on server reboot:
```bash
pm2 startup
# (Run the sudo env PATH... command that PM2 prints on screen)
pm2 save
```

Useful PM2 Commands:
- `pm2 restart vaw-quiz` : Restart the app after code updates.
- `pm2 stop vaw-quiz` : Stop the app.
- `pm2 logs vaw-quiz` : View real-time console and error logs.

---

### 5. Nginx Reverse Proxy with WebSocket & SSL

Create a new Nginx server configuration:
```bash
sudo nano /etc/nginx/sites-available/vaw-quiz
```

Paste the following configuration (replace `quiz.yourdomain.com` with your domain name or public server IP):

```nginx
server {
    listen 80;
    server_name quiz.yourdomain.com; # Replace with your domain or server IP

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket support (CRITICAL for Live Quiz sync)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for persistent WebSocket connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable the site configuration and test Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/vaw-quiz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Add Free SSL Certificate (HTTPS) with Certbot:
```bash
sudo certbot --nginx -d quiz.yourdomain.com
```
Follow the on-screen prompts. Certbot will automatically configure HTTPS encryption and auto-renewal.

---

### 6. Firewall Configuration

If `ufw` (Uncomplicated Firewall) is enabled:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🐳 Alternative: Docker Deployment

If you prefer deploying with Docker and Docker Compose:

### 1. Create `Dockerfile` in the root directory:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
```

### 2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  vaw-quiz:
    build: .
    container_name: vaw-quiz-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      # Persist data outside container
      - ./data:/app/data
```

### 3. Build & Run:
```bash
docker compose up -d --build
```

---

## 🔐 Default Admin & Access Credentials

### Admin Control Portal
- **URL**: `http://your-server-ip:3000` ➔ Click **Admin Portal** in top navigation
- **Username**: `admin`
- **Default Password**: `ClwVaw@2026`

> ⚠️ **Security Recommendation**: Immediately after your first login, navigate to **Admin Portal ➔ Admin Users / Change Password** to set a secure custom administrator password.

### Participant Default Credentials
- **PF / Employee Number**: Any registered PF number (or register as a new participant on the homepage).
- **Default Participant Password**: `123` (participants can change their password or take quizzes directly).

---

## ⚙️ Configuration & Customization via Admin Portal

The entire application is 100% configurable through the built-in Admin Panel without touching source code:

1. **System & Organization Settings**:
   - Go to **Admin Portal ➔ System Settings**.
   - Change **Organization Name** (e.g., *Eastern Railway*, *Northern Railway*, *BHEL*, etc.).
   - Change **Programme Name** (e.g., *Vigilance Awareness Week 2026*).
   - Update **Slogan (English)** and **Slogan (Hindi)** (e.g., *Probity for Prosperity / सत्यनिष्ठा से समृद्धि*).
   - Enter Chief Vigilance Officer (**CVO Name, Designation, and Railway Zone**).
   - Upload official **Digital Signature** and **Official Seal Stamp**.

2. **Question Bank**:
   - Add custom questions with 4 multiple-choice options.
   - Tag questions to specific departments or designate as "All Departments".
   - Import questions in bulk using the downloadable CSV template.

3. **Live Quiz Sessions**:
   - Create and schedule synchronized live quiz competitions.
   - Configure question countdown timers (e.g., 20 seconds per question).
   - Launch lobby, start countdown, and project the real-time leaderboard during the live event.

4. **Honour Roll & Leaderboard Visibility**:
   - The public leaderboard dynamically displays the **Live Active Quiz** or the **Last Concluded Quiz Honour Roll**.
   - Automatically hides when no active or concluded session exists, ensuring a clean interface.

---

## 💾 Data Persistence & Backup

All application state—including participants, quiz questions, departmental schedules, test attempts, live sessions, and admin settings—is stored in:

```
📁 data/clw_vaw.json
```

### How to Backup:
To create a complete backup, simply copy the `data` folder:
```bash
# Example backup command
tar -czvf vaw_backup_$(date +%F).tar.gz data/
```

### How to Restore:
To restore data on a new server:
1. Stop the application: `pm2 stop vaw-quiz`
2. Replace `data/clw_vaw.json` with your backup copy.
3. Start the application: `pm2 start vaw-quiz`

---

## ❓ Troubleshooting & FAQ

### 1. Port 3000 is already in use (`EADDRINUSE`)
- **Solution**: Change the port in `.env` to another number (e.g., `PORT=8080`) and restart the server, or find and stop the conflicting process:
  ```bash
  # Check which process is using port 3000
  sudo lsof -i :3000
  # Or run directly with custom port
  PORT=8080 npm start
  ```

### 2. Live Quiz WebSocket doesn't connect behind Nginx
- **Symptoms**: Participants join lobby but live questions do not synchronize.
- **Solution**: Ensure your Nginx configuration contains the `Upgrade` headers:
  ```nginx
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  ```
  Then reload Nginx: `sudo nginx -s reload`.

### 3. Permission Denied writing to `data/clw_vaw.json`
- **Solution**: Ensure the user running Node.js has ownership of the `data/` folder:
  ```bash
  sudo chown -R $USER:$USER data/
  chmod 775 data/
  ```

### 4. How to Reset the Database to Factory Defaults
- If you wish to wipe test data and return to the original clean state:
  ```bash
  pm2 stop vaw-quiz
  rm -f data/clw_vaw.json
  pm2 start vaw-quiz
  ```
  The server will automatically generate fresh seed questions, default schedules, and the initial `admin` account on restart.

---

## 📜 Summary of Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server with Vite hot reload and API backend |
| `npm run build` | Compiles frontend React application into static `dist/` bundle |
| `npm start` | Launches full-stack production server with Express, WebSocket & API |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Cleans build artifacts (`dist/`) |

---

**Developed for Vigilance Awareness Week** · *Promoting Transparency, Probity, and Integrity across Indian Railways and Public Undertakings.*
