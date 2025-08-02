
const express = require('express');
const router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const upload = require('./multer');
const { name } = require('ejs');

// Disable caching
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Home page
router.get('/', (req, res) => {
  res.render('index', { nav: false });
});

// Login page
router.get('/login', (req, res) => {
  res.render('index', { nav: false });
});


// Logout route
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});

// GET Register – logs out current user
router.get('/register', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.render('register', { nav: false, error: null });
    });
  });
});

// POST Register
router.post('/register', async function (req, res, next) {
  try {
    const existingUser = await userModel.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render('register', { error: "Username already exists", nav: false });
    }

    // Create basic user object (only username here)
    const data = new userModel({
      username: req.body.username,
    });

    // Register with password (hash/salt)
    const user = await userModel.register(data, req.body.password);

    // 🔧 Now manually add the rest of the fields
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.name = req.body.name;

    // 🔐 Save the user again with extra fields
    await user.save();

    // ✅ Auto login
    req.session.regenerate(() => {
      req.login(user, function (err) {
        if (err) return next(err);
        res.redirect('/profile');
      });
    });

  } catch (err) {
    res.render('register', { error: err.message, nav: false });
  }
});

// Login POST
router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/"
}));

// Middleware to protect routes
function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// Profile page
router.get('/profile', isLoggedin, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate({
      path: 'posts',
      populate: {
        path: 'user',
        select: 'username name'  //
      }
    });

  res.render('profile', {
    user: user,
    nav: true
  });
});





router.get('/show/posts', isLoggedin, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  res.render("show", { 
    user: user, 
    nav: true 
  });
});

router.get('/feed', isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  const posts = await postModel.find({})
    .populate("user")         // To get username, name, etc.
    .sort({ createdAt: -1 }); // Optional: latest posts first

  res.render("feed", { 
    user: user,
    posts: posts, 
    nav: true 
  });
});

router.get('/post/:id', isLoggedin, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findById(req.params.id).populate("user");
  if (!post) return res.status(404).send("Post not found");
  res.render("singlepost", { user, post, nav: true });
});





// Profile picture upload
router.post('/fileupload', isLoggedin, upload.single("image"), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  if (!req.file) return res.status(400).send("No file uploaded.");

  user.profileImage = req.file.filename;
  await user.save();

  res.redirect('/profile');
});

// Add post
router.post('/add', isLoggedin, upload.single('image'), async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  if (!req.file) return res.status(400).send("No file uploaded.");

  const newPost = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(newPost._id);
  await user.save();

  res.redirect('/profile');
});
router.get('/addpost', isLoggedin, function (req, res) {
  res.render('addpost', { nav: true });
});
// Alternate post route
router.post('/createpost', isLoggedin, upload.single("postimage"), async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file ? req.file.filename : ""
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
});
// Show New Post form
router.get('/add', isLoggedin, (req, res) => {
  res.render('add', { nav: true }); // Assumes you have views/add.ejs
});


module.exports = router;
