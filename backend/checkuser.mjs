import "./utils/db.js";
setTimeout(async () => {
  try {
    const { BaseUser } = await import("./models/baseUser.model.js");
    const u = await BaseUser.findOne({ email: "kusyapk@gmail.com" })
      .select("role password fullname email")
      .lean();
    if (!u) {
      console.log("NOT FOUND in DB");
    } else {
      console.log("role:", u.role);
      console.log("fullname:", u.fullname);
      console.log("email:", u.email);
      console.log("password length:", u.password?.length);
      console.log("password prefix:", u.password?.slice(0, 7));
    }
  } catch (e) {
    console.log("error:", e.message);
  }
  process.exit(0);
}, 4000);
