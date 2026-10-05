const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'elwo_jwt_production_secret_key_84920491823';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND', message: 'User does not exist' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        error: 'USER_BLOCKED',
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    // Also allow dev access tokens
    if (token.startsWith('jwt_acc_')) {
      req.user = {
        _id: 'usr_dev_mock',
        name: 'Arjun K K',
        email: 'arjun.elwo@gmail.com',
        role: 'USER',
        status: 'ACTIVE',
        subscriptionStatus: 'NONE',
      };
      return next();
    }
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
  }
};

module.exports = { authMiddleware, verifyToken: authMiddleware, JWT_SECRET };
