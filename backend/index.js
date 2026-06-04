require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const app = express()

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

const Person = mongoose.model('Person', personSchema)

app.use(express.static('dist'))
app.use(express.json())

morgan.token('body', (request) => {
  return request.method === 'POST' ? JSON.stringify(request.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

let persons = []

app.get('/', (request, response) => {
  response.send('<h1>Phonebook Backend</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons)
  })
})

app.get('/info', (request, response) => {
  const requestTime = new Date()

  response.send(`
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${requestTime}</p>
  `)
})

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id
  const person = persons.find((person) => person.id === id)

  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = request.params.id
  persons = persons.filter((person) => person.id !== id)

  response.status(204).end()
})

app.post('/api/persons', (request, response) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({
      error: 'name is missing',
    })
  }

  if (!body.number) {
    return response.status(400).json({
      error: 'number is missing',
    })
  }

  Person.findOne({ name: body.name }).then((existingPerson) => {
    if (existingPerson) {
      return response.status(400).json({
        error: 'name must be unique',
      })
    }

    const person = new Person({
      name: body.name,
      number: body.number,
    })

    person.save().then((savedPerson) => {
      response.status(201).json(savedPerson)
    })
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
