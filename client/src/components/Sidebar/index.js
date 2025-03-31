import React, { useEffect, useState, useContext } from "react";
import bannerImg from "../../assets/images/banner1.jpg";
import { Link, useParams } from "react-router-dom";
import Rating from "@mui/material/Rating";

import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

function valuetext(value) {
  return `${value}°C`;
}
const label = { inputProps: { "aria-label": "Checkbox demo" } };

const Sidebar = (props) => {
  const [value, setValue] = useState([100, 60000]);
  const [value2, setValue2] = useState(0);
  const [brandFilters, setBrandFilters] = React.useState([]);
  const [ratingsArr, setRatings] = React.useState([]);
  const [totalLength, setTotalLength] = useState([]);
  const [catId, setCatId] = useState("");
  const [homeSideBanners, setHomeSideBanners] = useState([]);

  const context = useContext(MyContext);

  const filterByRating = (rating) => {
    props.filterByRating(rating);
  };

  const { id } = useParams();

  useEffect(() => {
    setCatId(id);
    props.filterByPrice(value, id);
    fetchDataFromApi("/api/homeSideBanners").then((res) => {
      setHomeSideBanners(res);
    });
  }, [id]);

  useEffect(() => {
    props.filterByPrice(value, catId);
  }, [value]);

  return (
    <>
      <div className={`sidebar ${context.isOpenFilters === true && "open"}`}>
        <div className="card border-0 shadow">
          <h3>Category</h3>
          <div className="catList">
            {context?.categories?.categoryList?.length !== 0 &&
              context?.categories?.categoryList !== undefined &&
              context?.categories?.categoryList?.map((cat, index) => {
                return (
                  <Link to={`/products/category/${cat?.id}`} index={index}>
                    <div className="catItem d-flex align-items-center">
                      <span className="img">
                        <img 
                        src={cat?.images[0]}
                         width={30} />
                      </span>
                      <h4 className="mb-0 ml-3 mr-3 text-capitalize">
                        {cat?.name}
                      </h4>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        <div className="card border-0 shadow priceCard">
          <h3 className="mb-4">Filter by price</h3>

          <RangeSlider
            value={value}
            onInput={setValue}
            min={100}
            max={60000}
            step={5}
          />

          <div className="d-flex pt-2 pb-2 priceRange">
            <span>
              From: <strong className="text-success">₱ {value[0]}</strong>
            </span>
            <span className="ml-auto">
              From: <strong className="text-success">₱ {value[1]}</strong>
            </span>
          </div>

          <br />

          <div className="filters pt-0 pb-0">
            <h5>Filter By Ratings</h5>
            <ul className="pl-2 mb-0">
              <li className="cursor" onClick={() => {
                filterByRating(5);
                context?.setIsOpenFilters(!context?.isOpenFilters)
                }}>
                <Rating name="read-only" value={5} readOnly size="small" />
              </li>
              <li className="cursor" onClick={() => {
                filterByRating(4);
                context?.setIsOpenFilters(!context?.isOpenFilters)
                }}>
                <Rating name="read-only" value={4} readOnly size="small" />
              </li>
              <li className="cursor" onClick={() => {
                filterByRating(3);
                context?.setIsOpenFilters(!context?.isOpenFilters)
                }}>
                <Rating name="read-only" value={3} readOnly size="small" />
              </li>
              <li className="cursor" onClick={() => {
                filterByRating(2);
                context?.setIsOpenFilters(!context?.isOpenFilters)
                }}>
                <Rating name="read-only" value={2} readOnly size="small" />
              </li>
              <li className="cursor" onClick={() => {
                filterByRating(1);
                context?.setIsOpenFilters(!context?.isOpenFilters)
                }}>
                <Rating name="read-only" value={1} readOnly size="small" />
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebarAds">
        {homeSideBanners?.length !== 0 &&
          homeSideBanners?.map((item, index) => {
            return (
              <div className="banner mb-3" key={index} onClick={()=>context?.setIsOpenFilters(!context?.isOpenFilters)}>
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
                      className="cursor w-100 transition"
                      alt="banner img"
                    />
                  </Link>
                )}
              </div>
            );
          })}
            </div>
      </div>
    </>
  );
};

export default Sidebar;
