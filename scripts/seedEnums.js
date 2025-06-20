// scripts/seedEnumFields.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({path: path.resolve(__dirname, '../config.env')})
const mongoose = require('mongoose');
const EnumField = require('../models/enumFields'); // ajusta la ruta si hace falta

const NAMES = ['categorias', 'colors'];

async function seed() {
  try {
    const DB = process.env.DATABASE.replace(
        "<password>",
        process.env.DATABASEPASSWORD,
    );
    await mongoose.connect(DB, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a la base de datos');

    for (const name of NAMES) {
      const existing = await EnumField.findOne({ name });
      if (existing) {
        console.log(`⏭️  Ya existe el enum "${name}", omitiendo.`);
      } else {
        // Al crear sin pasar "values", usará el default: []
        await EnumField.create({ name });
        console.log(`✳️  Enum "${name}" creado con values = []`);
      }
    }
  } catch (err) {
    console.error('❌ Error durante el seed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

seed();
