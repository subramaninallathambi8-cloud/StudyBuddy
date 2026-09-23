const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // raw text content
    filename: { type: String }, // original uploaded file name
    summary: { type: String },
    flashcards: [
      {
        question: String,
        answer: String,
      },
    ],
    quiz: [
      {
        question: String,
        options: [String],
        answer: String,
      },
    ],
    studyPlan: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
