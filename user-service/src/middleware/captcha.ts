import { CustomError } from "@vestify/shared";
import { NextFunction, Request, Response } from "express";

/**
 * CAPTCHA verification middleware
 * Supports Google reCAPTCHA v2/v3 and hCaptcha
 */
export const verifyCaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Skip CAPTCHA in development if disabled
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_CAPTCHA === "true"
    ) {
      return next();
    }

    const { captchaToken } = req.body;

    if (!captchaToken) {
      throw new CustomError("CAPTCHA token is required", 400);
    }

    // Determine CAPTCHA provider
    const captchaProvider = process.env.CAPTCHA_PROVIDER || "recaptcha"; // 'recaptcha' or 'hcaptcha'

    let isValid = false;

    if (captchaProvider === "recaptcha") {
      isValid = await verifyRecaptcha(captchaToken);
    } else if (captchaProvider === "hcaptcha") {
      isValid = await verifyHcaptcha(captchaToken);
    } else {
      throw new CustomError("Invalid CAPTCHA provider configuration", 500);
    }

    if (!isValid) {
      throw new CustomError("CAPTCHA verification failed", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Google reCAPTCHA token
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn("RECAPTCHA_SECRET_KEY not set, skipping CAPTCHA verification");
    return true; // Allow request if not configured
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      },
    );

    const data = (await response.json()) as {
      success: boolean;
      score?: number;
    };

    // For reCAPTCHA v3, also check score (0.0 to 1.0)
    // Score >= 0.5 is typically considered valid
    if (data.success) {
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
      if (data.score !== undefined) {
        return data.score >= minScore;
      }
      return true; // v2 doesn't have score
    }

    return false;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return false;
  }
}

/**
 * Verify hCaptcha token
 */
async function verifyHcaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn("HCAPTCHA_SECRET_KEY not set, skipping CAPTCHA verification");
    return true; // Allow request if not configured
  }

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = (await response.json()) as { success: boolean };
    return data.success;
  } catch (error) {
    console.error("Error verifying hCaptcha:", error);
    return false;
  }
}
