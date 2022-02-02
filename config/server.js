module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("URL", "https://api.writeonce.dev"),
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "ca526dbb2a2c73384499c4e4ac46eed4"),
    },
  },
});
