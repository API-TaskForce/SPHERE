import container from '../config/container.js';
import OrganizationMembershipService from '../services/OrganizationMembershipService.js';

class OrganizationMembershipController {
  private organizationMembershipService: OrganizationMembershipService;

  constructor() {
    this.organizationMembershipService = container.resolve('organizationMembershipService');
    this.indexByUser = this.indexByUser.bind(this);
    this.indexByOrganization = this.indexByOrganization.bind(this);
    this.show = this.show.bind(this);
  }

  async indexByUser(req: any, res: any) {
    try {
      const memberships = await this.organizationMembershipService.indexByUser(req.params.userId);
      res.json(memberships);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByOrganization(req: any, res: any) {
    try {
      const memberships = await this.organizationMembershipService.indexByOrganization(req.params.organizationId);
      res.json(memberships);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async show(req: any, res: any) {
    try {
      const membership = await this.organizationMembershipService.show(req.params.membershipId);
      res.json(membership);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }
}

export default OrganizationMembershipController;
