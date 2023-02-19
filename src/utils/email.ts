import nodemailer from "nodemailer";
import mg from "nodemailer-mailgun-transport";
import i18n from "@/config/i18n";

/**
 * Sends email
 * @param {Object} data - data
 * @param {boolean} callback - callback
 */
export async function sendEmail(data: any, callback: (result: boolean) => void) {
  const auth: mg.Options = {
    auth: {
      apiKey: process.env.EMAIL_SMTP_API_MAILGUN!,
      domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN!,
    },
    // host: 'api.eu.mailgun.net' // THIS IS NEEDED WHEN USING EUROPEAN SERVERS
  };
  const transporter = nodemailer.createTransport(mg(auth));
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `${data.user.name} <${data.user.email}>`,
    subject: data.subject,
    html: data.htmlMessage,
  };
  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      return callback(false);
    }
    return callback(true);
  });
}

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
export function prepareToSendEmail(user: any, subject = '', htmlMessage = '') {
  user = {
    name: user.name,
    email: user.email,
    verification: user.verification
  }
  const data = {
    user,
    subject,
    htmlMessage
  }
  if (process.env.NODE_ENV === 'production') {
    sendEmail(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log(data)
  }
}


export function sendRegistrationEmailMessage(locale = '', user: any) {
  i18n.setLocale(locale)
  const subject = i18n.__('registration.SUBJECT')
  const htmlMessage = i18n.__(
    'registration.MESSAGE',
    user.name,
    process.env.FRONTEND_URL!,
    user.verification
  )
  prepareToSendEmail(user, subject, htmlMessage)
}