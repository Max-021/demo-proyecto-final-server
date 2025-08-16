//rutas principales sin middlewares de proteccion y/o restriccion
const express = require('express');

const authController = require('../controllers/authController');
const captchaMiddlewares = require('../controllers/middlewares/captcha');

const router = express.Router();

router.get('/checkSession',authController.alreadyLoggedIn);
router.get('/logout',authController.logout);
router.post('/signup',authController.signup);
router.post('/login', captchaMiddlewares.conditionalLoginCaptcha, authController.login);
router.post('/passwordForgotten',authController.passwordForgotten);
// router.patch('/retryPassword',authController.retryPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/validateResetToken/:token', authController.validateResetToken);
router.post('/passwordReset/validate/:token', authController.validateRulesPasswordReset)


module.exports = router;