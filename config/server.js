module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // url: 'https://170f-42-109-140-231.ngrok.io',
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'ca526dbb2a2c73384499c4e4ac46eed4'),
    },
  },
});
