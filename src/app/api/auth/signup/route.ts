import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Logger, LogTags, categorizeError, ValidationError, DatabaseError, ConnectionError } from "@/lib/logger"
import { isValidEmail, isValidPassword, sanitizeString } from "@/lib/validation"
import { prisma } from "@/server/db"

export async function POST(request: NextRequest) {
  Logger.d(LogTags.SIGNUP, 'Registration request received');

  try {
    // Parse request body and extract credentials
    const body = await request.json()
    const { email, password, name } = body

    Logger.d(LogTags.SIGNUP, 'Request body parsed', { hasEmail: !!email, hasPassword: !!password, hasName: !!name });

    // Validate required credentials
    if (!email || !password) {
      Logger.w(LogTags.SIGNUP, 'Registration failed: missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      Logger.w(LogTags.SIGNUP, 'Registration failed: invalid email format', { email: Logger.maskEmail(email) });
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      Logger.w(LogTags.SIGNUP, 'Registration failed: password too weak');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name ? sanitizeString(name) : sanitizedEmail.split('@')[0];

    Logger.d(LogTags.SIGNUP, 'Input validation passed', { email: Logger.maskEmail(sanitizedEmail) });

    // Hash the password before database operations
    const hashedPassword = await bcrypt.hash(password, 12)
    Logger.d(LogTags.SIGNUP, 'Password hashed successfully');

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ 
      where: { email: sanitizedEmail }
    })

    if (existingUser) {
      // Check if existing user has a password
      if (existingUser.password) {
        Logger.w(LogTags.SIGNUP, 'Registration failed: user already exists', { email: Logger.maskEmail(sanitizedEmail) });
        return NextResponse.json({ error: "User already registered" }, { status: 409 })
      } else {
        // User exists but has no password - update the existing record
        Logger.i(LogTags.SIGNUP, 'Updating incomplete user record', { userId: existingUser.id });
        
        try {
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              password: hashedPassword,
              firstName: sanitizedName
            }
          })
          
          Logger.i(LogTags.SIGNUP, 'Incomplete user record updated successfully', { userId: updatedUser.id, email: Logger.maskEmail(sanitizedEmail) });
          
          return NextResponse.json(
            {
              message: "User successfully registered",
              user: { id: updatedUser.id, email: updatedUser.email },
            },
            { status: 201 },
          )
        } catch (saveError) {
          Logger.e(LogTags.SIGNUP, 'Failed to update incomplete user record', { error: saveError, userId: existingUser.id });
          throw saveError; // Re-throw to be caught by outer catch
        }
      }
    }

    // Create new user (only if no existing user found)
    const newUser = await prisma.user.create({
      data: {
        firstName: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        username: sanitizedEmail.split('@')[0],
        stats: {
          create: {}
        }
      }
    })

    Logger.i(LogTags.SIGNUP, 'User registered successfully', { userId: newUser.id, email: Logger.maskEmail(sanitizedEmail) });

    // Return a success response with the user ID and email
    return NextResponse.json(
      {
        message: "User successfully registered",
        user: { id: newUser.id, email: newUser.email },
      },
      { status: 201 },
    )
  } catch (error) {
    Logger.e(LogTags.SIGNUP, 'Registration error details', { error: error });
    const categorizedError = categorizeError(error);
    Logger.d(LogTags.SIGNUP, 'Categorized error type', { type: categorizedError.constructor.name, message: categorizedError.message });

    if (categorizedError instanceof ValidationError) {
      Logger.e(LogTags.SIGNUP, `Validation error in registration: ${categorizedError.message}`);
      return NextResponse.json({ error: categorizedError.message }, { status: 400 });
    }

    if (categorizedError instanceof DatabaseError) {
      Logger.e(LogTags.DB_ERROR, `Database error in registration: ${categorizedError.message}`);
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    }

    if (categorizedError instanceof ConnectionError) {
      Logger.e(LogTags.DB_CONNECT, `Database unavailable in registration: ${categorizedError.message}`);
      return NextResponse.json(
        { error: "Database is unavailable. Check DATABASE_URL or start PostgreSQL and try again." },
        { status: 503 }
      );
    }

    Logger.e(LogTags.SIGNUP, `Unexpected error in registration: ${categorizedError.message}`, { error: categorizedError });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
