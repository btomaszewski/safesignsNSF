import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Person, Warning, Logout, LiveHelp } from "@mui/icons-material";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface HeaderProps {
  isAddingHazardPoint: boolean;
  onLoginBtnClick: () => void;
  onAddHazardBtnClick: () => void;
  onHelpBtnClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isAddingHazardPoint,
  onLoginBtnClick,
  onAddHazardBtnClick,
  onHelpBtnClick,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const canAddHazard =
    user?.role === "Admin" ||
    user?.role === "SpecialUser" ||
    user?.role === "User";

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.reload();
  };

  return (
    <AppBar position="static" elevation={4} style={{ zIndex: 10 }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <a href="/" onClick={handleLogoClick} className="flex items-center">
          <img src="images/logo.png" alt="SafeSigns Logo" className="h-9 mr-2" />
          <Typography variant="h5" fontWeight="bold">
            SafeSigns
          </Typography>
        </a>
        <div className="flex items-center">
          {canAddHazard && (
            <Button
              disabled={isAddingHazardPoint}
              variant="contained"
              color="secondary"
              startIcon={<Warning />}
              sx={{ mr: 2 }}
              onClick={onAddHazardBtnClick}
            >
              Add Hazard
            </Button>
          )}
          <Button
            disabled={isAddingHazardPoint}
            variant="contained"
            startIcon={user ? <Person /> : <Person />}
            endIcon={user && <Logout />}
            sx={{
              mr: 2,
              backgroundColor: "#00B0FF",
              color: "white",
              "&:hover": {
                backgroundColor: "#40C4FF",
              },
              "&:active": {
                backgroundColor: "#0091EA",
              },
            }}
            onClick={user ? handleLogout : onLoginBtnClick}
          >
            {user ? `${user.username}` : "Login"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '50%',
              minWidth: 'auto',
              width: 40,
              height: 40,
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'darkorange',
              '&:hover': {
                backgroundColor: 'orange',
              }
            }}
            onClick={onHelpBtnClick}
          >
            <LiveHelp sx={{ fontSize: 24 }} />
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
