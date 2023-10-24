import mongoose from "../config/db.js";

const ProfilesSchema = new mongoose.Schema({
  name: String,
  roles: Array
});

const Profiles = mongoose.model('profiles', ProfilesSchema);

export default Profiles