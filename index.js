const express = require('express');
const path = require('path');
require('dotenv').config({ path: './config.env' });
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const i18next = require('i18next');
const i18Backend = require('i18next-fs-backend');
const {LanguageDetector, handle} = require('i18next-http-middleware');

const AppError = require('./auxiliaries/appError');
const productRouter = require('./routes/product');
const enumFieldsRouter = require('./routes/enumFields');
const userRouter = require('./routes/user');
const userBasicsRouter = require('./routes/userBasics');
const captchaRouter = require('./routes/captcha');

const app = express();

app.use(helmet());
app.use(compression());
if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const READ_MAX = process.env.NODE_ENV === 'production' ? 1200 : 100;
const WRITE_MAX = process.env.NODE_ENV === 'production' ? 200 : 50;
const readLimiter = rateLimit({
  windowMs:60 * 60 * 1000,
  max:READ_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).set('Retry-After', Math.ceil(3600).toString()).json({
        status: 'fail',
        message: req.t('rateLimit.readExceeded'),
      });
  },
});
const writeLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: WRITE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).set('Retry-After', Math.ceil(30 * 60).toString()).json({
        status: 'fail',
        message: req.t('rateLimit.writeExceeded'),
      });
  },
});
app.set('trust proxy', 1);

app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD'].includes(req.method)) {
    return readLimiter(req, res, next);
  }
  return writeLimiter(req, res, next);
});

app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true,limit:'10kb'}));

app.use(cookieParser());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
}));

app.use(mongoSanitize());
app.use(xss());
app.use(
    hpp({
        whitelist:[],//agregar los campos que considere ej: 'name'
    })
);

i18next
  .use(i18Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    backend: {
      loadPath: __dirname+'/locales/{{lng}}.json',
    },
    detection: {
      order: ['header','querystring'],
      lookupQuerystring: 'lang',
    }
  });
app.use(handle(i18next));

//revisar el tema puertos para el deploy, temporal

const apiUrl = `/api/v1`

app.use(`${apiUrl}/userBasics`, userBasicsRouter);
app.use(`${apiUrl}/user`, userRouter);
app.use(`${apiUrl}/products`, productRouter);
app.use(`${apiUrl}/enumFields`,enumFieldsRouter);
app.use(`${apiUrl}/captcha`, captchaRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof AppError) {
    const keys = Array.isArray(err.message) ? err.message : [err.message];
    const messages = keys.map(key => {
      return req.t(key, err.data || {});
    });

    return res.status(err.statusCode).json({
      status: err.statusCode.toString().startsWith("4") ? 'fail' : 'error',
      message: messages.join(", "),
      data: err.toClient,
    });
  }

  res.status(500).json({
    status: 'error',
    errors: 'Something went wrong!',
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`${req.originalUrl} can't be found on the server`, 404));
})

module.exports = app;