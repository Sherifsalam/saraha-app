const error = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ error: message });
}


export const BadrequestError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}


export const UnauthorizedError = (message) => {
    const error = new Error(message);
    error.statusCode = 401;
    return error;
}


export const NotFoundError = (message) => {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}


export const InternalServerError = (message) => {
    const error = new Error(message);
    error.statusCode = 500;
    return error;
}


export const ConflictError = (message) => {
    const error = new Error(message);
    error.statusCode = 409;
    return error;
}



export const SuccessResponse=({res,message="success" , status=200 ,data={}})=>{
  return res.status(status).json({ message, data });
}



