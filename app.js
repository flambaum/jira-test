const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const config = require('./config')

const PORT = config.port;

// Создание приложения express
const app = express();

// Регистрация промежуточного обработчика для разбора json данных
app.use(bodyParser.json());

// Регистрауия static каталога
const static = path.join(__dirname, 'public');
app.use(express.static(static));

// Регистрация обработчика запросов по пути /installed
app.all('/installed', (req, res) => {
  // Получение ключа для подписи токена из тела запроса
  const secret = req.body.sharedSecret;

  // Запись ключа в файл
  fs.writeFile("secret.txt", secret, (err) => {
    if(err) throw err;
    console.log('SECRET SAVED');
  });
  
  // Отправка ответа 200 OK
  res.sendStatus(200);
});

// Старт сервера
http.createServer(app).listen(PORT, () => {
  console.log('App server running on port ', PORT);
});