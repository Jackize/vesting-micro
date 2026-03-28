import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vestify User Service API",
      version: "1.0.0",
      description:
        "Authentication and user management API for the Vestify e-commerce platform. All protected routes require a JWT access token in the `Authorization: Bearer <token>` header.",
    },
    servers: [
      {
        url: "/api/users",
        description: "User service (via API Gateway)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token returned from `/login` or `/refresh`",
        },
      },
      schemas: {
        // ─── Reusable field types ──────────────────────────────────────────
        UserPublic: {
          type: "object",
          properties: {
            id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            email: { type: "string", example: "jane@example.com" },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+84901234567", nullable: true },
            avatar: { type: "string", nullable: true, example: null },
            role: { type: "string", enum: ["user", "admin", "moderator"], example: "user" },
            isEmailVerified: { type: "boolean", example: true },
            isActive: { type: "boolean", example: true },
            lastLogin: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ─── Success / error envelopes ─────────────────────────────────────
        SuccessMessage: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        // ─── Request bodies ────────────────────────────────────────────────
        RegisterBody: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: {
              type: "string",
              minLength: 6,
              example: "Secret123",
              description: "Min 6 chars, must include uppercase, lowercase, and a digit",
            },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+84901234567" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", example: "Secret123" },
          },
        },
        RefreshBody: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              description: "Opaque token returned by `/login`",
              example: "a1b2c3d4e5f6...",
            },
          },
        },
        LogoutBody: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              description: "The refresh token to invalidate. If omitted only the server-side session ends.",
              example: "a1b2c3d4e5f6...",
            },
          },
        },
        ForgotPasswordBody: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
          },
        },
        ResetPasswordBody: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string", description: "64-character hex token from the reset email" },
            newPassword: { type: "string", minLength: 6, example: "NewSecret123" },
          },
        },
        ChangePasswordBody: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string", example: "OldSecret123" },
            newPassword: { type: "string", minLength: 6, example: "NewSecret123" },
          },
        },
        UpdateProfileBody: {
          type: "object",
          properties: {
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+84901234567" },
            avatar: { type: "string", format: "uri", example: "https://cdn.example.com/avatar.jpg" },
          },
        },
        ResendVerificationBody: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
          },
        },
        UpdateRoleBody: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["user", "admin", "moderator"], example: "moderator" },
          },
        },
      },
      // ─── Shared response objects ───────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: "Missing or invalid access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, error: "Not authorized, user not found in request" },
            },
          },
        },
        Forbidden: {
          description: "Valid token but insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, error: "Access denied" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, error: "User not found" },
            },
          },
        },
        ValidationError: {
          description: "Request body / query failed validation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
      },
    },
    // ─── Tag groups (shown in sidebar) ──────────────────────────────────────
    tags: [
      { name: "Auth", description: "Register, login, logout, token refresh" },
      { name: "Email Verification", description: "Verify and resend email verification" },
      { name: "Password", description: "Forgot / reset / change password" },
      { name: "Profile", description: "Get and update the authenticated user's profile" },
      { name: "Admin", description: "User management (admin / moderator only)" },
    ],
    paths: {
      // ═══════════════════════════════════════════════════════════════════════
      // AUTH
      // ═══════════════════════════════════════════════════════════════════════
      "/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          description:
            "Creates an account and sends an email verification link. The account is inactive until the email is verified.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } },
            },
          },
          responses: {
            "201": {
              description: "User created. Verification email sent.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "User registered successfully. Please check your email to verify your account." },
                      data: {
                        type: "object",
                        properties: { user: { $ref: "#/components/schemas/UserPublic" } },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Email already registered or validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Email already exists" },
                },
              },
            },
          },
        },
      },

      "/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
            "Returns a short-lived JWT `accessToken` (15 min) and an opaque `refreshToken` (7 days). Store the refresh token securely — it is needed to obtain new access tokens.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Login successful" },
                      data: {
                        type: "object",
                        properties: {
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              email: { type: "string" },
                              firstName: { type: "string" },
                              lastName: { type: "string" },
                              fullName: { type: "string" },
                              role: { type: "string" },
                              lastLogin: { type: "string", format: "date-time", nullable: true },
                            },
                          },
                          accessToken: { type: "string", description: "JWT — valid for 15 min" },
                          refreshToken: { type: "string", description: "Opaque token — valid for 7 days" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "401": {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Invalid email or password" },
                },
              },
            },
            "403": {
              description: "Account deactivated or email not verified",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    notVerified: { value: { success: false, error: "Please verify your email before logging in" } },
                    deactivated: { value: { success: false, error: "Account has been deactivated" } },
                  },
                },
              },
            },
          },
        },
      },

      "/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          description: "Exchanges a valid refresh token for a new access token. The refresh token itself is NOT rotated.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RefreshBody" } },
            },
          },
          responses: {
            "200": {
              description: "New access token issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Token refreshed successfully" },
                      data: {
                        type: "object",
                        properties: { accessToken: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "401": {
              description: "Invalid or expired refresh token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    invalid: { value: { success: false, error: "Invalid refresh token" } },
                    expired: { value: { success: false, error: "Refresh token has expired" } },
                  },
                },
              },
            },
            "403": {
              description: "Account deactivated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Account has been deactivated" },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      "/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          description: "Deletes the refresh token from the server. Pass the `refreshToken` in the body to invalidate that session.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LogoutBody" } },
            },
          },
          responses: {
            "200": {
              description: "Logged out",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "Logged out successfully" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // EMAIL VERIFICATION
      // ═══════════════════════════════════════════════════════════════════════
      "/verify-email": {
        get: {
          tags: ["Email Verification"],
          summary: "Verify email address",
          description: "Validates the token from the verification email link and activates the account.",
          parameters: [
            {
              name: "token",
              in: "query",
              required: true,
              description: "64-character hex token from the verification email",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Email verified (or was already verified)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  examples: {
                    verified: { value: { success: true, message: "Email verified successfully" } },
                    alreadyVerified: { value: { success: true, message: "Email is already verified" } },
                  },
                },
              },
            },
            "400": {
              description: "Token missing, invalid, or expired",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    missing: { value: { success: false, error: "Verification token is required" } },
                    invalid: { value: { success: false, error: "Invalid or expired verification token" } },
                    expired: { value: { success: false, error: "Verification token has expired" } },
                  },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      "/resend-verification": {
        post: {
          tags: ["Email Verification"],
          summary: "Resend verification email",
          description: "Sends a new verification email. A 5-minute cooldown is enforced per email address.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ResendVerificationBody" } },
            },
          },
          responses: {
            "200": {
              description: "Email sent (or silently no-ops if user not found / already verified)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "Verification email sent successfully" },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": {
              description: "Cooldown active — too soon since last send",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Please wait 240 seconds before resending the verification email" },
                },
              },
            },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // PASSWORD
      // ═══════════════════════════════════════════════════════════════════════
      "/forgot-password": {
        post: {
          tags: ["Password"],
          summary: "Request password reset",
          description:
            "Sends a password-reset link to the email if an account exists. Always returns 200 to prevent email enumeration.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordBody" } },
            },
          },
          responses: {
            "200": {
              description: "Reset email sent (regardless of whether the account exists)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: {
                    success: true,
                    message: "If an account with that email exists, a password reset link has been sent.",
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
          },
        },
      },

      "/reset-password": {
        get: {
          tags: ["Password"],
          summary: "Validate reset token",
          description: "Checks that a password-reset token is valid and unused before showing the reset form.",
          parameters: [
            {
              name: "token",
              in: "query",
              required: true,
              description: "64-character hex token from the reset email",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Token is valid",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "Reset token verified successfully" },
                },
              },
            },
            "400": {
              description: "Token missing, invalid, expired, or already used",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    missing: { value: { success: false, error: "Reset token is required" } },
                    invalid: { value: { success: false, error: "Invalid or expired reset token" } },
                    expired: { value: { success: false, error: "Reset token has expired" } },
                    used: { value: { success: false, error: "Reset token has already been used" } },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Password"],
          summary: "Reset password",
          description: "Sets a new password using a valid reset token. All existing sessions are invalidated.",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordBody" } },
            },
          },
          responses: {
            "200": {
              description: "Password reset successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "Password reset successfully" },
                },
              },
            },
            "400": {
              description: "Validation error, invalid/expired/used token, or same password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    samePassword: { value: { success: false, error: "New password must be different from current password" } },
                    invalid: { value: { success: false, error: "Invalid or expired reset token" } },
                  },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      "/change-password": {
        put: {
          tags: ["Password"],
          summary: "Change password (authenticated)",
          description: "Changes the password for the currently logged-in user. All refresh tokens are revoked.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordBody" } },
            },
          },
          responses: {
            "200": {
              description: "Password changed, all sessions logged out",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "Password changed successfully. All sessions have been logged out." },
                },
              },
            },
            "400": {
              description: "New password same as current",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "New password must be different from current password" },
                },
              },
            },
            "401": {
              description: "Wrong current password or invalid auth token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Invalid current password" },
                },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // PROFILE
      // ═══════════════════════════════════════════════════════════════════════
      "/me": {
        get: {
          tags: ["Profile"],
          summary: "Get current user profile",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "User profile",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: { user: { $ref: "#/components/schemas/UserPublic" } },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Profile"],
          summary: "Update current user profile",
          description: "Updates `firstName`, `lastName`, `phone`, and/or `avatar`. All fields are optional.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileBody" } },
            },
          },
          responses: {
            "200": {
              description: "Updated profile",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "Profile updated successfully" },
                      data: {
                        type: "object",
                        properties: { user: { $ref: "#/components/schemas/UserPublic" } },
                      },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // ADMIN — USER MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════════
      "/": {
        get: {
          tags: ["Admin"],
          summary: "List all users",
          description: "Returns a paginated list of users. Requires `admin` or `moderator` role.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
            { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page" },
            { name: "role", in: "query", schema: { type: "string", enum: ["user", "admin", "moderator"] }, description: "Filter by role" },
            { name: "isActive", in: "query", schema: { type: "boolean" }, description: "Filter by active status" },
          ],
          responses: {
            "200": {
              description: "Paginated user list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          users: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } },
                          total: { type: "integer" },
                          page: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },

      "/{id}": {
        get: {
          tags: ["Admin"],
          summary: "Get user by ID",
          description: "Returns a single user. Requires authentication.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId" },
          ],
          responses: {
            "200": {
              description: "User found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: { user: { $ref: "#/components/schemas/UserPublic" } },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid ID format",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: { success: false, error: "Invalid user ID" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete user",
          description: "Permanently deletes a user. Requires `admin` role.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId" },
          ],
          responses: {
            "200": {
              description: "User deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                  example: { success: true, message: "User deleted successfully" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      "/{id}/role": {
        put: {
          tags: ["Admin"],
          summary: "Update user role",
          description: "Changes the role of a user. Requires `admin` role. Admins cannot remove their own admin role.",
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId" },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/UpdateRoleBody" } },
            },
          },
          responses: {
            "200": {
              description: "Role updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string", example: "User role updated successfully" },
                      data: {
                        type: "object",
                        properties: { user: { $ref: "#/components/schemas/UserPublic" } },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid role or self-demotion attempt",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  examples: {
                    invalidRole: { value: { success: false, error: "Invalid role. Role must be 'user', 'admin', or 'moderator'" } },
                    selfDemotion: { value: { success: false, error: "You cannot remove your own admin role" } },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
    },
  },
  apis: [], // spec is fully inline above
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
