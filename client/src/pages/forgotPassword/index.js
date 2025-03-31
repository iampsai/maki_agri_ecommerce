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
    newPass: "",
    confirmPass: "",
  });

  const onchangeInput = (e) => {
    setFormfields(() => ({
      ...formfields,
      [e.target.name]: e.target.value,
    }));
  };

  const changePass = (e) => {
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
        msg: "Password and confirm password not match",
      });
      return false;
    }

    postData(`/api/user/forgotPassword/changePassword`, formfields).then(
      (res) => {
        if (res.status === "SUCCESS") {
          context.setAlertBox({
            open: true,
            error: false,
            msg: res.message,
          });
          localStorage.removeItem("actionType")
          history("/signIn");
        }
      }
    );
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
              <div className="form-group mb-4 w-100 position-relative">
                <TextField
                  id="standard-basic"
                  label="New Password"
                  type={showPassword === false ? "password" : "text"}
                  required
                  className="w-100"
                  name="newPass"
                  onChange={onchangeInput}
                  disabled={isLoading === true ? true : false}
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
                  name="confirmPass"
                  onChange={onchangeInput}
                  disabled={isLoading === true ? true : false}
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
