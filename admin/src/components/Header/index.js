import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/icon.png";
import Button from "@mui/material/Button";
import { MdMenuOpen, MdOutlineMenu, MdOutlineLightMode, MdNightlightRound } from "react-icons/md";
import { FaRegBell } from "react-icons/fa6";
import { IoMenu, IoShieldHalfSharp } from "react-icons/io5";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Logout from "@mui/icons-material/Logout";
import Divider from "@mui/material/Divider";
import { MyContext } from "../../App";
import UserAvatarImgComponent from "../userAvatarImg";
import { fetchDataFromApi, editData } from "../../utils/api";

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const openMyAcc = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchorEl);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const context = useContext(MyContext);
  const navigate = useNavigate();

  const handleOpenMyAccDrop = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMyAccDrop = () => setAnchorEl(null);

  const handleOpenNotificationsDrop = (event) => setNotificationAnchorEl(event.currentTarget);
  const handleCloseNotificationsDrop = () => setNotificationAnchorEl(null);

  const loadNotifications = async () => {
    try {
      const res = await fetchDataFromApi("/api/notifications");
      if (!res) return;
      if (res.success === true && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount ?? res.data.filter((n) => !n.isRead).length);
      } else if (Array.isArray(res)) {
        setNotifications(res);
        setUnreadCount(res.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTheme = () => {
    if (context.theme === "dark") context.setTheme("light");
    else context.setTheme("dark");
  };

  const logout = () => {
    localStorage.clear();
    setAnchorEl(null);
    context.setAlertBox({ open: true, error: false, msg: "Logout successful" });
    setTimeout(() => navigate("/login"), 800);
  };

  return (
    <header className="d-flex align-items-center">
      <div className="container-fluid w-100">
        <div className="row d-flex align-items-center w-100">
          <div className="col-sm-2 part1 pr-0">
            <Link to={"/"} className="d-flex align-items-center logo">
              <img src={logo} alt="logo" />
              <span className="ml-2">RAS Admin</span>
            </Link>
          </div>

          {context.windowWidth > 992 && (
            <div className="col-sm-3 d-flex align-items-center part2">
              <Button className="rounded-circle mr-3" onClick={() => context.setIsToggleSidebar(!context.isToggleSidebar)}>
                {context.isToggleSidebar === false ? <MdMenuOpen /> : <MdOutlineMenu />}
              </Button>
            </div>
          )}

          <div className="col-sm-7 d-flex align-items-center justify-content-end part3">
            <Button className="rounded-circle mr-3" onClick={changeTheme}>
              {context.theme === "light" ? <MdNightlightRound /> : <MdOutlineLightMode />}
            </Button>

            <div className="dropdownWrapper position-relative">
              <Button className="rounded-circle mr-3" onClick={handleOpenNotificationsDrop}>
                <FaRegBell />
                {unreadCount > 0 && <span className="notificationBadge">{unreadCount}</span>}
              </Button>

              {context.windowWidth < 992 && (
                <Button className="rounded-circle mr-3" onClick={() => context.openNav()}>
                  <IoMenu />
                </Button>
              )}

              <Menu
                anchorEl={notificationAnchorEl}
                className="notifications dropdown_list"
                id="notifications"
                open={openNotifications}
                onClose={handleCloseNotificationsDrop}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <div className="head pl-3 pb-0 d-flex justify-content-between align-items-center">
                  <h4>Notifications ({unreadCount})</h4>
                  <div>
                    <Button
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await editData("/api/notifications/read-all", {});
                        await loadNotifications();
                        context.setAlertBox({ open: true, error: false, msg: "All notifications marked as read" });
                      }}
                    >
                      Mark all read
                    </Button>
                  </div>
                </div>

                <Divider className="mb-1" />

                <div className="scroll">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((item) => (
                      <MenuItem
                        key={item._id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await editData(`/api/notifications/${item._id}/read`, {});
                          } catch (err) {}
                          await loadNotifications();
                          if (item.orderId) navigate("/orders");
                        }}
                      >
                        <div className="d-flex w-100">
                          <div>
                            <UserAvatarImgComponent img={item.img || ""} />
                          </div>

                          <div className="dropdownInfo">
                            <h4>
                              <span>
                                <b>{item.title}</b>
                              </span>
                            </h4>
                            <p className="text-sky mb-0">{new Date(item.createdAt).toLocaleString()}</p>
                            <p className="mb-0">{item.message}</p>
                          </div>
                        </div>
                      </MenuItem>
                    ))
                  ) : (
                    <div className="px-3 py-2">No notifications</div>
                  )}
                </div>

                <div className="pl-3 pr-3 w-100 pt-2 pb-1">
                  <Link to="/notifications">
                    <Button className="btn-blue w-100">View all notifications</Button>
                  </Link>
                </div>
              </Menu>
            </div>

            {context.isLogin !== true ? (
              <Link to={"/login"}>
                <Button className="btn-blue btn-lg btn-round">Sign In</Button>
              </Link>
            ) : (
              <div className="myAccWrapper">
                <Button className="myAcc d-flex align-items-center" onClick={handleOpenMyAccDrop}>
                  <div className="userImg">
                    <span className="rounded-circle">{context.user?.name?.charAt(0)}</span>
                  </div>
                  <div className="userInfo res-hide">
                    <h4>{context.user?.name}</h4>
                    <p className="mb-0">{context.user?.email}</p>
                  </div>
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={openMyAcc}
                  onClose={handleCloseMyAccDrop}
                  onClick={handleCloseMyAccDrop}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem onClick={handleCloseMyAccDrop}>
                    <Link to="/my-account">
                      <ListItemIcon>
                        <PersonAdd fontSize="small" />
                      </ListItemIcon>
                      My Account
                    </Link>
                  </MenuItem>
                  <MenuItem onClick={handleCloseMyAccDrop}>
                    <ListItemIcon>
                      <IoShieldHalfSharp />
                    </ListItemIcon>
                    Reset Password
                  </MenuItem>
                  <MenuItem onClick={logout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
