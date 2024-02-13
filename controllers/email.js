import nodemailer from "nodemailer";

export const  sendEmail = async () => {
    try {
      const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth:{
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD
        }
      });
    
      let mailOptions = {
        from: process.env.USER_EMAIL,
        to : userEmail,
        subject: "subject",
        html: `<p>Your Otp is ${text}</p>`
      }
    
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
  
    } catch (error) {
      console.log(error);
    }
  };