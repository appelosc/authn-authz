const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {PrismaClient} = require('@prisma/client')

router.post('/register',  (req,res) =>{
    console.log('Name:' + req.body.username + 'Password: ' + req.body.password)
    res.send('register works')
})



module.exports = router
