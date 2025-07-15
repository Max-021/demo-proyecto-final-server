const fs = require('fs');
const path = require('path');

const weakListPath = path.join(__dirname, '../data/topWeakPasswords.txt');
let topWeakPasswords = new Set();
try {
  const raw = fs.readFileSync(weakListPath, 'utf-8');
  topWeakPasswords = new Set(
    raw
      .split('\n')           // una contraseña por línea
      .map(pwd => pwd.trim().toLowerCase())
      .filter(Boolean)         // elimina líneas vacías
  );
  console.log(`Cargadas ${topWeakPasswords.size} contraseñas débiles.`);
} catch (err) {
  console.error('Error cargando topWeakPasswords:', err);
}

/**
 * Comprueba si la contraseña deriva de datos personales del usuario.
 */
exports.isDerivedFromUser = (password, user) => {
  if (typeof password !== 'string') return false;
  const pwd = password.toLowerCase();
  const fields = [user.username, user.mail, user.firstName, user.lastName]
    .filter(Boolean)
    .map(f => f.toLowerCase());
  return fields.some(field => pwd.includes(field));
};

/**
 * Comprueba si la contraseña está en la lista de contraseñas comprometidas.
 */
exports.isWeakPassword = (password) => {
  if (typeof password !== 'string') return false;
  return topWeakPasswords.has(password.toLowerCase());
};

/**
 * Comprueba reglas generales, e integra checks de debilidad y derivación.
 */
exports.checkGeneralPasswordRules = (password, user) => {
  const errors = [];
  const langRoute = `auth.validatePasswordRules.validationErrors.`;
  if (!password) return [`${langRoute}required`];

  if (password.length < 12)       errors.push(`${langRoute}minLength`);
  if (password.length > 64)       errors.push(`${langRoute}maxLength`);
  if (!/[a-z]/.test(password))    errors.push(`${langRoute}lowercase`);
  if (!/[A-Z]/.test(password))    errors.push(`${langRoute}uppercase`);
  if (!/\d/.test(password))       errors.push(`${langRoute}number`);
  if (!/[\W_]/.test(password))    errors.push(`${langRoute}specialChar`);
  if (/^\s|\s$/.test(password))   errors.push(`${langRoute}noEdgeSpaces`);

  if (exports.isWeakPassword(password)) {
    errors.push(`${langRoute}weak`);
  }
  if (exports.isDerivedFromUser(password, user)) {
    errors.push(`${langRoute}derivedFromUser`);
  }

  return errors;
};
