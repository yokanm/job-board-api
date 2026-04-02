import type { Request, Response } from "express";
import config from "@/config";
import logger from "@/lib/winston";
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcrypt'
import { saltRound } from "@/lib";


interface AUTH_USER  {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "ADMIN" | "RECRUITER" | 'CANDIDATE';
    companyId: string;  // Added required company field
}


const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userName, email, firstName, lastName, password, role, companyId }: AUTH_USER = req.body
        
        // if (!userName || !email || password) {
        //     res.status(422).json({
        //         message:"please fill in all fields (userName, email and password)"
        //     })
        // }

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
                role,
                companyId
            }, 
        });
        res.status(201).json({
            message: "New user created now",
            id: newUser.id
        });

    } catch (error) {
        res.status(500).json({
            code:"ServerERROR",
            message: "Internal Server error",
            error: error
        })
        logger.error('Error during user registration', error)
    }
}

export default register;