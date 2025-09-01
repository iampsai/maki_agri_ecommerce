import Button from "@mui/material/Button";
import { MdDashboard } from "react-icons/md";
import { FaAngleRight } from "react-icons/fa6";
import { FaProductHunt } from "react-icons/fa";
import { FaCartArrowDown } from "react-icons/fa6";
import { Link, NavLink } from "react-router-dom";
import { useContext, useState } from "react";
import { IoMdLogOut } from "react-icons/io";
import { MyContext } from "../../App";
// ...existing imports
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Badge from '@mui/material/Badge';
import { fetchDataFromApi } from "../../utils/api";
import { BiSolidCategory } from "react-icons/bi";
import { TbSlideshow } from "react-icons/tb";
import { FaUsersCog } from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import { FaChartBar } from "react-icons/fa";
import { MdOutlineChat } from "react-icons/md";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isToggleSubmenu, setIsToggleSubmenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");

  const context = useContext(MyContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOpenSubmenu = (index) => {
    setActiveTab(index);
    if (activeTab === index) {
      setIsToggleSubmenu(!isToggleSubmenu);
    } else {
      setIsToggleSubmenu(false);
      setIsToggleSubmenu(true);
    }

  };
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!(token === "" || token === undefined || token === null)) {
      // token exists; proceed
    } else {
      history("/login");
    }

    // Check for user data and role
    checkUserRole();
  }, [history]);

  // Fetch unread chat messages count for badge
  useEffect(() => {
    let mounted = true;

    const normalizeMessages = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (res.data && Array.isArray(res.data)) return res.data;
      if (res.messages && Array.isArray(res.messages)) return res.messages;
      if (res.result && Array.isArray(res.result)) return res.result;
      if (res.data && res.data.messages && Array.isArray(res.data.messages)) return res.data.messages;
      return [];
    };

    const doFetch = async () => {
      try {
        const res = await fetchDataFromApi("/api/chat/admin/messages");
        const messages = normalizeMessages(res);
        const count = messages.filter((m) => {
          // handle boolean, string, numeric representations
          return m && (m.isRead === false || m.isRead === 'false' || m.isRead === 0 || m.isRead === '0');
        }).length;
        if (mounted) setUnreadCount(count);
      } catch (err) {
        console.debug("Sidebar: failed to load chat messages for badge", err && err.message ? err.message : err);
      }
    };

    doFetch();

    // Listen for updates triggered elsewhere in the app
    const onChatUpdated = () => {
      doFetch();
    };

    window.addEventListener('chat:updated', onChatUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('chat:updated', onChatUpdated);
    };
  }, [context.user]);

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
            <NavLink to="/" className={({ isActive }) => (isActive ? 'is-active' : '')}>
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
              className={`w-100 ${activeTab === 2 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 2 && isToggleSubmenu === true
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
              className={`w-100 ${activeTab === 3 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 3 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
                }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    to="/products"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Product List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                      to="/product/upload"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                    Product Upload
                  </NavLink>
                </li>

                <li>
                  <NavLink
                      to="/productWEIGHT/add"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                    Add Product WEIGHT
                  </NavLink>
                </li>
                <li>
                  <NavLink
                      to="/productSIZE/add"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                    Add Product SIZE
                  </NavLink>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <NavLink to="/orders" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              <Button
                className={`w-100 ${activeTab === 4 && isToggleSubmenu === true ? "active" : ""
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
              <NavLink to="/stock-management" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                <Button
                  className={`w-100 ${activeTab === 9 && isToggleSubmenu === true ? "active" : ""
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
            <>
              <li>
                <NavLink to="/reports" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                  <Button
                    className={`w-100 ${activeTab === 10 && isToggleSubmenu === true ? "active" : ""
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
              <li>
              <NavLink to="/chat" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                  <Button
                    className={`w-100 ${
                      activeTab === 11 && isToggleSubmenu === true ? "active" : ""
                    }`}
                    onClick={() => {
                      isOpenSubmenu(11);
                      context.setIsOpenNav(false);
                    }}
                  >
                    <span className="icon">
                      <MdOutlineChat />
                    </span>
                    <Badge color="error" badgeContent={unreadCount} max={99}>
                      <span>Chat Support</span>
                    </Badge>
                  </Button>
              </NavLink>
            </li>
            </>
          )}

          {/* User Management - Only visible to admin users */}
          {isAdmin && userRole === 'admin' && (
            <li>
              <Button
                className={`w-100 ${activeTab === 8 && isToggleSubmenu === true ? "active" : ""
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
                className={`submenuWrapper ${activeTab === 8 && isToggleSubmenu === true
                    ? "colapse"
                    : "colapsed"
                  }`}
              >
                <ul className="submenu">
                  <li>
                    <NavLink
                      to="/users"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                      User List
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/user/add"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                      Add User
                    </NavLink>
                  </li>

                  <li>
                    <NavLink
                      to="/user/add-rider"
                      className={({ isActive }) => (isActive ? 'is-active' : '')}
                      onClick={() => context.setIsOpenNav(false)}
                    >
                      Add Rider
                    </NavLink>
                  </li>
                </ul>
              </div>
            </li>
          )}

          <li>
            <Button
              className={`w-100 ${activeTab === 5 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 5 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
                }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    to="/banners"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/banners/add"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
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
              className={`w-100 ${activeTab === 1 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 1 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
                }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    to="/homeBannerSlide/add"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Add Home Banner Slide
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/homeBannerSlide/list"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
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
              className={`w-100 ${activeTab === 6 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 6 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
                }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    to="/homeSideBanners"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/homeSideBanners/add"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
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
              className={`w-100 ${activeTab === 7 && isToggleSubmenu === true ? "active" : ""
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
              className={`submenuWrapper ${activeTab === 7 && isToggleSubmenu === true
                  ? "colapse"
                  : "colapsed"
                }`}
            >
              <ul className="submenu">
                <li>
                  <NavLink
                    to="/homeBottomBanners"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                    onClick={() => context.setIsOpenNav(false)}
                  >
                    Banners List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/homeBottomBanners/add"
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
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
