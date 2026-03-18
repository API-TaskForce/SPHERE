import container from '../config/container.js';
import GroupCollectionService from '../services/GroupCollectionService.js';

class GroupCollectionController {
  private groupCollectionService: GroupCollectionService;

  constructor() {
    this.groupCollectionService = container.resolve('groupCollectionService');
    this.indexByGroup = this.indexByGroup.bind(this);
    this.indexByOrganization = this.indexByOrganization.bind(this);
    this.show = this.show.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.destroyByGroupAndCollection = this.destroyByGroupAndCollection.bind(this);
  }

  async indexByGroup(req: any, res: any) {
    try {
      const groupCollections = await this.groupCollectionService.indexByGroup(req.params.groupId);
      res.json(groupCollections);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByOrganization(req: any, res: any) {
    try {
      const groupCollections = await this.groupCollectionService.indexByOrganization(req.params.organizationId);
      res.json(groupCollections);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async show(req: any, res: any) {
    try {
      const groupCollection = await this.groupCollectionService.show(req.params.groupCollectionId);
      res.json(groupCollection);
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
      const groupCollection = await this.groupCollectionService.create(req.body);
      res.status(201).json(groupCollection);
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
      const groupCollection = await this.groupCollectionService.update(req.params.groupCollectionId, req.body);
      res.json(groupCollection);
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
      const result = await this.groupCollectionService.destroy(req.params.groupCollectionId);
      const message = result ? 'Successfully deleted.' : 'Could not delete group collection.';
      res.json({ message });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async destroyByGroupAndCollection(req: any, res: any) {
    try {
      const result = await this.groupCollectionService.destroyByGroupAndCollection(
        req.params.groupId,
        req.params.pricingCollectionId
      );
      const message = result ? 'Successfully deleted.' : 'Could not delete group collection.';
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

export default GroupCollectionController;
