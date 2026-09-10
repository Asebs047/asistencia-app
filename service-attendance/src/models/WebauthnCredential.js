import mongoose from "mongoose";

const webauthnCredentialSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    credentialID: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: [{ type: String }],
    deviceType: { type: String },
    backedUp: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("WebauthnCredential", webauthnCredentialSchema);
