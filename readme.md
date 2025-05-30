#IMPORTANTE

BORRAR TODOS LOS CONSOLE.LOG (NO OLVIDARSE!!!!!!!!!!!!!!)
REVISAR TODOS LOS COMENTARIOS CON LA PALABRA TEMPORAL PARA LAS REVISIONES FINALES Y ALGUNAS POSIBLES CORRECCIONES/ACTIVACIONES/EVALUACIONES DE CARA AL DEPLOY

#Modelos

Todos los modelos tienen que contener los campos requeridos según las necesidades del negocio al que se adapte la plantilla

Modelos actuales: Producto - Usuario - EnumFields

#Controladores

Revisar que los controladores tengan siempre las funciones CRUD básicas, más funciones extra especiales según el caso o que se hayan contemplado como una necesidad específica para la aplicación

Especial importancia al controlador de autenticación, revisar las anotaciones separadas en este archivo

También revisar especialmente el factoryHandler antes de cada implementación por posibles modificaciones/correcciones/adiciones de funciones

#Rutas

Revisar las rutas correspondientes a cada modelo para que se adapten al uso requerido

Incorporar las funciones del controlador de autenticación como middleware en las rutas que sean necesarias, según los requerimientos del negocio
Las funciones principales del controlador de autenticacion son las de proteger y la de restringir para controlar el acceso a rutas indebidas

##Los enums en este modelo de servidor tienen que tener por nombre de campo los mismos nombres que el campo al que validan

Esto es para que no sea un problema a la hora de los request del lado cliente para mostrar las opciones disponibles antes de mandar el documento a crear en la base de datos


##En el authController

La funcion createSendToken tiene que contener los campos necesarios adaptandose a los requerimientos del modelo de usuario

Las funciones signUp, LogOut, logIn tienen que ser revisadas por si hay que hacer cambios en la implementación

###Mail

Los mails tienen varios tipos según el caso, particularmente para crear un usuario, hay dos metodos Welcome y WelcomeSignup con el primero siendo el mail que se envía cuando un administrador crea un usuario y el segundo para cuando un usuario crea su cuenta desde /signup en el cliente, con esta segunda opción estando inhabilitada por defecto. También se incluyen mails destinados a informar acciones realizadas tanto por el usuario como por el administrador.