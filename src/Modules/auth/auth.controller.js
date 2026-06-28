import { Router } from "express";
import { SignupService, LoginService } from "./auth.service.js";
import { SuccessResponse } from "../../utils/error/error_handle.js";

 const router = Router();


router.get("/",(req,res) =>{
   res.json({msg:"hello from the user module"});
    
})


router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, gender } = req.body;
  const { data } = await SignupService(
    firstName,
    lastName,
    email,
    password,
    gender,
  );
  return SuccessResponse({
    res,
    data, 
    status: 201,
  });
});




router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { data, message } = await LoginService(email, password);
    return SuccessResponse({ res, data, message, status: 200 });
  } catch (err) {
    next(err);
  }
});

export default router