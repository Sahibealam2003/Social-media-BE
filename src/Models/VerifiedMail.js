const mongoose = require('mongoose')
const validator = require('validator')  // ✅ import missing tha

const VerifiedMailSchema = new mongoose.Schema({
  mail: {
    type: String,
    required: true,
    trim: true,
    validate: function (val) {
      const flag = validator.isEmail(val) 
      if (!flag) {
        throw new Error("Please enter a valid mail (from VerifiedMailSchema)")
      }
    }
  }
},{timestamps : true})

const VerifiedMail = mongoose.model('verified-mail', VerifiedMailSchema)

module.exports = {
    VerifiedMail
}
