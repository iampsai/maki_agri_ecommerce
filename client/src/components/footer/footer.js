import React, { useContext, useState } from "react";
import "./footer.css";

import Icon1 from "../../assets/images/icon-1.svg";
import Icon2 from "../../assets/images/icon-2.svg";
import Icon3 from "../../assets/images/icon-3.svg";
import Icon4 from "../../assets/images/icon-4.svg";
import Icon5 from "../../assets/images/icon-5.svg";
import Logo from "../../assets/images/logo.png";
import { Link } from "react-router-dom";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WatchLaterOutlinedIcon from "@mui/icons-material/WatchLaterOutlined";
import { Button } from "@mui/material";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Newsletter from "../../components/newsletter/index";
import NewsletterImg from "../../assets/images/newsletter.png";
import { MyContext } from "../../App";
import { IoHomeOutline } from "react-icons/io5";
import { IoMdHeartEmpty } from "react-icons/io";
import { FaRegUser } from "react-icons/fa6";
import { CiFilter } from "react-icons/ci";
import { IoBagCheckOutline } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";

const Footer = () => {

  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const context = useContext(MyContext);

  const openFilter = () => {
    context?.setIsOpenFilters(!context?.isOpenFilters);
  };

  const openSearch = () => {
    setIsOpenSearch(!isOpenSearch);
  };

  return (
    <>
      <section className="newsLetterSection">
        <div className="container-fluid">
          <div className="box d-flex align-items-center">
            <div className="info">
              <h2>
                Stay home & get your daily <br />
               Agri needs from our shop
              </h2>
              <p>Start You'r Daily Shopping with Agri E-Store</p>
              <br />
              <Newsletter />
            </div>

            <div className="img">
              <img src={NewsletterImg} className="w-100" />
            </div>
          </div>
        </div>
      </section>

      <div className="footerWrapper">
        <div className="footerBoxes">
          <div className="container-fluid">
            <div className="row">
              <div className="col">
                <div className="box d-flex align-items-center w-100">
                  <span>
                    <img src={Icon1} />
                  </span>
                  <div className="info">
                    <h4>Best prices & offers</h4>
                    <p>Cheapest in town!</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="box d-flex align-items-center w-100">
                  <span>
                    <img src={Icon2} />
                  </span>
                  <div className="info">
                    <h4>Free Delivery  </h4>
                    <p>Orders 2000 or more</p>
                  </div>
                </div>
              </div>

              <div className="col">
                <div className="box d-flex align-items-center w-100">
                  <span>
                    <img src={Icon3} />
                  </span>
                  <div className="info">
                    <h4>Great daily deal</h4>
                    <p>Exciting deals for you! </p>
                  </div>
                </div>
              </div>

             

            </div>
          </div>
        </div>

        <footer>
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-3 part1">
                <Link to="/">
                  <img src={Logo} />
                </Link>
                <br />
                <br />
              
                <br />

                <p>
                  <LocationOnOutlinedIcon /> <strong>Address</strong>: 
                  TN Pepito St. Valencia City Bukidnon
                </p>
                <p>
                  <HeadphonesOutlinedIcon /> <strong>Call Us:</strong> (+63) -
                  9367469404{" "}
                </p>
                <p>
                  <EmailOutlinedIcon /> <strong>Email:</strong> lacanielcapstone@gmail.com
                </p>
                <p>
                  <WatchLaterOutlinedIcon /> <strong>Hours:</strong> 10:00 -
                  18:00, Mon - Sat
                </p>
              </div>
              </div>
            
            <hr />

            <div className="row lastStrip">
              <div className="col-md-6 part_1 d-flex align-items-center">
                <p className="mb-0">
                  © 2025,  All rights reserved
                </p>
              </div>

              <div className="col-md-6 part3 d-flex align-items-center justify-content-end  part_3">
                <div className="d-flex align-items-center">
                  <h5>Follow Us</h5>
                  <ul className="list list-inline">
                    <li className="list-inline-item">
                      <Link to={""}>
                        <FacebookOutlinedIcon />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to={""}>
                        <TwitterIcon />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to={""}>
                        <InstagramIcon />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to={""}>
                        <YouTubeIcon />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {context.windowWidth < 992 && context?.isBottomShow === true && (
        <div className="fixed-bottom-menu d-flex align-self-center justify-content-between">
          <Link to="/" onClick={() => context?.closeSearch()}>
            <Button className="circle">
              <div className="d-flex align-items-center justify-content-center flex-column">
                <IoHomeOutline />
                <span className="title">Home</span>
              </div>
            </Button>
          </Link>

          {context.enableFilterTab === true && (
            <Button className="circle" onClick={() => {
              openFilter();
              context?.closeSearch()
            }}>
              <div className="d-flex align-items-center justify-content-center flex-column">
                <CiFilter />
                <span className="title">Filters</span>
              </div>
            </Button>
          )}

          <Button className="circle" onClick={()=>context?.openSearch(true) }>
            <div className="d-flex align-items-center justify-content-center flex-column">
              <IoIosSearch />
              <span className="title">Search</span>
            </div>
          </Button>

          <Link to="/myList"  onClick={() => context?.closeSearch()}>
            <Button className="circle">
              <div className="d-flex align-items-center justify-content-center flex-column">
                <IoMdHeartEmpty />
                <span className="title">Wishlist</span>
              </div>
            </Button>
          </Link>

          <Link to="/orders"  onClick={() => context?.closeSearch()}>
          <Button className="circle">
            <div className="d-flex align-items-center justify-content-center flex-column">
              <IoBagCheckOutline />
              <span className="title">Orders</span>
            </div>
          </Button>
        </Link>
          

          <Link to="/my-account"  onClick={() => context?.closeSearch()}>
            <Button className="circle">
              <div className="d-flex align-items-center justify-content-center flex-column">
                <FaRegUser />
                <span className="title">Account</span>
              </div>
            </Button>
          </Link>
        </div>
      )}


    </>
  );
};

export default Footer;
