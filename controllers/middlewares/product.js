const catchAsync = require("../../auxiliaries/catchAsync")
const authController = require("../authController");
const {editingRoles} = require("../../data/roles");

function runMiddleware(req,res,fn) {//mover esta funcion a auxiliaries e importarla aca
    return new Promise((resolve,reject) => {
        fn(req, res, err => {
            if(err) return reject(err);
            resolve();
        });
    });
}


exports.editorQueryAuth = catchAsync(async (req,res,next) => {
    const {showInactive, showAll} = req.query;
    const wantsEditorFilter = showAll === 'true' || showInactive === 'true';
    console.log()

    if(!wantsEditorFilter) return next();
    console.log("reviso");

    await runMiddleware(req,res, authController.protect);
    await runMiddleware(req,res, authController.restrict(...editingRoles));
    next();
})