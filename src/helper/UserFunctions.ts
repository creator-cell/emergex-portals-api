import UserModel from "../models/UserModel";

export async function generateUniqueUsername(name: string) {
  const cleanedName = name.toLowerCase().replace(/\s+/g, "");
  const randomSuffix = Math.floor(Math.random() * 100000);
  const username = `${cleanedName}${randomSuffix}`;
  const isUserNameExist = await UserModel.findOne({ username });
  if (isUserNameExist) {
    return generateUniqueUsername(name);
  }
  return username;
}

export function generatePassword() {
    const length = Math.floor(Math.random() * 3) + 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}
