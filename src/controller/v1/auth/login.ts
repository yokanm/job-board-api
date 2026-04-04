import type { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import logger from "@/lib/winston";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import config from "@/config";


const loginUser = async (req:Request, res:Response) => {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user) {
            res.status(401).json({ message: "Email or password is invalid" });
             return 
        }

        if (user.deletedAt) {
            res.status(401).json({ message: "Email or password is invalid" });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            res.status(401).json({ message: "Email or password is invalid" })
            return; 
        }
       
        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV==='production',
            sameSite: 'strict',
        });

        res.status(200).json({
            user: {
                userName: user.userName,
                email: user.email,
                role: user.role,
            },
            accessToken,
        });

    } catch (error) {
        logger.error('Error during user login', error)
        res.status(500).json({
            code: "ServerERROR",
            message: "Internal Server error",
            error: error
        })
    }
};

const loginCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(422).json({ message: "Email and password are required" });
            return;
        }

        const company = await prisma.company.findUnique({ where: { email } });

        if (!company || company.deletedAt) {
            res.status(401).json({ message: "Email or password is invalid" });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, company.password);
        if (!passwordMatch) {
            res.status(401).json({ message: "Email or password is invalid" });
            return;
        }

        const accessToken = generateAccessToken(company.id);
        const refreshToken = generateRefreshToken(company.id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            company: {
                id: company.id,
                name: company.name,
                email: company.email,
            },
            accessToken,
        });
        
        } catch (error) {
            logger.error('Error during company login', error)
            res.status(500).json({
                message: "Internal Server error",
                
            })
        }
}

export {loginUser, loginCompany}