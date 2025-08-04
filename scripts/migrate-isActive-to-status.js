const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/user');
const path = require('path');

dotenv.config({path: path.resolve(__dirname, '../config.env')})

const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASEPASSWORD,
);

async function run() {
    await mongoose.connect(DB);
    
    const res1 = await User.updateMany(
        {isActive: true},
        {
            $set: {status: 'active'},
            $unset: {isActive: ''},
        }
        
    )
    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1)
})