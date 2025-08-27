const jwt = require('jsonwebtoken');
const { User } = require('../Models/User');

const isLoggedIn = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ error: "No token, please log in" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const foundUser = await User.findOne({_id:decodedToken._id});
    if (!foundUser) {
      throw new Error('Please log in');
    }   
    req.user = foundUser
    next();
  } catch (error) {
    res.status(400).json({ error: "Pleas Log in" });
  }
};

module.exports = {
  isLoggedIn
};
