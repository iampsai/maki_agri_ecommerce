import React, { useContext, useEffect } from "react";
import { Link } from 'react-router-dom';
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import { MyContext } from '../../App';
import { postData, resendOtp as resendOtpApi } from "../../utils/api";

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

  const verifyOtp = (e) => {
    e.preventDefault();
    setIsLoading(true);
  
    const obj = {
      otp: otp,
      email: localStorage.getItem("userEmail"),
    };

    if (otp !== "") {
      const actionType = localStorage.getItem('actionType');
      postData(`/api/user/verifyemail`, obj).then((res) => {
        console.log(res);
        if (res?.success === true) {
          context.setAlertBox({
            open: true,
            error: false,
            msg: res?.message,
          });
          setIsLoading(false);
          if (actionType !== "forgotPassword") {
            localStorage.removeItem("userEmail");
            history("/signIn");
          } 
          if (actionType === "forgotPassword") {
            history("/forgotPassword");
          }
          
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res?.message,
          });
          setIsLoading(false);
        }
      });
    }
    
  };

  const handleResendOtp = async () => {
    try {
      const data = await resendOtpApi(`/api/user/resendotp`);

      if (data?.success) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: "OTP resent successfully!",
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
