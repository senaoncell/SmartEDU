const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Category = require("../models/Category");
const Course = require("../models/Course");


exports.createUser = async (req, res) => {
  try {
    // Kullanıcıyı oluştur
    const user = await User.create(req.body);
    res.status(201).redirect('/login');
  } catch (error) {
    // Hata durumu
    if (error.name === 'ValidationError') {
      // Eğer hata bir validation hatasıysa
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(err => req.flash('error', err.msg));
      }
      return res.status(400).redirect('/register');
    }

    // Diğer hatalar
    console.error(error);
    req.flash('error', 'An unexpected error occurred.');
    res.status(500).redirect('/register');
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'User does not exist!');
      return res.status(400).redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // USER SESSION
      req.session.userID = user._id;
      return res.status(200).redirect('/users/dashboard');
    } else {
      req.flash('error', 'Your password is not correct!');
      return res.status(400).redirect('/login');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'fail',
      error: error.message,
    });
  }
};

exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.getDashboardPage = async (req, res) => {
  const user = await User.findOne({ _id: req.session.userID }).populate(
    'courses'
  );
  const categories = await Category.find();
  const courses = await Course.find({ user: req.session.userID });
  const users = await User.find();
  console.log(users.countDocument);
  res.status(200).render('dashboard', {
    page_name: 'dashboard',
    user,
    categories,
    courses,
    users,
  });
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Course.deleteMany({ user: req.params.id });

    res.status(200).redirect('/users/dashboard');
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      error,
    });
  }
};