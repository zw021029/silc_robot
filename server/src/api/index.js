const express = require('express');
const router = express.Router();

const userRoutes = require('../routes/user');
const robotRoutes = require('../routes/robot');
const chatRoutes = require('../routes/chat');

router.use('/user', userRoutes);
router.use('/robot', robotRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
