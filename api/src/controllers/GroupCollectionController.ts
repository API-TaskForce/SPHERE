import container from '../config/container.js';
import GroupCollectionService from '../services/GroupCollectionService.js';

class GroupCollectionController {
  private groupCollectionService: GroupCollectionService;

  constructor() {
    this.groupCollectionService = container.resolve('groupCollectionService');
    this.indexByGroup = this.indexByGroup.bind(this);
    this.indexByOrganization = this.indexByOrganization.bind(this);
    this.show = this.show.bind(this);
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
}

export default GroupCollectionController;
