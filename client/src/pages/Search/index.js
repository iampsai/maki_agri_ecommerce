import React, { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Product from "../../components/product";
import { Button } from "@mui/material";

import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";

import CircularProgress from "@mui/material/CircularProgress";

const SearchPage = (props) => {
  const [filterId, setFilterId] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [productData, setProductData] = useState([]);
  const [currentCat,setCurrentCat] = useState();

  const context = useContext(MyContext);

  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
    setFilterId("");

    let url = window.location.href;
    let apiEndPoint = "";

    if (url.includes("subCat")) {
      apiEndPoint = `/api/products/subCatId?subCatId=${id}&location=${localStorage.getItem(
        "location"
      )}`;
    }
    if (url.includes("category")) {
      apiEndPoint = `/api/products/catId?catId=${id}&location=${localStorage.getItem(
        "location"
      )}`;
    }


    fetchDataFromApi(`/api/category/${id}`).then((res) => {
        setCurrentCat(res)
        console.log(res)
    });

    context.setEnableFilterTab(true);

  }, [id]);


  const filterByRating=(rating)=>{
    setisLoading(true);
    let url = window.location.href;
    let apiEndPoint = "";

    if (url.includes("subCat")) {
      apiEndPoint = `/api/products/rating?rating=${rating}&subCatId=${id}&location=${localStorage.getItem("location")}`;
    }
    if (url.includes("category")) {
      apiEndPoint = `/api/products/rating?rating=${rating}&catId=${id}&location=${localStorage.getItem("location")}`;
    }

   

    fetchDataFromApi(apiEndPoint).then((res) => {
      setProductData(res)
      setisLoading(false);
      window.scrollTo({
          top: 0,
          behavior: 'smooth',
      })
  })


  }


  const filterByPrice=(price, catId)=>{
    setisLoading(true);

    var window_url = window.location.href;
    var api_EndPoint = "";


    if (filterId === "") {
      if (window_url.includes("subCat")) {
        api_EndPoint = `/api/products/fiterByPrice?minPrice=${
          price[0]
        }&maxPrice=${price[1]}&subCatId=${id}&location=${localStorage.getItem(
          "location"
        )}`;
      }
      if (window_url.includes("category")) {
        api_EndPoint = `/api/products/fiterByPrice?minPrice=${
          price[0]
        }&maxPrice=${price[1]}&catId=${id}&location=${localStorage.getItem(
          "location"
        )}`;
      }
    }
    if (filterId !== "") {
      api_EndPoint = `/api/products/fiterByPrice?minPrice=${
        price[0]
      }&maxPrice=${
        price[1]
      }&subCatId=${filterId}&location=${localStorage.getItem(
        "location"
      )}`;
    }


    fetchDataFromApi(api_EndPoint).then((res) => {
      setProductData(res)
      setisLoading(false);
  })

  }

  return (
    <>
      <section className="listingPage">
        <div className="container-fluid">


          <div className="listingData">
            <div className="row">
              <div className={`col-md-3 sidebarWrapper`}>
                <Sidebar filterByRating={filterByRating} catId={id} filterByPrice={filterByPrice} />
              </div>

              <div className="col-md-9 rightContent homeProducts pt-0">
                <div className="topStrip d-flex align-items-center">
                  <p className="mb-0">
                    We found <span className="text-success">{context?.searchItems?.length>0 && context?.searchItems?.length}</span> items for
                    you!
                  </p>
                </div>

                <div className="productRow pl-4 pr-3">
                  {isLoading === true ? (
                    <div className="loading d-flex align-items-center justify-content-center">
                      <CircularProgress color="inherit" />
                    </div>
                  ) : (
                    context?.searchItems?.map((item, index) => {
                      return (
                        <div className="item" key={index}>
                          <Product item={item} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SearchPage;
