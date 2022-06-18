const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const process = require('process')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}

notesRouter.get('/', async (request, response) => {
  // Note.find({})
  //   .then(notes => {
  //     response.json(notes)
  //   })
  const notes = await Note.find({}).populate('user',{ username: 1, name: 1 })
  response.json(notes)
})

// notesRouter.get('/:id', (request, response, next) => {
//   Note.findById(request.params.id)
//     .then(note => {
//       if (note) {
//         response.json(note)
//       } else {
//         response.status(404).end()
//       }
//     })
//     .catch(error => next(error))
// })

notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
  // try {
  //   const note = await Note.findById(request.params.id)
  //   if (note) {
  //     response.json(note)
  //   } else {
  //     response.status(404).end()
  //   }
  // } catch(exception) {
  //   next(exception)
  // }
})

notesRouter.post('/', async (request, response) => {
  const body = request.body
  const token = getTokenFrom(request)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date(),
    user: user._id
  })

  const savedNote = await note.save()
  user.notes = user.notes.concat(savedNote._id)
  await user.save()
  response.status(201).json(savedNote)
  // try {
  //   const savedNote = await note.save()
  //   response.status(201).json(savedNote)
  // } catch(exception) {
  //   next(exception)
  // }
  // note.save()
  //   .then(savedNote => {
  //     response.status(201).json(savedNote)
  //   })
  //   .catch(error => next(error))
})

notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

// notesRouter.delete('/:id', async (request, response, next) => {
//   try {
//     await Note.findByIdAndRemove(request.params.id)
//     response.status(204).end()
//   } catch (exception) {
//     next(exception)
//   }
// })

// notesRouter.delete('/:id', (request, response, next) => {
//   Note.findByIdAndRemove(request.params.id)
//     .then(() => {
//       response.status(204).end()
//     })
//     .catch(error => next(error))
// })

notesRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

module.exports = notesRouter