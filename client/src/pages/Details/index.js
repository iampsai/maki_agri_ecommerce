import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import Rating from "@mui/material/Rating";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import Slider from "react-slick";
import { useRef } from "react";
import { useState } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useEffect } from "react";
import { Button } from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import QuantityBox from "../../components/quantityBox";
import Product from "../../components/product";
import axios from "axios";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";

const DetailsPage = (props) => {
  const [zoomInage, setZoomImage] = useState(
    "https://www.jiomart.com/images/product/original/490000363/maggi-2-minute-masala-noodles-70-g-product-images-o490000363-p490000363-0-202305292130.jpg"
  );

  const [bigImageSize, setBigImageSize] = useState([1500, 1500]);
  const [smlImageSize, setSmlImageSize] = useState([150, 150]);

  const [activeSize, setActiveSize] = useState(null);
  const [tabError, setTabError] = useState(false);

  const [inputValue, setinputValue] = useState(1);

  const [activeTabs, setActiveTabs] = useState(0);

  const [currentProduct, setCurrentProduct] = useState({});

  const [relatedProductData, setRelatedProductData] = useState([]);
  let [productQuantity, setProductQuantity] = useState();
  let [cartFields, setCartFields] = useState({});

  const [addedInMyList, setAddedInMyList] = useState(false);

  const [reviews, setReviews] = useState({
    review: "",
    customerRating: 1,
    customerId: "",
    customerName: "",
    productId: "",
  });

  const [reviewsData, setReviewsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const context = useContext(MyContext);

  const zoomSliderBig = useRef();
  const zoomSlider = useRef();

  let { id } = useParams();

  var settings2 = {
    dots: false,
    infinite: false,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: false,
    arrows: false,
  };

  var settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 7,
    slidesToScroll: 1,
    fade: false,
    arrows: context.windowWidth > 992 ? true : false,
  };

  var related = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    fade: false,
    arrows: context.windowWidth > 992 ? true : false,
  };

  const goto = (index) => {
    zoomSlider.current.slickGoTo(index);
    zoomSliderBig.current.slickGoTo(index);
  };

  const isActive = (index) => {
    setActiveSize(index);
    setTabError(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchDataFromApi(`/api/products/${id}`).then((res) => {
      setCurrentProduct(res);

      if (
        res?.productRam.length === 0 &&
        res?.productWeight.length === 0 &&
        res?.size.length === 0
      ) {
        setActiveSize(1);
      }

      fetchDataFromApi(
        `/api/products/subCatId?subCatId=${
          res?.subCatId
        }&location=${localStorage.getItem("location")}`
      ).then((res) => {
        const filteredData = res?.products?.filter((item) => item.id !== id);
        setRelatedProductData(filteredData);
      });
    });

    getAllReviews(id);

    checkIsAddedInMyList(id);
  }, [id]);

  const checkIsAddedInMyList = (productId) => {
    fetchDataFromApi(
      `/api/my-list?productId=${productId}&userId=${context?.user?.userId}`
    ).then((res) => {
      if (res?.length !== 0) {
        setAddedInMyList(true);
      }
    });
  };

  const quantity = (val) => {
    setProductQuantity(val);
  };

  const selectedItem = () => {};

  const addtoCart = () => {
    if (activeSize !== null) {
      setTabError(false);

      const user = JSON.parse(localStorage.getItem("user"));

      cartFields.productTitle = currentProduct?.name;
      cartFields.image = currentProduct?.images[0];
      cartFields.rating = currentProduct?.rating;
      cartFields.price = currentProduct?.price;
      cartFields.quantity = productQuantity;
      cartFields.subTotal = parseInt(currentProduct?.price * productQuantity);
      cartFields.productId = currentProduct?.id;
      cartFields.countInStock = currentProduct?.countInStock;
      cartFields.userId = user?.userId;

      context.addToCart(cartFields);
    } else {
      setTabError(true);
    }
  };

  const getAllReviews = (productId) => {
    fetchDataFromApi(`/api/productReviews?productId=${productId}`).then(
      (resp) => {
        setReviewsData(resp);
      }
    );
  };

  const addReview = (e) => {
    e.preventDefault();

    setIsLoading(true);
    if (context?.isLogin === true) {
      if (reviews?.review === "") {
        context?.setAlertBox({
          open: true,
          error: true,
          msg: "Please add Review",
        });
        return false;
      }

      reviews.customerId = context.user?.userId;
      reviews.customerName = context.user?.name;
      reviews.productId = id;

      postData(`/api/productReviews/add`, reviews).then((res) => {
        if (res !== undefined && res !== null && res?.length !== 0) {
          setIsLoading(false);
          reviews.review = "";
          reviews.customerRating = 1;
          reviews.customerId = "";
          reviews.customerName = "";
          reviews.productId = "";
          getAllReviews(id);
        }
      });
    } else {
      context?.setAlertBox({
        open: true,
        error: true,
        msg: "Please Login first",
      });
    }
  };

  return (
    <>
      <section className="detailsPage mb-5">
        {context.windowWidth > 992 && (
          <div className="breadcrumbWrapper mb-4">
            <div className="container-fluid">
              <ul className="breadcrumb breadcrumb2 mb-0">
                <li>
                  <Link>Home</Link>{" "}
                </li>
                <li>
                  <Link
                    to={`/products/category/${currentProduct?.catId}`}
                    className="text-capitalize"
                  >
                    {currentProduct?.catName}
                  </Link>
                </li>

                <li>
                  <Link
                    to={`/products/subCat/${currentProduct?.subCatId}`}
                    className="text-capitalize"
                  >
                    {currentProduct?.subCatName}
                  </Link>
                </li>
                <li> {currentProduct?.name?.substr(0, 50) + "..."}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="container detailsContainer pt-3 pb-3">
          <div className="row">
            {/* productZoom code start here */}
            <div className="col-md-5">
              <div className="productZoom">
                <Slider
                  {...settings2}
                  className="zoomSliderBig"
                  ref={zoomSliderBig}
                >
                  {currentProduct?.images?.length !== 0 &&
                    currentProduct?.images?.map((image, index) => {
                      return (
                        <div className="item" key={index}>
                          <InnerImageZoom
                            zoomType="hover"
                            zoomScale={1}
                            src={image}
                    
                          />
                        </div>
                      );
                    })}
                </Slider>
              </div>

              <Slider {...settings} className="zoomSlider" ref={zoomSlider}>
                {currentProduct?.images?.length !== 0 &&
                  currentProduct?.images?.map((image, index) => {
                    return (
                      <div className="item">
                        <img
                        src={image}
                      
                          className="w-100"
                          onClick={() => goto(index)}
                        />
                      </div>
                    );
                  })}
              </Slider>
            </div>
            {/* productZoom code ends here */}

            {/* product info code start here */}
            <div className="col-md-7 productInfo">
              <h1>{currentProduct?.name}</h1>
              <div className="d-flex align-items-center mb-4 mt-3">
                <Rating
                  name="half-rating-read"
                  value={parseInt(currentProduct?.rating)}
                  precision={0.5}
                  readOnly
                />
                <span className="text-light ml-2">
                  ({reviewsData?.length !== 0 ? reviewsData?.length : 0}{" "}
                  reviews)
                </span>
              </div>

              <div className="priceSec d-flex align-items-center mb-3">
                <span className="text-g priceLarge">
                ₱ {currentProduct?.price}
                </span>
                <div className="ml-3 d-flex flex-column">
                  <span className="text-org">
                    {currentProduct?.discount}% Off
                  </span>
                  <span className="text-light oldPrice">
                  ₱ {currentProduct?.oldPrice}
                  </span>
                </div>
              </div>

              <p>{currentProduct?.description}</p>

              {currentProduct?.size?.length !== 0 && (
                <div className="productSize d-flex align-items-center">
                  <span>Size:</span>
                  <ul
                    className={`list list-inline mb-0 pl-4 ${
                      tabError === true && "error"
                    }`}
                  >
                    {currentProduct?.size?.map((size, index) => {
                      return (
                        <li className="list-inline-item">
                          <a
                            className={`tag ${
                              activeSize === index ? "active" : ""
                            }`}
                            onClick={() => isActive(index)}
                          >
                            {size}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {currentProduct?.productRam?.length !== 0 && (
                <div className="productSize d-flex align-items-center">
                  <span>RAM:</span>
                  <ul className="list list-inline mb-0 pl-4">
                    {currentProduct?.productRam?.map((productRam, index) => {
                      return (
                        <li className="list-inline-item">
                          <a
                            className={`tag ${
                              activeSize === index ? "active" : ""
                            }`}
                            onClick={() => isActive(index)}
                          >
                            {productRam}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {currentProduct?.productWeight?.length !== 0 && (
                <div className="productSize d-flex align-items-center">
                  <span>WEIGHT:</span>
                  <ul className="list list-inline mb-0 pl-4">
                    {currentProduct?.productWeight?.map(
                      (productWeight, index) => {
                        return (
                          <li className="list-inline-item">
                            <a
                              className={`tag ${
                                activeSize === index ? "active" : ""
                              }`}
                              onClick={() => isActive(index)}
                            >
                              {productWeight}
                            </a>
                          </li>
                        );
                      }
                    )}
                  </ul>
                </div>
              )}

              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center flex-wrap">
                  <QuantityBox
                    quantity={quantity}
                    item={currentProduct}
                    selectedItem={selectedItem}
                    value={1}
                  />

                  <div className="d-flex align-items-center addTocartActions">
                    <Button
                      className={`btn-g btn-lg addtocartbtn`}
                      onClick={addtoCart}
                    >
                      <ShoppingCartOutlinedIcon />
                      {context.isAddingInCart === true
                        ? "Adding..."
                        : " Add to cart"}
                    </Button>
                    <Button className=" btn-lg addtocartbtn  ml-3  wishlist btn-border">
                      {addedInMyList === true ? (
                        <FavoriteIcon />
                      ) : (
                        <FavoriteBorderOutlinedIcon />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* product info code ends here */}
          </div>

          <div className="card mt-5 p-5 detailsPageTabs">
            <div className="customTabs">
              <ul className="list list-inline">
                <li className="list-inline-item">
                  <Button
                    className={`${activeTabs === 0 && "active"}`}
                    onClick={() => {
                      setActiveTabs(0);
                    }}
                  >
                    Description
                  </Button>
                </li>
                <li className="list-inline-item">
                  <Button
                    className={`${activeTabs === 1 && "active"}`}
                    onClick={() => {
                      setActiveTabs(1);
                    }}
                  >
                    Additional info
                  </Button>
                </li>
                <li className="list-inline-item">
                  <Button
                    className={`${activeTabs === 2 && "active"}`}
                    onClick={() => {
                      setActiveTabs(2);
                    }}
                  >
                    Reviews (
                    {reviewsData?.length !== 0 ? reviewsData?.length : 0})
                  </Button>
                </li>
              </ul>

              <br />

              {activeTabs === 0 && (
                <div className="tabContent">
                  <p>
                 
                  </p>
                </div>
              )}

              {activeTabs === 1 && (
                <div className="tabContent">
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <tbody>
                       
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTabs === 2 && (
                <div className="tabContent">
                  <div className="row">
                    <div className="col-md-8">
                      <h3>Customer questions & answers</h3>
                      <br />
                      {reviewsData?.length !== 0 && (
                        <div className="reviewsScroll">
                          {reviewsData?.length !== 0 &&
                            reviewsData
                              ?.slice(0)
                              ?.reverse()
                              ?.map((review, index) => {
                                return (
                                  <div
                                    className="card p-4 reviewsCard flex-row"
                                    key={index}
                                  >
                                    <div className="image">
                                      <div className="rounded-circle">
                                        <img 
                                        
                                        src={context?.user?.image} />
                                      </div>
                                      <span className="text-g d-block text-center font-weight-bold">
                                        {review?.customerName}
                                      </span>
                                    </div>

                                    <div className="info pl-5">
                                      <div className="d-flex align-items-center w-100">
                                        <h5 className="text-light">
                                          {review?.dateCreated?.split("T")[0]}
                                        </h5>
                                        <div className="ml-auto">
                                          <Rating
                                            name="half-rating-read"
                                            value={parseInt(
                                              review?.customerRating
                                            )}
                                            precision={0.5}
                                            readOnly
                                          />
                                        </div>
                                      </div>

                                      <p>{review?.review}</p>
                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                      )}

                      <form className="reviewForm" onSubmit={addReview}>
                        <h4>Add a review</h4>
                        <div className="form-group mt-2">
                          <textarea
                            className="form-control"
                            placeholder="Write a Review"
                            name="review"
                            value={reviews.review}
                            onChange={(e) => {
                              setReviews(() => ({
                                ...reviews,
                                [e.target.name]: e.target.value,
                              }));
                            }}
                          ></textarea>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="form-group">
                              <Rating
                                name="customerRating"
                                value={reviews?.customerRating}
                                precision={0.5}
                                onChange={(e) => {
                                  setReviews(() => ({
                                    ...reviews,
                                    [e.target.name]: e.target.value,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <br />
                        <div className="form-group">
                          <Button type="submit" className="btn-g btn-lg">
                            {isLoading === true ? "Adding..." : "Submit Review"}
                          </Button>
                        </div>
                      </form>
                    </div>

                    {
                      //     <div className="col-md-4 pl-5 reviewBox">
                      //     <h4>Customer reviews</h4>
                      //     <div className="d-flex align-items-center mt-2">
                      //       <Rating
                      //         name="half-rating-read"
                      //         defaultValue={4.5}
                      //         precision={0.5}
                      //         readOnly
                      //       />
                      //       <strong className="ml-3">4.8 out of 5</strong>
                      //     </div>
                      //     <br />
                      //     <div className="progressBarBox d-flex align-items-center">
                      //       <span className="mr-3">5 star</span>
                      //       <div
                      //         class="progress"
                      //         style={{ width: "85%", height: "20px" }}
                      //       >
                      //         <div
                      //           class="progress-bar bg-success"
                      //           style={{ width: "75%", height: "20px" }}
                      //         >
                      //           75%
                      //         </div>
                      //       </div>
                      //     </div>
                      //     <div className="progressBarBox d-flex align-items-center">
                      //       <span className="mr-3">4 star</span>
                      //       <div
                      //         class="progress"
                      //         style={{ width: "85%", height: "20px" }}
                      //       >
                      //         <div
                      //           class="progress-bar bg-success"
                      //           style={{ width: "50%", height: "20px" }}
                      //         >
                      //           50%
                      //         </div>
                      //       </div>
                      //     </div>
                      //     <div className="progressBarBox d-flex align-items-center">
                      //       <span className="mr-3">3 star</span>
                      //       <div
                      //         class="progress"
                      //         style={{ width: "85%", height: "20px" }}
                      //       >
                      //         <div
                      //           class="progress-bar bg-success"
                      //           style={{ width: "55%", height: "20px" }}
                      //         >
                      //           55%
                      //         </div>
                      //       </div>
                      //     </div>
                      //     <div className="progressBarBox d-flex align-items-center">
                      //       <span className="mr-3">2 star</span>
                      //       <div
                      //         class="progress"
                      //         style={{ width: "85%", height: "20px" }}
                      //       >
                      //         <div
                      //           class="progress-bar bg-success"
                      //           style={{ width: "35%", height: "20px" }}
                      //         >
                      //           35%
                      //         </div>
                      //       </div>
                      //     </div>
                      //     <div className="progressBarBox d-flex align-items-center">
                      //       <span className="mr-3">1 star</span>
                      //       <div
                      //         class="progress"
                      //         style={{ width: "85%", height: "20px" }}
                      //       >
                      //         <div
                      //           class="progress-bar bg-success"
                      //           style={{ width: "25%", height: "20px" }}
                      //         >
                      //           25%
                      //         </div>
                      //       </div>
                      //     </div>
                      //   </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <br />

          <div className="relatedProducts homeProductsRow2  pb-4">
            <h2 class="hd mb-0 mt-0">Related products</h2>
            <br className="res-hide" />

            {
              <Slider {...related} className="prodSlider">
                {relatedProductData.length !== 0 &&
                  relatedProductData.map((product, index) => {
                    return (
                      <div className="item" key={index}>
                        <Product item={product} />
                      </div>
                    );
                  })}
              </Slider>
            }
          </div>
        </div>
      </section>
    </>
  );
};

export default DetailsPage;
