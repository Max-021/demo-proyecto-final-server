//esta funcion es especifica para un mejor funcionamiento del agregado de enums,    IMPORTANTE: esto es para la version vieja del enumFields model
exports.checkEachEnumArray = (obj) => {
  Object.keys(obj).forEach((key) => {
    const lowercaseBody = obj[key].map(word => word.toLowerCase().trim());
    obj[key] = Array.from(new Set(lowercaseBody));
  });
};