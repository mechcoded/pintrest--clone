const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

// Connect to database
mongoose.connect('mongodb://localhost:27017/pinterestClone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define user schema
const userSchema = new mongoose.Schema({
  username: String,      // This will be used as the login ID
  name: String,
  email: String,
  profileImage: String,
  contact: Number,
  boards: {
    type: Array,
    default: []
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post'
    }
  ]
});

// ✅ Attach passport-local-mongoose plugin
userSchema.plugin(plm);

// Export model
module.exports = mongoose.model('user', userSchema);

