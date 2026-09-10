import { Router } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import User from "../models/User.js";
import WebauthnCredential from "../models/WebauthnCredential.js";
import { createAttendance } from "../routes/attendance.routes.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { setChallenge, getChallenge, clearChallenge } from "./challengeStore.js";

const router = Router();

const rpName = process.env.WEBAUTHN_RP_NAME || "Asistencia App";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:5173";

router.use(authMiddleware);

// POST /webauthn/register/options - el alumno pide un challenge para enrolar su autenticador
router.post(
  "/register/options",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.sub);
    const existingCredentials = await WebauthnCredential.find({ userId: user._id });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialID,
        transports: cred.transports,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    setChallenge(user._id, options.challenge);
    res.json(options);
  })
);

// POST /webauthn/register/verify - verifica la respuesta del navegador y guarda la credencial
router.post(
  "/register/verify",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.sub);
    const expectedChallenge = getChallenge(user._id);
    if (!expectedChallenge) {
      return res.status(400).json({ message: "No hay un registro biométrico en curso" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    clearChallenge(user._id);

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: "No se pudo verificar el registro biométrico" });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await WebauthnCredential.create({
      userId: user._id,
      credentialID: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      transports: credential.transports,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });

    res.status(201).json({ verified: true });
  })
);

// POST /webauthn/attendance/options - challenge para marcar asistencia con el autenticador ya enrolado
router.post(
  "/attendance/options",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const credentials = await WebauthnCredential.find({ userId: req.user.sub });
    if (credentials.length === 0) {
      return res.status(404).json({ message: "No tienes un autenticador biométrico registrado" });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialID,
        transports: cred.transports,
      })),
    });

    setChallenge(req.user.sub, options.challenge);
    res.json(options);
  })
);

export default router;

// Router aparte porque se monta en la raíz (`/attendance/biometric`), no bajo `/webauthn`.
export const biometricAttendanceRouter = Router();
biometricAttendanceRouter.use(authMiddleware);

// POST /attendance/biometric - verifica la aserción WebAuthn y registra la asistencia
biometricAttendanceRouter.post(
  "/biometric",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const expectedChallenge = getChallenge(req.user.sub);
    if (!expectedChallenge) {
      return res.status(400).json({ message: "No hay una marcación biométrica en curso" });
    }

    const credentialRecord = await WebauthnCredential.findOne({ credentialID: req.body.id });
    if (!credentialRecord || credentialRecord.userId.toString() !== req.user.sub) {
      return res.status(400).json({ message: "Credencial no reconocida" });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credentialRecord.credentialID,
        publicKey: new Uint8Array(Buffer.from(credentialRecord.publicKey, "base64")),
        counter: credentialRecord.counter,
        transports: credentialRecord.transports,
      },
    });

    clearChallenge(req.user.sub);

    if (!verification.verified) {
      return res.status(400).json({ message: "No se pudo verificar la marcación biométrica" });
    }

    credentialRecord.counter = verification.authenticationInfo.newCounter;
    await credentialRecord.save();

    const student = await User.findById(req.user.sub);
    await createAttendance(student, "biometric", res);
  })
);
