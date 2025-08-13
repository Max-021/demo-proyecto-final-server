const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/password/validate', authController.validatePasswordStatus);

router.use(authController.protect);

//protected routes
router.get('/userInfo/:id', authController.restrictToSelf, authController.getUserInfo);
// router.patch('/newPassword',authController.retryPassword);
router.patch('/updateMe/:id', authController.restrictToSelf, userController.updateUser);
router.patch('/deactivateMe/:id', authController.restrictToSelf, userController.deactivateMe);
router.delete('/deleteMe/:id',authController.restrictToSelf, userController.deleteUser);
router.patch('/changePassword', authController.updatePassword);

router.use(authController.restrict('admin'));

//restricted routes
router.route('/createUser').post(authController.createUser);
router.route('/rolesList').get(userController.getRoles);
router.route('/usersList').get(userController.getUsers);
router.route('/userInfo/:id').delete(userController.deactivateMe);
router.route('/toggleSuspension').patch(userController.toggleSuspension);
router.route('/changeRole').patch(userController.changeUserRole);

module.exports = router;