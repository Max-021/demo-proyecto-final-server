exports.welcomeUser = (username, url) => /*html*/`
    <h1>Te damos la bienvenida a ${process.env.APPNAME}</h1>
    <p>Usuario: ${username}</p>
    <br/>
    <p>Haz click en el siguiente link ${url} para establecer la contraseña para esta cuenta. Una vez terminado el proceso podrás empezar a utilizar tu cuenta</p>
    <br/>
    <p>Saludos,</p>
    <p>El equipo de ${process.env.APPNAME}</p>
`;
exports.welcomeUserSignup = (username, url) => /*html*/`
    <h1>Te damos la bienvenida a ${process.env.APPNAME}</h1>
    <br/>
    <p>Usuario: ${username}</p>
    <br/>
    <p>Haz click en el siguiente link ${url} para activar confirmar la cuenta. Una vez terminado el proceso podrás empezar a utilizar este usuario</p>
    <br/>
    <p>Saludos,</p>
    <p>El equipo de ${process.env.APPNAME}</p>
`;
exports.passwordRetrieved = (url) => /*html*/`
    <h2>Contraseña reestablecida</h2>
    <p>Se ha reestablecido la contraseña para este usuario, haz click en el siguiente link ${url} para ingresar su nueva contraseña. En
     el caso de no haber solicitado este link ignore este mensaje.</p>
`;
exports.userDeleted = () => /*html*/`
    <h2>Cuenta eliminada</h2>
    <p>Este mensaje fue enviado para confirmarle la eliminación de su cuenta. Los datos fueron borrados y en caso de querer volver a participar en la plataforma tendrá que ser desde una cuenta nueva.</p>
`;
exports.userDeactivated = () => /*html*/`
    <h2>Cuenta desactivada</h2>
    <p>Este mensaje fue enviado para confirmarle la desactivación de su cuenta. La misma no podra realizar ninguna acción hasta ser reactivada 
    por el propietario de la cuenta.</p>
    <p>Para reactivar la cuenta simplemente se necesita iniciar sesión normalmente.</p>
`;
exports.reactivatedUser = () => /*html*/`
    <h2>Cuenta reactivada</h2>
    <p>Este mensaje fue enviado para confirmarle la reactivación de su cuenta. Ya puede volver a utilizar su cuenta.</p>
`;
exports.userSuspended = (motivo = null) => /*html*/`
    <h2>Cuenta suspendida</h2>
    <p>Esta cuenta ha sido suspendida.${motivo ? ` Con motivo: ${motivo}` : ''}</p>
    <p>Para más información ponerse en contacto con administración.</p>
`;
exports.userRoleUpdated = (role) => /*html*/`
    <h2>Rol actualizado</h2>
    <p>El rol de tu usuario ha sido actualizado.</p>
    <p>Su nuevo rol es: ${role}</p>
    <br/>
`;