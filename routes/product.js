//aca van las rutas de productos, cambiarlas acorde a las necesidades de cada proyecto
const express = require('express');

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

//routes
router.route('/').get(productController.catalogo);

router.route('/').post(
    authController.protect,
    authController.restrict('admin'),
    productController.createProduct,//temporal, revisar si hacer algo especial por el tema de las imagenes
);
router.route('/one').get(authController.protect, productController.getOnlyOne);
router
    .route('/:id')//REVISAR esto del id, temporal, tengo que ver que parametro pasar
    .get(productController.getProduct)
    .patch(
        authController.protect,
        authController.restrict('admin'),
        productController.updateProduct,//temporal, revisar si hacer algo especial por el tema de las imagenes
    )
    .delete(
        authController.protect,
        authController.restrict('admin'),
        productController.deleteProduct,//temporal, revisar si hacer algo especial por el tema de las imagenes
);

module.exports = router;