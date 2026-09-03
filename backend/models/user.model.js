/**
 * Compatibility shim — re-exports BaseUser as `User` so that legacy imports
 * (import { User } from "../models/user.model.js") keep working without
 * registering a second model named "User" and causing OverwriteModelError.
 *
 * All new code should import directly from baseUser.model.js, student.model.js,
 * or recruiter.model.js.
 */
export { BaseUser as User } from "./baseUser.model.js";
