import { Router } from "express";
import { registerCompany, registerUsers } from "@/controller/v1/auth/register";
import { loginCompany, loginUser } from "@/controller/v1/auth/login";

const router = Router();

    router.post('/register', registerUsers);
    router.post('/register/company', registerCompany);
    router.post('/login', loginUser);
    router.post('/login/company', loginCompany);
    
export default router;