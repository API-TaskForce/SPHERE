import crypto from 'crypto';
import container from '../config/container.js';
import UserMongoose from '../repositories/mongoose/models/UserMongoose.js';
import CacheService from '../services/CacheService.js';
import OrganizationService from '../services/OrganizationService.js';

const CAS_BASE_URL = process.env.SSO_US_CAS_URL ?? 'https://sso.us.es/cas';
const CALLBACK_URL =
  process.env.SSO_US_CALLBACK_URL ??
  `http://localhost:${process.env.SERVER_PORT ?? 8080}${process.env.BASE_URL_PATH ?? '/api'}/auth/sso/us/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const SSO_CODE_TTL = 30;

class SSOController {
  private cacheService: CacheService;
  private organizationService: OrganizationService;

  constructor() {
    this.cacheService = container.resolve('cacheService');
    this.organizationService = container.resolve('organizationService');
    this.initiate = this.initiate.bind(this);
    this.callback = this.callback.bind(this);
    this.exchange = this.exchange.bind(this);
  }

  initiate(_req: any, res: any) {
    const serviceUrl = encodeURIComponent(CALLBACK_URL);
    res.redirect(`${CAS_BASE_URL}/login?service=${serviceUrl}`);
  }

  async callback(req: any, res: any) {
    const { ticket } = req.query;

    if (!ticket) {
      return res.redirect(`${FRONTEND_URL}/login?sso_error=no_ticket`);
    }

    try {
      const casData = await validateCasTicket(ticket as string);
      if (!casData) {
        return res.redirect(`${FRONTEND_URL}/login?sso_error=invalid_ticket`);
      }

      const userData = await findOrCreateSSOUser(casData, this.organizationService);

      const code = crypto.randomBytes(16).toString('hex');
      await this.cacheService.set(`sso:code:${code}`, userData, SSO_CODE_TTL);

      return res.redirect(`${FRONTEND_URL}/sso/callback?code=${code}`);
    } catch (err: any) {
      console.error('[SSO] CAS callback error:', err);
      return res.redirect(`${FRONTEND_URL}/login?sso_error=server_error`);
    }
  }

  async exchange(req: any, res: any) {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    try {
      const userData = await this.cacheService.get(`sso:code:${code}`);
      if (!userData) {
        return res.status(401).json({ error: 'Invalid or expired SSO code' });
      }

      // Delete after single use by overwriting with expired TTL (1s)
      // CacheService doesn't expose del, so we set a 1s TTL to expire it quickly
      await this.cacheService.set(`sso:code:${code}`, userData, 1);

      return res.json(userData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

interface CasData {
  uvus: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

async function validateCasTicket(ticket: string): Promise<CasData | null> {
  const validateUrl = `${CAS_BASE_URL}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(CALLBACK_URL)}`;
  const response = await fetch(validateUrl);
  const xml = await response.text();

  const userMatch = xml.match(/<cas:user>([^<]+)<\/cas:user>/);
  if (!userMatch) return null;

  const uvus = userMatch[1].trim();

  const emailMatch = xml.match(/<cas:mail>([^<]+)<\/cas:mail>/);
  const firstNameMatch = xml.match(/<cas:givenName>([^<]+)<\/cas:givenName>/);
  const lastNameMatch = xml.match(/<cas:sn>([^<]+)<\/cas:sn>/);

  return {
    uvus,
    email: emailMatch ? emailMatch[1].trim() : null,
    firstName: firstNameMatch ? firstNameMatch[1].trim() : null,
    lastName: lastNameMatch ? lastNameMatch[1].trim() : null,
  };
}

async function findOrCreateSSOUser(casData: CasData, organizationService: OrganizationService) {
  const { uvus, email, firstName, lastName } = casData;

  let userDoc = await UserMongoose.findOne({ username: uvus }).exec();

  if (!userDoc) {
    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

    userDoc = await new UserMongoose({
      username: uvus,
      firstName: firstName ?? uvus,
      lastName: lastName ?? 'US',
      email: email ?? `${uvus}@alum.us.es`,
      password: crypto.randomBytes(32).toString('hex'),
      phone: '000000000',
      userType: 'user',
      avatar: 'avatars/default-avatar.png',
      token,
      tokenExpiration,
    }).save();

    try {
      await organizationService.createPersonal(userDoc.id, userDoc.username);
    } catch {
      // Non-critical
    }
  } else {
    // Refresh token on login
    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await UserMongoose.updateOne({ username: uvus }, { token, tokenExpiration });
    userDoc = await UserMongoose.findOne({ username: uvus }).exec();
  }

  return {
    id: userDoc!.id,
    firstName: userDoc!.get('firstName'),
    lastName: userDoc!.get('lastName'),
    username: userDoc!.get('username'),
    email: userDoc!.get('email'),
    avatar: userDoc!.get('avatar') ?? 'avatars/default-avatar.png',
    token: userDoc!.get('token'),
    tokenExpiration: userDoc!.get('tokenExpiration'),
  };
}

export default SSOController;
