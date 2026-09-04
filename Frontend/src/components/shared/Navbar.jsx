import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Avatar, AvatarImage } from "../ui/avatar";
import { LogOut, User2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { logout } from "@/redux/authSlice";
import { toast } from "sonner";
import ThemeSwitcher from "../ThemeSwitcher";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(logout());
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const adminLogoutHandler = async () => {
    try {
      await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
    } catch (_) { }
    dispatch(logout());
    navigate("/admin/login");
    toast.success("Logged out of admin panel");
  };

  return (
    <div>
      <div className="flex items-center justify-between mx-auto max-w-7xl h-16">

        <Link to="/" className="cursor-pointer">
          <h1 className="text-2xl font-bold">
            Get<span className="text-[#F83002]">Hired</span>
          </h1>
        </Link>

        <div className="flex items-center gap-12">
          {/* Nav links — hidden for admin */}
          <ul className="flex font-medium items-center gap-5 dark:text-white">
            {user?.isAdmin ? null
              : user?.role === "recruiter" ? (
                <>
                  <li><Link to="/admin/companies">Companies</Link></li>
                  <li><Link to="/admin/jobs">Jobs</Link></li>
                  <li><Link to="/selected-candidates">Selected Candidates</Link></li>
                </>
              ) : user?.role === "student" ? (
                <>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/jobs">Jobs</Link></li>
                  <li><Link to="/browse">Browse</Link></li>
                </>
              ) : (
                <li><Link to="/">Home</Link></li>
              )}
          </ul>

          <ThemeSwitcher />

          {/* Not logged in */}
          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-[#6A38C2] hover:bg-[#5b30a6]">Signup</Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="ghost" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Button>
              </Link>
            </div>
          )}

          {/* Admin — logout button only, no profile popover */}
          {user?.isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={adminLogoutHandler}
              className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}

          {/* Regular user (student / recruiter) — avatar popover */}
          {user && !user.isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user?.profile?.profilePhoto} alt="profile" />
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex gap-2 space-y-2">
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user?.profile?.profilePhoto} alt="profile" />
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{user?.fullname}</h4>
                    <p className="text-sm text-muted-foreground">{user?.profile?.bio}</p>
                  </div>
                </div>
                <div className="flex flex-col my-2 text-gray-600">
                  {user.role === "student" && (
                    <div className="flex w-fit items-center gap-2 cursor-pointer">
                      <User2 />
                      <Button variant="link">
                        <Link to="/profile">View Profile</Link>
                      </Button>
                    </div>
                  )}
                  <div className="flex w-fit items-center gap-2 cursor-pointer">
                    <LogOut />
                    <Button onClick={logoutHandler} variant="link">Logout</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
