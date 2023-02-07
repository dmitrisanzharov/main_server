const jwt = require('jsonwebtoken');

// obj should be something like this: {mongoId: 12213213}

function generateToken(obj) {
    const varSecret = process.env.JSW_SECRET;
    return jwt.sign(obj, varSecret, {
        expiresIn: '1d'
    })
}

module.exports = { generateToken }; 
