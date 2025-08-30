const mongoose = require("mongoose");
const contactSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
    },
    userRole:{
        type:String,
        required:true
    },
    userEmail:{
        type:String,
        required:true
    },
    portfolioLink:{
        type:String,
    },
    message:{
        type:String,
        required:true
    }
},{timestamps:true});

const Contact = mongoose.model("Contact",contactSchema);
module.exports= Contact;