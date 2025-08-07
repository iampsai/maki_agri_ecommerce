import React, { useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Button } from "@mui/material";
import { useState } from "react";
import { editData, postData } from "../../utils/api";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import { useNavigate } from 'react-router-dom';

import { useContext } from "react";

import { MyContext } from '../../App';

const ForgotPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();

  const [formfields, setFormfields] = useState({
    email: localStorage.getItem("userEmail"),
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const onchangeInput = (e) => {
    setFormfields(() => ({
      ...formfields,
      [e.target.name]: e.target.value,
    }));
  };

  const changePass = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formfields.otp) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter the OTP received via email and SMS",
      });
      setIsLoading(false);
      return;
    }

    if (!formfields.newPassword) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter new password",
      });
      setIsLoading(false);
      return;
    }

    if (!formfields.confirmPassword) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please confirm password",
      });
      setIsLoading(false);
      return;
    }

    if (formfields.newPassword !== formfields.confirmPassword) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Password and confirm password do not match",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await postData(`/api/user/forgotPassword/changePassword`, {
        email: formfields.email,
        otp: formfields.otp,
        newPassword: formfields.newPassword
      });

      if (response.success && response.status === "SUCCESS") {
        context.setAlertBox({
          open: true,
          error: false,
          msg: response.message,
        });
        localStorage.removeItem("actionType");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        history("/signIn");
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: response.message || "Failed to change password",
        });
      }
    } catch (error) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "An error occurred while changing password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="signIn mb-5">
        <div className="breadcrumbWrapper">
          <div className="container-fluid">
            <ul className="breadcrumb breadcrumb2 mb-0">
              <li>
                <Link to="/">Home</Link>{" "}
              </li>
              <li>Forgot Password</li>
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

            <h3>Forgot Password</h3>
            <form className="mt-4" onSubmit={changePass}>
              <div className="form-group mb-4 w-100">
                <TextField
                  id="otp-input"
                  label="Enter OTP"
                  type="text"
                  required
                  className="w-100"
                  name="otp"
                  onChange={onchangeInput}
                  disabled={isLoading}
                  placeholder="Enter the OTP received via email and SMS"
                />
              </div>

              <div className="form-group mb-4 w-100 position-relative">
                <TextField
                  id="standard-basic"
                  label="New Password"
                  type={showPassword === false ? "password" : "text"}
                  required
                  className="w-100"
                  name="newPassword"
                  onChange={onchangeInput}
                  disabled={isLoading}
                />
                <Button
                  className="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword === false ? (
                    <VisibilityOffOutlinedIcon />
                  ) : (
                    <VisibilityOutlinedIcon />
                  )}
                </Button>
              </div>

              <div className="form-group mb-4 w-100 position-relative">
                <TextField
                  id="standard-basic"
                  label="Confirm Password"
                  type={showPassword2 === false ? "password" : "text"}
                  required
                  className="w-100"
                  name="confirmPassword"
                  onChange={onchangeInput}
                  disabled={isLoading}
                />
                <Button
                  className="icon"
                  onClick={() => setShowPassword2(!showPassword2)}
                >
                  {showPassword2=== false ? (
                    <VisibilityOffOutlinedIcon />
                  ) : (
                    <VisibilityOutlinedIcon />
                  )}
                </Button>
              </div>

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
          </div>
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;
