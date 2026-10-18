const jwt = require('jsonwebtoken');

/**
 * protect
 * Reads the JWT from the Authorization header ("Bearer <token>"),
 * verifies it with JWT_SECRET, and attaches the decoded organisation id
 * to req.orgId so downstream handlers know who is making the request.
 *
 * Returns 401 if the token is missing, malformed, or invalid.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — no token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.orgId = decoded.id; // set by authController when the token is signed
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorised — token invalid or expired.' });
  }
};

module.exports = { protect };
