const fs = require("fs");
const Material = require("../models/Material");
const { askGemini } = require("../utils/gemini");

// Helper: read uploaded file text
const readFileText = (filePath) => fs.readFileSync(filePath, "utf-8");

// POST /api/materials/upload
const uploadMaterial = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const { title } = req.body;
  const content = readFileText(req.file.path);

  const material = await Material.create({
    user: req.user.userId,
    title: title || req.file.originalname,
    content,
    filename: req.file.originalname,
  });

  // Clean up file from disk after reading
  fs.unlinkSync(req.file.path);

  res.status(201).json({ message: "Material uploaded", material });
};

// GET /api/materials
const getMaterials = async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user.userId };
  const materials = await Material.find(filter).select("-content -flashcards -quiz -studyPlan").sort("-createdAt");
  res.json(materials);
};

// GET /api/materials/:id
const getMaterial = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  // Students can only access their own
  if (req.user.role !== "admin" && material.user.toString() !== req.user.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(material);
};

// DELETE /api/materials/:id
const deleteMaterial = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  if (req.user.role !== "admin" && material.user.toString() !== req.user.userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  await material.deleteOne();
  res.json({ message: "Deleted" });
};

// POST /api/materials/:id/summarize
const summarize = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  const prompt = `Summarize the following study material clearly and concisely in bullet points:\n\n${material.content}`;
  const summary = await askGemini(prompt);

  material.summary = summary;
  await material.save();

  res.json({ summary });
};

// POST /api/materials/:id/flashcards
const generateFlashcards = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  const count = req.body.count || 5;

  const prompt = `
Create ${count} flashcards from the study material below.
Return ONLY valid JSON in this format, no extra text:
[{"question": "...", "answer": "..."}]

Study material:
${material.content}
`;

  const raw = await askGemini(prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  const flashcards = JSON.parse(clean);

  material.flashcards = flashcards;
  await material.save();

  res.json({ flashcards });
};

// POST /api/materials/:id/quiz
const generateQuiz = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  const count = req.body.count || 5;

  const prompt = `
Create ${count} multiple choice quiz questions from the study material below.
Return ONLY valid JSON in this format, no extra text:
[{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}]

Study material:
${material.content}
`;

  const raw = await askGemini(prompt);
  const clean = raw.replace(/```json|```/g, "").trim();
  const quiz = JSON.parse(clean);

  material.quiz = quiz;
  await material.save();

  res.json({ quiz });
};

// POST /api/materials/:id/study-plan
const generateStudyPlan = async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Not found" });

  const { goal, hoursPerDay, days } = req.body;

  const prompt = `
You are a study planner. Based on the study material below, create a personalized ${days || 7}-day study plan.
Student's goal: ${goal || "Understand and retain the material"}
Available study time: ${hoursPerDay || 2} hours per day.

Return a clear day-by-day schedule with topics and activities.

Study material:
${material.content}
`;

  const studyPlan = await askGemini(prompt);

  material.studyPlan = studyPlan;
  await material.save();

  res.json({ studyPlan });
};

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterial,
  deleteMaterial,
  summarize,
  generateFlashcards,
  generateQuiz,
  generateStudyPlan,
};
