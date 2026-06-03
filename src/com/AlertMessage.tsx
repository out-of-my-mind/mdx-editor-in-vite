import { Snackbar, Alert, AlertProps } from '@mui/material';
import React from 'react';

export interface AlertMessageProps {
  open?: boolean;
  message: string;
  severity?: AlertProps['severity'];
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  variant?: 'filled' | 'outlined' | 'standard';
  isClosable?: boolean;
  onClose?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  open = false,
  message,
  severity = 'success',
  autoHideDuration = 5000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  variant = 'filled',
  isClosable = true,
  onClose
}) => {
  const [myOpen, setMyOpen] = React.useState(open);

  // 当 message 变化时重新打开 snackbar
  React.useEffect(() => {
    setMyOpen(true);
  }, [message]);

  // 同步外部 open 属性的变化
  React.useEffect(() => {
    setMyOpen(open);
  }, [open]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    setMyOpen(false);
    onClose?.();
  };

  return (
    <Snackbar
      open={myOpen}
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