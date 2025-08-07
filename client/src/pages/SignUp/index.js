import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Button } from "@mui/material";
import { useState } from "react";
import GoogleImg from "../../assets/images/google.png";
import FacebookIcon from '@mui/icons-material/Facebook';

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { postData } from "../../utils/api";
import { useContext } from "react";
import { MyContext } from "../../App";
import { useAuth } from "../../contexts/AuthContext";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [formFields, setFormFields] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const context = useContext(MyContext);
  const history = useNavigate();
  const { googleSignIn, facebookSignIn } = useAuth();

  useEffect(() => {
    context.setEnableFilterTab(false);
  }, [])

  const onChangeInput = (e) => {
    setFormFields(() => ({
      ...formFields,
      [e.target.name]: e.target.value
    }))
  }

  const signUp = async (e) => {
    e.preventDefault();

    try {
      if (formFields.name === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Name can not be blank!",
        });
        return false;
      }

      if (formFields.email === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Email can not be blank!",
        });
        return false;
      }

      if (formFields.phone === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Phone can not be blank!",
        });
        return false;
      }

      if (formFields.password === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Password can not be blank!",
        });
        return false;
      }

      setIsLoading(true);

      // Format phone number for Philippines format if needed
      let formattedPhone = formFields.phone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.replace('0', '63');
      }

      // Register with backend first to get OTP
      const backendResult = await postData("/api/user/signup", {
        name: formFields.name,
        email: formFields.email,
        phone: formattedPhone,
        password: formFields.password
      });

      if (backendResult.success) {
        // Save user details for verification
        localStorage.setItem("userEmail", formFields.email);
        localStorage.setItem("userId", backendResult.userId);
        localStorage.setItem("token", backendResult.token);
        
        context.setAlertBox({
          open: true,
          error: false,
          msg: backendResult.message || "Account created! Please verify with the OTP sent to your email and phone.",
        });

        setTimeout(() => {
          history("/verifyAccount");
        }, 2000);
      } else {
        setIsLoading(false);
        context.setAlertBox({
          open: true,
          error: true,
          msg: backendResult.message || "Failed to create account",
        });
      }
    } catch (error) {
      setIsLoading(false);
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "An error occurred during signup",
      });
    }
  }

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      
      if (!result.error) {
        // After successful Google sign in, register or login with backend
        const backendResult = await postData("/api/user/authWithGoogle", {
          name: result.user.displayName,
          email: result.user.email,
          // If you need to collect phone number for Google users, you'll need to add an extra step
          phone: "",  // You might want to prompt user for phone number
          images: result.user.photoURL ? [result.user.photoURL] : [],
        });

        if (backendResult.success || backendResult.user) {
          context.setIsLogin(true);
          context.setUser(backendResult.user);
          
          context.setAlertBox({
            open: true,
            error: false,
            msg: backendResult.msg || "Signed in with Google successfully!",
          });

          // Set auth token from backend
          if (backendResult.token) {
            localStorage.setItem('token', backendResult.token);
          }

          setTimeout(() => {
            history("/");
          }, 2000);
        } else {
          throw new Error(backendResult.message || "Failed to register with backend");
        }
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: result.msg || "Google sign in failed",
        });
      }
    } catch (error) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Failed to sign in with Google",
      });
      setIsLoading(false);
    }
  }

  const signInWithFacebook = async () => {
    setIsLoading(true);
    try {
      const result = await facebookSignIn();
      
      if (!result.error) {
        context.setIsLogin(true);
        context.setUser(result.user);
        
        context.setAlertBox({
          open: true,
          error: false,
          msg: result.msg || "User Login Successfully!",
        });

        setTimeout(() => {
          history("/");
          setIsLoading(false);
        }, 2000);
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: result.msg,
        });
        setIsLoading(false);
      }
    } catch (error) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: error.message || "Failed to sign in with Facebook",
      });
      setIsLoading(false);
    }
  }

  return (
    <>
      <section className="signIn mb-5">
        <div className="breadcrumbWrapper">
          <div className="container-fluid">
            <ul className="breadcrumb breadcrumb2 mb-0">
              <li><Link to="/">Home</Link>  </li>
              <li>Sign Up</li>
            </ul>
          </div>
        </div>

        <div className="loginWrapper">
          <div className="card shadow">
            <Backdrop
              sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={loading}
              className="formLoader"
            >
              <CircularProgress color="inherit" />
            </Backdrop>

            <h3>Sign Up</h3>
            <form className="mt-4" onSubmit={signUp}>
              <div className="form-group mb-4 w-100">
                <TextField id="name" type="text" name="name" label="Name" className="w-100"
                  onChange={onChangeInput} value={formFields.name} />
              </div>

              <div className="form-group mb-4 w-100">
                <TextField id="email" type="email" name="email" label="Email" className="w-100"
                  onChange={onChangeInput} value={formFields.email} />
              </div>

              <div className="form-group mb-4 w-100">
                <TextField id="phone" type="text" name="phone" label="Phone" className="w-100"
                  onChange={onChangeInput} value={formFields.phone} />
              </div>

              <div className="form-group mb-3 w-100">
                <div className="position-relative">
                  <TextField id="password" type={showPassword === false ? 'password' : 'text'} name="password" label="Password" className="w-100"
                    onChange={onChangeInput} value={formFields.password} />
                  <Button className="icon" onClick={() => setShowPassword(!showPassword)}>
                    {
                      showPassword === false ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />
                    }
                  </Button>
                </div>
              </div>

              <div className="form-group mt-3 mb-4 w-100">
                <Button type="submit" className="btn btn-g btn-lg w-100" onClick={signUp}>Sign Up</Button>
              </div>

              <div className="form-group mt-5 mb-4 w-100 signInOr">
                <p className="text-center">OR</p>
                <Button className="w-100 mb-3" variant="outlined" onClick={signInWithGoogle}>
                  <img src={GoogleImg} alt="Google" />
                  Sign Up with Google
                </Button>
                {/* <Button className="w-100" variant="outlined" onClick={signInWithFacebook} style={{ backgroundColor: '#4267B2', color: 'white' }}>
                  <FacebookIcon style={{ marginRight: '8px' }} />
                  Sign Up with Facebook
                </Button> */}
              </div>

              <p className="text-center">Already have an account
                <b> <Link to="/signIn">Sign In</Link>
                </b>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default SignUp;
