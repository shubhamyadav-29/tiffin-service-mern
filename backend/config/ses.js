const { SESClient } = require('@aws-sdk/client-ses');

// Amazon SES client - used for sending registration and booking confirmation emails
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = sesClient;
