import mongoose from "../config/db.js";

const categoriesSchema = new mongoose.Schema({
  name: String,
});

const Categories = mongoose.model('categories', categoriesSchema);

export default Categories