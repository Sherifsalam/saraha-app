import { signupSchema } from "../Modules/auth/auth.validation.js";
import { BadrequestError } from "../utils/error/error_handle.js";



const reqData=["body","params","query"]

export const Validation=(schema)=>{
    return(req,res,next)=>{
        const ValidateErrors=[]
        reqData.forEach(ele=>{
            if (schema[ele]) {
              const ValidateRes = schema[ele].validate(req.body, {abortEarly: false,});

              if (ValidateRes.error) {
                ValidateErrors.push(ValidateRes.error);        
            } 
            }

        })
        if (ValidateErrors.length > 0) {
          res.status(400).json({
            success: false,
            message: "validation error",
            stack: ValidateErrors,
          });
        }
    }
       
}