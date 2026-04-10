import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame1180 from "./Frame1180.jsx";
import Navbar from "../components/Navbar.jsx";

const AddaddressifNewuser = () => {
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [locality, setLocality] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  const handleSaveAddress = () => {
    if (!address.trim() || !pinCode.trim() || !locality.trim()) return;
    try {
      const deliveryAddress = {
        address: address.trim(),
        pin_code: pinCode.trim(),
        locality: locality.trim(),
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("delivery_address", JSON.stringify(deliveryAddress));
      window.dispatchEvent(new Event("address-changed"));
    } catch {
      // ignore localStorage errors
    }
    setIsSaved(true);
  };

  return (
    <>
      <Navbar />
      <div
        id="_22_9781__Add_address_if_New_u"
        className="exported-login-scope flex items-center justify-center bg-white min-h-screen w-full overflow-hidden"
      >
        {isSaved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Frame1180 embedded onExplore={() => navigate("/")} />
          </div>
        )}
        <div
          id="_22_9782__Address_Form_Contain"
          className="h-[39.75rem] w-[32rem] flex flex-col justify-start items-center flex-nowrap gap-16"
        >
          <div
            id="_22_9783__Header_Container"
            className="relative w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-3"
          >
            <span
              id="_22_9784__Welcome_Text"
              className="flex justify-center text-center items-start h-[1.5625rem] w-[32rem] relative"
            >
              <span
                className="whitespace-nowrap bg-[linear-gradient(90.0deg,rgba(52,168,83,1.00)_0.0%,rgba(201,216,86,1.00)_100.0%)] bg-clip-text text-transparent not-italic text-xl font-normal"
                style={{
                  fontFamily: "Outfit",
                }}
              >
                Welcome, Pongiyannan
              </span>
            </span>
            <div
              id="_22_9785__Account_Status_Conta"
              className="relative h-[5.8125rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-2"
            >
              <span
                id="_22_9786__Account_Status"
                className="flex justify-center text-center items-start h-[2.1875rem] w-[32rem] relative"
              >
                <span
                  className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-[1.75rem] font-medium"
                  style={{
                    fontFamily: "Outfit",
                  }}
                >
                  Your Account is Ready
                </span>
              </span>
              <span
                id="_22_9787__Address_Prompt"
                className="flex justify-center text-center items-start h-[3.125rem] w-[29.125rem] relative"
              >
                <span
                  className="bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
                  style={{
                    fontFamily: "Outfit",
                  }}
                >
                  Please add your delivery address to ensure a smooth and timely delivery experience.
                </span>
              </span>
            </div>
          </div>

          <div
            id="_22_9788__Address_Form"
            className="relative w-[26.25rem] flex flex-col justify-start items-start flex-nowrap gap-9"
          >
            <div
              id="_22_9789__Address_Input_Contai"
              className="relative h-[5.25rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-start flex-nowrap gap-3"
            >
              <div
                id="_22_9790__Address_Input"
                className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
              >
                <span
                  id="_22_9791__Address_Label"
                  className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Address
                  </span>
                </span>
              </div>

              <div
                id="_22_9792__Input_fields_button_"
                className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
              >
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Add your Address"
                  className="flex justify-start text-left items-start h-[1.4375rem] w-full relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)] outline-none"
                  style={{
                    fontFamily: "Outfit",
                  }}
                />
              </div>
            </div>

            <div
              id="_22_9793__Pin_Code_Input_Conta"
              className="relative h-[5.25rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-start flex-nowrap gap-3"
            >
              <div
                id="_22_9794__Pin_Code_Input"
                className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
              >
                <span
                  id="_22_9795__Pin_Code_Label"
                  className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Pin code
                  </span>
                </span>
              </div>

              <div
                id="_22_9796__Input_fields_button_"
                className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
              >
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Add your Pin code"
                  className="flex justify-start text-left items-start h-[1.4375rem] w-full relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)] outline-none"
                  style={{
                    fontFamily: "Outfit",
                  }}
                />
              </div>
            </div>

            <div
              id="_22_9797__Locality_Input_Conta"
              className="relative h-[5.25rem] w-[calc(100%-0rem-0rem)] flex flex-col justify-start items-start flex-nowrap gap-3"
            >
              <div
                id="_22_9798__Locality_Input"
                className="relative h-[1.5625rem] w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-0"
              >
                <span
                  id="_22_9799__Locality_Label"
                  className="flex justify-start text-left items-start h-[1.5625rem] w-[23.75rem] relative"
                >
                  <span
                    className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-xl font-normal"
                    style={{
                      fontFamily: "Outfit",
                    }}
                  >
                    Locality/Town
                  </span>
                </span>
              </div>

              <div
                id="_22_9800__Input_fields_button_"
                className="relative bg-[rgba(252,252,252,1.00)] border h-[1.3125rem] w-[23.625rem] flex flex-row justify-start items-center flex-nowrap gap-2.5 px-5 py-3 rounded-xl border-[#cfcfcfff] border-solid"
              >
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Add your Locality/Town"
                  className="flex justify-start text-left items-start h-[1.4375rem] w-full relative bg-transparent text-[rgba(137,137,137,1.00)] not-italic text-lg font-normal placeholder-[rgba(137,137,137,1.00)] outline-none"
                  style={{
                    fontFamily: "Outfit",
                  }}
                />
              </div>
            </div>

            <div
              id="_22_9801__Primary_secondary_ut"
              onClick={handleSaveAddress}
              className="relative bg-[rgba(58,186,114,1.00)] h-6 w-[calc(100%-1.25rem-1.25rem)] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span
                id="I22_9801_22_7190__Order_Now"
                className="flex justify-start text-left items-start h-[1.5625rem] w-[7.0625rem] relative"
              >
                <span
                  className="whitespace-nowrap bg-white bg-clip-text text-transparent not-italic text-xl font-medium"
                  style={{
                    fontFamily: "Outfit",
                  }}
                >
                  Save Address
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddaddressifNewuser;
