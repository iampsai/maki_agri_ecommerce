import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";

import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi, postData, deleteData } from "../../utils/api";

const Checkout = () => {
  const [formFields, setFormFields] = useState({
    fullName: "",
    country: "",
    streetAddressLine1: "",
    streetAddressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    email: "",
  });
  const [cartData, setCartData] = useState([]);
  const [totalAmount, setTotalAmount] = useState();

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.userId) {
      history("/signIn");
      return;
    }
    
    // Load cart data
    fetchDataFromApi(`/api/cart?userId=${user.userId}`).then((res) => {
      setCartData(res);

      setTotalAmount(
        res.length !== 0 &&
          res
            .map((item) => parseInt(item.price) * item.quantity)
            .reduce((total, value) => total + value, 0)
      );
    });

    // Load user data including billing address
    fetchDataFromApi(`/api/user/${user.userId}`).then((res) => {
      if (res) {
        // Set billing address if it exists
        if (res.billingAddress) {
          setFormFields({
            fullName: res.billingAddress.fullName || res.name || '',
            country: res.billingAddress.country || '',
            streetAddressLine1: res.billingAddress.streetAddressLine1 || '',
            streetAddressLine2: res.billingAddress.streetAddressLine2 || '',
            city: res.billingAddress.city || '',
            state: res.billingAddress.state || '',
            zipCode: res.billingAddress.zipCode || '',
            phoneNumber: res.billingAddress.phoneNumber || '',
            email: res.email || ''
          });
        } else {
          // If no billing address, at least fill in name, phone and email from user profile
          setFormFields(prev => ({
            ...prev,
            fullName: res.name || '',
            phoneNumber: res.phone || '',
            email: res.email || ''
          }));
        }
      }
    }).catch(error => {
      console.error('Error loading user data:', error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Error loading billing information"
      });
    });

    context.setEnableFilterTab(false);
  }, [context, history]);

  const onChangeInput = (e) => {
    setFormFields(() => ({
      ...formFields,
      [e.target.name]: e.target.value,
    }));
  };

  const payNow = (e) => {
    e.preventDefault();

     if (formFields.fullName === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill full name ",
      });
      return false;
    }

    if (formFields.country === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill country ",
      });
      return false;
    }

    if (formFields.streetAddressLine1 === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill Street address",
      });
      return false;
    }

    if (formFields.streetAddressLine2 === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill  Street address",
      });
      return false;
    }

    if (formFields.city === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill city ",
      });
      return false;
    }

    if (formFields.state === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill state ",
      });
      return false;
    }

    if (formFields.zipCode === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill zipCode ",
      });
      return false;
    }

    if (formFields.phoneNumber === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill phone Number ",
      });
      return false;
    }

    if (formFields.email === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please fill email",
      });
      return false;
    }

    const addressInfo = {
      name: formFields.fullName,
      phoneNumber: formFields.phoneNumber,
      address: formFields.streetAddressLine1 + formFields.streetAddressLine2,
      pincode: formFields.zipCode,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    // Development mode - bypass payment gateway
    // Generate a fake payment ID for development
    const fakePaymentId = "dev_" + Math.random().toString(36).substring(2, 15);
    
    const user = JSON.parse(localStorage.getItem("user"));
    
    const payLoad = {
      name: addressInfo.name,
      phoneNumber: formFields.phoneNumber,
      address: addressInfo.address,
      pincode: addressInfo.pincode,
      amount: parseInt(totalAmount),
      paymentId: fakePaymentId,
      email: user.email,
      userid: user.userId,
      products: cartData,
      date: addressInfo?.date
    };
    
    console.log("Development mode - bypassing payment gateway");
    console.log(payLoad);
    
    // Show loading indicator
    context.setAlertBox({
      open: true,
      error: false,
      msg: "Processing your order...",
    });
    
    postData(`/api/orders/create`, payLoad)
      .then((res) => {
        fetchDataFromApi(`/api/cart?userId=${user?.userId}`)
          .then((res) => {
            if (res && Array.isArray(res) && res.length !== 0) {
              // Process each cart item
              const deletePromises = res.map((item) => {
                if (item && item.id) {
                  return deleteData(`/api/cart/${item.id}`).catch(err => {
                    console.error("Error deleting cart item:", err);
                    return null;
                  });
                }
                return Promise.resolve(null);
              });
              
              // Wait for all delete operations to complete
              Promise.all(deletePromises)
                .then(() => {
                  // Show success message
                  context.setAlertBox({
                    open: true,
                    error: false,
                    msg: "Order placed successfully!",
                  });
                  
                  // Update cart data and redirect
                  setTimeout(() => {
                    context.getCartData();
                    history("/orders");
                  }, 1000);
                })
                .catch(err => {
                  console.error("Error processing cart items:", err);
                  // Still show success and redirect
                  context.setAlertBox({
                    open: true,
                    error: false,
                    msg: "Order placed successfully!",
                  });
                  setTimeout(() => {
                    context.getCartData();
                    history("/orders");
                  }, 1000);
                });
            } else {
              // Handle empty cart case
              context.setAlertBox({
                open: true,
                error: false,
                msg: "Order placed successfully!",
              });
              setTimeout(() => {
                context.getCartData();
                history("/orders");
              }, 1000);
            }
          })
          .catch(err => {
            console.error("Error fetching cart data:", err);
            // Still show success and redirect
            context.setAlertBox({
              open: true,
              error: false,
              msg: "Order placed successfully!",
            });
            setTimeout(() => {
              history("/orders");
            }, 1000);
          });
      })
      .catch(err => {
        console.error("Error creating order:", err);
        context.setAlertBox({
          open: true,
          error: true,
          msg: "There was a problem processing your order. Please try again.",
        });
      });
      
    // Razorpay integration code - commented out for development
    /*
    var options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: parseInt(totalAmount * 100),
      currency: "INR",
      order_receipt: "order_rcptid_" + formFields.fullName,
      name: "E-Bharat",
      description: "for testing purpose",
      handler: function (response) {
        console.log(response);

        const paymentId = response.razorpay_payment_id;

        const user = JSON.parse(localStorage.getItem("user"));

        const payLoad = {
          name: addressInfo.name,
          phoneNumber: formFields.phoneNumber,
          address: addressInfo.address,
          pincode: addressInfo.pincode,
          amount: parseInt(totalAmount),
          paymentId: paymentId,
          email: user.email,
          userid: user.userId,
          products: cartData,
          date:addressInfo?.date
        };

        console.log(payLoad);
          
        postData(`/api/orders/create`, payLoad).then((res) => {
          fetchDataFromApi(`/api/cart?userId=${user?.userId}`).then((res) => {
            if (res && Array.isArray(res) && res.length !== 0) {
              res.forEach((item) => {
                if (item && item.id) {
                  deleteData(`/api/cart/${item.id}`).then(() => {
                    // Success handling if needed
                  }).catch(err => {
                    console.error("Error deleting cart item:", err);
                  });
                }
              });
              
              setTimeout(() => {
                context.getCartData();
              }, 1000);
              history("/orders");
            } else {
              // Handle empty cart case
              context.getCartData();
              history("/orders");
            }
          }).catch(err => {
            console.error("Error fetching cart data:", err);
            // Still navigate to orders even if there's an error
            history("/orders");
          });
        }).catch(err => {
          console.error("Error creating order:", err);
          context.setAlertBox({
            open: true,
            error: true,
            msg: "There was a problem processing your order. Please try again.",
          });
        });
      },

      theme: {
        color: "#3399cc",
      },
    };

    var pay = new window.Razorpay(options);
    pay.open();
    */
  };

  return (
    <section className="section pt-5 pb-4">
      <div className="container">
        <form className="checkoutForm" onSubmit={payNow}>
          <div className="row">
            <div className="col-md-8">
              <h2 className="hd">BILLING DETAILS</h2>

              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <TextField
                      label="Full Name *"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="fullName"
                      value={formFields.fullName}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <TextField
                      label="Country *"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="country"
                      value={formFields.country}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>

              <h6>Street address *</h6>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <TextField
                      label="House number and street name"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="streetAddressLine1"
                      value={formFields.streetAddressLine1}
                      onChange={onChangeInput}
                    />
                  </div>

                  <div className="form-group">
                    <TextField
                      label="Apartment, suite, unit, etc. (optional)"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="streetAddressLine2"
                      value={formFields.streetAddressLine2}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>

              <h6>Town / City *</h6>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <TextField
                      label="City"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="city"
                      value={formFields.city}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>

              <h6>State / County *</h6>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <TextField
                      label="State"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="state"
                      value={formFields.state}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>

              <h6>Postcode / ZIP *</h6>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <TextField
                      label="ZIP Code"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="zipCode"
                      value={formFields.zipCode}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      type="number"
                      name="phoneNumber"
                      value={formFields.phoneNumber}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group">
                    <TextField
                      label="Email Address"
                      type="email"
                      variant="outlined"
                      className="w-100"
                      size="small"
                      name="email"
                      value={formFields.email}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4 cartRightBox ">
              <div className="card orderInfo">
                <h4 className="hd">YOUR ORDER</h4>
                <div className="table-responsive mt-3">
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cartData?.length !== 0 &&
                        cartData?.map((item, index) => {
                          return (
                            <tr>
                              <td>
                                {item?.productTitle?.substr(0, 20) + "..."}{" "}
                                <b>× {item?.quantity}</b>
                              </td>

                              <td>
                                {item?.subTotal?.toLocaleString("en-PH", {
                                  style: "currency",
                                  currency: "PHP",
                                })}
                              </td>
                            </tr>
                          );
                        })}

                      <tr>
                        <td>Subtotal </td>

                        <td>
                          {(cartData?.length !== 0
                            ? cartData
                                ?.map(
                                  (item) => parseInt(item.price) * item.quantity
                                )
                                .reduce((total, value) => total + value, 0)
                            : 0
                          )?.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Button type="submit" className="btn-g btn-lg w-100">
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Checkout;
