const multer = require('multer');
const {v2: cloudinary} = require('cloudinary');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const sharp = require('sharp');

const imgHeight = 500;
const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb) => {
    if(file.mimeType.startsWith('image')) {
        cb(null,true);
    }else{
        cb(new AppError("The selected file is not an image",404), false);
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
        
//     }
// })

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})


const resizeImg = (img) => catchAsync(async (req,res,next) => {
    console.log("req.file")
    console.log(req.file)
    if(!req.file) return next();

    // const buffer = await s
})

exports.uploadImgs = catchAsync(async (req,res,next) => {
    try {
        if(!req.files.img || req.files.img.length === 0) {
            req.fields.img = ['https://res.cloudinary.com/dkjl60cwy/image/upload/v1740593162/products/tsauufqjnqjg3dveprym.webp'];
            return next();
        }
        if(req.files.img.length > 10) return next(new AppError('Max amount of images exceeded', 404));

        console.log("Cloudinary Config:");
        console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);
        console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
        console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);

        const imageUploadPromises = req.files.img.map(async (file) => {
            const buffer = await sharp(file.path)
            .resize({width:imgHeight * 1.5, height: imgHeight})
            .toFormat('webp')
            .toBuffer();
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({folder: 'products'}, (error, result) => {
                    if(error) reject(error);
                    else resolve(result.secure_url);
                }).end(buffer);
            })
        });

        const imageUrls = await Promise.all(imageUploadPromises);
        req.fields.img = imageUrls;

        next();
    } catch (error) {
        console.log("sale por el error")
        console.log(error)
        return next(error);
    }
})