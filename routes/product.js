//aca van las rutas de productos, cambiarlas acorde a las necesidades de cada proyecto
const express = require('express');
const formidableMiddleware = require('express-formidable');

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const productMiddlewares = require('../controllers/middlewares/product');
const imgFunctions = require('../auxiliaries/imgHandler');
const {editingRoles} = require('../data/roles');

const router = express.Router();

//routes
router.route('/').get(productMiddlewares.editorQueryAuth, productController.checkCatalogue, productController.catalogo);
router.post('/checkOrder', productController.checkOrder);
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
    .delete(productController.deleteProduct);

module.exports = router;