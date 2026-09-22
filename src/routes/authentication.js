const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient()



router.post('/register', async (req,res) =>{
    try {
        const hashPassword = await bcrypt.hash( req.body.password, 10)
        const user = await prisma.users.create({
            data: {
                username: req.body.username,
                password: hashPassword
            }
        })

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username
            }
        })
    } catch (error) {
        res.status(400).json({
            message: 'Invalid request'
        }
        )
    }
    
})

router.post('/login', async (req,res) =>{
    try {
        requestedCreds = await prisma.users.findUnique({
            where: {username: req.body.username}
        })
        
        if(!requestedCreds){
            return res.status(404).json({
                message: "Invalid credentials"
            })
        }
        const credComparison = await bcrypt.compare(req.body.password, requestedCreds.password)
        if(!credComparison){
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }
        jwtToken = jwt.sign({
            id: requestedCreds.id,
            username: requestedCreds.username
        }, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.status(200).json({
            message: "Login succesfull",
            token: jwtToken
        });
        
        
    } catch (error) {
        res.status(401).json({
            message: "Authorization failed"
        })
    }
})

module.exports = router
