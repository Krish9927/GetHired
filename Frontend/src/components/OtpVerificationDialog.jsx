import React, { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import axios from "axios";
import { toast } from "sonner";
import { VERIFICATION_API_END_POINT } from "@/utils/constant";
import { useDispatch } from "react-redux";
import { setVerification } from "@/redux/authSlice";

const OtpVerificationDialog = ({ open, setOpen, onVerified }) => {
    const [otp, setOtp] = useState("");
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const dispatch = useDispatch();

    const handleSendOtp = async () => {
        setSending(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/send-otp`, {}, { withCredentials: true });
            if (res.data.success) {
                setOtpSent(true);
                toast.success("OTP sent to your email");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) return toast.error("Enter a valid 6-digit OTP");
        setVerifying(true);
        try {
            const res = await axios.post(`${VERIFICATION_API_END_POINT}/verify-otp`, { otp }, { withCredentials: true });
            if (res.data.success) {
                toast.success("Email verified successfully!");
                // Refresh verification status
                const statusRes = await axios.get(`${VERIFICATION_API_END_POINT}/status`, { withCredentials: true });
                if (statusRes.data.success) dispatch(setVerification(statusRes.data.verification));
                onVerified?.();
                setOpen(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm">
                <h2 className="text-lg font-semibold">Verify Your Email</h2>
                {!otpSent ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">We'll send a 6-digit OTP to your registered email.</p>
                        <Button onClick={handleSendOtp} disabled={sending} className="w-full">
                            {sending ? "Sending..." : "Send OTP"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">Enter the OTP sent to your email.</p>
                        <div className="space-y-1">
                            <Label>OTP</Label>
                            <Input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                            />
                        </div>
                        <Button onClick={handleVerifyOtp} disabled={verifying} className="w-full">
                            {verifying ? "Verifying..." : "Verify OTP"}
                        </Button>
                        <button
                            onClick={handleSendOtp}
                            disabled={sending}
                            className="text-sm text-blue-500 hover:underline w-full text-center"
                        >
                            {sending ? "Resending..." : "Resend OTP"}
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default OtpVerificationDialog;
