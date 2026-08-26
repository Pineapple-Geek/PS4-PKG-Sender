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

## 📦 Installation via Portainer

### 1. Crée les dossiers PKG sur ton NAS

/srv/dev-disk-by-uuid-820dec2c-37a0-45b3-af55-34fb34afe767/PS4Roms
/srv/dev-disk-by-uuid-1913d119-ecc4-41e4-b936-348064e82870/PS4Roms2


Place tes fichiers `.pkg` dans ces dossiers.

---

### 2. Ajoute une stack dans Portainer

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
      - /srv/dev-disk-by-uuid-820dec2c-37a0-45b3-af55-34fb34afe767/PS4Roms:/app/files
      - /srv/dev-disk-by-uuid-1913d119-ecc4-41e4-b936-348064e82870/PS4Roms2:/app/files

    ports:
      - "3333:3333"

    networks:
      - ps4net

networks:
  ps4net:
    driver: bridge
