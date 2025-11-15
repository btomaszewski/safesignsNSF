import React from 'react';
import Typography from '@mui/material/Typography';

const Footer: React.FC = () => {
  return (
    <footer 
      className="py-0.5 text-center relative" 
      style={{ 
        zIndex: 10,
        backgroundColor: '#1976D2',
        color: 'white',
      }}
    >
      <Typography variant="body2" fontSize="0.65rem" fontWeight="bold" style={{ lineHeight: '1.3' }}>
        © {new Date().getFullYear()} SafeSigns (RIT) | All rights reserved.
      </Typography>
    </footer>
  );
};

export default Footer;