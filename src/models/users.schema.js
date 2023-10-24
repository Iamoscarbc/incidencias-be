import mongoose from "../config/db.js";

const UsersSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  phone: String,
  email: String,
  docnumber: String,
  password: String,
  idProfile: String,
  state: Number
});

const Users = mongoose.model('users', UsersSchema);

export default Users