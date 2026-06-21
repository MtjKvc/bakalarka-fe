# 🇸🇰 Slovenská verzia
# Návod na lokálnu inštaláciu (Docker)

Tento návod vysvetľuje, ako nainštalovať a spustiť aplikáciu lokálne pomocou Dockeru na systémoch **Windows** a **Linux (Ubuntu)**.

---

# Požiadavky

Pred začatím sa uistite, že máte nainštalovaný nasledujúci softvér:

* Git
* Docker

---

# 1. Inštalácia Git

Git je potrebný na klonovanie repozitárov projektu.

## Windows

Stiahnite a nainštalujte Git:

https://git-scm.com/download/win

Overte inštaláciu:

```powershell
git --version
```

---

## Linux (Ubuntu)

Nainštalujte Git:

```bash
sudo apt update
sudo apt install git -y
```

Overte inštaláciu:

```bash
git --version
```

---

# 2. Inštalácia Dockeru

Docker je potrebný na zostavenie a spustenie všetkých služieb aplikácie.

## Windows

Nainštalujte Docker Desktop:

https://docs.docker.com/desktop/setup/install/windows-install/

Po inštalácii sa uistite, že Docker Desktop je spustený.

Overte inštaláciu:

```powershell
docker --version
docker compose version
```

---

## Linux (Ubuntu)

Nainštalujte Docker Engine:

https://docs.docker.com/engine/install/ubuntu/

Overte inštaláciu:

```bash
docker --version
docker compose version
```

---

# 3. Vytvorenie projektového adresára

Vytvorte adresár, ktorý bude obsahovať všetky súbory projektu.

## Windows

```powershell
mkdir C:\BP
cd C:\BP
```

## Linux

```bash
mkdir -p ~/BP
cd ~/BP
```

---

# 4. Klonovanie repozitárov

Naklonujte oba repozitáre do projektového adresára.

## Windows

```powershell
cd C:\BP

git clone -b bug-fix https://github.com/MtjKvc/bakalarka-fe.git frontend
git clone -b feature/api https://github.com/hrabcakm123/bp_spring_backend.git backend
```

## Linux

```bash
cd ~/BP

git clone -b bug-fix https://github.com/MtjKvc/bakalarka-fe.git frontend
git clone -b feature/api https://github.com/hrabcakm123/bp_spring_backend.git backend
```

Očakávaná štruktúra adresárov:

```text
BP/
├── frontend/
├── backend/
└── docker-compose.yml
```

---

# 5. Vytvorenie Docker Compose konfigurácie

Vytvorte súbor s názvom:

```text
docker-compose.yml
```

v adresári `BP`.

---

## ⚠️ Dôležitá konfigurácia

Pred spustením aplikácie nahraďte **všetky hodnoty uzavreté v `< >`** vlastnými konfiguračnými hodnotami.

---

#### ✔️ Ako vyplniť hodnoty

* Hodnoty zapisujte **bez znakov `< >`**
* Zástupné hodnoty nahraďte priamo skutočnými údajmi
* Nenechávajte žiadnu zástupnú hodnotu nezmenenú

#### ❌ Nesprávny príklad

```yaml
POSTGRES_DB: <YOUR_DATABASE_NAME>
```

#### ✔️ Správny príklad

```yaml
POSTGRES_DB: bp_database
```

---

Je potrebné upraviť nasledujúce zástupné hodnoty:

| Placeholder                 | Popis                                       |
| --------------------------- | ------------------------------------------- |
| `<YOUR_DATABASE_NAME>`      | Názov PostgreSQL databázy                   |
| `<YOUR_DATABASE_USER>`      | Používateľské meno PostgreSQL               |
| `<YOUR_DATABASE_PASSWORD>`  | Heslo PostgreSQL                            |
| `<YOUR_GMAIL_ADDRESS>`      | Gmail účet používaný na odosielanie emailov |
| `<YOUR_GMAIL_APP_PASSWORD>` | Gmail App Password                          |
| `<YOUR_256_BIT_SECRET_KEY>` | Tajný JWT kľúč                              |

> **⚠️ Dôležité**
>
> Hodnoty použité v:
>
> * `SPRING_DATASOURCE_URL`
> * `SPRING_DATASOURCE_USERNAME`
> * `SPRING_DATASOURCE_PASSWORD`
> * PostgreSQL healthcheck
>
> musia presne zodpovedať hodnotám PostgreSQL konfigurácie.

---

## Docker Compose konfigurácia

Skopírujte nasledujúci obsah do súboru `docker-compose.yml`.

