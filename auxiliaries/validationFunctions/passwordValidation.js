const passwordValidation = require('../pwdValidations');

module.exports = (pwd, user) => {
    const status = passwordValidation.checkGeneralPasswordRules(pwd, user);
    return Array.isArray(status) ? status : [];
}