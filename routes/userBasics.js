//rutas principales sin middlewares de proteccion y/o restriccion
const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/checkSession',authController.alreadyLoggedIn);
router.get('/logout',authController.logout);
router.post('/signup',authController.signup);//temporal, agregar en la funcion signup el controlador de autenticacion para que solo el administrador pueda agregar cuentas
router.post('/login',authController.login);
router.post('/passwordForgotten',authController.passwordForgotten);
router.patch('/retryPassword',authController.retryPassword);


module.exports = router;