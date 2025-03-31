import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Button } from "@mui/material";
import { useState } from "react";
import GoogleImg from "../../assets/images/google.png";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { postData } from "../../utils/api";
import { useContext } from "react";
import { MyContext } from "../../App";

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";

const googleProvider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setIsLoading]  = useState(false);

  const [formFields, setFormFields] = useState({
    name:'',
    email:'',
    phone:'',
    password:'',
  });

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(()=>{
    context.setEnableFilterTab(false);
  },[])


  const onChangeInput=(e)=>{
    setFormFields(()=>({
       ...formFields,
       [e.target.name]:e.target.value 
    }))
  }

  const signUp = (e)=>{
    e.preventDefault();
  
    try {
      if (formFields.name === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "name can not be blank!",
        });
        return false;
      }

      if (formFields.email === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "email can not be blank!",
        });
        return false;
      }

      if (formFields.phone === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "phone can not be blank!",
        });
        return false;
      }

      if (formFields.password === "") {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "password can not be blank!",
        });
        return false;
      }

      setIsLoading(true);

      postData("/api/user/signup", formFields)
        .then((res) => {
          if (res.status !== 'FAILED') {
          
            localStorage.setItem("userEmail", formFields.email);
           // localStorage.setItem("token", res.token);
       

            setTimeout(() => {
              setIsLoading(true);
              history("/verifyAccount");
              //window.location.href="/signIn";
            }, 2000);
          } else {
            setIsLoading(false);
            context.setAlertBox({
              open: true,
              error: true,
              msg: res.msg,
            });
          }
        })
        .catch((error) => {
          setIsLoading(false);
          console.error("Error posting data:", error);
          // Handle error (e.g., show an error message)
        });
    } catch (error) {
      console.log(error);
    }
  }


  const signInWithGoogle=()=>{
    setIsLoading(true);
    signInWithPopup(auth, googleProvider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;

      const fields={
        name:user.providerData[0].displayName,
        email: user.providerData[0].email,
        password: null,
        images:user.providerData[0].photoURL,
        phone:user.providerData[0].phoneNumber
    }


    postData("/api/user/authWithGoogle", fields).then((res) => {
      try {
        if (res.error !== true) {
          localStorage.setItem("token", res.token);

          const user = {
            name: res.user?.name,
            email: res.user?.email,
            userId: res.user?.id,
          };

          localStorage.setItem("user", JSON.stringify(user));
          setIsLoading(false);
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

  return (
    <>
      <section className="signIn mb-5">
        <div class="breadcrumbWrapper res-hide">
          <div class="container-fluid">
            <ul class="breadcrumb breadcrumb2 mb-0">
              <li>
                <Link to="/">Home</Link>{" "}
              </li>
              <li>SignUp</li>
            </ul>
          </div>
        </div>

        <div className="loginWrapper">
          <div className="card shadow">
            <Backdrop
              sx={{ color: "#000", zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={loading}
              className="formLoader"
            >
              <CircularProgress color="inherit" />
            </Backdrop>

            <h3>SignUp</h3>
            <form className="mt-4" onSubmit={signUp}>
              <div className="form-group mb-4 w-100">
                <TextField
                  id="Full Name"
                  type="text"
                  name="name"
                  label="Full Name"
                  className="w-100"
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group mb-4 w-100">
                <TextField
                  id="email"
                  type="email"
                  name="email"
                  label="Email"
                  className="w-100"
                  onChange={onChangeInput}
                />
              </div>

              <div className="form-group mb-4 w-100">
              <TextField
                id="Phone"
                type="number"
                name="phone"
                label="Phone"
                className="w-100"
                onChange={onChangeInput}
              />
            </div>


              <div className="form-group mb-4 w-100">
                <div className="position-relative">
                  <TextField
                    id="password"
                    type={showPassword === false ? "password" : "text"}
                    name="password"
                    label="Password"
                    className="w-100"
                    onChange={onChangeInput}
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
              </div>

              <div className="form-group mt-5 mb-4 w-100">
                <Button type="submit" className="btn btn-g btn-lg w-100">Sign Up</Button>
              </div>


              <div className='form-group mt-1 mb-4 w-100 signInOr'>
                                <p className='text-center'>OR</p>
                                <Button className='w-100' variant="outlined" onClick={signInWithGoogle}>
                                <img src={GoogleImg} />
                                    Sign In with Google</Button>
                            </div>



              <p className="text-center">
                Already have an account
                <b>
           
                  <Link to="/signIn">Sign In</Link>
                </b>
              </p>

              
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default SignUp;
