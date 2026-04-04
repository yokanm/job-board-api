import type { Request, Response } from 'express';
import config from '@/config';
import logger from '@/lib/winston';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createSlug, saltRound } from '@/lib';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

type RegisterUserBody = {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'RECRUITER' | 'CANDIDATE';
  phone: string;
  companyId?: string;
};
type RegisterCompanyBody = {
  companyName: string;
  companyEmail: string;
  companyPassword: string;
  userName: string;
  firstName: string;
  lastName: string;
  userEmail: string;
  userPassword: string;
};

const registerUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userName,
      email,
      firstName,
      lastName,
      password,
      role,
      companyId,
    }: RegisterUserBody = req.body;

    if (!userName || !firstName || !lastName || !email || !password) {
      res.status(422).json({ message: 'Please fill in all required fields' });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }
   

    const hashedPassword = await bcrypt.hash(password, saltRound);

    const safeRole =
      role === 'RECRUITER' ? 'RECRUITER' : 'CANDIDATE';

    const newUser = await prisma.user.create({
      data: {
        userName,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: safeRole,
        companyId,
      },
    });
    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User registration', {
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      user: {
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });

  } catch (error) {
    logger.error('User registration error', error);

    res.status(500).json({
      message: 'Internal Server error',
    });
  }
};

// Creates a company AND its first admin user in one transaction
const registerCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      companyName,
      companyEmail,
      companyPassword,
      userName,
      firstName,
      lastName,
      userEmail,
      userPassword,
    }: RegisterCompanyBody = req.body;

    if (
      !companyName ||
      !companyEmail ||
      !companyPassword ||
      !userName ||
      !firstName ||
      !lastName ||
      !userEmail ||
      !userPassword
    ) {
      res.status(422).json({ message: 'Please fill in all required fields' });
      return;
    }

    // Check both emails don't already exist
    const [existingCompany, existingUser] = await Promise.all([
      prisma.company.findUnique({ where: { email: companyEmail } }),
      prisma.user.findUnique({ where: { email: userEmail } }),
    ]);

    if (existingCompany) {
      res.status(409).json({ message: 'Company email already registered' });
      return;
    }
    if (existingUser) {
      res.status(409).json({ message: 'User email already exists' });
      return;
    }

    const [hashedCompanyPassword, hashedUserPassword] = await Promise.all([
      bcrypt.hash(companyPassword, saltRound),
      bcrypt.hash(userPassword, saltRound),
    ]);

    const slug = `${createSlug(companyName)}-${Date.now()}`;

    // Use a transaction — if user creation fails, company is rolled back too
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          password: hashedCompanyPassword,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          userName,
          firstName,
          lastName,
          email: userEmail,
          password: hashedUserPassword,
          role: 'ADMIN',
          companyId: company.id,
        },
      });

      return { company, user };
    });

    res.status(201).json({
      message: 'Company and admin user created successfully',
      companyId: result.company.id,
      userId: result.user.id,
    });

  } catch (error) {
    logger.error('Error during company registration', error);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export { registerUsers, registerCompany };