```yaml
version: "3.8"

services:

  postgres:
    image: postgres:15-alpine
    container_name: postgres

    environment:
      # Postgres configuration
      POSTGRES_DB: <YOUR_DATABASE_NAME>
      POSTGRES_USER: <YOUR_DATABASE_USER>
      POSTGRES_PASSWORD: <YOUR_DATABASE_PASSWORD>

    ports:
      - "127.0.0.1:5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      # Must match POSTGRES_USER and POSTGRES_DB above
      test: ["CMD-SHELL", "pg_isready -U <YOUR_DATABASE_USER> -d <YOUR_DATABASE_NAME>"]
      interval: 10s
      timeout: 5s
      retries: 5

    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redis

    ports:
      - "127.0.0.1:6379:6379"

    volumes:
      - redis_data:/data

    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

    restart: unless-stopped

  backend:
    build: ./backend
    container_name: spring-backend

    ports:
      - "8080:8080"

    environment:
      # Database configuration
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/<YOUR_DATABASE_NAME>
      SPRING_DATASOURCE_USERNAME: <YOUR_DATABASE_USER>
      SPRING_DATASOURCE_PASSWORD: <YOUR_DATABASE_PASSWORD>

      # Redis configuration
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379

      # Email configuration
      MAIL_HOST: smtp.gmail.com
      MAIL_PORT: 587
      MAIL_USERNAME: <YOUR_GMAIL_ADDRESS>
      MAIL_PASSWORD: <YOUR_GMAIL_APP_PASSWORD>

      # JWT Secret Key
      APP_SECRET_KEY: <YOUR_256_BIT_SECRET_KEY>

    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: angular-frontend

    ports:
      - "80:80"

    depends_on:
      - backend

    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

# 6. Generovanie potrebných prihlasovacích údajov

Pred spustením aplikácie musíte nakonfigurovať emailový účet a JWT tajný kľúč používaný backendom.

---

## Generovanie JWT tajného kľúča

Vygenerujte bezpečný JWT tajný kľúč pomocou:

https://jwtsecrets.com/#generator

Odporúčané nastavenia:

* Algoritmus: **HS256**
* Dĺžka tajného kľúča: **256 bitov**

Skopírujte vygenerovanú hodnotu a nahraďte:

```yaml
APP_SECRET_KEY: <YOUR_256_BIT_SECRET_KEY>
```

---

## Konfigurácia Gmailu pre odosielanie emailov

Aplikácia používa Gmail SMTP na odosielanie emailov. Aby sa aplikácia mohla autentifikovať vo vašom Google účte, musíte vytvoriť **Google App Password**.

---

### Krok 1 – Vytvorte alebo použite Gmail účet

Ak ešte nemáte Gmail účet, vytvorte si ho:

https://accounts.google.com/signup

Emailovú adresu použite v konfigurácii:

```yaml
MAIL_USERNAME: <YOUR_GMAIL_ADDRESS>
```

Príklad:

```yaml
MAIL_USERNAME: myapplication@gmail.com
```

---

### Krok 2 – Zapnite dvojfaktorové overenie

Google vyžaduje zapnuté dvojfaktorové overenie pred vytvorením App Password.

Otvorte:

https://myaccount.google.com/security

Povoľte:

* 2-Faktorové Overenie

---

### Krok 3 – Vygenerujte App Password

Po zapnutí dvojfaktorového overenia vytvorte Gmail App Password.

1. Otvorte oficiálnu dokumentáciu Google: https://support.google.com/accounts/answer/185833?hl=sk
2. Prejdite na sekciu: **Vytvorenie a používanie hesiel aplikácií**
3. Kliknite na: **Vytváranie a správa hesiel aplikácií**
4. Prihláste sa do svojho Google účtu, ak budete vyzvaní
5. Vygenerujte nový App Password
6. Skopírujte vygenerované heslo a použite ho v Docker konfigurácii:

```yaml
MAIL_PASSWORD: <YOUR_GMAIL_APP_PASSWORD>
```

**⚠️ Dôležité**

> Nepoužívajte bežné heslo k Gmail účtu.
>
> Vždy používajte Google App Password vytvorený špeciálne pre túto aplikáciu.

---

# 7. Spustenie aplikácie

Prejdite do adresára obsahujúceho súbor `docker-compose.yml`.

## Windows

```powershell
cd C:\BP
docker compose up -d --build
```

## Linux

```bash
cd ~/BP
docker compose up -d --build
```

Docker automaticky:

1. Zostaví Angular frontend image
2. Zostaví Spring Boot backend image
3. Vytvorí PostgreSQL kontajner
4. Vytvorí Redis kontajner
5. Vytvorí Docker sieť
6. Vytvorí perzistentné Docker volumes

---

# 8. Overenie bežiacich kontajnerov

Skontrolujte spustené kontajnery:

```bash
docker ps
```

Výstup by mal obsahovať:

```text
postgres
redis
spring-backend
angular-frontend
```

---

# 9. Prístup k aplikácii

Po spustení bude aplikácia dostupná na:

| Služba      | URL                                         |
| ----------- | ------------------------------------------- |
| Frontend    | http://localhost:80                         |
| Backend API | http://localhost:8080/swagger-ui/index.html |
| PostgreSQL  | localhost:5432                              |
| Redis       | localhost:6379                              |

Po inicializácii databázy systém automaticky vytvorí tri predvolené používateľské účty určené na testovanie a demonštráciu:

| Rola    | Email                                                     | Heslo    |
| ------- | --------------------------------------------------------- | -------- |
| Admin   | [admin@admin.admin](mailto:admin@admin.admin)             | password |
| Teacher | [teacher@teacher.teacher](mailto:teacher@teacher.teacher) | password |
| Helper  | [helper@helper.helper](mailto:helper@helper.helper)       | password |

---

# 10. Vytvorené Docker zdroje

Docker automaticky vytvorí:

* Docker sieť
* PostgreSQL volume (`postgres_data`)
* Redis volume (`redis_data`)
* PostgreSQL kontajner
* Redis kontajner
* Backend kontajner
* Frontend kontajner

Môžete ich skontrolovať pomocou:

```bash
docker network ls
docker volume ls
docker ps
```

---

# 11. Zobrazenie logov

Zobrazenie logov všetkých služieb:

```bash
docker compose logs
```

Sledovanie logov v reálnom čase:

```bash
docker compose logs -f
```

Logy backendu:

```bash
docker compose logs -f backend
```

Logy frontendu:

```bash
docker compose logs -f frontend
```

Logy PostgreSQL:

```bash
docker compose logs -f postgres
```

Logy Redis:

```bash
docker compose logs -f redis
```

---

# 12. Opätovné zostavenie po zmenách

Ak vykonáte zmeny v zdrojovom kóde frontendu alebo backendu, znova zostavte Docker image a reštartujte kontajnery:

```bash
docker compose up -d --build
```

Tento príkaz použite pri:

* Stiahnutí nových zmien z Git repozitárov
* Aktualizácii zdrojového kódu aplikácie
* Úprave Dockerfile súborov
* Aktualizácii závislostí
* Zmene konfigurácie súvisiacej so zostavením

---

# 13. Zastavenie aplikácie

Zastavenie a odstránenie všetkých bežiacich kontajnerov:

```bash
docker compose down
```

---

# 14. Odstránenie kontajnerov a volumes

Zastavenie aplikácie a odstránenie všetkých kontajnerov, sietí a perzistentných volumes:

```bash
docker compose down -v
```

> **⚠️ Upozornenie**
>
> Tento príkaz natrvalo odstráni všetky PostgreSQL a Redis dáta uložené v Docker volumes.

---

# Riešenie problémov

## Overenie stavu Dockeru

```bash
docker ps
```

## Kontrola logov

```bash
docker compose logs
```

## Reštart všetkých služieb

```bash
docker compose restart
```

## Kompletné znovuzostavenie

```bash
docker compose down -v
docker compose up -d --build
```

<br><br>

# 🇬🇧 English Version
# Local Installation Guide (Docker)

This guide explains how to install and run the application locally using Docker on both **Windows** and **Linux (Ubuntu)**.

---

# Prerequisites

Before starting, ensure the following software is installed:

* Git
* Docker

---

# 1. Install Git

Git is required to clone the project repositories.

## Windows

Download and install Git:

https://git-scm.com/download/win

Verify the installation:

```powershell
git --version
```

---

## Linux (Ubuntu)

Install Git:

```bash
sudo apt update
sudo apt install git -y
```

Verify the installation:

```bash
git --version
```

---

# 2. Install Docker

Docker is required to build and run all application services.

## Windows

Install Docker Desktop:

https://docs.docker.com/desktop/setup/install/windows-install/

After installation, ensure Docker Desktop is running.

Verify the installation:

```powershell
docker --version
docker compose version
```

---

## Linux (Ubuntu)

Install Docker Engine:

https://docs.docker.com/engine/install/ubuntu/

Verify the installation:

```bash
docker --version
docker compose version
```

---

# 3. Create Project Directory

Create a directory that will contain all project files.

## Windows

```powershell
mkdir C:\BP
cd C:\BP
```

## Linux

```bash
mkdir -p ~/BP
cd ~/BP
```

---

# 4. Clone the Repositories

Clone both repositories into the project directory.

## Windows

```powershell
cd C:\BP

