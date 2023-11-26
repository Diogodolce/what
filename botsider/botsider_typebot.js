// BACKEND DA API
// BIBLIOTECAS UTILIZADAS PARA COMPOSIÇÃO DA API
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// PORTA ONDE O SERVIÇO SERÁ INICIADO
const port = 8000;
const idClient = 'BLACK-API';

// DADOS TYPEBOT - Preencha a url do typebot e o nome do fluxo
const url = 'https://typebot.seudominio.com.br/api/v1/sendMessage';
const typebot = 'nomedofluxoaqui';
const dirBot = './typebot';
if (!fs.existsSync(dirBot)){
    fs.mkdirSync(dirBot)
}

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
    console.log('BLACK API Dispositivo pronto CALABRESO');
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

// INTEGRAÇÃO TYPEBOT
function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        deleteDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    try {
      fs.rmdirSync(dirPath);
      console.log(`Diretório ${dirPath} deletado com sucesso.`);
    } catch (error) {
      console.error(`Erro ao deletar diretório ${dirPath}:`, error);
    }
  } else {
    console.log(`O diretório ${dirPath} não existe.`);
  }
}

async function readWriteFileJson(sessionId, from) {
  let dataFile = [];
  fs.writeFileSync("./typebot/" + from + "/typebot.json", JSON.stringify(dataFile));
  var data = fs.readFileSync("./typebot/" + from + "/typebot.json");
  var myObject = JSON.parse(data);
  let newData = {
    id: sessionId,
  };
  await myObject.push(newData);
  fs.writeFileSync("./typebot/" + from + "/typebot.json", JSON.stringify(myObject));
}

async function createSession(data){
  const reqData = {
    sessionId: data.from,
    startParams: {
      typebot: typebot,
      prefilledVariables: {
        number: data.from.split('@')[0],
        name: data.notifyName
      },
    },
  };
  const request = await axios.post(url, reqData);
  const dirFrom = './typebot/' + data.from.replace(/\D/g,'');
  if (!fs.existsSync(dirFrom)){
    fs.mkdirSync(dirFrom);
    await readWriteFileJson(request.data.sessionId, data.from.replace(/\D/g,''));
  }
}

// EVENTO DE ESCUTA/ENVIO DE MENSAGENS RECEBIDAS PELA API
client.on('message', async msg => {
  const dirFrom = './typebot/' + msg.from.replace(/\D/g,'');
  if (!fs.existsSync(dirFrom)){
    await createSession(msg);
  }
  if (msg.body !== 'sair'){
    const from = msg.from.replace(/\D/g,'');
    const sessionId = fs.readFileSync("./typebot/" + from + "/typebot.json","utf8").split(':')[1].replace(/\W/g, '');
    const content = msg.body;
    const reqData = {
        message: content,
        sessionId: sessionId,
    };
    const request = await axios.post(url, reqData);
    const messages = request.data.messages
    for (const message of messages){
      if (message.type === 'text') {
        let formattedText = '';
        for (const richText of message.content.richText){
          for (const element of richText.children){
            let text = '';
            if (element.text) {
                text = element.text;
            }
            if (element.bold) {
                text = `*${text}*`;
            }
            if (element.italic) {
                text = `_${text}_`;
            }
            if (element.underline) {
                text = `~${text}~`;
            }
            formattedText += text;          
          }
          formattedText += '\n';
        }
        formattedText = formattedText.replace(/\n$/, '');
        await client.sendMessage(msg.from, formattedText);
      }
      if (message.type === 'image' || message.type === 'video') {
        console.log(message)
        try{
          const media = await MessageMedia.fromUrl(message.content.url)
          await client.sendMessage(msg.from, media, {caption: 'BLACKSIDER API'})
        }catch(e){}
      }
      if (message.type === 'audio') {
        console.log(message)
        try{
          const media = await MessageMedia.fromUrl(message.content.url)
          await client.sendMessage(msg.from, media, {sendAudioAsVoice: true})
        }catch(e){}
      }
    }
  }
  if (msg.body === 'sair'){
    await deleteDirectory(dirFrom)
    await client.sendMessage(msg.from, 'Atendimento automático desligado.')
  }
});
   
// INITIALIZE DO SERVIÇO    
server.listen(port, function() {
  console.log('BLACKSIDER API - ALOPRANDO na porta *: ' + port);
});