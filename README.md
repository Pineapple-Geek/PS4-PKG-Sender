# PS4 PKG Sender – Version NAS (Docker + Portainer)

Ce projet permet d’envoyer des fichiers **PKG** vers une **PS4** via l’outil *Remote PKG Installer*, grâce à une interface web simple et rapide.

Cette version est adaptée pour un **NAS sous Docker + Portainer**, avec support de **plusieurs disques fusionnés** dans un seul dossier virtuel.

---

## 🚀 Fonctionnalités

- Interface web pour envoyer des PKG à la PS4  
- Compatible Docker / Portainer  
- Support de plusieurs disques fusionnés  
- Configuration simple via variables d’environnement  
- Aucun script externe nécessaire  

---

## 📦 Installation via Portainer (Pour un seul dossier sur un disque)

### 1. Crée les dossiers PKG sur ton NAS

`/srv/dev-disk-by-Label/PS4Roms`

Place tes fichiers `.pkg` dans ces dossiers.

---

### 2. Ajoute une stack dans Portainer

Portainer → **Stacks** → **Add Stack**

Nom : `ps4-pkg-sender`

LOCALIP: "192.168.0.104" Adresse IP de votre NAS
PS4IP: "192.168.0.102" Adresse IP de votre PS4

Colle le contenu du fichier `docker-compose.yml` :

```yaml
version: "3.8"

services:
  ps4pkg:
    image: justanormaldev/ps4-pkg-sender:latest
    container_name: ps4-pkg-sender
    restart: unless-stopped

    environment:
      LOCALIP: "192.168.0.104"
      PS4IP: "192.168.0.102"

    volumes:
      - /srv/dev-disk-by-Label/PS4Roms:/app/files

    ports:
      - "3333:3333"

    networks:
      - ps4net

networks:
  ps4net:
    driver: bridge
```

## 📦 Installation via Portainer (Pour plusieurs dossiers sur plusieurs disques)

### 1. Crée les dossiers PKG sur ton NAS

`/srv/dev-disk-by-Label1/PS4Roms`
`/srv/dev-disk-by-Label2/PS4Roms2`

Place tes fichiers `.pkg` dans ces dossiers.

### 2. Créer un dossier parent sur ton NAS, puis y bind‑mount les deux disques.

#### Étape 1 — Créer le dossier parent
```bash
sudo mkdir -p /srv/PS4Unified
```

#### Étape 2 — Créer les dossiers cibles
```bash
sudo mkdir -p /srv/PS4Unified/PS4Roms
sudo mkdir -p /srv/PS4Unified/PS4Roms2
```

#### Étape 3 — Bind-mount les deux disques dedans
```bash
sudo mount --bind /srv/dev-disk-by-Label1/PS4Roms /srv/PS4Unified/PS4Roms

sudo mount --bind /srv/dev-disk-by-Label2/PS4Roms2 /srv/PS4Unified/PS4Roms2
```

Utiliser cette commande à chaque fois que vous redémarrer votre NAS.

---

### 3. Ajoute une stack dans Portainer

Portainer → **Stacks** → **Add Stack**

Nom : `ps4-pkg-sender`

Colle le contenu du fichier `docker-compose.yml` :

```yaml
version: "3.8"

services:
  ps4pkg:
    image: justanormaldev/ps4-pkg-sender:latest
    container_name: ps4-pkg-sender
    restart: unless-stopped

    environment:
      LOCALIP: "192.168.0.104"
      PS4IP: "192.168.0.102"

    volumes:
      - /srv/PS4Unified:/app/files

    ports:
      - "3333:3333"

    networks:
      - ps4net

networks:
  ps4net:
    driver: bridge
```