git clone -b bug-fix https://github.com/MtjKvc/bakalarka-fe.git frontend
git clone -b feature/api https://github.com/hrabcakm123/bp_spring_backend.git backend
```

## Linux

```bash
cd ~/BP

git clone -b bug-fix https://github.com/MtjKvc/bakalarka-fe.git frontend
git clone -b feature/api https://github.com/hrabcakm123/bp_spring_backend.git backend
```

Expected directory structure:

```text
BP/
├── frontend/
├── backend/
└── docker-compose.yml
```

---

# 5. Create Docker Compose Configuration

Create a file named:

```text id="trsx33"
docker-compose.yml
```

inside the `BP` directory.

---

## ⚠️ Important Configuration Required

Before starting the application, replace **all values enclosed in `< >`** with your own configuration values.

---

#### ✔️ How to fill values

* Write values **without angle brackets `< >`**
* Replace placeholders directly with your real values
* Do not leave any placeholder unchanged

#### ❌ Wrong example

```yaml
POSTGRES_DB: <YOUR_DATABASE_NAME>
```

#### ✔️ Correct example

```yaml
POSTGRES_DB: bp_database
```
---

The following placeholders must be updated:

| Placeholder                 | Description                           |
| --------------------------- | ------------------------------------- |
| `<YOUR_DATABASE_NAME>`      | PostgreSQL database name              |
| `<YOUR_DATABASE_USER>`      | PostgreSQL username                   |
| `<YOUR_DATABASE_PASSWORD>`  | PostgreSQL password                   |
| `<YOUR_GMAIL_ADDRESS>`      | Gmail account used for sending emails |
| `<YOUR_GMAIL_APP_PASSWORD>` | Gmail App Password                    |
| `<YOUR_256_BIT_SECRET_KEY>` | JWT secret key                        |

> **⚠️ Important**
>
> The database values used in:
>
> * `SPRING_DATASOURCE_URL`
> * `SPRING_DATASOURCE_USERNAME`
> * `SPRING_DATASOURCE_PASSWORD`
> * PostgreSQL healthcheck
>
> must match the PostgreSQL configuration values exactly.

---

## Docker Compose Configuration

Copy the following content into the `docker-compose.yml` file:

```yaml
version: "3.8"

