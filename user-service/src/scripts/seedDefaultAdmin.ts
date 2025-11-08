import User from "../models/User";

/**
 * Seed default admin user if no admin users exist
 * This function should be called on server startup
 */
export async function seedDefaultAdmin(): Promise<void> {
  try {
    // Check if any admin users exist
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount > 0) {
      console.log(
        `✅ Admin users already exist (${adminCount} admin(s) found). Skipping default admin creation.`,
      );
      return;
    }

    // Get default admin credentials from environment variables
    const defaultAdminEmail =
      process.env.DEFAULT_ADMIN_EMAIL || "admin@vestify.com";
    const defaultAdminPassword =
      process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
    const defaultAdminFirstName =
      process.env.DEFAULT_ADMIN_FIRST_NAME || "Admin";
    const defaultAdminLastName = process.env.DEFAULT_ADMIN_LAST_NAME || "User";
    const defaultAdminPhone = process.env.DEFAULT_ADMIN_PHONE;

    // Check if user with this email already exists
    const existingUser = await User.findByEmail(defaultAdminEmail);
    if (existingUser) {
      console.log(
        `⚠️ User with email ${defaultAdminEmail} already exists. Updating role to admin...`,
      );
      existingUser.role = "admin";
      await existingUser.save();
      console.log(`✅ User ${defaultAdminEmail} role updated to admin`);
      return;
    }

    // Create default admin user
    console.log(`📦 No admin users found. Creating default admin user...`);
    console.log(`   Email: ${defaultAdminEmail}`);

    const adminUser = await User.create({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      firstName: defaultAdminFirstName,
      lastName: defaultAdminLastName,
      phone: defaultAdminPhone,
      role: "admin",
      isEmailVerified: false,
      isActive: true,
    });

    console.log(`✅ Default admin user created successfully!`);
    console.log(`   User ID: ${adminUser._id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.getFullName()}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(
      `\n⚠️ IMPORTANT: Please change the default admin password after first login!`,
    );
    console.log(
      `   Default password: ${defaultAdminPassword} (set via DEFAULT_ADMIN_PASSWORD env var)`,
    );
  } catch (error: any) {
    console.error("❌ Error seeding default admin user:", error.message);
    // Don't throw error - just log it, so server can still start
    // This allows the server to start even if admin creation fails
  }
}
