import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import https from 'https';
import cors from 'cors';
import express from 'express';
import routes from './routes';
import { setConnection } from './utils/connection';
import bodyParser from 'body-parser';
import passport from 'passport';
import { logger } from './utils/logger.js';
const app = express()

// Use the passport Middleware
app.use(passport.initialize());
// Bring in the Passport Strategy
require('./utils/passport.js')(passport);

const isHttps = process.env.isHttps * 1 === 1;
const httpsPort = process.env.httpsPort;
const httpPort = process.env.httpPort;
let credentials = null;

if(isHttps) {
  const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
  const certificate = fs.readFileSync('sslcert/server.pem', 'utf8');
  credentials = {key: privateKey, cert: certificate};
}

// app.use(cors())
setCors(app);

setConnection();
console.log("Connected to Database")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/testing', routes.testing)
app.use('/items', routes.items)
// app.use('/users', routes.users)
app.use('/wallet', routes.wallet)

if(isHttps) {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(httpsPort, function () {
    logger.info(`Nusic api has started on https port ${httpsPort}.`);
  })  
}

const httpServer = http.createServer(app);
httpServer.listen(httpPort, function () {
  logger.info(`Nusic api has started on http port ${httpPort}.`);
})

// app.listen(process.env.httpPort, () =>
// 		console.log('App running on port ' + process.env.httpPort)
// )

function setCors(app) {
  const whitelist = [
    'http://127.0.0.1:3000', 
    'http://localhost:3000', 
		'https://app.nusic.pro',
		'https://wallet-login-sample.vercel.app'
  ];
  const origin = function (origin, callback) {
		// console.log('cors origin', origin);
    if(origin === undefined) callback(null, true); // for postman testing ######
    else if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('Not allowed by CORS');
      // callback(new Error('Not allowed by CORS'))
    }
  };
  app.use(cors({
      origin,
      maxAge: 5,
      credentials: true,
      allowMethods: ['GET', 'POST'],
      allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    })
  )
}