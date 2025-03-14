//aca van las rutas de productos, cambiarlas acorde a las necesidades de cada proyecto
const express = require('express');
const formidableMiddleware = require('express-formidable');

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const imgFunctions = require('../auxiliaries/imgHandler');

const router = express.Router();

//routes
router.route('/').get(productController.catalogo);

router.route('/').post(
    authController.protect,
    authController.restrict('admin'),
    formidableMiddleware({multiples: true}),
    imgFunctions.uploadImgs,
    productController.createProduct,
);
router.route('/one').get(authController.protect, productController.getOnlyOne);
router
    .route('/changedSimpleField')
    .patch(
        authController.protect,
        authController.restrict('admin'),
        productController.updateFromSingleEnumField,
    );
router
    .route('/changedArrayField')
    .patch(
        authController.protect,
        authController.restrict('admin'),
        productController.updateFromArrayEnumField,
    )
router
    .route('/:id')//temporal, revisar tema vulnerabilidades con el pasaje del id
    .get(productController.getProduct)
    .patch(
        authController.protect,
        authController.restrict('admin'),
        formidableMiddleware({multiples: true}),
        imgFunctions.uploadImgs,
        productController.updateProduct,
    )
    .delete(
        authController.protect,
        authController.restrict('admin'),
        productController.deleteProduct,//temporal, revisar si hacer algo especial por el tema de las imagenes
);

module.exports = router;