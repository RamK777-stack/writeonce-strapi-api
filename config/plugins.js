module.exports = ({ env }) => {
  console.log(env("SENDGRID_API_KEY"));
  return {
    email: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: "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",
      },
      settings: {
        defaultFrom: "ramk97095@gmail.com",
        defaultReplyTo: "ramk97095@gmail.com",
        testAddress: "ramk97095@gmail.com",
      },
    },
  };
};
