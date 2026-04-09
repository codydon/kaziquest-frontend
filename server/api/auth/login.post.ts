import { createError } from 'h3'

export default eventHandler(async (event) => {
  const body = await readBody(event)

  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }

  if (!email.includes('@') || password.length < 4) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  const timestamp = Date.now()

  return {
    access: `demo-access-${timestamp}`,
    refresh: `demo-refresh-${timestamp}`,
    user: {
      id: `user-${timestamp}`,
      email,
      name: email.split('@')[0],
      company: {
        name: 'KaziQuest Demo'
      }
    }
  }
})