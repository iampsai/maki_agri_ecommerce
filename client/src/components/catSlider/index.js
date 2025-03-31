import React, { useEffect, useRef, useState,useContext } from 'react';
import Slider from "react-slick";
import './style.css';
import { Link } from 'react-router-dom';

import { MyContext } from '../../App';
const CatSlider = (props) => {

    const [catData, setCatData] = useState([]);
    const context = useContext(MyContext);

    const slider = useRef();


    var settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow:8,
        slidesToScroll: 1,
        fade: false,
        arrows: context.windowWidth>992 ? true : false,
        autoplay: context.windowWidth>992 ? 2000 : false,
    };


    useEffect(()=>{
        setCatData(props.data)
    },[props.data]);



    return (
        <>
            <div className='catSliderSection'>
                <div className='container-fluid' ref={slider}>
                    <h2 className='hd'>Featured Categories</h2>
                    <Slider {...settings} className='cat_slider_Main' id="cat_slider_Main" >


                        {
                            catData?.length !== 0 &&
                            catData?.map((cat, index) => {
                                return (
                                    <div className='item' key={index} >
                                        <Link to={`/products/category/${cat.id}`}>
                                            <div className='info' style={{ background: cat?.color }}>
                                                <img src={cat?.images[0]}  width="80" />
                                            </div>
                                            <h5 className='text-capitalize'>{cat?.name}</h5>
                                        </Link>

                                    </div>
                                )
                            })
                        }







                        {
                            //    itemBg.length!==0 && itemBg.map((item,index)=>{
                            //     return(
                            //         <div className='item'>
                            //         <div className='info'  style={{background:item}}>
                            //             <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-13.png'/>
                            //             <h5>Cake & Milk</h5>
                            //             <p>26 items</p>
                            //         </div>
                            //     </div>
                            //     )
                            //    }) 
                        }


                        {/* <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-12.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>

                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-11.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-9.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-3.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-1.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-2.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-4.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-13.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-5.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>

                        
                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-2.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-4.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-13.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div>


                        <div className='item'>
                            <div className='info'>
                                <img src='https://wp.alithemes.com/html/nest/demo/assets/imgs/shop/cat-5.png'/>
                                <h5>Cake & Milk</h5>
                                <p>26 items</p>
                            </div>
                        </div> */}


                    </Slider>
                </div >
            </div >



        </>
    )
}

export default CatSlider;