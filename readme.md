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

##IMPORTANTE: sobre la funcion updateMany para la funcion updateFromStockEnumField, acá detallo como funciona el pipeline por si lo tengo que modificar
updateMany(filter, udpate, options, callback function), me centro en el parametro update:
    -Recibe normalmente un objeto con el valor a poner y las condiciones del reemplazo
    -Pero si le mando un array se transforma en un pipeline de agregación que detallo acá en casos de futuras modificaciones:
    pipeline = pipeline = [
    // primera etapa: Añado un campo temporal basado en una condición
    {
        $set: {
            campoTemporal: {
                $cond: [
                    { $gt || $lt || la condición que sea: ["$campo", valor] },  // 👈 1) operador lógico con referencias a campos mediante "$"
                    valorTrue,   // 👈 2) valor si la condición es verdadera
                    valorFalse   // 👈 3) valor si es falsa
                ]
            }
        }
    },

    // segunda etapa: Actualizo aplicando el cambio usando operadores matemáticos
    {
        $set: {
            campoFinal: {
                $round || $abs || otro operador numérico: [  // 👈 operador de agregación, no se escriben varios a la vez
                    {
                        $multiply: [                        // 👈 ejemplo de operador interno
                            "$campo",                       // 👈 campo original
                            {
                                $subtract || $divide || $add || $…: [  // 👈 operación aritmética sobre valores
                                    valor,
                                    "$campoTemporal"
                                ]
                            }
                        ]
                    },
                    2  // 👈 precisión del redondeo (opcional según operador)
                ]
            }
        }
    },

    // tercera etapa: Elimino el campo temporal
    {
        $unset || otro operador de base de datos: [ "campoTemporal" ]  // 👈 normalmente solo usás $unset acá
    }
]


#Rutas

Revisar las rutas correspondientes a cada modelo para que se adapten al uso requerido

Incorporar las funciones del controlador de autenticación como middleware en las rutas que sean necesarias, según los requerimientos del negocio
Las funciones principales del controlador de autenticacion son las de proteger y la de restringir para controlar el acceso a rutas indebidas

##Los enums en este modelo de servidor tienen que tener por nombre de campo los mismos nombres que el campo al que validan

Esto es para que no sea un problema a la hora de los request del lado cliente para mostrar las opciones disponibles antes de mandar el documento a crear en la base de datos

##Captcha routes
Las funciones de las rutas del captcha están hechas dentro del mismo router

##En controladores
todas las respuestas deben seguir el formato:
res.status(num).json({
    status: 'status',
    data: {lo que quiera devolver, pero como objeto }
});

##En el authController

La funcion createSendToken tiene que contener los campos necesarios adaptandose a los requerimientos del modelo de usuario

Las funciones signUp, LogOut, logIn tienen que ser revisadas por si hay que hacer cambios en la implementación

###Mail

Los mails tienen varios tipos según el caso, particularmente para crear un usuario, hay dos metodos Welcome y WelcomeSignup con el primero siendo el mail que se envía cuando un administrador crea un usuario y el segundo para cuando un usuario crea su cuenta desde /signup en el cliente, con esta segunda opción estando inhabilitada por defecto. También se incluyen mails destinados a informar acciones realizadas tanto por el usuario como por el administrador.

###Sobre los roles

La idea es que haya 1 solo administrador, o la cantidad mínima posible de usuarios con el máximo status, éste no se puede modificar y no se pueden tomar acciones entre sí. sí pueden tener poder de cambio de rol/suspensión + otras acciones que se consideren pertinentes sobre el resto de los usuarios.


###ProductController

acá es importante actualizar la funcion checkCatalogue segun crezcan las opciones disponibles en los filtros del editor del lado cliente