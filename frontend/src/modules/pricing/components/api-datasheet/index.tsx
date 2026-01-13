import { Box, Card, CardContent, Chip, Divider, Grid, Link, Stack, Typography, styled } from '@mui/material';
import { blue, green, grey, orange, red, purple, teal, cyan } from '@mui/material/colors';
import { FaBolt, FaServer, FaInfinity, FaCoins, FaPause, FaLayerGroup, FaShareNodes, FaPuzzlePiece } from 'react-icons/fa6';
import { MdAutorenew, MdAttachMoney, MdSpeed, MdPolicy } from 'react-icons/md';

export type Datasheet = {
    associatedSaaS: { name: string; url: string };
    type: string;
    capacity: { value: string; autoRecharge: string; extraCharge: string }[];
    maxPower: { value: string; throttling?: string; policies?: string[] }[];
    perRequestCost?: string;
    coolingPeriod?: { value: string; retryAfter: boolean };
    segmentation?: string;
    sharedLimits?: string;
    extraFields?: Record<string, string>;
};

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}));

const InfoCard = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.grey[50], // Very light grey
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    height: '100%',
    border: `1px solid ${theme.palette.grey[300]}`,
    transition: 'box-shadow 0.2s',
    '&:hover': {
        boxShadow: theme.shadows[2],
    }
}));

const LabelValue = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
    <Box mb={1.5}>
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            {icon} {label}
        </Typography>
        <Typography variant="body2" component="div">{value}</Typography>
    </Box>
);

export default function ApiDatasheet({ data }: { data: Datasheet }) {
    return (
        <Card elevation={0} sx={{ border: `1px solid ${grey[300]}`, mb: 4, borderRadius: 3 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    API Datasheet
                </Typography>

                <Grid container spacing={2}>
                    {/* General Info */}
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard>
                            <SectionTitle variant="subtitle1">
                                <FaServer color={blue[600]} /> General
                            </SectionTitle>
                            <LabelValue
                                label="Associated SaaS"
                                value={
                                    <Link href={data.associatedSaaS.url} target="_blank" rel="noopener noreferrer" underline="hover" fontWeight="bold">
                                        {data.associatedSaaS.name}
                                    </Link>
                                }
                            />
                            <LabelValue
                                label="Type"
                                value={
                                    <Chip
                                        label={data.type}
                                        size="small"
                                        sx={{
                                            backgroundColor: orange[50],
                                            color: orange[900],
                                            fontWeight: 'bold',
                                            border: `1px solid ${orange[200]}`
                                        }}
                                    />
                                }
                            />
                        </InfoCard>
                    </Grid>

                    {/* Capacity (Quota) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard>
                            <SectionTitle variant="subtitle1">
                                <FaInfinity color={green[600]} /> Capacity
                            </SectionTitle>
                            <Stack spacing={2} divider={<Divider flexItem />}>
                                {data.capacity.map((cap, index) => (
                                    <Box key={index}>
                                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                                            {cap.value}
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            <Chip
                                                icon={<MdAutorenew />}
                                                label={`Recharge: ${cap.autoRecharge}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ justifyContent: 'start', border: 'none', pl: 0 }}
                                            />
                                            <Chip
                                                icon={<MdAttachMoney />}
                                                label={`Extra: ${cap.extraCharge}`}
                                                size="small"
                                                variant="outlined"
                                                color={cap.extraCharge === 'None' || cap.extraCharge === '0' ? 'default' : 'warning'}
                                                sx={{ justifyContent: 'start', border: 'none', pl: 0 }}
                                            />
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        </InfoCard>
                    </Grid>

                    {/* Max Power (Rate Limit) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard>
                            <SectionTitle variant="subtitle1">
                                <FaBolt color={red[500]} /> Max Power
                            </SectionTitle>
                            <Stack spacing={2} divider={<Divider flexItem />}>
                                {data.maxPower.map((power, index) => (
                                    <Box key={index}>
                                        <Typography variant="body1" fontWeight="medium" gutterBottom>
                                            {power.value}
                                        </Typography>
                                        {power.throttling && (
                                            <LabelValue
                                                label="Throttling"
                                                icon={<MdSpeed style={{ fontSize: 12 }} />}
                                                value={power.throttling}
                                            />
                                        )}
                                        {power.policies && power.policies.length > 0 && (
                                            <Box mt={1}>
                                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                                    <MdPolicy style={{ fontSize: 12 }} /> Policies
                                                </Typography>
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {power.policies.map(p => (
                                                        <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        </InfoCard>
                    </Grid>

                    {/* Advanced Constraints (Combined Card) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <InfoCard>
                            <SectionTitle variant="subtitle1">
                                <FaPuzzlePiece color={purple[500]} /> Constraints
                            </SectionTitle>
                            <Stack spacing={1.5}>
                                {data.perRequestCost && (
                                    <LabelValue
                                        label="Per-Request Cost"
                                        icon={<FaCoins style={{ fontSize: 12, color: orange[700] }} />}
                                        value={data.perRequestCost}
                                    />
                                )}
                                {data.coolingPeriod && (
                                    <LabelValue
                                        label="Cooling Period"
                                        icon={<FaPause style={{ fontSize: 12, color: cyan[700] }} />}
                                        value={`${data.coolingPeriod.value} ${data.coolingPeriod.retryAfter ? '(Retry-After header)' : ''}`}
                                    />
                                )}
                                {data.segmentation && (
                                    <LabelValue
                                        label="Segmentation"
                                        icon={<FaLayerGroup style={{ fontSize: 12, color: teal[600] }} />}
                                        value={data.segmentation}
                                    />
                                )}
                                {data.sharedLimits && (
                                    <LabelValue
                                        label="Shared Limits"
                                        icon={<FaShareNodes style={{ fontSize: 12, color: purple[600] }} />}
                                        value={data.sharedLimits}
                                    />
                                )}
                            </Stack>
                        </InfoCard>
                    </Grid>

                    {/* Extra Fields (if any) */}
                    {data.extraFields && Object.keys(data.extraFields).length > 0 && (
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>Additional Information</Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(data.extraFields).map(([key, value]) => (
                                        <Grid item xs={12} sm={4} key={key}>
                                            <LabelValue label={key} value={value} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Grid>
                    )}

                </Grid>
            </CardContent>
        </Card>
    );
}
