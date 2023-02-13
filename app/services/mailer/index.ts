import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {
  USER_REGISTRATION,
  FORGOT_PASSWORD,
  RESET_PASSWORD_SUCCESS,
} from '../../utils/constants';
import ejs from 'ejs';
import fs from 'fs';

interface IMailer {
  sendMail: (
    options: CustomMailOption,
    mailType: string,
    emailData: any
  ) => Promise<void | null>;
}

interface CustomMailOption extends Mail.Options {
  data: any;
}

export default class Mailer implements IMailer {
  protected readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.buildMailTransporter()!;
  }

  sendMail = async (options: CustomMailOption, mailType: string) => {
    const year = new Date().getFullYear();
    const emailData = options.data;

    try {
      const res = await this.getEmailTemplate(emailData, mailType);
      this.transporter.sendMail({
        subject: options.subject,
        to: options.to,
        from: process.env.APP_EMAIL_ADDRESS,
        html: await ejs.renderFile(
          `${__dirname}/templates/shared/html/layout.ejs`,
          {
            appName: process.env.APP_NAME,
            content: res?.html,
            year,
          }
        ),
        text: await ejs.renderFile(
          `${__dirname}/templates/shared/text/layout.ejs`,
          {
            appName: process.env.APP_NAME,
            content: res?.text,
            year,
          }
        ),
      });
    } catch (error) {
      throw error;
    }
  };

  private buildMailTransporter() {
    return nodemailer.createTransport({
      auth: {
        user: process.env.MAILTRAP_SMTP_USERNAME,
        pass: process.env.MAILTRAP_SMTP_PASSWORD,
      },
      host: 'smtp.mailtrap.io',
      port: process.env.EMAIL_PROVIDER_PORT,
    } as nodemailer.TransportOptions);
  }

  private async getEmailTemplate(emailData: any, type: string) {
    const year = new Date().getFullYear();
    let result;

    emailData = {
      ...emailData,
      year,
    };

    switch (type) {
      case USER_REGISTRATION:
        result = await this.buildTemplate('registration', emailData);
        break;
      case FORGOT_PASSWORD:
        result = await this.buildTemplate('forgotPassword', emailData);
        break;
      case RESET_PASSWORD_SUCCESS:
        result = await this.buildTemplate('resetPassword', emailData);
        break;
    }

    return result;
  }

  private async buildTemplate(filename: string, data: any) {
    //filename must directory and files names of the email you sending
    //e.g. forgotPassword/forgotPassword.ejs
    const text = await ejs.renderFile(
      __dirname + `/templates/${filename}/${filename}.text.ejs`,
      data
    );
    const html = await ejs.renderFile(
      __dirname + `/templates/${filename}/${filename}.ejs`,
      data
    );
    return { html, text };
  }
}
