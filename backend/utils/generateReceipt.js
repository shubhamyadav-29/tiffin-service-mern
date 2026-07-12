const PDFDocument = require('pdfkit');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');

// Builds a simple payment receipt PDF in memory (no disk writes needed).
const buildReceiptPDF = (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#E85D04').text('TiffinHub', { align: 'left' });
    doc.fontSize(10).fillColor('#666').text('Payment Receipt', { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#000');
    const row = (label, value) => {
      doc.font('Helvetica-Bold').text(label, { continued: true, width: 200 });
      doc.font('Helvetica').text(value || '-');
    };

    row('Receipt Number: ', data.receiptNumber);
    row('Subscription ID: ', data.subscriptionId);
    row('Transaction Date: ', new Date(data.transactionDate).toLocaleString('en-IN'));
    doc.moveDown();

    row('Customer Name: ', data.customerName);
    row('Provider: ', data.providerName);
    row('Plan: ', data.planType);
    row('Subscription Period: ', `${new Date(data.startDate).toDateString()} - ${new Date(data.endDate).toDateString()}`);
    doc.moveDown();

    row('Razorpay Order ID: ', data.razorpayOrderId);
    row('Razorpay Payment ID: ', data.razorpayPaymentId);
    row('Payment Method: ', data.paymentMethod);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#E85D04')
      .text(`Amount Paid: Rs. ${data.amount} ${data.currency}`, { align: 'left' });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#999').font('Helvetica')
      .text('This is a system-generated receipt and does not require a signature.', { align: 'left' });

    doc.end();
  });
};

// Uploads the generated PDF buffer to S3 and returns its public URL
const uploadReceiptToS3 = async (buffer, receiptNumber) => {
  const key = `receipts/${receiptNumber}.pdf`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  );
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

const generateAndUploadReceipt = async (data) => {
  const buffer = await buildReceiptPDF(data);
  return uploadReceiptToS3(buffer, data.receiptNumber);
};

module.exports = { generateAndUploadReceipt };
