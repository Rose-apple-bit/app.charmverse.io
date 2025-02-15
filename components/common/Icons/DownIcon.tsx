import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';
import Box from '@mui/material/Box';
import { IconWrapper } from './IconWrapper';

interface Props {
  iconSize?: SvgIconTypeMap['props']['fontSize'];
  fontSize?: string;
  label?: string;
}

export function DownIcon ({ iconSize, label, fontSize }: Props) {
  return (
    <IconWrapper>
      <KeyboardArrowDownIcon fontSize={iconSize} />
      <Box component='span' fontSize={fontSize}>
        {label}
      </Box>
    </IconWrapper>
  );
}
