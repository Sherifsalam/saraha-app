import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "7d", 
    });
    return token;
}
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        return decoded;
    } catch (error) {
      console.log("JWT ERROR:", error.message); // ✅ add this
      return null;
    }
}

export const refreshToken = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",   
    });
    return token;
}


export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}