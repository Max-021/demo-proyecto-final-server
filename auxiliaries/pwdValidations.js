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
  if (!password) {
    errors.push('Contraseña requerida.');
    return errors;
  }

  if (password.length < 12) errors.push('Mínimo 12 caracteres.');
  if (password.length > 64) errors.push('Máximo 64 caracteres.');
  if (!/[a-z]/.test(password)) errors.push('Debe incluir al menos una letra minúscula.');
  if (!/[A-Z]/.test(password)) errors.push('Debe incluir al menos una letra mayúscula.');
  if (!/\d/.test(password)) errors.push('Debe incluir al menos un número.');
  if (!/[\W_]/.test(password)) errors.push('Debe incluir al menos un caracter especial.');
  if (/^\s|\s$/.test(password)) errors.push('No empiece ni termine con espacios.');

  if (exports.isWeakPassword(password)) {
    errors.push('La contraseña es débil.');
  }
  if (exports.isDerivedFromUser(password, user)) {
    errors.push('No puede derivarse de datos personales.');
  }

  return errors;
};
