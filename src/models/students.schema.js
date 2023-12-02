import mongoose from "../config/db.js";

const studentSchema = new mongoose.Schema({
    dni: Number,
    names: String,
    year_section: String,
    nivel: String
});

const Student = mongoose.model('students', studentSchema);

export default Student