##    888888b.   888      888    d8P   ##
##   888  "88b  888      888   d8P     ##
##   888  .88P  888      888  d8P      ## 
##   8888888K.  888      888d88K       ## 
##   888  "Y88b 888      8888888b      ## 
##   888    888 888      888  Y88b     ## 
##   888   d88P 888      888   Y88b    ## 
##   8888888P"  88888888 888    Y88b   ##
##          d8888 8888888b. 8888888    ## 
##         d88888 888   Y88b  888      ## 
##        d88P888 888    888  888      ## 
##       d88P 888 888   d88P  888      ## 
##      d88P  888 8888888P"   888      ## 
##     d88P   888 888         888      ## 
##    d8888888888 888         888      ## 
##   d88P     888 888       8888888    ##

## CRIAR SUBDOMINIO E APONTAR PARA O IP DO SERVIDOR VPS

BOTSIDER: apisider.seudominio.com

## CHECAR PROPAGAÇÃO DO DOMÍNIO

https://dnschecker.org/

## COPIAR A PASTA PARA ROOT E RODAR OS COMANDOS ABAIXO

sudo chmod +x ./botsider_install/botsider
cd ./botsider_install
sudo ./botsider

## USUARIO QUE FICARA SETADO NO UNBUNTU
================================================
usuario fcdeploy
fcdeploy_password=BotSider2023+hacker=
================================================

## INSTALAÇÃO MANUAL 

Crie um apontamento do tipo A com o nome do subdominio que vc vai usar meu lindo
EX: apisider.seudominio.com.br  neste caso o subdominio apisider foi usado

Comandos para instalação:

sudo apt update
sudo apt upgrade
sudo apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates && curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt -y install nodejs
sudo apt-get install libnss3-dev libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev
sudo apt-get install libasound2

subir a pasta para o root via FTP

sudo apt install unzip
unzip botsider.zip
cd botsider
sudo npm install
node botsider_post.js     ou outro bot que queira rodar
sudo npm install -g pm2
pm2 start botsider_post.js     ou outro bot que queira rodar
sudo apt install nginx
sudo rm /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/sites-available/botsider

server {
  server_name apisider.seudominio.com.br;
  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
  }

sudo ln -s /etc/nginx/sites-available/botsider /etc/nginx/sites-enabled 
sudo nginx -t
sudo service nginx restart
sudo apt-get install snapd
sudo snap install notes
sudo snap install --classic certbot
sudo certbot --nginx



Para botsider_gpt.js edite o arquivo nas linhas 83 e 84 para inserir suas credenciais
Pare o serviço de outro bot que estiver rodando e chame esse

Para trocar o bot que está rodando vc usa o comando pm2 list e veja qual o numero do serviço do bot atual
pm2 stop 0     caso seja 0 mesmo
cd botsider
pm2 start botsider_gpt.js 

caso queira apenas testar use node botsider_gpt.js