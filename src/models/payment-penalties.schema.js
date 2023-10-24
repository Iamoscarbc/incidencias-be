import mongoose from "../config/db.js";

const paymentPenaltiesSchema = new mongoose.Schema({
  date: String,
  idUser: String,
  amount: Number,
  paymentReason: String,
  documents: Array,
  payer: Object
});

const PaymentPenalties = mongoose.model('payment-penalties', paymentPenaltiesSchema);

export default PaymentPenalties