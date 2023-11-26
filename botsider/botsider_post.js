// BACKEND DA API
// BIBLIOTECAS UTILIZADAS PARA COMPOSIÇÃO DA API
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
  socket.emit('message', '© BLACK-API - Iniciado meu Calabreso!');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BLACK-API QRCode recebido, aponte a câmera  seu celular meu Calabreso!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BLACK-API Dispositivo pronto meu Calabreso meu Calabreso!');
    socket.emit('message', '© BLACK-API Dispositivo pronto meu Calabreso meu Calabreso!');
    socket.emit('qr', './check.svg')	
    console.log('© BLACK-API Dispositivo pronto meu Calabreso');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BLACK-API Autenticado meu Calabreso!');
    socket.emit('message', '© BLACK-API Autenticado meu Calabreso!');
    console.log('© BLACK-API Autenticado meu Calabreso');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BLACK-API Falha na autenticação meu Calabreso, reiniciando...');
    console.error('© BLACK-API Falha na autenticação meu Calabreso');
});

client.on('change_state', state => {
  console.log('© BLACK-API Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BLACK-API Cliente desconectado meu Calabreso!');
  console.log('© BLACK-API Cliente desconectado meu Calabreso', reason);
  client.initialize();
});
});

// POST PARA ENVIO DE MENSAGEM
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number.replace(/\D/g,'');
  const message = req.body.message;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);

  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// POST PARA ENVIO DE MIDIA VIA URL
app.post('/send-media', async (req, res) => {
  const number = req.body.number.replace(/\D/g,'');
  const caption = req.body.caption;
  const fileUrl = req.body.file;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);

  const media = await MessageMedia.fromUrl(fileUrl);

  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// POST PARA ENVIO DE MIDIA VIA CAMINHO
app.post('/send-media2', async (req, res) => {
  //console.log(req);
  const number = req.body.number.replace(/\D/g,'');
  const caption = req.body.caption;
  const filePath = req.body.file;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);

  const media = MessageMedia.fromFilePath(filePath);

  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// POST PARA ENVIO DE ÁUDIO GRAVADO URL
app.post('/send-record', async (req, res) => {
  const number = req.body.number.replace(/\D/g,'');
  const fileUrl = req.body.file;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);

  const media = await MessageMedia.fromUrl(fileUrl);

  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// POST PARA ENVIO DE ÁUDIO GRAVADO CAMINHO
app.post('/send-record2', async (req, res) => {
  const number = req.body.number.replace(/\D/g,'');
  const filePath = req.body.file;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);

  const media = MessageMedia.fromFilePath(filePath);

  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, media, {sendAudioAsVoice: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// POST PARA ENVIO DE VCARD
app.post('/send-vcard', async (req, res) => {
  const number = req.body.number.replace(/\D/g,'');
  const nome = req.body.nome;
  const email = req.body.email;
  const telefone = req.body.telefone;
  const info = req.body.info;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  // const nomeString = nome.toString();
  // const emailString = email.toString();
  // const telefoneString = telefone.toString();
  // const infoString = info.toString();

  // const vCard = `BEGIN:VCARD
  // VERSION:3.0
  // FN;CHARSET=UTF-8:${nomeString}
  // N;CHARSET=UTF-8:${nomeString};${nomeString};;;
  // EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:${emailString}
  // TEL;TYPE=HOME,VOICE:${telefoneString}
  // REV:${infoString}
  // END:VCARD`;

  const vCard =
    'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      'N:;' + nome + ';;;\n' +
      'FN:' + nome + '\n' +
      'TEL;type=CELL;waid=' + telefone+ ':+' + telefone + '\n' +
      'EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:'+ email + '\n' +
      'REV:' + info + '\n' +
      'END:VCARD'
  
  if (numberDDI !== "55") {
    const numberBSA = number + "@c.us";
    client.sendMessage(numberBSA, vCard, {parseVCards: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberBSA = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberBSA, vCard, {parseVCards: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberBSA = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberBSA, vCard, {parseVCards: true}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BLACK-API Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BLACK-API Mensagem não enviada',
      response: err.text
    });
    });
  }
});

// INITIALIZE DO SERVIÇO    
server.listen(port, function() {
  console.log(' BLACKSIDER API - Aloprando na porta *: ' + port);
});
