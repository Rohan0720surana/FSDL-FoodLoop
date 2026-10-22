const jwt = require('jsonwebtoken');

/**
 * protect
 * Reads the JWT from the Authorization header ("Bearer <token>"),
 * verifies it with JWT_SECRET, and attaches the organisation id and type
 * to req.orgId / req.orgType so later handlers know who is asking.
 *
 * Returns 401 if the token is missing, malformed, or invalid.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.orgId = decoded.id;     // set by authController when the token is signed
    req.orgType = decoded.type; // "DONOR" or "RECIPIENT"
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your login has expired — please log in again.' });
  }
};

/**
 * onlyFor('DONOR') / onlyFor('RECIPIENT')
 * Use after protect. Stops a donor from calling recipient routes and the other way round.
 */
const onlyFor = (type) => (req, res, next) => {
  if (req.orgType !== type) {
    const names = { DONOR: 'a donor', RECIPIENT: 'a recipient', ADMIN: 'an admin' };
    return res.status(403).json({ message: 'Only ' + names[type] + ' account can do this.' });
  }
  next();
};

module.exports = { protect, onlyFor };
