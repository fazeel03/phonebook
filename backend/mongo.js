const mongoose = require('mongoose')

const password = process.argv[2]
const name = process.argv[3]
const number = process.argv[4]

if (!password) {
  console.log('usage: node mongo.js <password> [name] [number]')
  process.exit(1)
}

if ((name && !number) || (!name && number)) {
  console.log('provide both name and number when adding a phonebook entry')
  process.exit(1)
}

mongoose.set('strictQuery', false)

const encodedPassword = encodeURIComponent(password)
const url = `mongodb+srv://fazzeeel_db_user:${encodedPassword}@phonebook.vtrkh89.mongodb.net/phonebookApp?appName=phonebook`

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

const run = async () => {
  try {
    await mongoose.connect(url)

    if (name && number) {
      const person = new Person({
        name,
        number,
      })

      await person.save()
      console.log(`added ${name} number ${number} to phonebook`)
      return
    }

    const persons = await Person.find({})

    console.log('phonebook:')
    persons.forEach((person) => {
      console.log(`${person.name} ${person.number}`)
    })
  } catch (error) {
    console.error('could not access the phonebook database')
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
