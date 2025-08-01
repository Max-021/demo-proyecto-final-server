const axios = require('axios');
const AppError = require('../../auxiliaries/appError');
const catchAsync = require('../../auxiliaries/catchAsync');
const User = require('../../models/user');

exports.verifyTurnstile = catchAsync(async (req,res,next) => {
    const token = req.body['cf-turnstile-response'];
    if (!token) return next(new AppError('captchaVerification.postVerif.noToken', 400));

    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET);
    params.append('response', token);

    const resp = await axios.post(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, }
    );

    if (!resp.data.success) return next(new AppError('captchaVerification.postVerif.failedVerif', 400));
    next();
})

exports.conditionalLoginCaptcha = catchAsync(async (req,res,next) => {
    const {mail, 'cf-turnstile-response': token} = req.body;

    if(!mail) return next();

    const user = await User.findOne({mail}).select('+captchaRequired +lastLoginAttemptTime +loginAttempts');
    if (!user) return next();

    const now = Date.now();
    if (user.lastLoginAttemptTime && now - user.lastLoginAttemptTime > 60*60*1000) {
        user.loginAttempts = 0;
        user.captchaRequired = false;
        user.lastLoginAttemptTime = undefined;
        await user.save({ validateBeforeSave: false });
        return next();
    }

    if (!user.captchaRequired) return next();

    if(!token) return next(new AppError('captchaVerification.conditionalLoginCaptcha.noToken',400,{}, {
        captchaRequired: true,
    }));

    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET);
    params.append('response', token);
    
    const resp = await axios.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        params.toString(),
        {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        validateStatus: () => true,
        }
    );

    if(!resp.data.success) return next(new AppError('captchaVerification.conditionalLoginCaptcha.failedVerif',400,{},{
        captchaRequired: true,
    }));

    user.captchaRequired = false;
    await user.save({validateBeforeSave: false});

    next();
})