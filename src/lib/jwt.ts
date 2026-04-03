import config from "@/config";
import jwt from 'jsonwebtoken';


export type TokenPayload = {
    userId: string; 
};

export const generateAccessToken = (userId:string): string => {
    return jwt.sign({ userId }, config.JWT_ACCESS_SECRET, {
            subject: "accessApi",
            expiresIn: config.ACCESS_TOKEN_EXPIRES
    })
    
}

export const generateRefreshToken = (userId:string): string => {
    return jwt.sign({userId }, config.JWT_REFRESH_SECRET, {
            subject: "refreshToken",
            expiresIn: config.REFRESH_TOKEN_EXPIRES
    })
    
}
    