import { Box, Divider, Typography, Avatar } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ProfileAvatar from '../profile-avatar';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useOrganization } from '../../../organization/hooks/useOrganization';
import { primary } from '../../../core/theme/palette';

export default function ProfileSidebar({sidebarWidth}: {sidebarWidth: number}) {
  const {authUser} = useAuth();
  const { organizations, activeOrganization } = useOrganization();

  return (
    <Box sx={{ p: 2 }}>
      {/* Avatar */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <ProfileAvatar size={sidebarWidth} />
      </Box>

      {/* Name and Username */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="h6">{authUser.user?.firstName} {authUser.user?.lastName}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {authUser.user?.username}
        </Typography>
      </Box>

      {/* Action Buttons */}
      {/* <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button variant="outlined" size="small">
          Edit profile
        </Button>
        <Button variant="outlined" size="small">
          Settings
        </Button>
      </Box> */}

      {/* URL */}
      {/* <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link to="https://alejandro-garcia-fernandez..." target="_blank" rel="noopener noreferrer">
          https://alejandro-garcia-fernandez.vercel.app/
        </Link>
      </Box> */}

      <Divider sx={{ my: 2 }} />

      {/* Interest Sections */}
      {/* <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          AI & ML interests
        </Typography>
        <Typography>No tiene intereses configurados todavía.</Typography>
      </Box> */}

      {/* Organizations Section */}
      {organizations.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Organizations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {organizations.map((org) => (
              <Box
                key={org.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.75,
                  borderRadius: 1,
                  bgcolor: org.id === activeOrganization?.id ? 'action.selected' : 'transparent',
                }}
              >
                {org.avatarUrl ? (
                  <Avatar src={org.avatarUrl} sx={{ width: 28, height: 28 }} />
                ) : (
                  <Avatar sx={{ width: 28, height: 28, bgcolor: primary[800], fontSize: 13 }}>
                    {org.isPersonal ? (
                      <PersonIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <BusinessIcon sx={{ fontSize: 16 }} />
                    )}
                  </Avatar>
                )}
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
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
