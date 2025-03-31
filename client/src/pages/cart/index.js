import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./style.css";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Rating from "@mui/material/Rating";
import { Button } from "@mui/material";
import QuantityBox from "../../components/quantityBox";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { MyContext } from "../../App";
import axios from "axios";

import { useNavigate } from "react-router-dom";

import { loadStripe } from "@stripe/stripe-js";
import { deleteData, editData, fetchDataFromApi } from "../../utils/api";
import emprtCart from "../../assets/images/empty.png";
import HomeIcon from "@mui/icons-material/Home";

const Cart = () => {
  const [cartData, setCartData] = useState([]);
  const [productQuantity, setProductQuantity] = useState();
  const [chengeQuantity, setchengeQuantity] = useState(0);
  let [cartFields, setCartFields] = useState({});
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();
  const [selectedQuantity, setselectedQuantity] = useState();

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem("token");
    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);
    } else {
      history("/signIn");
    }

    const user = JSON.parse(localStorage.getItem("user"));
    fetchDataFromApi(`/api/cart?userId=${user?.userId}`).then((res) => {
      setCartData(res);
      setselectedQuantity(res?.quantity);
    });
  }, []);

  const quantity = (val) => {
    setProductQuantity(val);
    setchengeQuantity(val);
    context.getCartData();
  };

  const selectedItem = (item, quantityVal) => {
    if (chengeQuantity !== 0) {
      setIsLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      cartFields.productTitle = item?.productTitle;
      cartFields.image = item?.image;
      cartFields.rating = item?.rating;
      cartFields.price = item?.price;
      cartFields.quantity = quantityVal;
      cartFields.subTotal = parseInt(item?.price * quantityVal);
      cartFields.productId = item?.id;
      cartFields.userId = user?.userId;

      //console.log(item?._id)

      editData(`/api/cart/${item?._id}`, cartFields).then((res) => {
        setTimeout(() => {
          setIsLoading(false);
          const user = JSON.parse(localStorage.getItem("user"));
          fetchDataFromApi(`/api/cart?userId=${user?.userId}`).then((res) => {
            setCartData(res);
            context?.setCartItems(res);
          });
        }, 1000);
      });
    }
  };

  const removeItem = (id) => {
    setIsLoading(true);
    deleteData(`/api/cart/${id}`).then((res) => {
      context.setAlertBox({
        open: true,
        error: false,
        msg: "Item removed from cart!",
      });
      setIsLoading(false);
      context?.getCartData();
    });
  };

  return (
    <>
      {context.windowWidth > 992 && (
        <div className="breadcrumbWrapper mb-4">
          <div className="container-fluid">
            <ul className="breadcrumb breadcrumb2 mb-0">
              <li>
                <Link to={"/"}>Home</Link>
              </li>
              <li>Shop</li>
              <li>Cart</li>
            </ul>
          </div>
        </div>
      )}

      <section className="cartSection mb-5">
        <div className="container-fluid">
          <div className="row">
            <div className={`${context?.cartItems?.length !== 0 ? 'col-md-8' : 'col-md-12'}`}>
              <div className="d-flex align-items-center w-100">
                <div className="left">
                  <h1 className="hd mb-0">Your Cart</h1>
                  <p>
                    There are{" "}
                    <span className="text-g">
                      <b>{context?.cartItems?.length}</b>
                    </span>{" "}
                    products in your cart
                  </p>
                </div>
              </div>

              {context?.cartItems?.length !== 0 ? (
                <>
                  <div className="cartWrapper mt-4">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                            <th>Remove</th>
                          </tr>
                        </thead>

                        <tbody>
                          {cartData?.length !== 0 &&
                            cartData?.map((item, index) => {
                              return (
                                <tr key={index}>
                                  <td width={"50%"}>
                                    <div className="d-flex align-items-center">
                                      <div className="img">
                                        <Link to={`/product/${item.productId}`}>
                                          <img
                                          src={item?.image}
                                           
                                            className="w-100"
                                          />
                                        </Link>
                                      </div>

                                      <div className="info pl-4">
                                        <Link to={`/product/${item.productId}`}>
                                          <h4>
                                            {item?.productTitle?.substr(0, 50) +
                                              "..."}
                                          </h4>
                                        </Link>
                                        <Rating
                                          name="half-rating-read"
                                          value={parseFloat(item?.rating)}
                                          precision={0.5}
                                          readOnly
                                        />{" "}
                                        <span className="text-light">
                                          ({parseFloat(item?.rating)})
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  <td width="20%">
                                    <span>₱ {item?.price}</span>
                                  </td>

                                  <td>
                                    {
                                      <QuantityBox
                                        quantity={quantity}
                                        item={item}
                                        selectedItem={selectedItem}
                                        value={item?.quantity}
                                      />
                                    }
                                  </td>

                                  <td>
                                    <span className="text-g">
                                    ₱ {item?.subTotal}
                                    </span>
                                  </td>

                                  <td align="center">
                                    <span
                                      className="cursor"
                                      onClick={() => removeItem(item?.id)}
                                    >
                                      <DeleteOutlineOutlinedIcon />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <br />

                  <div className="d-flex align-items-center">
                    <Link to="/">
                      <Button className="btn-g">
                        <KeyboardBackspaceIcon /> Continue Shopping
                      </Button>
                    </Link>
                    {/* <Button className='btn-g ml-auto' onClick={updateCartData}>
                    <RefreshIcon /> Update Cart</Button> */}
                  </div>
                </>
              ) : (
                <div className="empty d-flex align-items-center justify-content-center flex-column">
                  <img src={emprtCart} alt="image" width="150" height="150px" />
                  <h3>Your Cart is currently empty</h3>
                  <br />
                  <Link to="/">
                    <Button className="btn-g bg-g btn-lg btn-big btn-round">
                      <HomeIcon /> &nbsp; Continue Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {context?.cartItems?.length !== 0 && (
              <div className="col-md-4 cartRightBox">
                <div className="card p-4 ">
                  <div className="d-flex align-items-center mb-4">
                    <h5 className="mb-0 text-light">Subtotal</h5>
                    <h3 className="ml-auto mb-0 font-weight-bold">
                      <span className="text-g">
                        {(context.cartItems?.length !== 0
                          ? context.cartItems
                              ?.map(
                                (item) => parseInt(item.price) * item.quantity
                              )
                              .reduce((total, value) => total + value, 0)
                          : 0
                        )?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </span>
                    </h3>
                  </div>

                  <div className="d-flex align-items-center mb-4">
                    <h5 className="mb-0 text-light">Shipping</h5>
                    <h3 className="ml-auto mb-0 font-weight-bold">
                      <span>Free</span>
                    </h3>
                  </div>

                  <div className="d-flex align-items-center mb-4">
                    <h5 className="mb-0 text-light">Estimate for</h5>
                    <h3 className="ml-auto mb-0 font-weight-bold">
                   Philippines
                    </h3>
                  </div>

                  <div className="d-flex align-items-center mb-4">
                    <h5 className="mb-0 text-light">Total</h5>
                    <h3 className="ml-auto mb-0 font-weight-bold">
                      <span className="text-g">
                        {(context.cartItems?.length !== 0
                          ? context.cartItems
                              ?.map(
                                (item) => parseInt(item.price) * item.quantity
                              )
                              .reduce((total, value) => total + value, 0)
                          : 0
                        )?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </span>
                    </h3>
                  </div>

                  <br />
                  <Link to={"/checkout"}>
                    <Button className="btn-g btn-lg">
                      Proceed To CheckOut
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isLoading === true && <div className="loadingOverlay"></div>}
    </>
  );
};

export default Cart;
