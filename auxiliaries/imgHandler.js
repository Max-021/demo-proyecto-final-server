const sharp = require('sharp');
const multer = require('multer');

const { v2: cloudinary } = require('cloudinary');
const catchAsync = require('./catchAsync');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const imgHeight = 500;

exports.uploadImgs = catchAsync(async (req, res, next) => {
  console.log("entro!")
  console.log(req.files['img[]'])
  try {
    // Obtén el array de imágenes de la siguiente manera:
    let images = [];
    // Si se enviaron archivos (nuevas imágenes) a través de formidable:
    console.log(req.files)
    console.log(req.files.img)
    if (req.files && (req.files['img[]'] || req.files.img)) {
      console.log("entro al primer if")
      const filesArray = Array.isArray(req.files['img[]'])
        ? req.files['img[]']
        : Array.isArray(req.files.img) ? req.files.img
        : [req.files['img[]']];
      images = images.concat(filesArray);
      console.log(images)
    }
    console.log('images despues de meterles files')
    console.log(images)
    // Si se enviaron campos (imágenes existentes) a través de formidable:
    console.log("req.fields")
    console.log(req.fields)
    if (req.fields && req.fields['img[]']) {
      console.log("entro al segundo if")
      const fieldsArray = Array.isArray(req.fields['img[]'])
        ? req.fields['img[]']
        : [req.fields['img[]']];
      // Si deseas conservar el orden de envío, por ejemplo, puedes concatenar en el orden en que se envían
      images = fieldsArray.concat(images);
      console.log(images)
    }
    console.log('images despues de los dos ordenes')
    console.log(images)
    // Si no se reciben imágenes, puedes asignar un valor por defecto (opcional)
    if (images.length === 0) {
      req.fields.img = [
        "https://res.cloudinary.com/your-cloudinary-name/image/upload/vdefault/default_image.webp",
      ];
      return next();
    }
    console.log('images despues del check empty')
    console.log(images)

    // Procesa cada elemento del array manteniendo el orden:
    const processedImagesPromises = images.map(async (img) => {
      if (typeof img === "string") {
        // Es una URL existente: se deja sin cambios
        return img;
      } else {
        // Es un File (nueva imagen): procesarla con sharp y subirla a Cloudinary
        const buffer = await sharp(img.path)
        // const buffer = await sharp(img.buffer)
          .resize({ width: imgHeight * 1.5, height: imgHeight })
          .toFormat("webp")
          .toBuffer();
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: "products" }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }).end(buffer);
        });
      }
    });

    const finalImageUrls = await Promise.all(processedImagesPromises);
    // Se asigna el array final de URLs en req.fields.img para que updateProduct pueda usarlo
    req.fields.img = finalImageUrls;
    next();
  } catch (error) {
    console.log("Error en updateImgs:", error);
    return next(error);
  }
});