services:

  postgres:
    image: postgres:15-alpine
    container_name: postgres

    environment:
      # Postgres configuration
      POSTGRES_DB: <YOUR_DATABASE_NAME>
      POSTGRES_USER: <YOUR_DATABASE_USER>
      POSTGRES_PASSWORD: <YOUR_DATABASE_PASSWORD>

    ports:
      - "127.0.0.1:5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      # Must match POSTGRES_USER and POSTGRES_DB above
      test: ["CMD-SHELL", "pg_isready -U <YOUR_DATABASE_USER> -d <YOUR_DATABASE_NAME>"]
      interval: 10s
      timeout: 5s
      retries: 5

    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redis

    ports:
      - "127.0.0.1:6379:6379"

    volumes:
      - redis_data:/data

    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

    restart: unless-stopped

  backend:
    build: ./backend
    container_name: spring-backend

    ports:
      - "8080:8080"

    environment:
      # Database configuration
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/<YOUR_DATABASE_NAME>
      SPRING_DATASOURCE_USERNAME: <YOUR_DATABASE_USER>
      SPRING_DATASOURCE_PASSWORD: <YOUR_DATABASE_PASSWORD>

      # Redis configuration
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379

      # Email configuration
      MAIL_HOST: smtp.gmail.com
      MAIL_PORT: 587
      MAIL_USERNAME: <YOUR_GMAIL_ADDRESS>
      MAIL_PASSWORD: <YOUR_GMAIL_APP_PASSWORD>

      # JWT Secret Key
      APP_SECRET_KEY: <YOUR_256_BIT_SECRET_KEY>

    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: angular-frontend

    ports:
      - "80:80"

    depends_on:
      - backend

    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

# 6. Generate Required Credentials

Before starting the application, you must configure the email account and JWT secret key used by the backend.

---

## Generate JWT Secret Key

Generate a secure JWT secret key using:

