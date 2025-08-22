const mongoose = require('mongoose')
const validator = require('validator')

const otpSchema = new mongoose.Schema({
  otp: {
    required: true,
    type: String,
    minLength: 6,
    trim: true
  },
  mail: {
    required: true,
    type: String,
    validate: function (val) {
      const flag = validator.isEmail(val) // ✅ correct usage
      if (!flag) {
        throw new Error("Please Enter a valid email (from schema)")
      }
    }
  },
  createdAt : {
        // type :Date,
        // default : Date.now,
        // expires : 60*2

        type :String,
        expires : 60*2
  }
})

const OTP = mongoose.model('otp', otpSchema)

module.exports = {
    OTP
}
