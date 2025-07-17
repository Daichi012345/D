const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meal: { type: String, required: true },
  mood: { type: String, required: true },
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  image: { type: String },
  summary: { type: String },          
  instructions: { type: String },     
  ingredients: [{ type: String }],    
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
