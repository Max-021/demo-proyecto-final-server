const express = require('express');
const axios = require('axios');
const AppError = require('../auxiliaries/appError');
const catchAsync = require('../auxiliaries/catchAsync')


const router = express.Router();


router.post('/verifyCaptcha', catchAsync(async (req,res, next) => {
    const token = req.body['cf-turnstile-response'];
    if(!token) return next(new AppError('captchaVerification.postVerif.noToken', 400));

    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET);
    params.append('response', token);

    const resp = await axios.post(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, }
    );
    
    if(!resp.data.success) return next(new AppError('captchaVerification.postVerif.failedVerif', 400));
    
    return res.json({message: 'captchaVerification.postVerif.successVerif'})
}))

module.exports = router;