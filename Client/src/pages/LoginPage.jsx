import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const LoginPage = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const apiBase = React.useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const handleLogin = async () => {
    const identifier = phone.trim();
    if (!identifier || !password) {
      window.alert("Please enter phone/email and password");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Login failed (${res.status})`);
      }

      const user = await res.json();
      localStorage.setItem("auth_user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <>
      <Navbar />
      <div
        id="_22_9745__Login"
        className="exported-login-scope flex items-center justify-center bg-white min-h-screen w-full overflow-hidden"
      >
        <div
          id="_22_9746__Container"
          className="min-h-[34.195625rem] h-auto w-[26.25rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 p-5"
        >
          <div
            id="_22_9747__Form_Container"
            className="relative min-h-[34.195625rem] h-auto w-[26.25rem] flex flex-col justify-start items-center flex-nowrap gap-8"
          >
            <div
              id="_22_9748__Logo"
              className="relative bg-[rgba(58,186,114,1.00)] h-[2.445625rem] w-[2.5625rem] flex flex-col justify-center items-start flex-nowrap gap-[0.3125rem] p-[0.3125rem] rounded-[0.6439393758773804rem]"
            >
              <div
                id="_22_9749__IMG-20260226-WA0028_"
                className="relative h-[2.426875rem] w-full"
                style={{
                  background:
                    "url(assets/images/img20260226wa0028_2.png) 100% / cover no-repeat",
                }}
              ></div>
            </div>

            <div
              id="_22_9750__Header_Container"
              className="relative h-auto w-[26.25rem] flex flex-col justify-start items-center flex-nowrap gap-[3.25rem]"
            >
              <div
                id="_22_9751__Title_and_Subtitle_C"
                className="relative h-[3.9375rem] w-[25.0625rem] flex flex-col justify-start items-center flex-nowrap gap-2"
              >
                <span
                  id="_22_9752__Title"
                  className="flex justify-center text-center items-start h-[1.875rem] w-[25.0625rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-2xl font-medium"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Login
                  </span>
                </span>
                <span
                  id="_22_9753__Subtitle"
                  className="flex justify-center text-center items-start h-[1.5625rem] w-[25.0625rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Log in to continue your ordering experience.
                  </span>
                </span>
              </div>

              <div
                id="_22_9754__Form"
                className="relative h-[29.5rem] w-[26.25rem] flex flex-col justify-start items-center flex-nowrap gap-9"
              >
                <div
                  id="_22_9755__Input_Fields"
                  className="relative h-[25.6875rem] w-[26.25rem]"
                >
                  <div
                    id="_22_9756__Name_Input_Container"
                    className="absolute h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3 left-0 top-0"
                  >
                    <div
                      id="_22_9757__Name_Input"
                      className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
                    >
                      <span
                        id="_22_9758__Name_Label"
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
                      id="_22_9759__Input_fields_button_"
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
                    id="_22_9760__Phone_Number_Input_C"
                    className="absolute h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3 left-0 top-[7.5625rem]"
                  >
                    <div
                      id="_22_9761__Phone_Number_Input"
                      className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
                    >
                      <span
                        id="_22_9762__Phone_Number_or_Emai"
                        className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                      >
                        <span
                          className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                          style={{
                            fontFamily: "Outfit",
                          }}
                        >
                          Phone Number or email
                        </span>
                      </span>
                    </div>

                    <div
                      id="_22_9763__Input_fields_button_"
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
                    id="_22_9760__Password_Input_C"
                    className="absolute h-[5.25rem] w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-3 left-0 top-[15.125rem]"
                  >
                    <div
                      id="_22_9761__Password_Input"
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
                      id="_22_9763__Password_Input_fields_button_"
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
                    id="_22_9764__Primary_secondary_ut"
                    onClick={handleLogin}
                    className="absolute bg-[rgba(58,186,114,1.00)] h-6 w-[23.75rem] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl left-0 top-[22.6875rem] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <span
                      id="I22_9764_22_7190__Send_otp"
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
                  id="_22_9765__Login_Container"
                  className="relative h-[1.5625rem] flex flex-row justify-start items-center flex-nowrap gap-[1.0625rem]"
                >
                  <span
                    id="_22_9766__New_User_Label"
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[6.0625rem] relative"
                  >
                    <span
                      className="whitespace-nowrap bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      New user ?
                    </span>
                  </span>
                  <span
                    id="_22_9767__Sign_Up_Link"
                    onClick={() => navigate("/signup")}
                    className="flex justify-start text-left items-start h-[1.5625rem] w-[4.0625rem] relative cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span
                      className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal underline"
                      style={{
                        fontFamily: "Outfit",
                      }}
                    >
                      Sign up
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

export default LoginPage;
