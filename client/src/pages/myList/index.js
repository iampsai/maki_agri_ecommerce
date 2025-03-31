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
import emprtCart from "../../assets/images/empty-list.png";
import HomeIcon from "@mui/icons-material/Home";

const Cart = () => {
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    if (context?.isLogin === false) {
      history("/signIn");
    }

    context.setEnableFilterTab(false);
    
  }, [context?.isLogin]);

  const removeItem = (id) => {
    setIsLoading(true);
    deleteData(`/api/my-list/${id}`).then((res) => {
      context.setAlertBox({
          open: true,
          error: false,
          msg: "Item removed from My List!"
      })

      const user = JSON.parse(localStorage.getItem("user"));
      fetchDataFromApi(`/api/my-list?userId=${user?.userId}`).then((res) => {
          context?.setMyListData(res);
          setIsLoading(false);
      })

  })

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
              <li>My List</li>
            </ul>
          </div>
        </div>
      )}

      <section className="cartSection mb-5">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="myListWrapper">
                <div className="d-flex align-items-center w-100">
                  <div className="left">
                    <h1 className="hd mb-0">My List</h1>
                    <p>
                      There are{" "}
                      <span className="text-g">
                        <b>{context?.myListData?.length}</b>
                      </span>{" "}
                      products in your Wishlist
                    </p>
                  </div>
                </div>

                {context?.myListData?.length !== 0 ? (
                  <>
                    <div className="cartWrapper mt-4">
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Price</th>
                              <th>Remove</th>
                            </tr>
                          </thead>

                          <tbody>
                            {context?.myListData?.length !== 0 &&
                              context?.myListData?.map((item, index) => {
                                return (
                                  <tr key={index}>
                                    <td width={"70%"}>
                                      <div className="d-flex align-items-center">
                                        <div className="img">
                                          <Link
                                            to={`/product/${item.productId}`}
                                          >
                                            <img
                                            src={item?.image}
                                        
                                              className="w-100"
                                            />
                                          </Link>
                                        </div>

                                        <div className="info pl-4">
                                          <Link
                                            to={`/product/${item.productId}`}
                                          >
                                            <h4>
                                              {item?.productTitle?.substr(
                                                0,
                                                50
                                              ) + "..."}
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
                                      <span>₱: {item?.price}</span>
                                    </td>

                                    <td width="10%">
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

              
                  </>
                ) : (
                  <div className="empty d-flex align-items-center justify-content-center flex-column">
                    <img
                      src={emprtCart}
                      alt="image"
                      width="100"
  
                    />
                     <br />
                    <h3>Your Wishlist is currently empty</h3>
                    <br />
                    <Link to="/">
                      <Button className="btn-g bg-g btn-lg btn-big btn-round">
                        <HomeIcon /> &nbsp; Continue Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoading === true && <div className="loadingOverlay"></div>}
    </>
  );
};

export default Cart;
