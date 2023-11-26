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
const fs = require('fs');

// PORTA ONDE O SERVIÇO SERÁ INICIADO
const port = 8000;
const idClient = 'BLACK-API';
let messageHistory = new Map();
let firstMessage = new Map();

//Função para salvar o histórico de mensagens em um arquivo JSON
const saveMessageHistoryToFile = () => {
  const jsonData = JSON.stringify([...messageHistory]);
  fs.writeFile('messageHistory.json', jsonData, (err) => {
    if (err) {
      console.error('Erro ao salvar o histórico de mensagens:', err);
    } else {
      console.log('O histórico de mensagens foi salvo em messageHistory.json');
    }
  });
};

//Função para carregar o histórico de mensagens a partir de um arquivo JSON
const loadMessageHistoryFromFile = () => {
  try {
    const jsonData = fs.readFileSync('messageHistory.json', 'utf8');
    messageHistory = new Map(JSON.parse(jsonData));
  } catch (err) {
    console.error('Erro ao carregar o histórico de mensagens:', err);
  }
};

// Adicione a função updateMessageHistory aqui
const updateMessageHistory = (chatId, message, isFirstMessage) => {
  if (!messageHistory.has(chatId)) {
    messageHistory.set(chatId, []);
  }
  const history = messageHistory.get(chatId);
  if (isFirstMessage) {
    history.push({ sender: 'bot', content: `*BLACKSIDER* 🤖`, timestamp: new Date() });
  }

  history.push({ ...message, timestamp: new Date() });
  saveMessageHistoryToFile(); // Salva o histórico de mensagens em um arquivo

  // Limita o tamanho do histórico, defina o número de mensagens que você deseja salvar.
  //const maxHistorySize = 10;
  //while (history.length > maxHistorySize) {
 //   history.shift();
 // }
};


// Adicione a função clearMessageHistoryPeriodically aqui
const clearMessageHistoryPeriodically = (interval, hours) => {
  setInterval(() => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    messageHistory.forEach((messages, chatId) => {
      const filteredMessages = messages.filter(message => message.timestamp >= cutoffTime);
      messageHistory.set(chatId, filteredMessages);
    });

    saveMessageHistoryToFile(); // Salve o histórico de mensagens atualizado em um arquivo
  }, interval);
};


//CONFIG CHATGPT Inserir as chaves abaixo
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    organization: 'org-xxxxxxxxxxxx',
    apiKey: 'sk-xxxxxxxxxxxxxxxxxx',
});
const openai = new OpenAIApi(configuration);

// GERA RESPOSTA TEXTO CHATGPT
const getDavinciResponse = async (clientText, historyText, chatId) => {
  const options = {
    model: "gpt-3.5-turbo", // Modelo GPT a ser usado
    prompt: historyText + clientText, // Texto enviado pelo usuário
    temperature: 0.7, // Nível de variação das respostas geradas, 1 é o máximo
    max_tokens: 3500 // Quantidade de tokens (palavras) a serem retornadas pelo bot, 4000 é o máximo
  };

  try {
    const response = await openai.createCompletion(options);
    let botResponse = "";
    response.data.choices.forEach(({ text }) => {
      botResponse += text;
    });
    botResponse = botResponse.trim();

    // Verifica se o tamanho da resposta é maior que o limite de tokens permitido
    if (botResponse.split(' ').length > 3950) {
      return botResponse;
    }

    return botResponse;
  } catch (e) {
    console.error('Erro ao processar a resposta:', e.response.data.error.message);
    let errorMessage = "";
    if (e.response.data.error.message) {
      errorMessage = "Desculpe, houve um erro ao processar sua solicitação. Por favor, reformule sua pergunta.";
    } else {
      errorMessage = "Desculpe, houve um erro desconhecido. Por favor, tente novamente.";
    }
    return `❌ Erro de resposta da OpenAI: ${errorMessage}. Por favor, reformule sua pergunta.`;
  }
};

