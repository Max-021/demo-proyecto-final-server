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

    for (const name of NAMES) {
      const existing = await EnumField.findOne({ name });
      if (existing) {
      } else {
        await EnumField.create({ name });
      }
    }
  } catch (err) {
    console.error('❌ Error durante el seed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
