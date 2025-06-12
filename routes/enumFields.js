const express = require('express');

const enumFieldsController = require('../controllers/enumFieldsController');
const authController = require('../controllers/authController');
const {editingRoles} = require('../data/roles');

const router = express.Router();

router.route('/')
    .get(authController.protect,enumFieldsController.getAllFields)
    .post(
        authController.protect,
        authController.restrict(...editingRoles),
        enumFieldsController.createEnumField,
    );
router.route('/filterData').get(enumFieldsController.getCategories);

router.route('/:id')
    .get(enumFieldsController.getEnumField)
    .patch(
        authController.protect,
        authController.restrict(...editingRoles),
        enumFieldsController.updateEnumField,
        )
    .delete(
        authController.protect,
        authController.restrict(...editingRoles),
        enumFieldsController.deleteEnumField,
    )

module.exports = router;