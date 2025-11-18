require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '*** (set)' : 'Not set');
