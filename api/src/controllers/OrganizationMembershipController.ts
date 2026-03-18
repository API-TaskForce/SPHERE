import container from '../config/container.js';
import OrganizationMembershipService from '../services/OrganizationMembershipService.js';

class OrganizationMembershipController {
  private organizationMembershipService: OrganizationMembershipService;

  constructor() {
    this.organizationMembershipService = container.resolve('organizationMembershipService');
    this.indexByUser = this.indexByUser.bind(this);
    this.indexByOrganization = this.indexByOrganization.bind(this);
    this.show = this.show.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.destroyByUserAndOrganization = this.destroyByUserAndOrganization.bind(this);
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

  async create(req: any, res: any) {
    try {
      const membership = await this.organizationMembershipService.create(req.body);
      res.status(201).json(membership);
    } catch (err: any) {
      if (err.name?.includes('ValidationError') || err.code === 11000) {
        res.status(422).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async update(req: any, res: any) {
    try {
      const membership = await this.organizationMembershipService.update(req.params.membershipId, req.body);
      res.json(membership);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async destroy(req: any, res: any) {
    try {
      const result = await this.organizationMembershipService.destroy(req.params.membershipId);
      const message = result ? 'Successfully deleted.' : 'Could not delete organization membership.';
      res.json({ message });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async destroyByUserAndOrganization(req: any, res: any) {
    try {
      const result = await this.organizationMembershipService.destroyByUserAndOrganization(
        req.params.userId,
        req.params.organizationId
      );
      const message = result ? 'Successfully deleted.' : 'Could not delete organization membership.';
      res.json({ message });
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
