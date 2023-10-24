import mongoose from "../config/db.js";

const inspectSchema = new mongoose.Schema({
  date: String,
  idUser: String,
  description: String,
  documents: Array
});

const Inspect = mongoose.model('inspects', inspectSchema);

export default Inspect