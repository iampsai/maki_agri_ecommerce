import React, { useEffect, useState, createContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./responsive.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Home from "./pages/Home/index";
import About from "./pages/About/index";
import Listing from "./pages/Listing";
import NotFound from "./pages/NotFound";
import DetailsPage from "./pages/Details";
import Checkout from "./pages/checkout";
import axios from "axios";
import Cart from "./pages/cart";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import MyList from "./pages/myList";
import Loader from "./assets/images/loading.gif";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { fetchDataFromApi, postData } from "./utils/api";
import SearchPage from "./pages/Search";
import Orders from "./pages/Orders";
import MyAccount from "./pages/MyAccount";
import VerifyAccount from "./pages/VerifyAccount";
import ForgotPassword from "./pages/forgotPassword";
import { AuthProvider } from "./contexts/AuthContext";
import ChatBox from "./components/ChatBox";
import Rider from "./pages/Rider";
import RiderDashboard from "./pages/Rider/Dashboard";

const MyContext = createContext();

function App() {
  const [productData, setProductData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsloading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedCountry, setselectedCountry] = useState("");
  const [user, setUser] = useState();

  const [isopenNavigation, setIsopenNavigation] = useState(false);

  const [isLogin, setIsLogin] = useState();
  const [isOpenFilters, setIsOpenFilters] = useState(false);
  const [isBottomShow, setIsBottomShow] = useState(true);

  const [cartTotalAmount, setCartTotalAmount] = useState();
  const [isAddingInCart, setIsAddingInCart] = useState(false);
  const [myListData, setMyListData] = useState([]);

  const [searchItems, setSearchItems] = useState([]);
  const [enableFilterTab, setEnableFilterTab] = useState(false);
  const [isOpenSearch, setOpenSearch] = useState(false);

  const [alertBox, setAlertBox] = useState({
    msg: "",
    error: false,
    open: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);

      const userData = JSON.parse(localStorage.getItem("user"));

      setUser(userData);
      getMyListData();
    } else {
      setIsLogin(false);
    }
  }, [isLogin]);

  useEffect(() => {
    fetchDataFromApi("/api/category/").then((res) => {
      setCategories(res);
    });

    getCartData();

    const location = localStorage.getItem("location");
    if (location !== null && location !== "" && location !== undefined) {
      setselectedCountry(location);
    } else {
      setselectedCountry("All");
      localStorage.setItem("location", "All");
    }
  }, []);

  const getMyListData = () => {
    if (user?.userId) {
      fetchDataFromApi(`/api/my-list?userId=${user?.userId}`).then((res) => {
        if (res?.length !== 0) {
          setMyListData(res);
        }
      });
    }
  };

  const getCartData = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.userId) {
      fetchDataFromApi(`/api/cart?userId=${user?.userId}`).then((res) => {
        setCartItems(res);
      });
    }
  };

  const addToCart = async (items) => {
    if (isLogin !== false) {
      setIsAddingInCart(true);
      postData(`/api/cart/add`, items).then((res) => {
        if (res.status !== false) {
          setAlertBox({
            open: true,
            error: false,
            msg: "Item is added in the cart",
          });

          setTimeout(() => {
            setIsAddingInCart(false);
          }, 500);

          getCartData();
        } else {
          setAlertBox({
            open: true,
            error: true,
            msg: res.msg,
          });

          setTimeout(() => {
            setIsAddingInCart(false);
          }, 500);
        }
      });
    } else {
      setAlertBox({
        open: true,
        error: true,
        msg: "Please login first",
      });

      setTimeout(() => {
        setIsAddingInCart(false);
      }, 500);
    }
  };

  const signIn = () => {
    const is_Login = localStorage.getItem("isLogin");
    // setIsLogin(is_Login);
    // Coerce stored value to boolean (localStorage stores strings)
    setIsLogin(is_Login === "true" || is_Login === true);
  };

  const signOut = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLogin(false);
    setUser(null);
  };

  const openFilters = () => {
    setIsOpenFilters(!isOpenFilters);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setAlertBox({
      open: false,
    });
  };

  const openSearch = () => {
    setOpenSearch(true);
  };

  const closeSearch = () => {
    setOpenSearch(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const value = {
    windowWidth,
    categories,
    addToCart,
    signOut,
    signIn,
    openFilters,
    isopenNavigation,
    setIsopenNavigation,
    setCartTotalAmount,
    cartTotalAmount,
    setCartItems,
    cartItems,
    setselectedCountry,
    selectedCountry,
    alertBox,
    setAlertBox,
    setIsLogin,
    isLogin,
    setUser,
    user,
    setIsAddingInCart,
    isAddingInCart,
    getCartData,
    setMyListData,
    myListData,
    searchItems,
    setSearchItems,
    setEnableFilterTab,
    enableFilterTab,
    setIsOpenFilters,
    isOpenFilters,
    setIsBottomShow,
    isBottomShow,
    openSearch,
    closeSearch,
    isOpenSearch,
  };

  console.log("isLogin", isLogin);

  return (
    <div className="App">
      <MyContext.Provider value={value}>
        <AuthProvider>
          <BrowserRouter>
            <Header />
            <Snackbar
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={alertBox.open}
              autoHideDuration={6000}
              onClose={handleClose}
            >
              <Alert
                onClose={handleClose}
                severity={alertBox.error ? "error" : "success"}
                sx={{ width: "100%" }}
              >
                {alertBox.msg}
              </Alert>
            </Snackbar>
            <Routes>
              <Route exact={true} path="/" element={<Home />} />
              <Route
                exact={true}
                path="/products/category/:id"
                element={<Listing single={true} />}
              />
              <Route
                exact={true}
                path="/products/subCat/:id"
                element={<Listing single={false} />}
              />
              <Route exact={true} path="/product/:id" element={<DetailsPage />} />
              <Route exact={true} path="/cart" element={<Cart />} />
              <Route exact={true} path="/signIn" element={<SignIn />} />
              <Route exact={true} path="/signUp" element={<SignUp />} />
              <Route exact={true} path="/myList" element={<MyList />} />
              <Route exact={true} path="/checkout" element={<Checkout />} />
              <Route exact={true} path="/search" element={<SearchPage />} />
              <Route exact={true} path="/orders" element={<Orders />} />
              <Route exact={true} path="/my-account" element={<MyAccount />} />
              <Route exact={true} path="/verifyAccount" element={<VerifyAccount />} />
              <Route exact={true} path="/forgotPassword" element={<ForgotPassword />} />
              <Route exact={true} path="/rider" element={<Rider />} />
              <Route exact={true} path="/rider/dashboard" element={<RiderDashboard />} />
              <Route exact={true} path="*" element={<NotFound />} />
            </Routes>
            <Footer />
            {isLogin && <ChatBox />}
          </BrowserRouter>
        </AuthProvider>
      </MyContext.Provider>
    </div>
  );
}

export default App;

export { MyContext };
