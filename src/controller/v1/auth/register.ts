import type { Request, Response } from "express";
import config from "@/config";
import logger from "@/lib/winston";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcrypt'
import { createSlug, saltRound } from "@/lib";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";


type AUTH_USER = {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "ADMIN" | "RECRUITER" | "CANDIDATE" 
    phone: string
}
type RegisterCompanyBody = {
  companyName: string;
  companyEmail: string;
  companyPassword: string;
  userName: string;
  firstName: string;
  lastName: string;
  userEmail: string;
  userPassword: string;
}



const registerUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userName, email, firstName, lastName, password}: AUTH_USER = req.body
        
        if (!userName || !firstName || !lastName || !email || !password) {
            res.status(422).json({ message: "Please fill in all required fields" });
            return;
        }
        
        if (await prisma.user.findUnique({ where: { email } })) {
            res.status(409).json({ message: 'Email already exists' });
            return;  // Added to prevent further execution
        }

        const hashedPassword = await bcrypt.hash(password, saltRound);

        const newUser = await prisma.user.create({
            data: {
                userName,
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role: role ?? 'CANDIDATE',
                companyId
                
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
            secure: config.NODE_ENV==='production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      
      logger.info('User registration successful', {
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
      });
      
      res.status(201).json({
          user: {
            userName: newUser.userName,
            email: newUser.email,
            role: newUser.role,
          }, 
          accessToken  
      });


    } catch (error) {
      logger.error('Error during user registration', error)
        res.status(500).json({
            code: "ServerERROR",
            message: "Internal Server error",
        })
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
    }: RegisterCompanyBody  = req.body;

    if (
      !companyName || !companyEmail || !companyPassword ||
      !userName || !firstName || !lastName || !userEmail || !userPassword 
    ) {
      res.status(422).json({ message: "Please fill in all required fields" });
      return;
    }

    // Check both emails don't already exist
    const [existingCompany, existingUser] = await Promise.all([
      prisma.company.findUnique({ where: { email: companyEmail } }),
      prisma.user.findUnique({ where: { email: userEmail } }),
    ]);

    if (existingCompany) {
      res.status(409).json({ message: "Company email already registered" });
      return;
    }
    if (existingUser) {
      res.status(409).json({ message: "User email already exists" });
      return;
    }

    const [hashedCompanyPassword, hashedUserPassword] = await Promise.all([
      bcrypt.hash(companyPassword, saltRound),
      bcrypt.hash(userPassword, saltRound),
    ]);

    const baseSlug = createSlug(companyName);
    
    const slug = `${baseSlug}-${Date.now}`

    // Use a transaction — if user creation fails, company is rolled back too
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          password: hashedCompanyPassword,
          slug
          
        },
      });

      const user = await tx.user.create({
        data: {
          userName,
          firstName,
          lastName,
          email: userEmail,
          password: hashedUserPassword,
          role: "ADMIN",
          companyId: company.id,
        },
      });

      return { company, user };
    });

    res.status(201).json({
      message: "Company and admin user created successfully",
      companyId: result.company.id,
      userId: result.user.id,
    });
  } catch (error) {
    res.status(500).json({
      code: "SERVER_ERROR",
      message: "Internal server error",
      error: error
    });
    logger.error("Error during company registration", error);
  }
  
};

export {registerUsers, registerCompany};