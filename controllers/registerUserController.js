const bcrypt = require('bcryptjs');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');

const registerUser = async (req, res) => {
  try {
    const { username, password, phone, ...info } = req.body;

    // Validar campos obligatorios
    if (!username || !password) {
      return res.status(400).json({ msg: 'Faltan datos obligatorios' });
    }

    // Verificar si el usuario ya existe
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Nombre de usuario ya registrado' });
    }

    // Verificar si el correo ya está registrado
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Correo ya registrado' });
    }

    // Hashear contraseña (10 salt rounds está bien para bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    user = new User({ username, password: hashedPassword });
    await user.save();

    // Guardar info adicional vinculada al usuario
    const userInfo = new InfoUser({
      ...info,
      phone,
      userId: user._id
    });
    await userInfo.save();

    res.status(201).json({
      msg: 'Usuario registrado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        phone
      }
    });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = { registerUser };
