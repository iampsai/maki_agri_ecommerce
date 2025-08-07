import React, { useContext, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Button } from "@mui/material";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import { MyContext } from '../../App';
import { postData } from "../../utils/api";

import OtpBox from "../../components/OtpBox"


const VerifyAccount = () => {

  const [showLoader, setshowLoader] = useState(false);
  const [resendOtpEnabled, setResendOtpEnabled] = useState(false);
  const [userEmail,setUserEmail] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const [otp, setOtp] = useState("");

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
   
    const fetchedToken =localStorage.getItem("token");
    console.log("Fetched Token:", fetchedToken);
    // Enable the resend OTP button after 60 seconds
    setTimeout(() => {
      setResendOtpEnabled(true);
    }, 6000); //

    setUserEmail(localStorage.getItem("userEmail"))

  }, []);

   
  const handleOtpChange = (value) => {
    setOtp(value);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // Validate OTP
      if (!otp || otp.length !== 6) {
        throw new Error("Please enter the 6-digit OTP sent to your email and phone.");
      }

      // Get required data from localStorage
      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem("userEmail");
      const actionType = localStorage.getItem('actionType');

      // Validate required data
      if (!userId || !email) {
        console.error('Missing data:', { userId, email });
        throw new Error("Registration information not found. Please try signing up again.");
      }

      console.log('Sending verification request:', {
        userId,
        email,
        otp: otp.toString()
      });

      // Make verification request
      const res = await postData(`/api/user/verifyAccount/verify/${userId}`, {
        otp: otp.toString(), // Ensure OTP is sent as string
        email: email
      });

      if (res?.success) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: res.message,
        });

        // Clean up localStorage
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        
        // Keep token if it's a password reset flow
        if (actionType !== "forgotPassword") {
          localStorage.removeItem("token");
          setTimeout(() => {
            history("/signIn");
          }, 2000);
        } else {
          history("/forgotPassword");
        }
      } else {
        throw new Error(res?.message || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Failed to verify OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Email not found. Please try signing up again.",
        });
        return;
      }

      const data = await postData(`/api/user/verifyAccount/resendOtp`, { email });

      if (data?.success) {
        // Reset the resend OTP timer
        setResendOtpEnabled(false);
        setTimeout(() => {
          setResendOtpEnabled(true);
        }, 60000); // 60 seconds

        context.setAlertBox({
          open: true,
          error: false,
          msg: data.message || "OTP has been resent to your email and phone.",
        });
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: data?.message || "Error resending OTP",
        });
      }
    } catch (error) {
      console.error(
        "Error in resendOtp:",
        error.response?.data || error.message
      );
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Error resending OTP",
      });
    }
  };

  return (
    <>
      <section className="signIn mb-5">
        <div className="breadcrumbWrapper res-hide">
          <div className="container-fluid">
            <ul className="breadcrumb breadcrumb2 mb-0">
              <li>
                <Link to="/">Home</Link>{" "}
              </li>
              <li>OTP verification</li>
            </ul>
          </div>
        </div>

        <div className="loginWrapper">
          <div className="card shadow">
            <Backdrop
              sx={{ color: "#000", zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={showLoader}
              className="formLoader"
            >
              <CircularProgress color="inherit" />
            </Backdrop>

            <h3 className="text-center">OTP verification</h3>
            <p className="text-center">
              OTP has been sent to {userEmail}
            </p>

          

            <form className="mt-4" onSubmit={verifyOtp}>
            <OtpBox length={6} onChange={handleOtpChange} />

              <div className="form-group mt-5 mb-4 w-100">
                <Button
                  type="submit"
                  className="btn btn-g btn-lg w-100"
                  disabled={isLoading === true ? true : false}
                >
                  {isLoading === true ? <CircularProgress /> : "Submit"}
                </Button>
              </div>
            </form>
            <div>
              <Button
                onClick={handleResendOtp}
                className="btn btn-border btn-lg w-100"
                disabled={!resendOtpEnabled} // Adjusted logic
              >
                Resend OTP
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default VerifyAccount;
