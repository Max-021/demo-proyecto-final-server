const express = require('express');

const enumFieldsController = require('../controllers/enumFieldsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/')
    .get(authController.protect,enumFieldsController.getAllFields)
    .post(
        authController.protect,
        authController.restrict('admin'),
        enumFieldsController.createEnumField,
    );
router.route('/categories').get(enumFieldsController.getCategories);

router.route('/:id')
    .get(enumFieldsController.getEnumField)
    .patch(
        authController.protect,
        authController.restrict('admin'),
        enumFieldsController.updateEnumField,
        )
    .delete(
        authController.protect,
        authController.restrict('admin'),
        enumFieldsController.deleteEnumField,
    )

module.exports = router;