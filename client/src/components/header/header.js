import React, { useState, useEffect, useRef } from "react";
import "../header/header.css";
import Logo from "../../assets/images/logo.png";
import SearchIcon from "@mui/icons-material/Search";
import Select from "../selectDrop/select";
import axios from "axios";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import VerifiedIcon from "@mui/icons-material/Verified";
import Button from "@mui/material/Button";
import Person2OutlinedIcon from "@mui/icons-material/Person2Outlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";

import Nav from "./nav/nav";
import { Link } from "react-router-dom";
import { useContext } from "react";

import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";

const Header = (props) => {
  const [isOpenDropDown, setisOpenDropDown] = useState(false);
  const [isOpenAccDropDown, setisOpenAccDropDown] = useState(false);
  

  const headerRef = useRef();

  const context = useContext(MyContext);
  const history = useNavigate();

  const [categories, setcategories] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [isOpenNav, setIsOpenNav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchInput = useRef();

  const countryList = [];

  useEffect(() => {
    window.addEventListener("scroll", () => {
      let position = window.pageYOffset;
      if (position > 100) {
        headerRef.current.classList.add("fixed");
      } else {
        headerRef.current.classList.remove("fixed");
      }
    });

    getCountry("https://countriesnow.space/api/v0.1/countries/");
  }, []);

  useEffect(() => {
    setcategories(context.categories);
  }, [context.categories]);

  const getCountry = async (url) => {
    try {
      await axios.get(url).then((res) => {
        if (res !== null) {
          //console.log(res.data.data);
          res.data.data.map((item, index) => {
            countryList.push(item);
            //console.log(item.country)
          });

          //console.log(countryList)
          setCountryData(countryList);
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const logout = () => {
    context.setIsLogin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    history("/signIn");
  };

  const searchProducts = (e) => {
    //alert(searchInput.current.value);
    if (searchInput.current.value !== "") {
      setIsLoading(true);
      fetchDataFromApi(`/api/search?q=${searchInput.current.value}`).then(
        (res) => {
          context?.setSearchItems(res);
          setTimeout(() => {
            history("/search");
            setIsLoading(false);
            searchInput.current.value = "";
            context?.closeSearch()
          }, 2000);
        }
      );
    }
  };

  const selectedSelectBoxItem = (name, id) => {
    if (name === "Your Location") {
      localStorage.setItem("location", "All");
    } else {
      localStorage.setItem("location", name);
    }
    window.location.href = "/"
  };


  const openNav = () => {
    setIsOpenNav(true);
    context.setIsopenNavigation(true)
    context?.setIsBottomShow(false);
}

const closeNav = () => {
    setIsOpenNav(false);
    setisOpenAccDropDown(false)
    context.setIsopenNavigation(false);
    context?.setIsBottomShow(true);
}

  return (
    <>
      <div className="headerWrapper" ref={headerRef}>
        <header>
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-2 part1 d-flex align-items-center">
                {context?.windowWidth < 992 && <MenuIcon onClick={openNav} />}
                <Link to="/">
                  <img src={Logo} className="logo" />
                </Link>

                {context?.windowWidth < 992 && (
                  <ul className="list list-inline mb-0 headerTabs pl-0">
                    <li className="list-inline-item ml-0">
                      <span>
                        <Link to={"/cart"}>
                          <ShoppingCartOutlinedIcon />
                          <span className="badge bg-success rounded-circle">
                            {context.cartItems.length}
                          </span>
                          Cart
                        </Link>
                      </span>
                    </li>
                  </ul>
                )}
              </div>

              {/*headerSearch start here */}
              <div className="col-sm-5 part2">
                <div className={`headerSearch d-flex align-items-center ${context?.isOpenSearch === true ? 'open' : ''}`}>
                  <div className="search">
                    <input
                      type="text"
                      placeholder="Search for items..."
                      ref={searchInput}
                    />
                    {isLoading === true ? (
                      <CircularProgress
                        color="inherit"
                        className="searchIcon loading_"
                      />
                    ) : (
                      <SearchIcon
                        className="searchIcon cursor"
                        onClick={searchProducts}
                      />
                    )}
                  </div>
                </div>
              </div>
              {/*headerSearch start here */}

              <div className="col-sm-5 d-flex align-items-center part3 res-hide">
                <div className="ml-auto d-flex align-items-center">
              
                  <ClickAwayListener
                    onClickAway={() => setisOpenDropDown(false)}
                  >
                    <ul className="list list-inline mb-0 headerTabs">
                      <li className="list-inline-item">
                        <Link to="/myList">
                          <span>
                            <FavoriteBorderOutlinedIcon />
                            <span className="badge bg-success rounded-circle">
                              {context?.myListData?.length}
                            </span>
                            Wishlist
                          </span>
                        </Link>
                      </li>
                      <li className="list-inline-item">
                        <span>
                          <Link to={"/cart"}>
                            <ShoppingCartOutlinedIcon />
                            <span className="badge bg-success rounded-circle">
                              {context.cartItems.length}
                            </span>
                            Cart
                          </Link>
                        </span>
                      </li>

                      {context.isLogin === true ? (
                        <li className="list-inline-item">
                          <span
                            onClick={() => setisOpenDropDown(!isOpenDropDown)}
                          >
                            <Person2OutlinedIcon />
                            Account
                          </span>

                          {isOpenDropDown !== false && (
                            <ul className="dropdownMenu">
                              <li>
                                <Link to="/my-account">
                                  <Button
                                    className="align-items-center"
                                    onClick={() =>
                                      setisOpenDropDown(!isOpenDropDown)
                                    }
                                  >
                                    <Person2OutlinedIcon /> My Account
                                  </Button>
                                </Link>
                              </li>
                              <li>
                                <Link to="/orders">
                                  <Button
                                    onClick={() =>
                                      setisOpenDropDown(!isOpenDropDown)
                                    }
                                  >
                                    <VerifiedIcon /> Orders
                                  </Button>
                                </Link>
                              </li>
                              <li>
                                <Link to="/myList">
                                  <Button
                                    onClick={() =>
                                      setisOpenDropDown(!isOpenDropDown)
                                    }
                                  >
                                    <FavoriteBorderOutlinedIcon /> My Wishlist
                                  </Button>
                                </Link>
                              </li>

                              <li>
                                <Button onClick={logout}>
                                  <LogoutOutlinedIcon /> Sign out
                                </Button>
                              </li>
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li className="list-inline-item">
                          <Link to={"/signIn"}>
                            <Button className="btn btn-g">Sign In</Button>
                          </Link>
                        </li>
                      )}
                    </ul>
                  </ClickAwayListener>
                </div>
              </div>
            </div>
          </div>
        </header>

        {categories?.categoryList?.length !== 0 &&
          categories?.categoryList !== undefined && (
            <Nav data={categories?.categoryList} countryData={countryData.length !== 0 && countryData} openNav={isOpenNav} closeNav={closeNav} />
          )}
      </div>

      <div className="afterHeader"></div>
    </>
  );
};

export default Header;
