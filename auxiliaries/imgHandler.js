const sharp = require('sharp');
const multer = require('multer');
const AppError = require('../auxiliaries/appError')

const { v2: cloudinary } = require('cloudinary');
const catchAsync = require('./catchAsync');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const IMG_WIDTH  = 500;  // por ejemplo
const IMG_HEIGHT = 500;
const DEFAULT_IMG = "https://res.cloudinary.com/dkjl60cwy/image/upload/v1740593162/products/tsauufqjnqjg3dveprym.webp";


exports.uploadImages = catchAsync(async (req, res, next) => {
  const rawNew = req.files?.newImages;
  const newFiles = rawNew
    ? (Array.isArray(rawNew) ? rawNew : [rawNew])
    : [];

  let imgOrder = [];
  if (req.fields.imgOrder) {
    try {
      imgOrder = JSON.parse(req.fields.imgOrder);
    } catch {
      imgOrder = [];
    }
  }

  const keysToProcess = imgOrder.length
    ? imgOrder
    : newFiles.map(f => f.name);

  const newFilesMap = newFiles.reduce((map, file) => {
    map[file.name] = file;
    return map;
  }, {});

  const finalUrls = [];
  for (const key of keysToProcess) {
    if (typeof key === 'string' && key.startsWith('http')) {
      finalUrls.push(key);
    }
    else if (newFilesMap[key]) {
      const file     = newFilesMap[key];

      if(!file.type?.startsWith("image/")) return next(new AppError(`Only images allowed, ${file.name} is not a valid image`, 400));

      const inputPath = file.path || file.filepath;
      const buffer   = await sharp(inputPath)
        // .resize(IMG_WIDTH, IMG_HEIGHT, {fit: 'inside', withoutEnlargement: true,})// lo dejo comentado porque ya hago esto en el cliente, pero por las dudas no lo borro
        .toBuffer();

      const url = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: 'products' }, (err, result) =>
            err ? reject(err) : resolve(result.secure_url)
          )
          .end(buffer);
      });
      finalUrls.push(url);
    }
  }

  req.fields.img = finalUrls.length ? finalUrls : [DEFAULT_IMG];

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