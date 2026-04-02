import { Router } from "express";

/**
 * Controller
 */

import login from "@/controller/v1/auth/login";
import register from "@/controller/v1/auth/register";
/**
 * middleware
 */

/**
 * model
 */

const router = Router();

    router.post('/register', register);
    router.post('/login', login);
    
export default router;