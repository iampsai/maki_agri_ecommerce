import { useContext, useEffect, useState } from "react";
import Logo from "../../assets/images/icon.png";
import patern from "../../assets/images/bg.jpg";
import { MyContext } from "../../App";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";

const ForgotPassword = () => {
  const [inputIndex, setInputIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email entry, 2: OTP verification, 3: New password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const history = useNavigate();
  const context = useContext(MyContext);

  const [formfields, setFormfields] = useState({
    email: "",
    otp: "",
    newPass: "",
    confirmPass: "",
  });

  useEffect(() => {
    context.setisHideSidebarAndHeader(true);
  }, [context]);

  const focusInput = (index) => {
    setInputIndex(index);
  };

  const onchangeInput = (e) => {
    setFormfields(() => ({
      ...formfields,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 6 digits
    if (/^\d*$/.test(value) && value.length <= 6) {
      setFormfields({
        ...formfields,
        otp: value,
      });
    }
  };

  const requestPasswordReset = (e) => {
    e.preventDefault();

    if (formfields.email === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Email cannot be blank!",
      });
      return false;
    }

    setIsLoading(true);
    postData("/api/user/forgotPassword", { email: formfields.email }).then((res) => {
      try {
        if (res.status === "SUCCESS") {
          localStorage.setItem("userEmail", formfields.email);
          context.setAlertBox({
            open: true,
            error: false,
            msg: "OTP has been sent to your email",
          });
          setStep(2);
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.msg || "Something went wrong",
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Something went wrong",
        });
        setIsLoading(false);
      }
    });
  };

  const verifyOtp = (e) => {
    e.preventDefault();

    if (formfields.otp === "" || formfields.otp.length !== 6) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter a valid 6-digit OTP",
      });
      return false;
    }

    setIsLoading(true);
    const obj = {
      otp: formfields.otp,
      email: formfields.email || localStorage.getItem("userEmail"),
    };

    postData(`/api/user/verifyemail`, obj).then((res) => {
      try {
        if (res?.success === true) {
          context.setAlertBox({
            open: true,
            error: false,
            msg: res?.message || "OTP verified successfully",
          });
          setStep(3);
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res?.message || "Invalid OTP",
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Something went wrong",
        });
        setIsLoading(false);
      }
    });
  };

  const resetPassword = (e) => {
    e.preventDefault();

    if (formfields.newPass === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter new password",
      });
      return false;
    }

    if (formfields.confirmPass === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please confirm password",
      });
      return false;
    }

    if (formfields.newPass !== formfields.confirmPass) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Password and confirm password do not match",
      });
      return false;
    }

    setIsLoading(true);
    const payload = {
      email: formfields.email || localStorage.getItem("userEmail"),
      newPass: formfields.newPass,
    };

    postData(`/api/user/forgotPassword/changePassword`, payload).then((res) => {
      try {
        if (res.status === "SUCCESS") {
          context.setAlertBox({
            open: true,
            error: false,
            msg: res.message || "Password changed successfully",
          });
          localStorage.removeItem("userEmail");
          setTimeout(() => {
            history("/login");
          }, 2000);
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.msg || "Failed to change password",
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Something went wrong",
        });
        setIsLoading(false);
      }
    });
  };

  const resendOtp = () => {
    setIsLoading(true);
    postData("/api/user/forgotPassword", { email: formfields.email || localStorage.getItem("userEmail") }).then((res) => {
      try {
        if (res.status === "SUCCESS") {
          context.setAlertBox({
            open: true,
            error: false,
            msg: "OTP has been resent to your email",
          });
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.msg || "Failed to resend OTP",
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Something went wrong",
        });
        setIsLoading(false);
      }
    });
  };

  return (
    <>
      <img src={patern} className="loginPatern" alt=""/>
      <section className="loginSection">
        <div className="loginBox">
          <Link to={"/"} className="d-flex align-items-center flex-column logo">
            <img src={Logo} alt=""/>
            <span className="ml-2">Rich Agri Supply</span>
          </Link>
          <div className="wrapper mt-3 card border">
            <h2 className="mb-4">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Reset Password"}
            </h2>

            {step === 1 && (
              <form onSubmit={requestPasswordReset}>
                <div
                  className={`form-group position-relative ${
                    inputIndex === 0 && "focus"
                  }`}
                >
                  <span className="icon">
                    <MdEmail />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    onFocus={() => focusInput(0)}
                    onBlur={() => setInputIndex(null)}
                    autoFocus
                    name="email"
                    value={formfields.email}
                    onChange={onchangeInput}
                  />
                </div>

                <div className="form-group">
                  <Button
                    type="submit"
                    className="btn-blue btn-lg w-100 btn-big"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress /> : "Send OTP"}
                  </Button>
                </div>

                <div className="form-group text-center mb-0">
                  <Link to="/login" className="link">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={verifyOtp}>
                <div
                  className={`form-group position-relative ${
                    inputIndex === 1 && "focus"
                  }`}
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter 6-digit OTP"
                    onFocus={() => focusInput(1)}
                    onBlur={() => setInputIndex(null)}
                    name="otp"
                    value={formfields.otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                  />
                </div>

                <div className="form-group">
                  <Button
                    type="submit"
                    className="btn-blue btn-lg w-100 btn-big"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress /> : "Verify OTP"}
                  </Button>
                </div>

                <div className="form-group text-center mb-0">
                  <Button
                    onClick={resendOtp}
                    className="link"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={resetPassword}>
                <div
                  className={`form-group position-relative ${
                    inputIndex === 2 && "focus"
                  }`}
                >
                  <span className="icon">
                    <RiLockPasswordFill />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="New Password"
                    onFocus={() => focusInput(2)}
                    onBlur={() => setInputIndex(null)}
                    name="newPass"
                    value={formfields.newPass}
                    onChange={onchangeInput}
                  />
                  <span
                    className="toggleShowPassword"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                  </span>
                </div>

                <div
                  className={`form-group position-relative ${
                    inputIndex === 3 && "focus"
                  }`}
                >
                  <span className="icon">
                    <RiLockPasswordFill />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Confirm Password"
                    onFocus={() => focusInput(3)}
                    onBlur={() => setInputIndex(null)}
                    name="confirmPass"
                    value={formfields.confirmPass}
                    onChange={onchangeInput}
                  />
                  <span
                    className="toggleShowPassword"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <IoMdEyeOff /> : <IoMdEye />}
                  </span>
                </div>

                <div className="form-group">
                  <Button
                    type="submit"
                    className="btn-blue btn-lg w-100 btn-big"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress /> : "Reset Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;