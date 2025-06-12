const nodemailer = require('nodemailer');
const {htmlToText} = require('html-to-text');
const userMail = require('./emailtemplates/userMails.js')

module.exports = class Email {
    constructor(user,url, role = '', motivo = '') {
        this.to         = user.mail || '';
        this.username   = user.username || '';
        this.url        = url || '';
        this.from       = `${process.env.EMAIL_FROM}`;
        this.role       = role;
        this.motivo     = motivo; 
    }

    async newTransport(){
        if(process.env.NODE_ENV === 'production'){
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,//'smtp.algo'
                port: process.env.EMAIL_PORT,//587 puede ser uno de los standards, tengo que revisar cual era
                auth: {
                    user: process.env.EMAIL_USERNAME,//usuario y contraseña smtp (si es que uso smtp)
                    pass: process.env.EMAIL_PASSWORD,
                }
            });
        }
        // if(!this.testAccount) {//si no existe la cuenta de prueba, comentado por uso de ethereal persistente
        //     this.testAccount = await nodemailer.createTestAccount();
        // }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST_DEV,//this.testAccount.smtp.host,
            port: Number(process.env.EMAIL_PORT_DEV),//this.testAccount.smtp.port,
            secure: process.env.EMAIL_SECURITY_DEV === 'true',//this.testAccount.smtp.secure,
            auth:{
                user: process.env.EMAIL_USERNAME_DEV,//this.testAccount.user,
                pass: process.env.EMAIL_PASSWORD_DEV,//this.testAccount.pass,
            },
            ...(Number(process.env.EMAIL_PORT_DEV) === 587 && {requireTLS: true}),
        });
    }
    buildHtml(subject) {//modificar a convenir
        return /*html*/`
        <h1>${subject}</h1>
        <p>Se ha enviado este mail pero parece que ocurrió un error y no se cargó el cuerpo del mail. Si notas cambios en tu cuenta no dudes en ponerte en contacto con el administrador del sitio. Te pedimos disculpas por el inconveniente.</p>
        <br/>
        <p>El equipo de ${process.env.APPNAME}</p>
        `;
    }
    async send(subject, html) {
        const fallbackBody = this.buildHtml(subject)
        const mailOptions = {
            from: this.from || 'test@gmailll.com',
            to: this.to,
            subject,
            html: html || fallbackBody,
            text: htmlToText(html)
        }
        // console.log(mailOptions)
        const transporter = await this.newTransport();
        const info = await transporter.sendMail(mailOptions);

        if(process.env.NODE_ENV !== 'production'){
            console.log("mensaje enviado:"+info.messageId);
            console.log("vprev"+nodemailer.getTestMessageUrl(info));
        }
    }
    /**
     * Envía un correo de bienvenida para que el usuario establezca su contraseña.
     * @returns {Promise<void>}
     */
    async welcome(){//esto es para los usuarios que crea el administrador
        await this.send(`Bienvenido a ${process.env.APPNAME}`,userMail.welcomeUser(this.username, this.url))
    }
    async signupWelcome(){//esto lo dejo vacio, es para los usuarios que crean cuenta desde signup, por defecto desactivada en el cliente

    }
    async passwordReset() {
        await this.send('Recuperación de contraseña', userMail.passwordRetrieved(this.url))//temporal, revisar esta parte en conjunto con los otros temas del authController
    }
    async userDeactivation() {
        await this.send('Usuario desactivado', userMail.userDeactivated());
    }
    async userSuspension() {
        await this.send('Usuario suspendido', userMail.userSuspended(this.motivo));
    }
    async userActivation() {
        await this.send('Usuario reactivado', userMail.reactivatedUser());
    } 
    async updatedRole(){
        await this.send('Rol actualizado', userMail.userRoleUpdated(this.role));//ver si le cambio el subject a algo más adecuado como cargo, posicion, lo que sea
    }
}