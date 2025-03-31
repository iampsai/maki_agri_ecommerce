import React, { useEffect, useContext } from "react";
import "./nav.css";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GridViewIcon from "@mui/icons-material/GridView";
import HeadphonesOutlinedIcon from "@mui/icons-material/HeadphonesOutlined";
import { useState } from "react";
import { MyContext } from "../../../App";
import { Category } from "@mui/icons-material";
import Logo from "../../../assets/images/logo.jpg";
import Select from "../../selectDrop/select";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useNavigate } from "react-router-dom";

const Nav = (props) => {
  const [navData, setNavData] = useState([]);
  const [isOpenNav, setIsOpenNav] = useState(false);
  const [windowWidth, setWindowWidth] = useState();
  const [openDropdownMenu, setDropdownMenu] = useState(false);
  const [openDropdownMenuIndex, setDropdownMenuIndex] = useState(null);
  const [isopenSidebarVal, setisopenSidebarVal] = useState(false);

  const [openMegaMenu, setOpenMegaMenu] = useState(false);

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    setNavData(props.data);
    setWindowWidth()
  }, []);


  useEffect(() => {
    setWindowWidth(context.windowWidth)
  }, [context.windowWidth]);

  useEffect(() => {
    setIsOpenNav(props.openNav);
  }, [props.openNav]);

  const closeNav = () => {
    props.closeNav();
    setDropdownMenu(false);
    setDropdownMenuIndex(null);
  };

  const openDropdownFun = (index) => {
    setDropdownMenu(!openDropdownMenu);
    setDropdownMenuIndex(index);
  };
  const selectedSelectBoxItem = (name, id) => {
    if (name === "Your Location") {
      localStorage.setItem("location", "All");
    } else {
      localStorage.setItem("location", name);
    }
    window.location.href = window.location.href;
  };

  const logout = () => {
    context.setIsLogin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    history("/signIn");
  };

  return (
    <>
    {
      isOpenNav === true && <div className='navbarOverlay' onClick={closeNav}></div>
  }

      <div className={`nav d-flex align-items-center`}>
        <div className="container-fluid">
          <div className="row position-relative">
            <div className="col-sm-2 part1 d-flex align-items-center">
              <Button className="bg-g text-white catTab res-hide" onClick={() => setisopenSidebarVal(!isopenSidebarVal)}>
                <GridViewIcon /> &nbsp;Browse All Categories{" "}
                <KeyboardArrowDownIcon />
              </Button>

              <div
                className={`sidebarNav ${
                  isopenSidebarVal === true ? "open" : ""
                }`}
              >
                <ul>
                  {navData.length !== 0 && navData?.map((item, index) => {
                    return (
                      <li key={index}>
                        <Link to={`/products/category/${item?._id}`}>
                          <Button>
                            <img
                              src={item?.images[0]}
                              width="20"
                              className="mr-2"
                            />{" "}
                            {item?.name} <KeyboardArrowDownIcon className="ml-auto" />
                          </Button>
                        </Link>
                        {item?.children?.length !== 0 && (
                          <div className="submenu">
                            {item?.children?.map((subCat, key) => {
                              return (
                                <Link
                                  to={`/products/subCat/${subCat?._id}`}
                                  key={key}
                                >
                                  <Button>{subCat?.name}</Button>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>


            </div>

            <div className="col-sm-8 part2 position-static">
              <nav className={isOpenNav === true ? "open" : ""}>
                {context?.windowWidth < 992 && (
                  <>
                    <div className="p-3" onClick={closeNav}>
                      <Link to="/">
                        <img src={Logo} />
                      </Link>
                    </div>

                    {props?.countryData.length !== 0 && (
                      <div className="pl-3 w-100 mb-3">
                        <div className="countryWrapper w-100">
                          <Select
                            data={props?.countryData}
                            placeholder={"All"}
                            icon={
                              <LocationOnOutlinedIcon
                                style={{ opacity: "0.5" }}
                              />
                            }
                            view="country"
                            selectedSelectBoxItem={selectedSelectBoxItem}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <ul className="list list-inline mb-0">
                  {context?.windowWidth > 992 && (
                    <li className="list-inline-item">
                      <Button>
                        <Link to={"/"}>Home</Link>
                      </Button>
                    </li>
                  )}

                  {navData.length !== 0 &&
                    navData
                      .filter((item, idx) => idx < 6)
                      .map((item, index) => {
                        return (
                          <li className="list-inline-item" key={index}>
                            <Button onClick={() => openDropdownFun(index)}>
                              <Link to={`/products/category/${item?.id}`} onClick={closeNav}>
                                {context?.windowWidth < 992 && (
                                  <img
                                    src={item?.images[0]}
                                    alt="image"
                                    width="20"
                                    className="mr-2"
                                  />
                                )}
                                {item?.name}
                              </Link>
                              {item?.children?.length !== 0 && (
                                  <KeyboardArrowDownIcon
                                    className={`rotateIcon`}
                                  />
                                )}

                            </Button>

                            {item?.children?.length !== 0 && (
                              <div
                                className={`dropdown_menu ${
                                  openDropdownMenu === true &&
                                  openDropdownMenuIndex === index &&
                                  "open"
                                }`}
                              >
                                <ul className="mb-0">
                                  {item?.children?.map((item_, index_) => {
                                    return (
                                      <li key={index_}>
                                        <Button>
                                          <Link
                                            to={`/products/subCat/${item_?.id}`}
                                            onClick={closeNav}
                                          >
                                            {item_.name}
                                          </Link>
                                        </Button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </li>
                        );
                      })}

                  {context?.windowWidth > 992 && (
                    <li className="list-inline-item position-static">
                      <Button onClick={() => setOpenMegaMenu(!openMegaMenu)}>
                        <Link>
                          Shop{" "}
                          <KeyboardArrowDownIcon
                            className={`${
                              openMegaMenu === true && "rotateIcon"
                            }`}
                          />
                        </Link>
                      </Button>
                      <div
                        className={`dropdown_menu megaMenu w-100 ${
                          openMegaMenu === true && "open"
                        }`}
                      >
                        <div className="row">
                          {navData?.length !== 0 &&
                            navData
                              ?.filter((item, idx) => idx < 5)
                              .map((item, index) => {
                                return (
                                  <div className="col" key={index}>
                                    <Link to={`/products/category/${item?.id}`}>
                                      <h4 className="text-g text-capitalize">
                                        {item?.name}
                                      </h4>
                                    </Link>

                                    {item?.children?.length !== 0 && (
                                      <ul className="mt-2 mb-0">
                                        {item?.children?.map(
                                          (item_, index_) => {
                                            return (
                                              <li key={index_}>
                                                <Link
                                                  to={`/products/subCat/${item_?.id}`}
                                                >
                                                  {item_?.name}
                                                </Link>
                                              </li>
                                            );
                                          }
                                        )}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                        </div>
                      </div>
                    </li>
                  )}
                </ul>

                {windowWidth < 992 && (
                  <>
                    {context.isLogin !== true ? 
                      <div className="pl-3 pr-3 mt-4">
                    
                        <Link to={"/signIn"}>
                          <Button
                            className="btn btn-g btn-lg w-100"
                            onClick={closeNav}
                          >
                            Sign In
                          </Button>
                        </Link>
                      </div>:

                      <div className="pl-3 pr-3 mt-4">
                       
                          <Button
                            className="btn btn-g btn-lg w-100"
                            onClick={()=>{
                              closeNav();
                              logout()
                              }}
                          >
                            Logout
                          </Button>
                 
                      </div>

                    }
                  </>
                )}
              </nav>
            </div>

            
          </div>
        </div>
      </div>
    </>
  );
};

export default Nav;