// GERA URL DA IMAGEM CHATGPT
const getDalleResponse = async (clientText) => {
  const options = {
      prompt: clientText, // Descrição da imagem
      n: 1, // Número de imagens a serem geradas
      size: "1024x1024", // Tamanho da imagem
  }

  try {
      const response = await openai.createImage(options);
      return { url: response.data.data[0].url, error: null };
  } catch (e) {
      return { url: null, error: `❌ Não consigo atender sua solicitação LINDESO: Ela foi rejeitada como resultado de nosso sistema de segurança. Seu prompt pode conter texto que não é permitido pelo nosso sistema de segurança.\r\n Refaça sua solicitação com mais detalhes e sem pedidos proibidos` };
  }
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
  socket.emit('message', '© BLACK-API - Iniciado meu Calabreso!');
  socket.emit('qr', './icon.svg');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BLACK-API QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', '© BLACK-API Dispositivo pronto!');
    socket.emit('message', '© BLACK-API Dispositivo pronto!');
    socket.emit('qr', './check.svg')	
    console.log('© BLACK-API Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', '© BLACK-API Autenticado!');
    socket.emit('message', '© BLACK-API Autenticado!');
    console.log('© BLACK-API Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', '© BLACK-API Falha na autenticação, reiniciando...');
    console.error('© BLACK-API Falha na autenticação');
});

client.on('change_state', state => {
  console.log('© BLACK-API Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', '© BLACK-API Cliente desconectado!');
  console.log('© BLACK-API Cliente desconectado', reason);
  client.initialize();
});
});

// EVENTO DE ESCUTA/ENVIO DE MENSAGENS RECEBIDAS PELA API
client.on('message', async msg => {

  const msgChatGPT = msg.body;
  const chatId = msg.from;

  // Atualiza o histórico de mensagens
  updateMessageHistory(chatId, { sender: 'user', content: msgChatGPT });

// Cria o histórico de texto para passar para a função getDavinciResponse
const historyText = messageHistory.get(chatId).map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Bot'}: ${msg.content}`).join('\n') + ' \n';

  // mensagem de texto
  if (msgChatGPT !== null && !msgChatGPT.includes("/imagine")) {
    const question = msgChatGPT;
    getDavinciResponse(question, historyText, chatId).then((response) => {
      let botResponse = response;
    
      const isFirstMessage = !firstMessage.has(chatId) || firstMessage.get(chatId);
      if (isFirstMessage) {
        firstMessage.set(chatId, false);
        botResponse = `*BLACKSIDER* 🤖\n\n${botResponse}`;
      }
    
      client.sendMessage(msg.from, botResponse);
      updateMessageHistory(chatId, { sender: 'bot', content: botResponse }, isFirstMessage);
    });       
  }

  // imagem
  if (msgChatGPT.includes('/imagine ')) {
    msg.reply('Ok CALABRESO Aguarde enquanto gero sua imagem...');
    const index = msgChatGPT.indexOf(" ");
    const imgDescription = msgChatGPT.substring(index + 1);
    getDalleResponse(imgDescription, msg).then(async (result) => {
        if (result.error) {
            msg.reply('Desculpe, ocorreu um erro ao gerar a imagem. Por favor, tente uma solicitação mais leve.');
            console.error(result.error);
        } else {
            const media = await MessageMedia.fromUrl(result.url);
            client.sendMessage(msg.from, media, { caption: imgDescription });
        }
    }).catch(error => {
        console.error('Erro ao gerar imagem:', error);
        msg.reply('Desculpe, ocorreu um erro ao gerar a imagem. Por favor, tente uma solicitação mais leve.');
    });
}
});

// INITIALIZE DO SERVIÇO    
server.listen(port, function() {
  console.log('BLACKSIDER API - Aloprando rodando na porta *: ' + port);

  // Chame a função clearMessageHistoryPeriodically após o server.listen
  //clearMessageHistoryPeriodically(1 * 60 * 60 * 1000); // Limpa o histórico de mensagens a cada 1 hora

  // Carregue o histórico de mensagens do arquivo e limpe o arquivo
  loadMessageHistoryFromFile();
  saveMessageHistoryToFile();
});