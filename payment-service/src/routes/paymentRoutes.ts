import { currentUser, requireAuth } from "@vestify/shared";
import express, { Router } from "express";
import { createPayment } from "../controllers/createPayment";
import { validateCreatePayment } from "../middleware/validator";

const router: Router = express.Router();

router.post(
  "/create-payment",
  currentUser,
  requireAuth,
  validateCreatePayment,
  createPayment,
);

export default router;
