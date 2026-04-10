import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const Frame1180 = ({ embedded = false, onExplore } = {}) => {
  const navigate = useNavigate();

  const handleExplore = () => {
    if (typeof onExplore === "function") {
      onExplore();
      return;
    }
          {!embedded ? <Navbar /> : null}
    navigate("/");
  };

  const content = (
    <div
      id="_22_9803__Frame_1180"
      className="h-[calc(16.6875rem-0rem-0rem)] w-[calc(22.75rem-0rem-0rem)] flex flex-col justify-start items-center flex-nowrap gap-[2.8125rem]"
    >
      <div
        id="_22_9804__Frame_1179"
        className="relative h-[10.875rem] w-[22.75rem] flex flex-col justify-start items-center flex-nowrap gap-6"
      >
        <div id="_22_9805__checkmark-circle-01" className="relative h-[3.875rem] w-[3.875rem]">
          <img
            id="_22_9806__Vector"
            src="assets/images/vector.svg"
            alt="Vector"
            className="absolute left-[calc(100%_*_0.08)] top-[calc(100%_*_0.08)]"
          />
          <img
            id="_22_9807__Vector"
            src="assets/images/vector_1.svg"
            alt="Vector"
            className="absolute left-[calc(100%_*_0.33)] top-[calc(100%_*_0.33)]"
          />
        </div>

        <div
          id="_22_9808__Frame_1178"
          className="relative h-[5.5rem] w-[22.75rem] flex flex-col justify-start items-center flex-nowrap gap-2"
        >
          <span
            id="_22_9809__Your_Address_is_Save"
            className="flex justify-center text-center items-start h-[1.875rem] w-[22.75rem] relative"
          >
            <span
              className="whitespace-nowrap bg-neutral-700 bg-clip-text text-transparent not-italic text-2xl font-medium"
              style={{
                fontFamily: "Outfit",
              }}
            >
              Your Address is Saved
            </span>
          </span>
          <span
            id="_22_9810__Saved_successfully_f"
            className="flex justify-center text-center items-start h-[3.125rem] w-[22.75rem] relative"
          >
            <span
              className="bg-[rgba(132,132,132,1.00)] bg-clip-text text-transparent not-italic text-xl font-normal"
              style={{
                fontFamily: "Outfit",
              }}
            >
              Saved successfully for a smoother checkout experience.
            </span>
          </span>
        </div>
      </div>

      <div
        id="_22_9811__Primary_secondary_ut"
        onClick={handleExplore}
        className="relative bg-[rgba(58,186,114,1.00)] h-6 w-[20.25rem] flex flex-row justify-center items-center flex-nowrap gap-2.5 px-5 py-3 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
      >
        <span
          id="I22_9811_22_7190__Order_Now"
          className="flex justify-start text-left items-start h-[1.5625rem] w-[9.25rem] relative"
        >
          <span
            className="whitespace-nowrap bg-white bg-clip-text text-transparent not-italic text-xl font-medium"
            style={{
              fontFamily: "Outfit",
            }}
          >
            Explore Flavours
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="exported-login-scope">{content}</div>
      ) : (
        <div className="exported-login-scope flex items-center justify-center bg-white min-h-screen w-full overflow-hidden">
          {content}
        </div>
      )}
    </>
  );
};

export default Frame1180;
