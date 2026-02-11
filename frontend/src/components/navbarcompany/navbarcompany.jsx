import styles from "./NavbarCompany.module.css";
import logo from "../../../public/LOGO.svg";
import Notification from "../../../public/notification.svg"
import { useNavigate } from 'react-router-dom'

const Navbarcompany = () => {
   
   
 
   
  const navigate = useNavigate();

  const handlePostingJob =()=>{
    navigate("../PostJob");
  }
  
  const handleGoToSettings = ()=>{
    navigate("../Notifications");
  }
  return (
    <div className ={styles.NavBar} >

        <img src={logo} alt="img"  className={styles.logo} ></img>

        <div className={styles.secondDiv}>
                <button className={styles.BackToHomeButton}  onClick={handlePostingJob}>Post Job</button>
                <img src={Notification} className={styles.Notification} onClick={handleGoToSettings}></img>

        </div>
    

        
    </div>
  )
}


export default Navbarcompany