import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { USER_API_END_POINT } from "@/utils/constant";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

const AdminLogin = () => {
  const [input, setInput] = useState({ email: "", password: "" });
  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // If already logged in as admin, go straight to panel
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (user?.isAdmin) navigate("/admin/panel");
    }
  }, [user]);

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!input.email || !input.password) {
      return toast.error("Email and password are required");
    }
    try {
      dispatch(setLoading(true));
      const res = await axios.post(
        `${USER_API_END_POINT}/admin/login`,
        input,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        navigate("/admin/panel");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Background grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo / branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6A38C2] shadow-lg shadow-purple-900/50 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <Link to="/">
              <h1 className="text-3xl font-bold text-white hover:opacity-80 transition-opacity">
                Get<span className="text-[#F83002]">Hired</span>
              </h1>
            </Link>
            <p className="text-gray-400 text-sm mt-1">Admin Control Panel</p>
          </div>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Administrator Sign In</h2>
              <p className="text-gray-400 text-sm mt-1">
                Restricted access — authorised personnel only
              </p>
            </div>

            <form onSubmit={submitHandler} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-300">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    name="email"
                    value={input.email}
                    onChange={changeHandler}
                    placeholder="admin@example.com"
                    autoComplete="username"
                    className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    name="password"
                    value={input.password}
                    onChange={changeHandler}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#6A38C2] focus:ring-[#6A38C2]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#6A38C2] hover:bg-[#5b30a6] text-white font-semibold rounded-xl mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-600 mt-6">
              This page is for administrators only. Unauthorised access attempts are logged.
            </p>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Not an admin?{" "}
            <Link to="/login" className="text-[#6A38C2] hover:underline font-medium">
              Go to regular login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
