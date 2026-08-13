import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in to continue' })
  }

  try {
    const claims = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ['HS384'],
    })

    req.username = claims.sub
    req.token = header.slice(7)

    if (!req.username) {
      return res.status(401).json({ error: 'Token has no subject' })
    }
    next()
  } catch (error) {

    const expired = error.name === 'TokenExpiredError'
    res.status(401).json({
      error: expired ? 'Your session has expired' : 'Invalid session',
    })
  }
}
