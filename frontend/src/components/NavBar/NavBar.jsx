import styles from "./NavBar.module.css";
import logo from "../../../public/LOGO.svg";

import Notification from "../../../public/notification.svg"
import { useNavigate } from 'react-router-dom'

const NavBar = () => {
   
   
 


  const navigate = useNavigate();

  const handleBackToHomePage =()=>{
    navigate("../Home");
  }
  
  const handleGoToSettings = ()=>{
    navigate("../Notifications");
  }
  return (
    <div className ={styles.NavBar} >

        <img src={logo} alt="img"  className={styles.logo} ></img>

        <div className={styles.secondDiv}>
                <button className={styles.BackToHomeButton}  onClick={handleBackToHomePage}>Back To HomePage</button>
                <img src={Notification} className={styles.Notification} onClick={handleGoToSettings}></img>

        </div>
    

        
    </div>
  )
}


export default NavBar 