import ProfileAvatar from '../profile-avatar';
import { useAuth } from '../../../auth/hooks/useAuth';
import Iconify from '../../../core/components/iconify';
import { useOrganization } from '../../../organization/hooks/useOrganization';

export default function ProfileSidebar({sidebarWidth}: {sidebarWidth: number}) {
  const {authUser} = useAuth();
  const { organizations, activeOrganization } = useOrganization();

  const avatarSizeClass = sidebarWidth >= 400 ? 'h-[400px] w-[400px]' : 'h-[300px] w-[300px]';

  return (
    <div className="p-2">
      {/* Avatar */}
      <div className="flex justify-center">
        <ProfileAvatar sizeClass={avatarSizeClass} />
      </div>

      {/* Name and Username */}
      <div className="mt-2 text-center">
        <h2 className="text-xl font-semibold">{authUser.user?.firstName} {authUser.user?.lastName}</h2>
        <p className="text-base text-sphere-grey-600">
          {authUser.user?.username}
        </p>
      </div>

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

      <div className="my-2 border-b border-slate-300" />

      {/* Interest Sections */}
      {/* <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          AI & ML interests
        </Typography>
        <Typography>No tiene intereses configurados todavía.</Typography>
      </Box> */}

      {/* Organizations Section */}
      {organizations.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-sphere-grey-600">Organizations</p>
          <div className="flex flex-col gap-1.5">
            {organizations.map((org) => (
              <div
                key={org.id}
                className={`flex items-center gap-2 rounded p-1.5 ${
                  org.id === activeOrganization?.id ? 'bg-sphere-grey-200' : ''
                }`}
              >
                {org.avatarUrl ? (
                  <img
                    src={org.avatarUrl}
                    alt={org.displayName}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sphere-primary-800 text-white">
                    <Iconify icon={org.isPersonal ? 'mdi:account' : 'mdi:domain'} width={14} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
                    {org.displayName}
                  </p>
                  {org.isPersonal && (
                    <p className="text-xs text-sphere-grey-600">Personal</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
