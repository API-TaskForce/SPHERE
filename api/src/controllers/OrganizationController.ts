import container from '../config/container.js';
import OrganizationService from '../services/OrganizationService.js';

class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = container.resolve('organizationService');
    this.index = this.index.bind(this);
    this.indexByUser = this.indexByUser.bind(this);
    this.show = this.show.bind(this);
    this.showByName = this.showByName.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.listMembers = this.listMembers.bind(this);
    this.addMember = this.addMember.bind(this);
    this.updateMemberRole = this.updateMemberRole.bind(this);
    this.removeMember = this.removeMember.bind(this);
  }

  // ── Organization CRUD ───────────────────────────────────────────────────────

  async index(req: any, res: any) {
    try {
      const organizations = await this.organizationService.index();
      res.json(organizations);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByUser(req: any, res: any) {
    try {
      const organizations = await this.organizationService.indexByUser(req.user.id);
      res.json(organizations);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async show(req: any, res: any) {
    try {
      const organization = await this.organizationService.show(req.params.organizationId);
      res.json(organization);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async showByName(req: any, res: any) {
    try {
      const organization = await this.organizationService.showByName(req.params.name);
      res.json(organization);
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
      const organization = await this.organizationService.createWithOwner(req.body, req.user.id);
      res.status(201).json(organization);
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
      const organization = await this.organizationService.update(req.params.organizationId, req.body);
      res.json(organization);
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
      const result = await this.organizationService.destroy(req.params.organizationId);
      const message = result ? 'Successfully deleted.' : 'Could not delete organization.';
      res.json({ message });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  // ── Member management ───────────────────────────────────────────────────────

  async listMembers(req: any, res: any) {
    try {
      const members = await this.organizationService.listMembers(req.params.organizationId);
      res.json(members);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async addMember(req: any, res: any) {
    try {
      const { userId, role } = req.body;
      const membership = await this.organizationService.addMember(
        userId,
        req.params.organizationId,
        role
      );
      res.status(201).json(membership);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('already a member')) {
        res.status(422).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async updateMemberRole(req: any, res: any) {
    try {
      const { role } = req.body;
      const membership = await this.organizationService.updateMemberRole(
        req.params.userId,
        req.params.organizationId,
        role
      );
      res.json(membership);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async removeMember(req: any, res: any) {
    try {
      await this.organizationService.removeMember(req.params.userId, req.params.organizationId);
      res.json({ message: 'Successfully removed.' });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }
}

export default OrganizationController;