https://jwtsecrets.com/#generator

Recommended settings:

* Algorithm: **HS256**
* Secret Length: **256 bits**

Copy the generated value and replace:

```yaml id="eah8v5"
APP_SECRET_KEY: <YOUR_256_BIT_SECRET_KEY>
```

---

## Configure Gmail for Email Sending

The application uses Gmail SMTP for sending emails. To allow the application to authenticate with your Google account, you must generate a **Google App Password**.

---

### Step 1 - Create or Use a Gmail Account

Create a Gmail account if you do not already have one:

https://accounts.google.com/signup

Use the email address as:

```yaml id="b8jzfr"
MAIL_USERNAME: <YOUR_GMAIL_ADDRESS>
```

Example:

```yaml id="y7viy4"
MAIL_USERNAME: myapplication@gmail.com
```

---

### Step 2 - Enable Two-Factor Authentication

Google requires Two-Factor Authentication before App Passwords can be generated.

Open:

https://myaccount.google.com/security

Enable:

* 2-Step Verification

---

### Step 3 - Generate an App Password

After enabling Two-Factor Authentication, generate a Gmail App Password.

1. Open the official Google documentation: https://support.google.com/accounts/answer/185833

2. Scroll to the section: **Create & use app passwords**

3. Click: **Create and manage your app passwords**

4. Sign in to your Google account if prompted

5. Generate a new App Password

6. Copy the generated password and use it in your Docker configuration:

```yaml id="8b4wgc"
MAIL_PASSWORD: <YOUR_GMAIL_APP_PASSWORD>
```

**⚠️ Important**
> Do not use your regular Gmail account password.
>
> Always use a Google App Password generated specifically for this application.

---

# 7. Start the Application

Navigate to the directory containing the `docker-compose.yml` file.

## Windows

```powershell
cd C:\BP
docker compose up -d --build
```

## Linux

```bash
cd ~/BP
docker compose up -d --build
```

Docker will automatically:

1. Build the Angular frontend image
2. Build the Spring Boot backend image
3. Create the PostgreSQL container
4. Create the Redis container
5. Create the Docker network
6. Create persistent Docker volumes

---

# 8. Verify Running Containers

Check the running containers:

```bash
docker ps
```

Expected output should contain:

```text
postgres
redis
spring-backend
angular-frontend
```

---

# 9. Access the Application

After startup, the application should be available at:

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:80 |
| Backend API | http://localhost:8080/swagger-ui/index.html |
| PostgreSQL  | localhost:5432        |
| Redis       | localhost:6379        |

After the initial database initialization, the system creates three default user accounts for testing and demonstration purposes:

| Role    | Email                 | Password  |
|---------|----------------------|----------|
| Admin   | admin@admin.admin     | password |
| Teacher | teacher@teacher.teacher | password |
| Helper  | helper@helper.helper   | password |

---

# 10. Docker Resources Created

Docker automatically creates:

* Docker network
* PostgreSQL volume (`postgres_data`)
* Redis volume (`redis_data`)
* PostgreSQL container
* Redis container
* Backend container
* Frontend container

Inspect them using:

```bash
docker network ls
docker volume ls
docker ps
```

---

# 11. View Logs

Display logs for all services:

```bash
docker compose logs
```

Follow logs in real time:

```bash
docker compose logs -f
```

Backend logs:

```bash
docker compose logs -f backend
```

Frontend logs:

```bash
docker compose logs -f frontend
```

PostgreSQL logs:

```bash
docker compose logs -f postgres
```

Redis logs:

```bash
docker compose logs -f redis
```

---

# 12. Rebuilding After Changes

If source code changes are made in either the frontend or backend project, rebuild the Docker images and restart the containers:

```bash
docker compose up -d --build
```

Use this command when:

* Pulling new changes from Git repositories
* Updating application source code
* Modifying Dockerfiles
* Updating dependencies
* Changing build-related configuration

---

# 13. Stop the Application

Stop and remove all running containers:

```bash
docker compose down
```

---

# 14. Remove Containers and Volumes

Stop the application and remove all containers, networks, and persistent volumes:

```bash
docker compose down -v
```

> **⚠️ Warning**
>
> This command permanently deletes all PostgreSQL and Redis data stored inside Docker volumes.

---

# Troubleshooting

## Verify Docker Status

```bash
docker ps
```

## Check Logs

```bash
docker compose logs
```

## Restart All Services

```bash
docker compose restart
```

## Full Rebuild

```bash
docker compose down -v
docker compose up -d --build
```
