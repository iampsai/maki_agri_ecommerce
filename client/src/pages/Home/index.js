import React, { useState, useEffect, useRef, useContext } from "react";
import SliderBanner from "./slider/index";
import CatSlider from "../../components/catSlider";

import Banners from "../../components/banners";
import {Link} from 'react-router-dom';
import "./style.css";
import Product from "../../components/product";
import homeBannerPlaceholder from "../../assets/images/homeBannerPlaceholder.jpg";

import Slider from "react-slick";
import TopProducts from "./TopProducts";
import axios from "axios";
import { MyContext } from "../../App";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { fetchDataFromApi } from "../../utils/api";

const Home = (props) => {
  const [categories, setcategories] = useState([]);
  const [selectedCat, setselectedCat] = useState();
  const [filterData, setFilterData] = useState([]);
  const [value, setValue] = React.useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [homeSlides, setHomeSlides] = useState([]);

  const  [homeSideBanners, setHomeSideBanners] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [slideList, setSlideList] = useState([]);

  const productRow=useRef();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

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


  useEffect(() => {
    window.scrollTo(0, 0);

    const location = localStorage.getItem("location");

    if (location !== null && location !== "" && location !== undefined) {
      fetchDataFromApi(`/api/products/featured?location=${location}`).then(
        (res) => {
          setFeaturedProducts(res);
        }
      );


    }

    fetchDataFromApi("/api/homeBanner").then((res) => {
      setHomeSlides(res);
    });

    fetchDataFromApi("/api/banners").then((res) => {
      setSlideList(res);
    });

    fetchDataFromApi("/api/homeSideBanners").then((res) => {
      setHomeSideBanners(res);
    });

    context.setEnableFilterTab(false);

  }, []);



  useEffect(() => {
    if (context.categories?.categoryList?.length > 0) {
      setcategories(context.categories);
      setselectedCat(context.categories?.categoryList[0]?.id);
    }
  }, [context.categories]);

  useEffect(() => {
    if (selectedCat !== undefined) {
      setIsLoading(true);
      const location = localStorage.getItem("location");
      fetchDataFromApi(
        `/api/products/catId?catId=${selectedCat}&location=${location}`
      ).then((res) => {
        setFilterData(res.products);
        setIsLoading(false);
        // console.log(selectedCat)
      });
    }
  }, [selectedCat]);

  const filterProducts = (id) => {
    setIsLoading(true);
      const location = localStorage.getItem("location");
      fetchDataFromApi(
        `/api/products/catId?catId=${id}&location=${location}`
      ).then((res) => {
        setFilterData(res.products);
        setIsLoading(false);
        // console.log(selectedCat)
      });
  };

  return (
    <div style={{ display: "block" }}>

    {homeSlides?.length !== 0 ? (
      <SliderBanner data={homeSlides} />
    ) : (
      <div className="container-fluid mt-3">
        <div className="homeBannerSection w-100 pt-4 pb-4">
          <img src={homeBannerPlaceholder} className="w-100" />
        </div>
      </div>
    )}
     

      {context.categories?.categoryList?.length > 0 && (
        <CatSlider data={context.categories?.categoryList} />
      )}

      <section className="homeProducts homeProductWrapper pb-0">
        <div className="container-fluid">
          <div className="d-flex align-items-center homeProductsTitleWrap">
            <h2 className="hd mb-0 mt-0 res-full">Popular Products</h2>

            <div className="ml-auto filtes_Products w-75 d-flex align-items-center justify-content-end">
              {context.categories?.categoryList?.length > 0 && (
                <Tabs
                  value={value}
                  onChange={handleChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="scrollable auto tabs example"
                >
                  {context.categories?.categoryList?.map((cat) => {
                    return (
                      <Tab
                        label={cat?.name}
                        onClick={() => filterProducts(cat?.id)}
                      />
                    );
                  })}
                </Tabs>
              )}
            </div>
          </div>

          <div className={`productRow pb-0 pt-2 ${isLoadingProducts===true && 'loading'}`} ref={productRow}>
            {filterData?.length !== 0 &&
              filterData?.filter((item, idx) => idx < 10)?.slice(0)
              ?.reverse()
              ?.map((item, index) => {
                return (
                  <div className="item" key={index}>
                    <Product item={item} />
                  </div>
                );
              })}
          </div>
        </div>
      </section>

       {slideList?.length !== 0 && <Banners data={slideList}/>}

      


  
      <section className='homeProducts homeProductsRow2 pt-0'>
      <div className='container-fluid'>
          <div className='d-flex align-items-center'>
              <h2 className='hd mb-0 mt-0'>Featured Products</h2>

          </div>

     
          <div className='row mt-3'>
              <div className='col-md-9'>
                  <Slider {...settings} className='prodSlider'>

                      {
                        featuredProducts?.length!==0 && featuredProducts?.slice(0)
                        ?.reverse()
                        ?.map((item,index)=>{
                          return (
                            <div className="item" key={index}>
                              <Product item={item} />
                            </div>
                          );
                        })
                      }

                  </Slider>
              </div>

              <div className='col-md-3 pr-5 res-hide'>
              {homeSideBanners?.length !== 0 &&
                homeSideBanners?.map((item, index) => {
                  if(index===1){
                    return (
                      <div className="banner mb-3" key={index}>
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
                  }
                
                })}
              </div>


          </div>


      </div>
  </section>


  
    </div>
  );
};

export default Home;
