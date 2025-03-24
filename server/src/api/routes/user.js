const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

router.post('/register', validate.register, userController.register);
router.post('/login', validate.login, userController.login);

module.exports = router;