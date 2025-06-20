const express = require('express');

const enumFieldsController = require('../controllers/enumFieldsController');
const authController = require('../controllers/authController');
const {editingRoles} = require('../data/roles');

const router = express.Router();

//acá arriba de los middlewares las rutas que considere que tienen que ser de acceso publico
router.get('/filterData',enumFieldsController.getFilterData);

router.use(authController.protect);
router.use(authController.restrict(...editingRoles));

router.route('/')
    .get(enumFieldsController.getAllFields)
    // .post(enumFieldsController.createEnumField);//temporal, terminar la funcion para agregar estos documentos, va atado al modelo de productos

router.route('/:id')
    .get(enumFieldsController.getEnumField)
    .patch(enumFieldsController.updateEnumField)
    .delete(enumFieldsController.deleteEnumField)

module.exports = router;