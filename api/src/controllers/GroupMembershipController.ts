import container from '../config/container.js';
import GroupMembershipService from '../services/GroupMembershipService.js';

class GroupMembershipController {
  private groupMembershipService: GroupMembershipService;

  constructor() {
    this.groupMembershipService = container.resolve('groupMembershipService');
    this.indexByUser = this.indexByUser.bind(this);
    this.indexByGroup = this.indexByGroup.bind(this);
    this.show = this.show.bind(this);
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
}

export default GroupMembershipController;
