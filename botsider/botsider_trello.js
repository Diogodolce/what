// BACKEND DA API
// BIBLIOTECAS UTILIZADAS PARA COMPOSIÇÃO DA API
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const fetch = require('node-fetch');

// PORTA ONDE O SERVIÇO SERÁ INICIADO
const port = 8000;
const idClient = 'BLACK-API';

// SERVIÇO EXPRESS
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));
app.use("/", express.static(__dirname + "/"))
app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

// PARÂMETROS DO CLIENT DO WPP
const client = new Client({
    authStrategy: new LocalAuth({ clientId: idClient }),
    puppeteer: { headless: true,
      // CAMINHO DO CHROME PARA WINDOWS (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      //===================================================================================
      // CAMINHO DO CHROME PARA MAC (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      //===================================================================================
      // CAMINHO DO CHROME PARA LINUX (REMOVER O COMENTÁRIO ABAIXO)
      executablePath: '/usr/bin/google-chrome-stable',
      //===================================================================================
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
      ] }
  });

// INITIALIZE DO CLIENT DO WPP
client.initialize();

// EVENTOS DE CONEXÃO EXPORTADOS PARA O INDEX.HTML VIA SOCKET
io.on('connection', function(socket) {
  socket.emit('message', 'BLACK API - Iniciado');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'BLACK API QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', async () => {
    socket.emit('ready', 'BLACK API Dispositivo pronto!');
    socket.emit('message', 'BLACK API Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('BLACK API Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', 'BLACK API Autenticado!');
    socket.emit('message', 'BLACK API Autenticado!');
    console.log('BLACK API Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', 'BLACK API Falha na autenticação, reiniciando...');
    console.error('BLACK API Falha na autenticação');
});

client.on('change_state', state => {
  console.log('BLACK API Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', 'BLACK API Cliente desconectado!');
  console.log('BLACK API Cliente desconectado', reason);
  client.initialize();
});
});

// INTEGRAÇÃO TRELLO https://trello.com/power-ups/admin
// https://developer.atlassian.com/cloud/trello/rest
const APIKey = 'api key aqui';
const APIToken = 'insira o token aqui';
const id = 'id do quadro';

async function trelloGetList(){
  fetch(`https://api.trello.com/1/boards/${id}/lists?key=${APIKey}&token=${APIToken}`, {
    method: 'GET'
  })
    .then(response => {
      console.log(
        `Response: ${response.status} ${response.statusText}`
      );
      return response.json();
    })
    .then(data => {
      data.forEach(item => {
        console.log(`ID: ${item.id}, Name: ${item.name}`);
      });
    })
    .catch(err => console.error(err));
}

async function trelloCreateCard(list, name, desc){
  fetch(`https://api.trello.com/1/cards?idList=${list}&key=${APIKey}&token=${APIToken}&name=${name}&desc=${desc}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      console.log(
        `Response: ${response.status} ${response.statusText}`
      );
      return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
}

async function trelloUpdateCard(card, list, name){
  fetch(`https://api.trello.com/1/cards/${card}?key=${APIKey}&token=${APIToken}&idList=${list}&name=${name}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      console.log(
        `Response: ${response.status} ${response.statusText}`
      );
      return response.json();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
}

async function trelloGetCard(item) {
  function checkDesc(cards) {
    for (const card of cards) {
      if (card.desc.includes(item)) {
        return card.id;
      }
    }
    return false;
  }
  try {
    const response = await fetch(`https://api.trello.com/1/boards/${id}/cards?key=${APIKey}&token=${APIToken}`, {
      method: 'GET'
    });
    const data = await response.json();
    const hasDescription = checkDesc(data);
    return hasDescription;
  } catch (err) {
    console.error(err);
    return false;
  }
}

trelloGetList();

// FLUXO DO BOT
client.on('message', async msg => {

  const list0 = '65088638b9368e77f5987bc7' // Cliente Prospectado
  const list1 = '65088638b9368e77f5987bc8' // Orçamento Enviado
  const list2 = '65088638b9368e77f5987bc9' // Trabalho Concluído

  const idCard = await trelloGetCard(msg.from.replace(/\D/g, ''));

  if (msg.body !== null && msg.body !== '0' && msg.body !== '1' && msg.body !== '2'){
    client.sendMessage(msg.from, 'Escolha uma opção: \n0- Cliente\n1- Orçamento\n2- Concluído')
  }
  if (msg.body !== null && msg.body === '0'){
    client.sendMessage(msg.from, 'Card criado para a lista: Cliente Prospectado')
    if(idCard){
      await trelloUpdateCard(idCard, list0, 'Cliente Prospectado - ' + msg.from.replace(/\D/g, ''))
    }
    else{
      await trelloCreateCard(list0, 'Cliente Prospectado - ' + msg.from.replace(/\D/g, ''), 'https://wa.me/' + msg.from.replace(/\D/g, ''))
    }
  }
  if (msg.body !== null && msg.body === '1'){
    client.sendMessage(msg.from, 'Card criado para a lista: Orçamento Enviado')
    if(idCard){
      await trelloUpdateCard(idCard, list1, 'Orçamento Enviado - ' + msg.from.replace(/\D/g, ''))
    }
    else{
      await trelloCreateCard(list1, 'Orçamento Enviado - ' + msg.from.replace(/\D/g, ''), 'https://wa.me/' + msg.from.replace(/\D/g, ''))
    }
  }
  if (msg.body !== null && msg.body === '2'){
    client.sendMessage(msg.from, 'Card criado para a lista: Trabalho Concluído')
    if(idCard){
      await trelloUpdateCard(idCard, list2, 'Trabalho Concluído - ' + msg.from.replace(/\D/g, ''))
    }
    else{
      await trelloCreateCard(list2, 'Trabalho Concluído - ' + msg.from.replace(/\D/g, ''), 'https://wa.me/' + msg.from.replace(/\D/g, ''))
    }
  }
});
   
server.listen(port, function() {
  console.log('Aloprando na porta *: ' + port);
});
