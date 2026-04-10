import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const apiBase = React.useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const handleContinue = async () => {
    const identifier = phone.trim();
    const safeName = name.trim();
    const safePassword = password;

    if (!safeName || !identifier || !safePassword) {
      window.alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/signup/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to request OTP (${res.status})`);
      }

      const json = await res.json();
      const requestId = json?.request_id;
      if (!requestId) throw new Error("Invalid OTP response");

      if (json?.dev_otp) {
        window.alert(`DEV OTP: ${json.dev_otp}`);
      }

      localStorage.setItem(
        "pending_signup",
        JSON.stringify({ request_id: requestId, name: safeName, identifier, password: safePassword })
      );

      navigate("/otp-verification");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to request OTP");
    }
  };

  return (
    <>
      <Navbar />
      <div
        id="_22_9812__Sign_up"
        className="exported-login-scope flex items-center justify-center bg-white min-h-screen w-full overflow-hidden"
      >
        <div
          id="_22_9813__Container"
          className="min-h-[34.070625rem] h-auto w-[26.25rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 p-5"
        >
          <div
            id="_22_9814__Form_Container"
            className="relative min-h-[34.070625rem] h-auto flex-1 flex flex-col justify-start items-center flex-nowrap gap-8"
          >
            <div
              id="_22_9815__Logo"
              className="relative bg-[rgba(58,186,114,1.00)] h-[2.445625rem] w-[2.5625rem] flex flex-col justify-center items-start flex-nowrap gap-[0.3125rem] p-[0.3125rem] rounded-[0.6439393758773804rem]"
            >
              <div
                id="_22_9816__IMG-20260226-WA0028_"
                className="relative h-[2.426875rem] w-full"
                style={{
                  background:
                    "url(assets/images/img20260226wa0028_2.png) 100% / cover no-repeat",
                }}
              ></div>
            </div>

            <div
              id="_22_9817__Header_Container"
              className="relative h-[29rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem]"
            >
              <div
                id="_22_9818__Title_and_Subtitle_C"
                className="relative h-[3.9375rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-2"
              >
                <span
                  id="_22_9819__Title"
                  className="flex justify-center text-center items-start h-[1.875rem] w-[26.25rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-2xl font-medium"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Sign up
                  </span>
                </span>
                <span
                  id="_22_9820__Subtitle"
                  className="flex justify-center text-center items-start h-[1.5625rem] w-[26.25rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Create an account to start ordering.
                  </span>
                </span>
              </div>

              <div
                id="_22_9821__Form"
                className="relative h-auto w-[26.25rem] flex flex-col justify-start items-center flex-nowrap gap-9"
              >
                <div
                  id="_22_9822__Input_Fields"
                  className="relative flex flex-col justify-start items-start flex-nowrap gap-9"
                >
                  <div
                    id="_22_9823__Name_Input_Container"
                    className="relative h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3"
                  >
                    <div
                      id="_22_9824__Name_Input"
                      className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
                    >
                      <span
                        id="_22_9825__Name_Label"
                        className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                      >
                        <span
                          className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                          style={{
                            fontFamily: "Outfit",
                          }}
                        >
                          Name
                        </span>
                      </span>
                    </div>

                    <div
                      id="_22_9826__Input_fields_button_"
                      className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
                    >
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter Your Name"
                        className="flex justify-start text-left items-start h-[1.4375rem] w-[8.5rem] relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)]"
                        style={{
                          fontFamily: "Outfit",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    id="_22_9827__Phone_Number_Input_C"
                    className="relative h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3"
                  >
                    <div
                      id="_22_9828__Phone_Number_Input"
                      className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
                    >
                      <span
                        id="_22_9829__Phone_Number_or_Emai"
                        className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                      >
                        <span
                          className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                          style={{
                            fontFamily: "Outfit",
                          }}
                        >
                          Phone Number or Email
                        </span>
                      </span>
                    </div>

                    <div
                      id="_22_9830__Input_fields_button_"
                      className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
                    >
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number or email"
                        className="flex justify-start text-left items-start h-[1.4375rem] w-[17rem] relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)]"
                        style={{
                          fontFamily: "Outfit",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    id="_22_9827__Password_Input_C"
                    className="relative h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3"
                  >
                    <div
                      id="_22_9828__Password_Input"
                      className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
                    >
                      <span className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative">
                        <span
                          className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                          style={{ fontFamily: "Outfit" }}
                        >
                          Password
                        </span>
                      </span>
                    </div>

                    <div
                      id="_22_9830__Password_Input_fields_button_"
                      className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
                    >
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="flex justify-start text-left items-start h-[1.4375rem] w-[17rem] relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)]"
                        style={{
                          fontFamily: "Outfit",
                          border: "none",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    id="_22_9831__Primary_secondary_ut"
                    onClick={handleContinue}
                    className="relative bg-[rgba(58,186,114,1.00)] h-6 w-[23.75rem] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span
                      id="I22_9831_22_7190__Order_Now"
                      className="flex justify-start text-left items-start h-[1.5625rem] w-20 relative"
                    >
                      <span
                        className="whitespace-nowrap bg-white bg-clip-text text-transparent not-italic text-xl font-medium"
                        style={{
                          fontFamily: "Outfit",
                        }}
                      >
                        Continue
                      </span>
                    </span>
                  </div>
                </div>

                <div
                  id="_22_9832__Login_Container"
                  className="relative h-[1.5625rem] flex flex-row justify-start items-center flex-nowrap gap-[1.0625rem]"
                >
                  <span
                    id="_22_9833__Already_a_user_Label"
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[8.9375rem] relative"
                  >
                    <span
                      className="whitespace-nowrap bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Already a user ?
                    </span>
                  </span>
                  <span
                    id="_22_9834__Login_Link"
                    onClick={() => navigate("/login")}
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[3.0625rem] relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span
                      className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal underline"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Login
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
