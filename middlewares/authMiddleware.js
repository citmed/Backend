const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('🛡️ Token recibido:', token);

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const verified = jwt.verify(token, 'secretkey');
    console.log('✅ Token verificado:', verified);

    if (!verified.userId) {
      console.warn('⚠️ Token válido pero sin userId:', verified);
      return res.status(401).json({ msg: 'Token sin userId' });
    }

    // ✅ Guardar el objeto completo del usuario autenticado
    req.user = {
      id: verified.userId,
      role: verified.role,
    };

    next();
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
    res.status(401).json({ msg: 'Token inválido' });
  }
};

module.exports = authMiddleware;
