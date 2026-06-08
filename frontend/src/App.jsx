import { useEffect, useState } from 'react'
import PersonForm from './components/PersonForm'
import Persons from './components/Persons'
import Notification from './components/Notification'
import personsService from './services/persons'

const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    personsService
      .getAll()
      .then((initialPersons) => {
        setPersons(initialPersons)
      })
      .catch(() => {
        showMessage('Could not load phonebook entries', 'error')
      })
  }, [])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)

    setTimeout(() => {
      setMessage(null)
    }, 3000)
  }

  const addPerson = (event) => {
    event.preventDefault()

    const name = newName.trim()
    const number = newNumber.trim()

    if (!name || !number) {
      showMessage('Name and number are required', 'error')
      return
    }

    const personObject = {
      name,
      number,
    }

    const existingPerson = persons.find((person) => person.name === name)

    if (existingPerson) {
      const confirmUpdate = window.confirm(
        `${name} is already added to phonebook, replace the old number with a new one?`
      )

      if (!confirmUpdate) {
        return
      }

      const updatedPerson = { ...existingPerson, number }

      personsService
        .update(existingPerson.id, updatedPerson)
        .then((returnedPerson) => {
          setPersons(
            persons.map((person) =>
              person.id === existingPerson.id ? returnedPerson : person
            )
          )
          setNewName('')
          setNewNumber('')
          showMessage(`Updated ${returnedPerson.name}`)
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.error || `Could not update ${name}`
          showMessage(errorMessage, 'error')
        })

      return
    }

    personsService
      .create(personObject)
      .then((returnedPerson) => {
        setPersons(persons.concat(returnedPerson))
        setNewName('')
        setNewNumber('')
        showMessage(`Added ${returnedPerson.name}`)
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.error || 'Could not add person'
        showMessage(errorMessage, 'error')
      })
  }

  const deletePerson = (person) => {
    if (!window.confirm(`Delete ${person.name}?`)) {
      return
    }

    personsService
      .remove(person.id)
      .then(() => {
        setPersons(persons.filter((currentPerson) => currentPerson.id !== person.id))
        showMessage(`Deleted ${person.name}`)
      })
      .catch(() => {
        showMessage(`Could not delete ${person.name}`, 'error')
      })
  }

  return (
    <div>
      <h1>Phonebook</h1>

      <Notification message={message} type={messageType} />

      <h2>Add a new</h2>
      <PersonForm
        onSubmit={addPerson}
        newName={newName}
        newNumber={newNumber}
        onNameChange={(event) => setNewName(event.target.value)}
        onNumberChange={(event) => setNewNumber(event.target.value)}
      />

      <h2>Numbers</h2>
      <Persons persons={persons} onDelete={deletePerson} />
    </div>
  )
}

export default App
