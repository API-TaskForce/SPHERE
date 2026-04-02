import { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import { useOrganization } from '../../../organization/hooks/useOrganization';
import { Organization } from '../../../organization/api/organizationsApi';
import { grey, primary } from '../../../core/theme/palette';

const OrgAvatar = ({ org, size = 24 }: { org: Organization; size?: number }) => {
  if (org.avatarUrl) {
    return <Avatar src={org.avatarUrl} sx={{ width: size, height: size }} />;
  }
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: primary[800], fontSize: size * 0.45 }}>
      {org.isPersonal ? (
        <PersonIcon sx={{ fontSize: size * 0.65 }} />
      ) : (
        <BusinessIcon sx={{ fontSize: size * 0.65 }} />
      )}
    </Avatar>
  );
};

export default function OrgSelector() {
  const { organizations, activeOrganization, setActiveOrganization, isLoading } = useOrganization();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (isLoading || !activeOrganization) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (org: Organization) => {
    setActiveOrganization(org);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size="small"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          textTransform: 'none',
          color: 'text.primary',
          border: `1px solid ${grey[300]}`,
          borderRadius: 2,
          px: 1.25,
          py: 0.5,
          minWidth: 0,
          '&:hover': {
            bgcolor: grey[200],
            borderColor: grey[400],
          },
        }}
        aria-label="select organization"
      >
        <OrgAvatar org={activeOrganization} size={22} />
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {activeOrganization.displayName}
        </Typography>
        <ExpandMoreIcon sx={{ fontSize: 16, color: grey[600] }} />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            Organizations
          </Typography>
        </Box>
        <Divider />
        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            onClick={() => handleSelect(org)}
            selected={org.id === activeOrganization.id}
            sx={{ gap: 1.5, py: 1 }}
          >
            <OrgAvatar org={org} size={28} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {org.displayName}
              </Typography>
              {org.isPersonal && (
                <Typography variant="caption" color="text.secondary">
                  Personal
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
