import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Button } from '@mui/material';
import { useState } from 'react';
import GoogleImg from '../../assets/images/google.png';


import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import { useNavigate } from 'react-router-dom';

import { useContext } from 'react';

import { MyContext } from '../../App';
import { editData, postData } from '../../utils/api';

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";

const googleProvider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);



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

  useEffect(() => {
    context.setEnableFilterTab(false);
  }, []);

  const onChangeInput = (e) => {
    setFormFields(() => ({
      ...formFields,
      [e.target.name]: e.target.value
    }))
  }

  const signIn = (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formFields.email === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Email can not be blank!",
        });
        return false;
      }

      if (isOpenVerifyEmailBox === false) {
        if (formFields.password === "") {
          context.setAlertBox({
            open: true,
            error: true,
            msg: "Password can not be blank!",
          });
          return false;
        }

        postData("/api/user/signin", formFields).then((res) => {
          localStorage.removeItem("user");

        
          context.setIsLogin(true);

          const user = {
            userName: res?.user?.name,
            email: res?.user?.email,
            userId: res.user?.id,
            image: res?.user?.images?.length > 0 ? res?.user?.images[0] : "",
            isAdmin: res.user?.isAdmin,
          };

       

          if (res.error !== true) {
            localStorage.setItem("token", res?.token);
            localStorage.setItem("user", JSON.stringify(user));
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
            if (res?.isVerify === false) {
              setIsLoading(true);
              setIsOpenVerifyEmailBox(true);
            }
            setIsLoading(false);
            context.setAlertBox({
              open: true,
              error: true,
              msg: res.msg,
            });
          }


        });
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
                //window.location.href="/signIn";
              }, 2000);
            });
          }
          console.log(res);
        });
      }

    } catch (error) {
      console.log(error);
    }

  }



  const signInWithGoogle = () => {
    setIsLoading(true);
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;

        const fields = {
          name: user.providerData[0].displayName,
          email: user.providerData[0].email,
          password: null,
          images: user.providerData[0].photoURL,
          phone: user.providerData[0].phoneNumber
        }



        postData("/api/user/authWithGoogle", fields).then((res) => {
          try {
            if (res.error !== true) {
              localStorage.setItem("token", res.token);

              const user = {
                name: res.user?.name,
                email: res.user?.email,
                userId: res.user?.id,
                image: res?.user?.images?.length > 0 ? res?.user?.images[0] : ""
              };

              setIsLoading(false);

              localStorage.setItem("user", JSON.stringify(user));

              context.setAlertBox({
                open: true,
                error: false,
                msg: res.msg,
              });

              setTimeout(() => {
                history("/");
                context.setIsLogin(true);
                setIsLoading(false);
              }, 2000);
            } else {
              context.setAlertBox({
                open: true,
                error: true,
                msg: res.msg,
              });
              setIsLoading(false);
            }
          } catch (error) {
            console.log(error);
            setIsLoading(false);
          }
        });



        console.log(user)
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        context.setAlertBox({
          open: true,
          error: true,
          msg: errorMessage,
        });
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }


  const forgotPassword = () => {
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
      localStorage.setItem("userEmail", formFields.email);
      localStorage.setItem("actionType", 'forgotPassword');
      postData("/api/user/forgotPassword", { email: formFields.email }).then((res) => {
        console.log(res)
        if (res.status === "SUCCESS") {
          history("/verifyAccount");
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.msg,
          });
        }
      })
    }
  }

  return (
    <>
      <section className='signIn mb-5'>
        <div class="breadcrumbWrapper">
          <div class="container-fluid">
            <ul class="breadcrumb breadcrumb2 mb-0">
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
                      <a className="border-effect cursor txt ml-auto" style={{ fontSize: '16px', textDecoration: 'none' }} onClick={forgotPassword}>Forgot Password?</a>
                    </div>



                    <div className='form-group mt-3 mb-4 w-100'>
                      <Button type="submit" className='btn btn-g btn-lg w-100' onClick={signIn}>Sign In</Button>
                    </div>


                    <div className='form-group mt-5 mb-4 w-100 signInOr'>
                      <p className='text-center'>OR</p>
                      <Button className='w-100' variant="outlined" onClick={signInWithGoogle}>
                        <img src={GoogleImg} />
                        Sign In with Google</Button>
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