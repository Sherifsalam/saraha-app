import crypto from "crypto";  
import { buffer } from "stream/consumers";

const IV_length=16


export const encrypt = (text) => {
const iv = crypto.randomBytes(IV_length);
const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_KEY), iv);

let encrypted = cipher.update(text , "utf8", "hex");
console.log(encrypted);

encrypted += cipher.final("hex");
console.log(encrypted);
return iv.toString("hex") + ":" + encrypted.toString("hex");

}   


export const decrypt = (encrpted) => {
const [iv, encryptedData] = encrpted.split(":");
const binary =  Buffer.from(iv, "hex");
const decipher = crypto.createDecipheriv("aes-256-cbc", process.env.ENCRYPTION_KEY, binary);

let decrypted = decipher.update(encryptedData, "hex", "utf8");
decrypted += decipher.final("utf8");
return decrypted;
};

