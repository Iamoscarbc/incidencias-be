import mongoose from "../config/db.js";

const incidenceSchema = new mongoose.Schema({
  date: String,
  idUser: String,
  categorie: String,
  docnumber: String,
  description: String,
  documents: Array,
  specialist: String
});

const Incidence = mongoose.model('incidences', incidenceSchema);

export default Incidence