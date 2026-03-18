import container from '../config/container.js';
import OrganizationService from '../services/OrganizationService.js';

class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = container.resolve('organizationService');
    this.index = this.index.bind(this);
    this.show = this.show.bind(this);
    this.showByName = this.showByName.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  async index(req: any, res: any) {
    try {
      const organizations = await this.organizationService.index();
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
      const organization = await this.organizationService.create(req.body);
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
}

export default OrganizationController;
