import container from '../config/container.js';
import GroupMembershipService from '../services/GroupMembershipService.js';

class GroupMembershipController {
  private groupMembershipService: GroupMembershipService;

  constructor() {
    this.groupMembershipService = container.resolve('groupMembershipService');
    this.indexByUser = this.indexByUser.bind(this);
    this.indexByGroup = this.indexByGroup.bind(this);
    this.show = this.show.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.destroyByUserAndGroup = this.destroyByUserAndGroup.bind(this);
  }

  async indexByUser(req: any, res: any) {
    try {
      const memberships = await this.groupMembershipService.indexByUser(req.params.userId);
      res.json(memberships);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByGroup(req: any, res: any) {
    try {
      const memberships = await this.groupMembershipService.indexByGroup(req.params.groupId);
      res.json(memberships);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async show(req: any, res: any) {
    try {
      const membership = await this.groupMembershipService.show(req.params.membershipId);
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
      const membership = await this.groupMembershipService.create(req.body);
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
      const membership = await this.groupMembershipService.update(req.params.membershipId, req.body);
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
      const result = await this.groupMembershipService.destroy(req.params.membershipId);
      const message = result ? 'Successfully deleted.' : 'Could not delete group membership.';
      res.json({ message });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async destroyByUserAndGroup(req: any, res: any) {
    try {
      const result = await this.groupMembershipService.destroyByUserAndGroup(
        req.params.userId,
        req.params.groupId
      );
      const message = result ? 'Successfully deleted.' : 'Could not delete group membership.';
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

export default GroupMembershipController;
