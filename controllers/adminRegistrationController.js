const bcrypt = require('bcrypt');
const User = require('../models/User');

const adminRegistration = async (req, res) => {
    try {
        const { email, password } = req.body;
        //console.log("Datos recibidos:", email, password); // Verifica los datos recibidos//

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El administrador ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await newUser.save();

        res.status(201).json({ message: 'Administrador registrado con éxito' });
    } catch (error) {
        console.error("Error en el registro del administrador:", error); 
        res.status(500).json({ message: 'Error en el servidor', error });
    }
};

module.exports = adminRegistration;