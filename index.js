require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

const {
  getHome,
  getUsers,
  postUser,
  postExercise,
  getLogs
} = require('./controller')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))

app.get('/', getHome);
app.route('/api/users').get(getUsers).post(postUser)
app.post('/api/users/:userId/exercises', postExercise)
app.get('/api/users/:userId/logs', getLogs)


const start = async() => {
  try{
    const port = process.env.PORT || 3000
    const db = await mongoose.connect(process.env.MONGO_URI)
    if(db) console.log("MongoDB connected!")
    app.listen(port, () => console.log(`App listening on port: ${port}`))
  }
  catch(error) {
    console.error(error)
  }
}
start()