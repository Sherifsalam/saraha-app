export const revokeTokenKey = (UserId,jti)=>`Users:login:${UserId}:${jti}`

export const confirmEmailKey = (UserId) => `Users:${UserId}:otp:oldconfirmEmail`

export  const confirmNewEmailKey = (UserId)=>`Users:${UserId}:otp:confirmEmail`

export const newEmailKey = (UserId)=>`Users:${UserId}:email:newEmail`

export const forgetPasswordKey = (UserId)=>`Users:${UserId}:otp:forgetPassword`