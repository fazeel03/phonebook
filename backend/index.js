require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const Person = require('./models/person')
const app = express()

mongoose.set('strictQuery', false)

const url = process.env.MONGODB_URI

mongoose.connect(url)

app.use(express.static('dist'))
app.use(express.json())

morgan.token('body', (request) => {
  return request.method === 'POST' ? JSON.stringify(request.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/', (request, response) => {
  response.send('<h1>Phonebook Backend</h1>')
})

app.get('/api/persons', async (request, response, next) => {
  try {
    const persons = await Person.find({})
    response.json(persons)
  } catch (error) {
    next(error)
  }
})

app.get('/info', async (request, response, next) => {
  try {
    const requestTime = new Date()
    const personCount = await Person.countDocuments({})

    response.send(`
      <p>Phonebook has info for ${personCount} people</p>
      <p>${requestTime}</p>
    `)
  } catch (error) {
    next(error)
  }
})

app.get('/api/persons/:id', async (request, response, next) => {
  try {
    const person = await Person.findById(request.params.id)

    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

app.delete('/api/persons/:id', async (request, response, next) => {
  try {
    await Person.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.put('/api/persons/:id', async (request, response, next) => {
  try {
    const body = request.body

    const updatedPerson = await Person.findByIdAndUpdate(
      request.params.id,
      { name: body.name, number: body.number },
      { new: true, runValidators: true, context: 'query' }
    )

    if (updatedPerson) {
      response.json(updatedPerson)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

app.post('/api/persons', async (request, response, next) => {
  try {
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

    const existingPerson = await Person.findOne({ name: body.name })

    if (existingPerson) {
      return response.status(400).json({
        error: 'name must be unique',
      })
    }

    const person = new Person({
      name: body.name,
      number: body.number,
    })

    const savedPerson = await person.save()
    response.status(201).json(savedPerson)
  } catch (error) {
    next(error)
  }
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
