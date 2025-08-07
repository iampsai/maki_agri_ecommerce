import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Button } from '@mui/material';
import { useState } from 'react';
import GoogleImg from '../../assets/images/google.png';
import FacebookIcon from '@mui/icons-material/Facebook';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import { useNavigate } from 'react-router-dom';

import { useContext } from 'react';

import { MyContext } from '../../App';
import { editData, postData } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [isOpenVerifyEmailBox, setIsOpenVerifyEmailBox] = useState(false);
  const [formFields, setFormFields] = useState({
    email: '',
    password: '',
  });

  const context = useContext(MyContext);
  const history = useNavigate();
  const { login, googleSignIn, facebookSignIn, forgotPassword } = useAuth();

  useEffect(() => {
    context.setEnableFilterTab(false);
  }, []);

  const onChangeInput = (e) => {
    setFormFields(() => ({
      ...formFields,
      [e.target.name]: e.target.value
    }))
  }

  const signIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formFields.email === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Email can not be blank!",
        });
        setIsLoading(false);
        return false;
      }

      if (isOpenVerifyEmailBox === false) {
        if (formFields.password === "") {
          context.setAlertBox({
            open: true,
            error: true,
            msg: "Password can not be blank!",
          });
          setIsLoading(false);
          return false;
        }

        const result = await login(formFields.email, formFields.password);
        
        if (!result.error) {
          context.setIsLogin(true);
          context.setUser(result.user);
          
          context.setAlertBox({
            open: true,
            error: false,
            msg: "User Login Successfully!",
          });

          setTimeout(() => {
            setIsLoading(false);
            history("/");
          }, 2000);
        } else {
          if (result.isVerify === false) {
            setIsOpenVerifyEmailBox(true);
          }
          setIsLoading(false);
          context.setAlertBox({
            open: true,
            error: true,
            msg: result.msg,
          });
        }
      }

      if (isOpenVerifyEmailBox === true) {
        localStorage.setItem("userEmail", formFields.email);
        postData("/api/user/verifyAccount/resendOtp", {
          email: formFields.email,
        }).then((res) => {
          if (res?.otp !== null && res?.otp !== "") {
            editData(`/api/user/verifyAccount/emailVerify/${res.existingUserId}`, {
              email: formFields.email,
              otp: res?.otp,
            }).then((res) => {
              setTimeout(() => {
                setIsLoading(true);
                history("/verifyAccount");
              }, 2000);
            });
          }
        });
      }

    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  }

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      
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

  const handleForgotPassword = async () => {
    if (formFields.email === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please enter your email",
      });
    } else {
      context.setAlertBox({
        open: false,
      });
      
      setIsLoading(true);
      const result = await forgotPassword(formFields.email);
      
      if (result.success) {
        localStorage.setItem("userEmail", formFields.email);
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("actionType", 'forgotPassword');
        history("/verifyAccount");
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: result.message || "Failed to process forgot password request",
        });
      }
      setIsLoading(false);
    }
  }

  return (
    <>
      <section className='signIn mb-5'>
        <div className="breadcrumbWrapper">
          <div className="container-fluid">
            <ul className="breadcrumb breadcrumb2 mb-0">
              <li><Link to="/">Home</Link>  </li>
              <li>Sign In</li>
            </ul>
          </div>
        </div>

        <div className='loginWrapper'>
          <div className='card shadow'>
            <Backdrop
              sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={loading}
              className="formLoader"
            >
              <CircularProgress color="inherit" />
            </Backdrop>

            <h3>Sign In</h3>
            <form className='mt-4' onSubmit={signIn}>
              <div className='form-group mb-4 w-100'>
                <TextField id="email" type="email" name='email' label="Email" className='w-100'
                  onChange={onChangeInput} value={formFields.email} />
              </div>

              {
                isOpenVerifyEmailBox === false ?

                  <>
                    <div className='form-group mb-3 w-100'>
                      <div className='position-relative'>
                        <TextField id="password" type={showPassword === false ? 'password' : 'text'} name='password' label="Password" className='w-100'
                          onChange={onChangeInput} value={formFields.password} />
                        <Button className='icon' onClick={() => setShowPassword(!showPassword)}>
                          {
                            showPassword === false ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />
                          }
                        </Button>
                      </div>
                    </div>

                    <div className='d-flex'>
                      <a className="border-effect cursor txt ml-auto" style={{ fontSize: '16px', textDecoration: 'none' }} onClick={handleForgotPassword}>Forgot Password?</a>
                    </div>

                    <div className='form-group mt-3 mb-4 w-100'>
                      <Button type="submit" className='btn btn-g btn-lg w-100' onClick={signIn}>Sign In</Button>
                    </div>

                    <div className='form-group mt-5 mb-4 w-100 signInOr'>
                      <p className='text-center'>OR</p>
                      <Button className='w-100 mb-3' variant="outlined" onClick={signInWithGoogle}>
                        <img src={GoogleImg} alt="Google" />
                        Sign In with Google
                      </Button>
                      {/* <Button className='w-100' variant="outlined" onClick={signInWithFacebook}>
                        <FacebookIcon style={{ marginRight: '8px', backgroundColor: '#4267B2', color: 'white' }} />
                        Sign In with Facebook
                      </Button> */}
                    </div>

                    <p className='text-center'>Not have an account
                      <b> <Link to="/signup">Sign Up</Link>
                      </b>
                    </p>
                  </>
                  :
                  <div className="form-group mt-5 mb-4 w-100">
                    <Button type="submit" className="btn-g col btn-lg btn-big">
                      {loading === true ? <CircularProgress /> : "Verify Email"}
                    </Button>
                  </div>
              }
            </form>
          </div>
        </div>
      </section>
    </>
  )
}

export default SignIn;