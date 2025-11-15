import { useAuth } from "./AuthContext";
import { Check } from "@mui/icons-material";
import './HelpModal.css';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {

    const { user } = useAuth();

    if (!isOpen) return null;

    const helpContent = user
        ? {
            title: `How to add a new Hazard point?`,
            body: "Simply click on Add Hazard button and then move the pointer to the desired area of the map and left click on mouse to add the Hazard point. You can cancel the process by right clicking on the mouse:",
            image: "images/help/addhazard-help.jpg"
        }
        : {
            title: "Welcome to the SafeSigns Online Platform!",
            body: "Please create an account (Register) or Login to access all features. You can start this process by clicking on Login button. After logging in, you can use the Help button to learn how to interact with SafeSigns:",
            image: "images/help/login-help.jpg"
        };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{helpContent.title}</h2>
                    <div className="header-underline"></div>
                </div>
                <div className="modal-body">
                    <p>{helpContent.body}</p>
                    <div className="image-container">
                        <img
                            src={helpContent.image}
                            alt=""
                            className="modal-image"
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="modal-button">
                        OK
                        <Check style={{ color: "white" }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;