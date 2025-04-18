const jwt = require('jsonwebtoken');
const token = jwt.sign({ user: 'test-user' }, 'your_secret_key_here');
console.log(token);