# Portfolio professionnel

## Déploiement sur un VPS

Le déploiement de production utilise Docker Compose pour isoler Node.js. Le
conteneur écoute uniquement sur `127.0.0.1:3100`; Apache reste le seul service
exposé sur les ports 80/443 et reverse-proxy le domaine vers le portfolio.

Prérequis VPS : Docker avec le plugin Compose, Apache 2, Git, ports TCP 80/443
ouverts, et un enregistrement DNS `A` (ainsi que `AAAA` si utilisé) pointant vers
le VPS.

```sh
git clone https://github.com/SoufianeAzerdaoui/portfolio-dev.git
cd portfolio-dev
cp .env.production.example .env.production
```

Renseigner au minimum `DOMAIN` dans `.env.production`. Renseigner aussi
`GEMINI_API_KEY` pour activer les réponses générées du Portfolio AI. Le fichier
`.env.production` contient des secrets et ne doit jamais être ajouté à Git.

Lancer ensuite :

```sh
sh deploy/deploy.sh
```

Installer ensuite le VirtualHost Apache fourni :

```sh
sudo a2enmod proxy proxy_http headers ssl
sudo cp deploy/apache/soufianeazerdaoui.me.conf /etc/apache2/sites-available/
sudo a2ensite soufianeazerdaoui.me.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
sudo certbot --apache -d soufianeazerdaoui.me
```

Commandes de diagnostic utiles :

```sh
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f frontend
curl -I "https://$(sed -n 's/^DOMAIN=//p' .env.production)"
```

Pour une mise à jour :

```sh
git pull --ff-only
sh deploy/deploy.sh
```
