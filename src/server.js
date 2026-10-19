const express = require('express')
const app = express()
require('dotenv').config()
const PORT = process.env.PORT || 3000
const cors = require('cors')

console.log(`Node.js ${process.version}`)


app.use(express.json())
app.use(cors({
    origin: [ 
        'https://people.arcada.fi',
        'http://people.arcada.fi',
    ]
}))

app.get('/', (req, res) => {
    res.json({ msg: "Auth-API" })
})

const authenticationRouter = require('./routes/authentication')
app.use('/auth', authenticationRouter)

app.listen(PORT, () => {
    try {
        console.log(`Running on http://localhost:${PORT}`)
    } catch (error) {
        console.error(`Error starting server: ${error.message}`)
    }
    
})
