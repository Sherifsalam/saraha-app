import bcrypt from "bcrypt";
import * as argon2 from "argon2"

export const hash = async (text, target) => {
    let ciphertext;
switch (target) {
    case "argon2":
        ciphertext = await argon2.hash(text);
        break;

    default:
        ciphertext = await bcrypt.hash(text, 10);


}
    return ciphertext;
}

export const compare = async (text, ciphertext,target) => {
    let results;
switch (target) {
    case "argon2":
        results = await argon2.verify( ciphertext, text);
        break;

    default:
        results = await bcrypt.compare(text, ciphertext );
}
return results;
};