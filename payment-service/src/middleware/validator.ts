import { validationRequest } from "@vestify/shared";
import { body } from "express-validator";

export const validateCreatePayment = [
  body("token").isString().withMessage("Token is required"),
  body("orderId").isString().withMessage("Order ID is required"),
  validationRequest,
];
