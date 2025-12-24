import { Snackbar, Alert, AlertProps } from '@mui/material';
import React from 'react';

export interface AlertMessageProps {
  message: string;
  severity?: AlertProps['severity'];
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  variant?: 'filled' | 'outlined' | 'standard';
  isClosable?: boolean;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  severity = 'success',
  autoHideDuration = 5000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  variant = 'filled',
  isClosable = true
}) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={isClosable ? handleClose : undefined}
        severity={severity}
        variant={variant}
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;