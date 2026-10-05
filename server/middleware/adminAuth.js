const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'elwo-admin-secret-key-2026';

const adminAuthMiddleware = (allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT']) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development mode, allow default super admin fallback if explicitly requested
      if (process.env.NODE_ENV !== 'production' && req.headers['x-admin-dev'] === 'true') {
        req.admin = {
          _id: 'admin_dev_super',
          name: 'Super Admin',
          email: 'admin@elwo.in',
          role: 'SUPER_ADMIN',
        };
        return next();
      }
      return res.status(401).json({ error: 'ADMIN_UNAUTHORIZED', message: 'Admin authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
      const admin = await Admin.findById(decoded.id);

      if (!admin || admin.status === 'BLOCKED') {
        return res.status(403).json({ error: 'ADMIN_FORBIDDEN', message: 'Admin access denied' });
      }

      if (!allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Role ${admin.role} is not authorized for this resource`,
        });
      }

      req.admin = admin;
      next();
    } catch {
      return res.status(401).json({ error: 'INVALID_ADMIN_TOKEN', message: 'Session expired' });
    }
  };
};

const verifyAdminToken = adminAuthMiddleware(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']);
const requireRole = (roles) => adminAuthMiddleware(roles);

module.exports = { adminAuthMiddleware, verifyAdminToken, requireRole };
