import React, { useEffect, useState, useContext } from "react";
import "./style.css";
import Rating from "@mui/material/Rating";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import Skeleton from '@mui/material/Skeleton';
import { IoIosImages } from "react-icons/io";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";

const Product = (props) => {
  const [productData, setProductData] = useState();
  const [isAdded, setIsadded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addedInMyList, setAddedInMyList] = useState(false);

  const context = useContext(MyContext);

  useEffect(() => {
    setProductData(props.item);
  }, [props.item]);

  
  useEffect(() => {
    setTimeout(() => {
        setIsLoading(false);
    }, 500);
}, []);


  const addToMyList = (product) => {
    if (context?.isLogin === true) {
      const obj = {
        productTitle: product?.name,
        image: product?.images[0],
        rating: product?.rating,
        price: product?.price,
        productId: product?.id,
        userId: context?.user?.userId,
      };

      postData(`/api/my-list/add`, obj).then((res) => {
        if (res.status !== false) {
          context?.setAlertBox({
            open: true,
            error: false,
            msg: "The product added in my list",
          });

          setAddedInMyList(true);

          fetchDataFromApi(`/api/my-list?userId=${context?.user?.userId}`).then(
            (res) => {
              context?.setMyListData(res);
            }
          );
        }
      });
    } else {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Please Login to continue",
      });
    }
  };

  const handleMouseEnter = (productId) => {
    fetchDataFromApi(
      `/api/my-list?productId=${productId}&userId=${context?.user?.userId}`
    ).then((res) => {
      if (res?.length !== 0) {
        setAddedInMyList(true);
      }
    });
  };

  return (
    <div
      className="productThumb"
      onMouseEnter={() => handleMouseEnter(productData?.id)}
    >
      {
        // props.tag !== null && props.tag !== undefined &&
        // <span className={`badge ${props.tag}`}>{props.tag}</span>
      }

      {productData !== undefined && (
        <>
          <div className="imgWrapper">
            <Link to={`/product/${productData.id}`}>
              <div className="wrapper mb-3">
              {
                            isLoading === true ?
                                <Skeleton variant="rectangular" width={300} height={400}>
                                    <IoIosImages/>
                                </Skeleton>

                                :

                                <img src={`${productData?.images[0]}`} className="w-100" />
                        }

                
              </div>

              <div className="overlay transition"></div>
            </Link>

            <ul className="actions list list-inline mb-0">
              <li className="list-inline-item">
                <a
                  className="cursor"
                  onClick={() => addToMyList(productData)}
                  tooltip={`${
                    addedInMyList === true
                      ? "Added in Wishlist"
                      : "Add to Wishlist"
                  }`}
                >
                  {addedInMyList === true ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderOutlinedIcon />
                  )}
                </a>
              </li>

              <li className="list-inline-item">
                <Link
                  to={`/product/${productData.id}`}
                  className="cursor"
                  tooltip="Quick View"
                >
                  <RemoveRedEyeOutlinedIcon />
                </Link>
              </li>
            </ul>
          </div>

          <div className="info">
            <span className="d-block catName">{productData?.catName}</span>
            <h4 className="title mb-0">
              <Link to={`/product/${productData.id}`}>
                {productData.name.substr(0, 25) + "..."}
              </Link>
            </h4>
            <Rating
              name="half-rating-read"
              value={parseFloat(productData?.rating)}
              precision={0.5}
              size="small"
              readOnly
            />
            <span className="brand d-block text-g">
              By <Link className="text-g">{productData?.brand}</Link>
            </span>

            <div className="d-flex align-items-center mt-3">
              <div className="d-flex align-items-center w-100">
                <span className="price text-g font-weight-bold">
                ₱ {productData?.price}
                </span>
                <span className="oldPrice ml-2">
                ₱{productData?.oldPrice}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Product;
