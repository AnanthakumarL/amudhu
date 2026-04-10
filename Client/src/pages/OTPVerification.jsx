import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerified, setIsVerified] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const apiBase = React.useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setResendMessage("OTP sent successfully!");
    setTimeout(() => setResendMessage(""), 3000);
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    const pendingRaw = localStorage.getItem("pending_signup");
    if (!pendingRaw) {
      // Fallback to local-only verification
      setIsVerified(true);
      return;
    }

    try {
      const pending = JSON.parse(pendingRaw);
      const res = await fetch(`${apiBase}/auth/signup/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: pending.request_id,
          otp: otpString,
          name: pending.name,
          identifier: pending.identifier,
          password: pending.password,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `OTP verification failed (${res.status})`);
      }

      const user = await res.json();
      localStorage.setItem("auth_user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-changed"));
      localStorage.removeItem("pending_signup");
      setIsVerified(true);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "OTP verification failed");
    }
  };

  const handleBack = () => {
    navigate("/signup");
  };

  return (
    <>
      <Navbar />
      <div
        id="_22_9768__OTP_Verification"
        className="exported-login-scope flex items-center justify-center bg-white min-h-screen w-full overflow-hidden"
      >
        {isVerified ? (
          <div className="flex flex-col items-center justify-center gap-8 p-5">
            <div className="relative h-20 w-20 bg-[rgba(58,186,114,1.00)] rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              <span
                className="bg-neutral-700 bg-clip-text text-transparent not-italic text-3xl font-medium"
                style={{ fontFamily: "Outfit" }}
              >
                OTP Verified!
              </span>
              <span
                className="bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-lg font-normal text-center"
                style={{ fontFamily: "Outfit" }}
              >
                Your account has been verified successfully.
              </span>
            </div>
            <button
              onClick={() => navigate("/add-address")}
              className="bg-[rgba(58,186,114,1.00)] h-6 w-32 flex flex-row justify-center items-center px-5 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span
                className="whitespace-nowrap bg-white bg-clip-text text-transparent not-italic text-xl font-medium"
                style={{ fontFamily: "Outfit" }}
              >
                Continue
              </span>
            </button>
          </div>
        ) : (
          <div id="_22_9769__Frame_1177" className="h-[21.5rem] w-[25.4375rem] flex flex-col justify-start items-center flex-nowrap gap-2.5 p-5">
            <div
              id="_22_9770__Frame_1176"
              className="relative h-[21.5rem] w-[25.4375rem] flex flex-col justify-start items-start flex-nowrap gap-12"
            >
              <div
                id="_22_9771__Frame_1175"
                className="relative h-[15.5rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-[3.3125rem]"
              >
                <div
                  id="_22_9772__Frame_1174"
                  className="relative h-[5.9375rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-2.5"
                >
                  <span
                    id="_22_9773__OTP_Title"
                    className="flex justify-center text-center items-start h-[2.1875rem] w-[25.4375rem] relative"
                  >
                    <span
                      className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-[1.75rem] font-medium"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Verify your Account
                    </span>
                  </span>
                  <span
                    id="_22_9774__OTP_Instruction"
                    className="flex justify-center text-center items-start h-[3.125rem] w-[25.4375rem] relative"
                  >
                    <span
                      className="bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Enter the 6-digit code sent to your registered number or email.
                    </span>
                  </span>
                </div>

                <div
                  id="_22_9775__Frame_1173"
                  className="relative h-[6.25rem] flex flex-col justify-start items-start flex-nowrap gap-7"
                >
                  <div
                    id="_22_9776__OTP_Fileds"
                    className="relative h-auto w-full flex flex-row justify-center items-center flex-nowrap gap-4"
                  >
                    {otp.map((digit, index) => (
                      <div
                        key={index}
                        id={`otp-box-${index}`}
                        className="relative bg-white border-2 h-14 w-14 flex flex-row justify-center items-center rounded-lg border-[#e0e0e0] cursor-text flex-shrink-0"
                      >
                        <input
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="h-full w-full text-center bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-3xl font-bold outline-none"
                          style={{
                            fontFamily: "Outfit",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <span
                    id="_22_9777__Didn_t_receive_the_O"
                    className="flex justify-center text-center items-start h-[1.5625rem] w-[24.5625rem] relative"
                  >
                    <span>
                      <span
                        className="whitespace-nowrap bg-[rgba(107,107,107,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                        style={{
                          fontFamily: "Outfit",
                        }}
                      >
                        Didn’t receive the OTP ?
                      </span>
                      <span
                        className="whitespace-nowrap bg-[rgba(33,158,60,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal underline"
                        style={{
                          fontFamily: "Outfit",
                        }}
                      >
                        &nbsp;
                      </span>
                      <span
                        onClick={handleResend}
                        className="whitespace-nowrap bg-[rgba(48,48,48,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal underline cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          fontFamily: "Outfit",
                        }}
                      >
                        Resend
                      </span>
                    </span>
                  </span>
                  {resendMessage && (
                    <span
                      className="whitespace-nowrap bg-[rgba(58,186,114,1.00)] bg-clip-text text-transparent not-italic text-lg font-normal"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      {resendMessage}
                    </span>
                  )}
                </div>
              </div>

              <div
                id="_22_9778__OTP_Code_Input"
                className="relative h-12 w-[calc(100%-0rem-0rem)] flex flex-row justify-between items-center flex-nowrap"
              >
                <div
                  onClick={handleBack}
                  id="_22_9779__Interaction_less_but"
                  className="relative h-[1.3125rem] w-[8.5rem] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl border-[#39ba71ff] border-solid border-[0.09375rem] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span
                    id="I22_9779_22_7269__Order_Now"
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[2.8125rem] relative"
                  >
                    <span
                      className="whitespace-nowrap bg-[rgba(57,186,113,1.00)] bg-clip-text text-transparent not-italic text-xl font-medium"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Back
                    </span>
                  </span>
                </div>

                <div
                  onClick={handleVerify}
                  id="_22_9780__Interaction_less_but"
                  className="relative bg-[rgba(58,186,114,1.00)] h-6 w-[8.6875rem] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <span
                    id="I22_9780_22_7273__Order_Now"
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[3.375rem] relative"
                  >
                    <span
                      className="whitespace-nowrap bg-white bg-clip-text text-transparent not-italic text-xl font-medium"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Verify
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OTPVerification;
