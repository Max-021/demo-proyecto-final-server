//aca van las rutas de productos, cambiarlas acorde a las necesidades de cada proyecto
const express = require('express');
const formidableMiddleware = require('express-formidable');

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const imgFunctions = require('../auxiliaries/imgHandler');
const {editingRoles} = require('../data/roles');

const router = express.Router();

//routes
router.route('/').get(productController.catalogo);//MEJORAR ESTO!!!!!!! acomodar el tema de protect y restrict
router.get('/existing/:id', productController.getProduct);

router.use(authController.protect);
router.use(authController.restrict(...editingRoles));

router.post('/', formidableMiddleware({multiples: true}), imgFunctions.uploadImages, productController.createProduct);
router.get('/one', productController.getOnlyOne);

router.patch('/changedSimpleField', productController.updateFromSingleEnumField);
router.patch('/changedArrayField', productController.updateFromArrayEnumField);
router.patch('/changedStockField', productController.updateFromStockEnumField);

router.route('/existing/:id')
    .patch(formidableMiddleware({multiples: true}), imgFunctions.deleteImages, imgFunctions.uploadImages, productController.updateProduct)
    .delete(productController.deleteProduct);//temporal, revisar si hacer algo especial por el tema de las imagenes

module.exports = router;