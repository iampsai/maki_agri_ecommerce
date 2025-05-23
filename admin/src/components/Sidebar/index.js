import Button from "@mui/material/Button";
import { MdDashboard } from "react-icons/md";
import { FaAngleRight } from "react-icons/fa6";
import { FaProductHunt } from "react-icons/fa";
import { FaCartArrowDown } from "react-icons/fa6";
import { MdMessage } from "react-icons/md";
import { FaBell } from "react-icons/fa6";
import { IoIosSettings } from "react-icons/io";
import { Link, NavLink } from "react-router-dom";
import { useContext, useState } from "react";
import { IoMdLogOut } from "react-icons/io";
import { MyContext } from "../../App";
import { FaClipboardCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BiSolidCategory } from "react-icons/bi";
import { TbSlideshow } from "react-icons/tb";
import { FaUsersCog } from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import { FaChartBar } from "react-icons/fa";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isToggleSubmenu, setIsToggleSubmenu] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");

  const context = useContext(MyContext);

  const isOpenSubmenu = (index) => {
    setActiveTab(index);
    if(activeTab===index){
      setIsToggleSubmenu(!isToggleSubmenu);
    }else{
      setIsToggleSubmenu(false);
      setIsToggleSubmenu(true);
    }
   
  };
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);
    } else {
      history("/login");
    }
    
    // Check for user data and role
    checkUserRole();
  }, []);
  
  // Add a separate function to check user role that can be called when context changes
  const checkUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        // Store the role for debugging
        const role = userData.role || (userData.isAdmin ? 'admin' : 'user');
        setUserRole(role);
        
        // Strict check for admin role only
        const isUserAdmin = role === 'admin' || userData.isAdmin === true;
        setIsAdmin(isUserAdmin);
        console.log("User role:", role, "isAdmin:", isUserAdmin);
      } else {
        setIsAdmin(false);
        setUserRole("");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setIsAdmin(false);
      setUserRole("");
    }
  };
  
  // Re-check user role when context.user changes
  useEffect(() => {
    checkUserRole();
  }, [context.user]);

  const logout = () => {
    localStorage.clear();

    context.setAlertBox({
      open: true,
      error: false,
      msg: "Logout successfull",
    });

    setTimeout(() => {
      history("/login");
    }, 2000);
  };

  return (
    <>
      <div className="sidebar">
        <ul>
          <li>
            <NavLink exact activeClassName="is-active" to="/">
              <Button
                className={`w-100 ${activeTab === 0 ? "active" : ""}`}
                onClick={() => {
                  isOpenSubmenu(0);
                  context.setIsOpenNav(false);
                }}
              >
                <span className="icon">
                  <MdDashboard />
                </span>
                Dashboard
              </Button>
            </NavLink>
          </li>

          <li>
            <Button
              className={`w-100 ${
                activeTab === 2 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(2)}
            >
              <span className="icon">
                <BiSolidCategory />
              </span>
              Category
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 2 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <Link
                    to="/category"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Category List
                  </Link>
                </li>
                <li>
                  <Link
                    to="/category/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add a category
                  </Link>
                </li>
                <li>
                  <Link
                    to="/subCategory"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Sub Category List
                  </Link>
                </li>
                <li>
                  <Link
                    to="/subCategory/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add a sub category
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <Button
              className={`w-100 ${
                activeTab === 3 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(3)}
            >
              <span className="icon">
                <FaProductHunt />
              </span>
              Products
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 3 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/products"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Product List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/product/upload"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Product Upload
                  </NavLink>
                </li>
        
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/productWEIGHT/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add Product WEIGHT
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/productSIZE/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add Product SIZE
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <NavLink exact activeClassName="is-active" to="/orders">
              <Button
                className={`w-100 ${
                  activeTab === 4 && isToggleSubmenu === true ? "active" : ""
                }`}
                onClick={() => {
                  isOpenSubmenu(4);
                  context.setIsOpenNav(false);
                }}
              >
                <span className="icon">
                  <FaCartArrowDown />
                </span>
                Orders
              </Button>
            </NavLink>
          </li>

          {/* Stock Management - Visible to both staff and admin */}
          {(userRole === 'staff' || userRole === 'admin') && (
            <li>
              <NavLink exact activeClassName="is-active" to="/stock-management">
                <Button
                  className={`w-100 ${
                    activeTab === 9 && isToggleSubmenu === true ? "active" : ""
                  }`}
                  onClick={() => {
                    isOpenSubmenu(9);
                    context.setIsOpenNav(false);
                  }}
                >
                  <span className="icon">
                    <MdInventory />
                  </span>
                  Stock Management
                </Button>
              </NavLink>
            </li>
          )}

          {/* Reports - Only visible to admin users */}
          {(userRole === 'admin' || userRole === 'staff') && (
            <li>
              <NavLink exact activeClassName="is-active" to="/reports">
                <Button
                  className={`w-100 ${
                    activeTab === 10 && isToggleSubmenu === true ? "active" : ""
                  }`}
                  onClick={() => {
                    isOpenSubmenu(10);
                    context.setIsOpenNav(false);
                  }}
                >
                  <span className="icon">
                    <FaChartBar />
                  </span>
                  Reports
                </Button>
              </NavLink>
            </li>
          )}
          
          {/* User Management - Only visible to admin users */}
          {isAdmin && userRole === 'admin' && (
            <li>
              <Button
                className={`w-100 ${
                  activeTab === 8 && isToggleSubmenu === true ? "active" : ""
                }`}
                onClick={() => isOpenSubmenu(8)}
              >
                <span className="icon">
                  <FaUsersCog />
                </span>
                User Management
                <span className="arrow">
                  <FaAngleRight />
                </span>
              </Button>
              <div
                className={`submenuWrapper ${
                  activeTab === 8 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                }`}
              >
                <ul className="submenu">
                  <li>
                    <NavLink
                      exact
                      activeClassName="is-active"
                      to="/users"
                      onClick={() => context.setIsOpenNav(false)}
                    >
                      User List
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      exact
                      activeClassName="is-active"
                      to="/users/add"
                      onClick={() => context.setIsOpenNav(false)}
                    >
                      Add User
                    </NavLink>
                  </li>
                </ul>
              </div>
            </li>
          )}

          <li>
            <Button
              className={`w-100 ${
                activeTab === 5 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(5)}
            >
              <span className="icon">
                <TbSlideshow />
              </span>
              Home Banners
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 5 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/banners"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/banners/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banner Upload
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <Button
              className={`w-100 ${
                activeTab === 1 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(1)}
            >
              <span className="icon">
                <TbSlideshow />
              </span>
              Home Banner Slides
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 1 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeBannerSlide/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add Home Banner Slide
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeBannerSlide/list"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Home Slides List
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <Button
              className={`w-100 ${
                activeTab === 6 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(6)}
            >
              <span className="icon">
                <TbSlideshow />
              </span>
              Home Side Banners
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 6 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeSideBanners"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeSideBanners/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banner Upload
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <Button
              className={`w-100 ${
                activeTab === 7 && isToggleSubmenu === true ? "active" : ""
              }`}
              onClick={() => isOpenSubmenu(7)}
            >
              <span className="icon">
                <TbSlideshow />
              </span>
              Home Bottom Banners
              <span className="arrow">
                <FaAngleRight />
              </span>
            </Button>
            <div
              className={`submenuWrapper ${
                activeTab === 7 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
              }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeBottomBanners"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to="/homeBottomBanners/add"
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banner Upload
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>
        </ul>

        <div className="logoutWrapper">
          <div className="logoutBox">
            <Button
              variant="contained"
              onClick={() => {
                logout();
                context.setIsOpenNav(false);
              }}
            >
              <IoMdLogOut /> Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
