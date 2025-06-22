const sharp = require('sharp');
const multer = require('multer');

const { v2: cloudinary } = require('cloudinary');
const catchAsync = require('./catchAsync');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const IMG_WIDTH  = 750;  // por ejemplo
const IMG_HEIGHT = 500;
const DEFAULT_IMG = "https://res.cloudinary.com/your-cloudinary-name/image/upload/vdefault/default_image.webp";


exports.uploadImages = catchAsync(async (req, res, next) => {
  let imgOrder = [];
  if (req.fields.imgOrder) {
    try {
      imgOrder = JSON.parse(req.fields.imgOrder);
    } catch {
      imgOrder = [];
    }
  }

  const rawNew = req.files.newImages;
  const newFiles = rawNew
    ? (Array.isArray(rawNew) ? rawNew : [rawNew])
    : [];

  const newFilesMap = newFiles.reduce((map, file) => {
    map[file.name] = file;
    return map;
  }, {});

  const finalUrls = [];
  for (const key of imgOrder) {
    if (typeof key === 'string' && key.startsWith('http')) {
      finalUrls.push(key);
    } else if (newFilesMap[key]) {
      const file = newFilesMap[key];
      const inputPath = file.path || file.filepath;
      const buffer = await sharp(inputPath)
        .resize(IMG_WIDTH, IMG_HEIGHT)
        .toFormat('webp')
        .toBuffer();
      const url = await new Promise((res, rej) => {
        cloudinary.uploader
          .upload_stream({ folder: 'products' }, (err, result) =>
            err ? rej(err) : res(result.secure_url)
          )
          .end(buffer);
      });
      finalUrls.push(url);
    }
  }

  if (finalUrls.length === 0) {
    req.fields.img = [DEFAULT_IMG];
  } else {
    req.fields.img = finalUrls;
  }

  next();
});

exports.deleteImages = catchAsync(async (req, res, next) => {
  // 0) Log para depurar qué llega
  console.log('deleteImages - raw removedImages:', req.fields.removedImages);

  // 1) Si no hay campo, salgo inmediatamente
  if (!req.fields.removedImages) {
    return next();
  }

  // 2) Intento parsear el JSON enviado
  let toRemove;
  try {
    toRemove = JSON.parse(req.fields.removedImages);
  } catch (err) {
    console.warn('deleteImages - JSON parse error:', err);
    return next();
  }

  // 3) Verifico que sea un array no vacío
  if (!Array.isArray(toRemove) || toRemove.length === 0) {
    return next();
  }

  // 4) Extraigo de cada URL el public_id que Cloudinary necesita
  const publicIds = toRemove.map(url => {
    const after = (url.split('/upload/')[1] || '');
    const noVersion = after.replace(/^v\d+\//, '');
    return noVersion.replace(/\.[^/.]+$/, '');
  });

  // 5) Llamo a la API de Cloudinary para borrarlas
  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: 'image' });
    console.log('Cloudinary deleted images', publicIds);
  } catch (err) {
    console.error('deleteImages - Cloudinary error:', err);
    // Si quieres que falle la petición en este punto, usa:
    // return next(err);
  }

  // 6) Finalmente, continúo al siguiente middleware
  return next();
});