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
const formidableMiddleware = require('express-formidable');

const AppError = require('./auxiliaries/appError');
const productRouter = require('./routes/product');
const enumFieldsRouter = require('./routes/enumFields');
const userRouter = require('./routes/user');
const userBasicsRouter = require('./routes/userBasics');

//IMPORTANTE, temporal, revisar como poner esto y tambien ver como lo protejo y si lo pongo en .env,
const allowedOrigins = ['http://localhost:3000', 'https://shoptemplateserver.onrender.com','https://shoptest-blue.vercel.app','https://shoptest-git-main-max021s-projects.vercel.app','https://shoptest-max021s-projects.vercel.app'];

const app = express();

//middlewares
//temporal, reviar todos los middlewares, helmet, morgan, limiter, mongoSanitize, xss, hpp, cookieparser y para que era express.json .urlencoded
app.use(helmet());
//temporal, revisar documentacion sobre que era morgan
if(process.env.NODE_ENV === 'development') {
    app.use(morgan);
}

const tryLimit = process.env.NODE_ENV === 'production' ? 10 : 100;
const limiter = rateLimit({max:tryLimit,windowsMs:60 * 60 * 1000,message: 'Too many tries from this ip, try again later'});
app.use('/api',limiter);

app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({extended: true,limit:'10kb'}));
app.use(cookieParser());
// app.use(formidableMiddleware({multiples:true}));//desactivado porque lo uso solo en el lugar que lo necesito

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(mongoSanitize());
app.use(xss());
//temporal, revisar que era hpp
// app.use(
//     hpp({
//         whitelist:[],//agregar los campos que considere ej: 'name'
//     })
// );



//reviar el tema puertos para el deploy, temporal

const apiUrl = `/api/v1`

app.use(`${apiUrl}/userBasics`, userBasicsRouter);
app.use(`${apiUrl}/user`, userRouter);
app.use(`${apiUrl}/products`, productRouter);
app.use(`${apiUrl}/enumFields`,enumFieldsRouter);

app.use((err,req,res,next) => {
    console.error(err.stack);
    console.error(err.statusCode);

    if(err instanceof AppError){
        return res.status(err.statusCode).json({
            status: err.status || 'error',
            message:err.message,
        })
    }

    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        err: err.stack//temporal, borrar
    })
});

app.all('*', (req, res, next) => {
    console.log(req.originalUrl)
    next(
        new AppError(`${req.originalUrl} can't be found on the server`, 404)
    )
})

module.exports = app;