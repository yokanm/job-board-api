import { Router } from "express";
import type { Request, Response } from "express";


const router = Router();

/*
 * Routes
*/
import authRoutes from "@/routes/v1/auth"

/*
 * Root route
 */
router.get('/', (req:Request, res:Response) => {
    res.status(200).json({
        message: "Api is Live and Healthy",
        status: "Ok",
        version: "1.0.0",
        timeStamp: new Date().toISOString(),
    })
})

router.use('/auth', authRoutes);

export default router;
