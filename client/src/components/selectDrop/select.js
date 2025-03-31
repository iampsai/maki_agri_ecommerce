import React, { useEffect, useState } from 'react';
import '../selectDrop/select.css';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import { FamilyRestroomTwoTone } from '@mui/icons-material';


const Select = ({data,placeholder, icon, view, selectedSelectBoxItem}) => {

    const [isOpenSelect, setisOpenSelect] = useState(false);
    const [selectedIndex, setselectedIndex] = useState(0);
    const [selectedItem, setselectedItem] = useState("");

    const [listData, setListData] = useState([]);
    const [listData2, setListData2] = useState([]);

    const openSelect = () => {
        setisOpenSelect(!isOpenSelect);
    }

    useEffect(()=>{
        if(data.length!==0){
            setListData(data);
            setListData2(data);
        }
        setselectedItem(placeholder);
    },[data]);

    useEffect(()=>{
        setselectedItem(localStorage.getItem('location'));
        setselectedIndex(parseInt(localStorage.getItem('locationTabIndex')));
    },[selectedItem,selectedIndex])

    const closeSelect = (index, name, id) => {
        localStorage.setItem('locationTabIndex',index)
        setselectedIndex(index);
        setisOpenSelect(false);
        setselectedItem(name);
        selectedSelectBoxItem(name, id);
    }

    const filterList=(e)=>{
        const keyword = e.target.value.toLowerCase();
        
        const list = listData2.filter((item)=>{
            return item.country?.toLowerCase().includes(keyword);
        })

        const list2 = list.filter((item, index) => list.indexOf(item) === index);

        setListData(list2)

    }

    return (
        <ClickAwayListener onClickAway={()=>setisOpenSelect(false)}>
            <div className='selectDropWrapper cursor position-relative'>
                {icon}
                <span className='openSelect' onClick={openSelect}>{selectedItem?.length>25 ? selectedItem?.substr(0,25)+'...' :  selectedItem} 
                <KeyboardArrowDownIcon className='arrow' /></span>
                {
                    isOpenSelect === true &&
                    <div className='selectDrop'>
                        <div className='searchField'>
                            <input type='text' placeholder='Search here...' onChange={filterList}/>
                        </div>
                        <ul className='searchResults'>
                        <li key={0} onClick={() => closeSelect(0, placeholder, '')} className={`${selectedIndex === 0 ? 'active' : ''}`}>{placeholder}</li> 
                        {
                            
                            listData.map((item,index)=>{
                              console.log(item)
                                return(
                                    <li key={index+1} onClick={() => closeSelect(index+1, item?.iso2, item?._id)} className={`${selectedIndex === index+1 ? 'active' : ''}`}>
                                        {item?.country}
                                    </li> 
                                )
                            })
                        }

                          
                        </ul>
                    </div>
                }

            </div>
        </ClickAwayListener>

    )
}

export default Select;