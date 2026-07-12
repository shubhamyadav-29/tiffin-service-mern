const { SendEmailCommand } = require('@aws-sdk/client-ses');
const sesClient = require('../config/ses');

// Sends transactional emails (registration + booking confirmation) via Amazon SES
const sendEmail = async ({ to, subject, html }) => {
  const params = {
    Source: process.env.SES_SENDER_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    // Don't crash the request if email fails - just log it
    console.error('SES email error:', error.message);
  }
};

const registrationEmailTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
    <h2 style="color: #E85D04;">Welcome to TiffinHub, ${name}!</h2>
    <p>Your account has been created successfully. Start exploring home-style tiffin providers near you.</p>
  </div>
`;

const bookingConfirmationTemplate = ({ userName, businessName, planType, startDate, endDate, price, address, receiptNumber }) => `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
    <h2 style="color: #E85D04;">Payment Successful — Subscription Confirmed!</h2>
    <p>Hi ${userName}, your ${planType} subscription with <strong>${businessName}</strong> is confirmed.</p>
    <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
      <tr><td style="padding:6px 0;">Start Date</td><td>${new Date(startDate).toDateString()}</td></tr>
      <tr><td style="padding:6px 0;">End Date</td><td>${new Date(endDate).toDateString()}</td></tr>
      <tr><td style="padding:6px 0;">Amount Paid</td><td>₹${price}</td></tr>
      <tr><td style="padding:6px 0;">Receipt No.</td><td>${receiptNumber || '-'}</td></tr>
    </table>
    ${address ? `
    <p style="margin-top:14px;"><strong>Delivery Address</strong><br/>
    ${address.fullName}, ${address.mobileNumber}<br/>
    ${address.houseNumber}, ${address.street}, ${address.area}<br/>
    ${address.city}, ${address.state} - ${address.pincode}
    ${address.landmark ? `<br/>Landmark: ${address.landmark}` : ''}
    </p>` : ''}
    <p style="margin-top:16px;">Enjoy your meals!</p>
  </div>
`;

const paymentFailedTemplate = ({ userName, businessName, amount }) => `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
    <h2 style="color: #dc2626;">Payment Unsuccessful</h2>
    <p>Hi ${userName}, your payment of ₹${amount} for <strong>${businessName}</strong>'s tiffin subscription could not be completed.</p>
    <p>No worries — you can retry the payment anytime from your dashboard. Your subscription is on hold until payment is completed.</p>
  </div>
`;

module.exports = { sendEmail, registrationEmailTemplate, bookingConfirmationTemplate, paymentFailedTemplate };
