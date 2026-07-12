const mongoose = require('mongoose');

// A meal item embedded document (used for breakfast/lunch/dinner)
const mealSchema = new mongoose.Schema(
  {
    items: [{ type: String }], // e.g. ["Dal", "Rice", "Roti", "Sabzi"]
    price: { type: Number, default: 0 },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
  },
  { timestamps: true }
);

// One menu document per provider per day
menuSchema.index({ provider: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
