import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "@/redux/authSlice";
import { Loader2, Mail, Lock, User, Phone, Briefcase, GraduationCap, ImagePlus } from "lucide-react";

const Signup = () => {
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    file: "",
  });
  const [preview, setPreview] = useState(null);
  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const changeFileHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("fullname", input.fullname);
    formData.append("email", input.email);
    formData.append("phoneNumber", input.phoneNumber);
    formData.append("password", input.password);
    formData.append("role", input.role);
    if (input.file) formData.append("file", input.file);

    try {
      dispatch(setLoading(true));
      const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (res.data.success) {
        navigate("/login");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (user) navigate("/");
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#6A38C2] to-[#4f28a0] flex-col justify-between p-12 text-white">
        <div>
          <h1 className="text-3xl font-bold">
            Get<span className="text-[#F83002]">Hired</span>
          </h1>
          <p className="text-purple-200 text-sm mt-1">Your career starts here</p>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Join thousands of<br />professionals today
          </h2>
          <p className="text-purple-200 text-lg">
            Create your profile, get verified, and start applying to top companies in minutes.
          </p>
          <div className="space-y-3">
            {[
              "Free to join — no hidden fees",
              "Get a verified candidate badge",
              "AI-powered ATS resume scoring",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-purple-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-purple-300 text-xs">© 2025 GetHired. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold">
              Get<span className="text-[#F83002]">Hired</span>
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={submitHandler} className="space-y-4">
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3">
                {["student", "recruiter"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setInput({ ...input, role })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${input.role === role
                      ? "border-[#6A38C2] bg-[#6A38C2]/10 text-[#6A38C2] dark:text-purple-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    {role === "student" ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>

              {/* Profile photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={changeFileHandler}
                    className="mt-1 text-sm cursor-pointer h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    name="fullname"
                    value={input.fullname}
                    onChange={changeEventHandler}
                    placeholder="John Doe"
                    className="pl-10 h-11 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={input.email}
                    onChange={changeEventHandler}
                    placeholder="you@example.com"
                    className="pl-10 h-11 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={input.phoneNumber}
                    onChange={changeEventHandler}
                    placeholder="9876543210"
                    className="pl-10 h-11 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    name="password"
                    value={input.password}
                    onChange={changeEventHandler}
                    placeholder="••••••••"
                    className="pl-10 h-11 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl mt-2"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-[#6A38C2] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
