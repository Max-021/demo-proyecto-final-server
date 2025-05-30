const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();
//IMPORTANTE
/*
todas las rutas tienen el middleware protect y/o restrict dependiendo de la necesidad adentro del llamado a la ruta, esto es porque poniendolo por fuera
para que afecte a todas las rutas debajo del llamado a proteger o restringir termina por llamar a ambos metodos incluso en las rutas que estan por
arriba, dejo comentado por las dudas las partes donde va por si termino por resolver esto, por ahora queda así que funciona pero escribo un poco
más de código
*/

//middleware para proteger las rutas a partir de esta funcion, que se ejecuta previo al acceso a cualquiera de estas rutas, comentado porque esta dentro de las funciones
router.use(authController.protect);

//protected routes
router.get('/userInfo', authController.getUserInfo);
router.patch('/newPassword',authController.retryPassword);//chequear que el reinicio de la contraseña sea correcto, temporal
router.patch('/updateMe/:id',userController.updateUser);
router.delete('/deleteMe/:id',userController.deactivateMe);
router.patch('/changePassword', authController.updatePassword);

//middleware para restringir ciertas acciones al administrador, comentado porque esta dentro de las funciones
// router.use('/restrict',authController.restrict('admin'));
router.use(authController.restrict('admin'));

//restricted routes
router.route('/createUser').post(authController.createUser);
router.route('/rolesList').get(userController.getRoles);
router.route('/usersList').get(userController.getUsers);
router.route('/userInfo/:id').delete(userController.deactivateMe);
router.route('/toggleSuspension').patch(userController.toggleSuspension);
router.route('/changeRole').patch(userController.changeUserRole);

module.exports = router;