import { createError } from 'h3'

export default eventHandler(async (event) => {
  const body = await readBody(event)

  const email = String(body?.email ?? '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required.' })
  }

  return {
    message: 'If an account exists for this email, a reset link has been sent.'
  }
})