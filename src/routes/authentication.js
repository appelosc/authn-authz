const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { z } = require('zod')
const authorize = require('../middleware/authorize')
const crypto = require('crypto')
const { hashToken } = require('../utils/hash')



const prisma = new PrismaClient()


const credentialsSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1)
})



router.post('/register', async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Username and password are required'
        })
    }
    const { username, password } = parsed.data

    try {
        const hashPassword = await bcrypt.hash(password, 10)
        const user = await prisma.users.create({
            data: {
                username: username,
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
        })
    }

})

router.post('/login', async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body)
    if (!parsed.success) {
        return res.status(400).json({
            message: 'Username and password are required'
        })
    }
    const { username, password } = parsed.data

    try {
        await prisma.tokens.deleteMany({
            where: { expires_at: { lt: new Date() } }
        })
        const requestedCreds = await prisma.users.findUnique({
            where: { username: username }
        })

        if (!requestedCreds) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }
        const credComparison = await bcrypt.compare(password, requestedCreds.password)
        if (!credComparison) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }
        const jwtToken = jwt.sign({
            sub: requestedCreds.id,
            username: requestedCreds.username
        }, process.env.JWT_SECRET, { expiresIn: '15m' })
        const refreshToken = jwt.sign({
            sub: requestedCreds.id,
            jti: crypto.randomUUID()
        }, process.env.REFRESH_SECRET, { expiresIn: '30d' })
        const { iat, exp } = jwt.decode(refreshToken)
        await prisma.tokens.create({
            data: {
                user_id: Number(requestedCreds.id),
                token: hashToken(refreshToken),
                issued_at: new Date(iat * 1000),
                expires_at: new Date(exp * 1000)
            }
        })


        res.status(200).json({
            message: "Login succesfull",
            token: jwtToken,
            refresh: refreshToken
        });


    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error"
        })
    }
})
router.post('/refresh', authorize, async (req, res) => {
    try {
        const token = await prisma.tokens.findUnique({
            where: { token: hashToken(req.refreshToken) },
            include: { user: true }
        })
        if (!token) {
            return res.status(401).json({
                message: "Invalid token"
            })
        }
        const jwtToken = jwt.sign({
            sub: token.user.id,
            username: token.user.username
        }, process.env.JWT_SECRET, { expiresIn: '15m' })

        res.status(200).json({
            message: "New token issued",
            token: jwtToken,
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Internal server error"
        })
    }

})
router.delete('/logout', async (req, res) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization failed' })
    }
    const token = authHeader.split(' ')[1]
    try {
        const deleteToken = await prisma.tokens.deleteMany({
            where: { token: hashToken(token) }
        })
        return res.status(200).json({
            message: "Succesfully logged out."
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }

})


module.exports = router
