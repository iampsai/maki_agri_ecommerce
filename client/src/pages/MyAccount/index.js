import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { IoMdCloudUpload } from "react-icons/io";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import {
  deleteData,
  deleteImages,
  editData,
  fetchDataFromApi,
  postData,
  uploadImage,
} from "../../utils/api";

import { MyContext } from "../../App";

import NoUserImg from "../../assets/images/no-user.jpg";
import CircularProgress from "@mui/material/CircularProgress";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const MyAccount = () => {
  const [isLogin, setIsLogin] = useState(false);

  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const history = useNavigate();

  const context = useContext(MyContext);

  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [previews, setPreviews] = useState([]);
  const [userData, setUserData] = useState(null);

  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    phone: "",
    images: [],
    isAdmin: false,
    password: "",
  });

  const [billingAddress, setBillingAddress] = useState({
    fullName: "",
    country: "",
    streetAddressLine1: "",
    streetAddressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const loadBillingAddress = async (userId) => {
    try {
      const response = await fetchDataFromApi(`/api/user/billing-address/${userId}`);
      if (response) {
        setBillingAddress(response);
      }
    } catch (error) {
      console.log("No billing address found");
    }
  };

  const saveBillingAddress = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.userId) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please login to save billing address",
      });
      return;
    }

    setIsLoading(true);
    try {
      await postData(`/api/user/billing-address/${user.userId}`, billingAddress);
      // Reload the billing address data after successful save
      await loadBillingAddress(user.userId);
      context.setAlertBox({
        open: true,
        error: false,
        msg: "Billing address saved successfully",
      });
    } catch (error) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Error saving billing address",
      });
    }
    setIsLoading(false);
  };

  const [fields, setFields] = useState({
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    context.setEnableFilterTab(false);
    
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);
      if (user?.userId) {
        loadBillingAddress(user.userId);
      }
    } else {
      history("/signIn");
    }

    deleteData("/api/imageUpload/deleteAllImages");
    
    // Fetch user data
    fetchDataFromApi(`/api/user/${user?.userId}`).then((res) => {
      setUserData(res);
      setPreviews(Array.isArray(res.images) ? res.images : []);

      setFormFields({
        name: res.name,
        email: res.email,
        phone: res.phone,
      });
    });
  }, [context, history]);

  const changeInput = (e) => {
    setFormFields(() => ({
      ...formFields,
      [e.target.name]: e.target.value,
    }));
  };

  const changeInput2 = (e) => {
    setFields(() => ({
      ...fields,
      [e.target.name]: e.target.value,
    }));
  };

  const onChangeFile = async (e, apiEndPoint) => {
    try {
      setPreviews([]);
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }

      setUploading(true);
      const formData = new FormData();
      const validImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file &&
          (file.type === "image/jpeg" ||
            file.type === "image/jpg" ||
            file.type === "image/png" ||
            file.type === "image/webp")
        ) {
          formData.append('images', file);
          validImages.push(file);
        } else {
          setUploading(false);
          context.setAlertBox({
            open: true,
            error: true,
            msg: "Please select a valid JPG or PNG image file.",
          });
          return;
        }
      }

      if (validImages.length === 0) {
        setUploading(false);
        return;
      }

      try {
        // Upload images first
        const uploadResponse = await uploadImage(apiEndPoint, formData);
        
        if (!uploadResponse || !uploadResponse.success) {
          throw new Error(uploadResponse?.message || "Failed to upload images");
        }

        // If the upload response directly contains the image URLs
        let imageUrls = [];
        if (uploadResponse.images && Array.isArray(uploadResponse.images)) {
          imageUrls = uploadResponse.images;
        } else {
          // Fallback to fetching images from the server
          const imageUploadResponse = await fetchDataFromApi("/api/imageUpload");
          if (!imageUploadResponse || !Array.isArray(imageUploadResponse)) {
            throw new Error("Invalid image upload response");
          }

          // Process image URLs
          imageUploadResponse.forEach(item => {
            if (item?.images && Array.isArray(item.images)) {
              imageUrls.push(...item.images);
            }
          });
        }

        // Get unique image URLs
        const uniqueImageUrls = [...new Set(imageUrls)];
        
        if (uniqueImageUrls.length === 0) {
          throw new Error("No images were uploaded");
        }

        // Update previews
        setPreviews(uniqueImageUrls);

        // Update user profile with new images
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.userId) {
          throw new Error("User not found");
        }

        const userData = await fetchDataFromApi(`/api/user/${user.userId}`);
        if (!userData) {
          throw new Error("Failed to fetch user data");
        }

        const updatedData = {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          images: uniqueImageUrls,
          isAdmin: userData.isAdmin
        };

        await editData(`/api/user/${user.userId}`, updatedData);

        setUploading(false);
        context.setAlertBox({
          open: true,
          error: false,
          msg: "Images Uploaded Successfully!",
        });

      } catch (error) {
        console.error("Upload error:", error);
        setUploading(false);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Failed to upload images. Please try again.",
        });
      }

    } catch (error) {
      console.error("File processing error:", error);
      setUploading(false);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Error processing files. Please try again.",
      });
    }

    // Old upload code removed as it's replaced by the async implementation above
  };

  const edituser = async (e) => {
    e.preventDefault();

    if (formFields.name === "" || formFields.email === "" || formFields.phone === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill all the required details",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.userId) {
        throw new Error("User not found");
      }

      const updatedData = {
        name: formFields.name,
        email: formFields.email,
        phone: formFields.phone,
        images: previews,
        isAdmin: formFields.isAdmin
      };

      await editData(`/api/user/${user.userId}`, updatedData);
      await deleteData("/api/imageUpload/deleteAllImages");

      setIsLoading(false);
      context.setAlertBox({
        open: true,
        error: false,
        msg: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      setIsLoading(false);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Failed to update profile. Please try again.",
      });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (
      fields.oldPassword !== "" &&
      fields.password !== "" &&
      fields.confirmPassword !== ""
    ) {
      if (fields.password !== fields.confirmPassword) {
        context.setAlertBox({
          open: true,
          error: true,
          msg: "Password and confirm password not match",
        });
      } else {
        const user = JSON.parse(localStorage.getItem("user"));

        const data = {
          name: user?.name,
          email: user?.email,
          password: fields.oldPassword,
          newPass: fields.password,
          phone: formFields.phone,
          images: formFields.images,
        };

        editData(`/api/user/changePassword/${user.userId}`, data).then(
          (res) => {
          
          }
        );
      }
    } else {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill all the details",
      });
      return false;
    }
  };

  return (
    <section className="section myAccountPage">
      <div className="container">
        <h2 className="hd">My Account</h2>

        <Box sx={{ width: "100%" }} className="myAccBox card border-0">
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="Edit Profile" {...a11yProps(0)} />
              <Tab label="Change Password" {...a11yProps(1)} />
              <Tab label="Billing Address" {...a11yProps(2)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <form onSubmit={edituser}>
              <div className="row">
                <div className="col-md-4">
                  <div className="userImage d-flex align-items-center justify-content-center">
                    {uploading === true ? (
                      <CircularProgress />
                    ) : (
                      <>
                        {Array.isArray(previews) && previews.length > 0 ? (
                          previews.map((img, index) => {
                            return <img src={img} alt="User" key={index} />;
                          })
                        ) : (
                          <img src={NoUserImg} alt="Default User" />
                        )}
                        <div className="overlay d-flex align-items-center justify-content-center">
                          <IoMdCloudUpload />
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              onChangeFile(e, "/api/user/upload")
                            }
                            name="images"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Name"
                          variant="outlined"
                          className="w-100"
                          name="name"
                          onChange={changeInput}
                          value={formFields.name}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Email"
                          disabled
                          variant="outlined"
                          className="w-100"
                          name="email"
                          onChange={changeInput}
                          value={formFields.email}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Phone"
                          variant="outlined"
                          className="w-100"
                          name="phone"
                          onChange={changeInput}
                          value={formFields.phone}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <Button
                      type="submit"
                      className="btn-g btn-lg btn-big"
                    >
                      {isLoading === true ? <CircularProgress /> : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <form onSubmit={changePassword}>
              <div className="row">
                <div className="col-md-12">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <TextField
                          label="Old Password"
                          variant="outlined"
                          className="w-100"
                          name="oldPassword"
                          onChange={changeInput2}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <TextField
                          label="New password"
                          variant="outlined"
                          className="w-100"
                          name="password"
                          onChange={changeInput2}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <TextField
                          label="Confirm Password"
                          variant="outlined"
                          className="w-100"
                          name="confirmPassword"
                          onChange={changeInput2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <Button
                      type="submit"
                      className="btn-g btn-lg btn-big"
                    >
                      
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <form>
              <div className="row">
                <div className="col-md-12">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Full Name"
                          variant="outlined"
                          className="w-100"
                          name="fullName"
                          value={billingAddress.fullName}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              fullName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Country"
                          variant="outlined"
                          className="w-100"
                          name="country"
                          value={billingAddress.country}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              country: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Street Address Line 1"
                          variant="outlined"
                          className="w-100"
                          name="streetAddressLine1"
                          value={billingAddress.streetAddressLine1}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              streetAddressLine1: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Street Address Line 2"
                          variant="outlined"
                          className="w-100"
                          name="streetAddressLine2"
                          value={billingAddress.streetAddressLine2}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              streetAddressLine2: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="City"
                          variant="outlined"
                          className="w-100"
                          name="city"
                          value={billingAddress.city}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="State"
                          variant="outlined"
                          className="w-100"
                          name="state"
                          value={billingAddress.state}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              state: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="ZIP Code"
                          variant="outlined"
                          className="w-100"
                          name="zipCode"
                          value={billingAddress.zipCode}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              zipCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    {/* <div className="col-md-6">
                      <div className="form-group">
                        <TextField
                          label="Phone Number"
                          variant="outlined"
                          className="w-100"
                          name="phoneNumber"
                          value={billingAddress.phoneNumber}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              phoneNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div> */}
                  </div>

                  <div className="form-group">
                    <Button
                      type="button"
                      className="btn-g btn-lg btn-big"
                      onClick={saveBillingAddress}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress /> : "Save Billing Address"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CustomTabPanel>
        </Box>
      </div>
    </section>
  );
};

export default MyAccount;