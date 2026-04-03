import { Router } from "express";
import login from "@/controller/v1/auth/company";
import { registerCompany, registerUsers } from "@/controller/v1/auth/register";

const router = Router();

    router.post('/register', registerUsers);
    router.post('/register/company', registerCompany);
    router.post('/login', login);
    
export default router;