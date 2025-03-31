import React, { useContext } from "react";
import Banner1 from "../../assets/images/banner1.jpg";
import Banner2 from "../../assets/images/banner2.jpg";
import Banner3 from "../../assets/images/banner3.jpg";
import Slider from "react-slick";
import "./style.css";
import { MyContext } from "../../App";
import { Link } from "react-router-dom";

const Banners = (props) => {
  const context = useContext(MyContext);

  var settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    fade: false,
    arrows: context.windowWidth < 992 ? false : true,
  };

  return (
    <div className="bannerSection">
      <div className="container-fluid">
        <Slider {...settings} className="prodSlider">
          {props?.data?.length !== 0 &&
            props?.data?.map((item, index) => {
              return (
                <div className={`box`} key={index}>
                {item?.subCatId !== null ? (
                  <Link
                    to={`/products/subCat/${item?.subCatId}`}
                    className="box"
                  >
                    <img
                    src={item?.images[0]}
                    
                      className="w-100 transition"
                      alt="banner img"
                    />
                  </Link>
                ) : (
                  <Link
                    to={`/products/category/${item?.catId}`}
                    className="box"
                  >
                    <img
                    src={item?.images[0]}
       
                      className="w-100 transition"
                      alt="banner img"
                    />
                  </Link>
                )}
              </div>
              );
            })}
        </Slider>
      </div>
    </div>
  );
};

export default Banners;
