const request = require('request');
const fs = require('fs');
const base64url = require('base64url');
const crypto = require('crypto');

const config = require('./config');

const SITE_URL = config.SITE_URL;
const REST_API = '/rest/api/3';
// Чтение ключа для подписи токена из файла
const SECRET = fs.readFileSync("secret.txt", "utf8");
// Чтение ключа приложения из дескриптора
const APP_KEY = require('./public/atlassian-connect').key;

// Запрос всех данных
const resourceList = config.resources;
resourceList.forEach(getData);

/*
  Функция принимает адрес ресурса REST api, генерирует jwt токен и отправляет запрос.
*/
function getData (resourceUrl) {

  // Подготовка канонической строки запроса вида
  // <canonical-method>&<canonical-URI>&<canonical-query-string>
  let req = `GET&${REST_API + resourceUrl}&`;

  // Хеширование строки запроса
  const hash = crypto.createHash('sha256');
  hash.update(req);
  req = hash.digest('hex');

  // Получение времени создания токена в секундах
  const now = Math.trunc(Date.now() / 1000);

  // Подготовка шапки токена
  const header = {
    "typ":"JWT",
    "alg":"HS256"
  };

  // Подготовка данных токена
  const clims = {
     "iss": APP_KEY,    // Ключ приложения
     "iat": now,        // Время создания
     "exp": now + 300,  // Время истечения
     "qsh": req         // Хеш строки запроса
  };

  // Кодирование шапки и данных в base64url
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClims = base64url(JSON.stringify(clims));

  // Создание подписи токена
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(`${encodedHeader}.${encodedClims}`);
  let signature = hmac.digest('base64');
  // Преобразование в кодировку base64url
  signature = base64url.fromBase64(signature);

  // Формирование токена
  const token = `${encodedHeader}.${encodedClims}.${signature}`

  // Подготовка данных запроса
  const reqOptions = {
    method: 'GET',
    url: `${SITE_URL+REST_API+resourceUrl}?jwt=${token}`,
    headers: {
       'Accept': 'application/json',
    }
  };

  // Отправка запроса
  request(reqOptions, (err, response, body) => {
    if (err) throw new Error(err);

    console.log(`
      Resource: ${resourceUrl}
      Response: ${response.statusCode} ${response.statusMessage}
      Body: ${body}`
    );

    // Преобразование полученных данных к объекту
    body = JSON.parse(body);

    const output = {
      "Resource": resourceUrl,
      "Data": body
    }

    // Запись результата в файл
    fs.appendFileSync("output.json", JSON.stringify(output));
  });
}