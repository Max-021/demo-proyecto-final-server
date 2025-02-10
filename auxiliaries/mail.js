const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user,url) {
        this.to = user.mail,
        this.firstName = user.username,
        this.url = url,
        this.from = `${process.env.EMAIL_FROM}`
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            return 1;
        }//temporal, revisar porque si en prod no se hace lo de abajo

        return nodemailer.createTransport({
            // service: 'Gmail'//tengo que revisar el proveedor del mail, temporal, si es gmail activar la opcion 'less secure app si todavia existe'
            auth:{
                user: process.env.EMAIL_USERNAME,
                password: process.env.EMAIL_PASSWORD,
            },
        })
    }

    async send(subject) {
        //define mail options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,//temporal, revisar esta linea y la de abajo
            text: htmlToText.fromString(html)

        }

        //create a newTransport and send an email
        await this.newTransport().sendMail(mailOptions);

    }

    async sendWelcome(){
        await this.send('Bienvenido a plantilla')//revisar, esto y dejarlo listo para el negocio que se necesite, temporal
    }

    async sendPasswordReset() {
        await this.send('La contraseña se podra reiniciar durante 10 minutos,')//temporal, revisar esta parte en conjunto con los otros temas del authController
    }
}