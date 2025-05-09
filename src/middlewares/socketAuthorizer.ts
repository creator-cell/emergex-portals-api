
import jwt from "jsonwebtoken";
import { config } from "../config/index";
import UserModel from "../models/UserModel";

export const socketAuthorizer = async (
    req: Request, fn: (err: string | null | undefined, success: boolean) => void
) => {
  try {
    const decoded = jwt.verify(token as string, config.jwtSecret);
    const userId =
      typeof decoded === "object" && "id" in decoded ? decoded.id : null;

    if (!userId) {
      return fn("user not found",false)
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
        return fn("user not found",false)
    }
    
    req.user = {
        id: user?._id as string,
        role: user?.role ?? "defaultRole",
        email: user?.email,
      };

    req.room = `${user.role}-${(user._id as string).toString()}`
    fn(null,true)

  } catch (error) {
    console.error("Error in socketAuthorizer middleware:", error);
  }
};
