import container from '../config/container.js';
import GroupService from '../services/GroupService.js';

class GroupController {
  private groupService: GroupService;

  constructor() {
    this.groupService = container.resolve('groupService');
    this.index = this.index.bind(this);
    this.indexByOrganization = this.indexByOrganization.bind(this);
    this.show = this.show.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.listMembers = this.listMembers.bind(this);
    this.addMember = this.addMember.bind(this);
    this.updateMemberRole = this.updateMemberRole.bind(this);
    this.removeMember = this.removeMember.bind(this);
    this.listCollections = this.listCollections.bind(this);
    this.addCollection = this.addCollection.bind(this);
    this.updateCollectionAccess = this.updateCollectionAccess.bind(this);
    this.removeCollection = this.removeCollection.bind(this);
  }

  // ── Group CRUD ──────────────────────────────────────────────────────────────

  async index(req: any, res: any) {
    try {
      const groups = await this.groupService.index();
      res.json(groups);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByOrganization(req: any, res: any) {
    try {
      const groups = await this.groupService.indexByOrganization(req.params.organizationId);
      res.json(groups);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async show(req: any, res: any) {
    try {
      const group = await this.groupService.show(req.params.groupId);
      res.json(group);
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
      const group = await this.groupService.createInOrganization(
        req.body,
        req.params.organizationId
      );
      res.status(201).json(group);
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
      const group = await this.groupService.update(req.params.groupId, req.body);
      res.json(group);
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
      const result = await this.groupService.destroy(req.params.groupId);
      const message = result ? 'Successfully deleted.' : 'Could not delete group.';
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
      const members = await this.groupService.listMembers(req.params.groupId);
      res.json(members);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async addMember(req: any, res: any) {
    try {
      const { userId, role } = req.body;
      const membership = await this.groupService.addMember(userId, req.params.groupId, role);
      res.status(201).json(membership);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else if (
        err.message.toLowerCase().includes('not a member') ||
        err.message.toLowerCase().includes('already a member')
      ) {
        res.status(422).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async updateMemberRole(req: any, res: any) {
    try {
      const { role } = req.body;
      const membership = await this.groupService.updateMemberRole(
        req.params.userId,
        req.params.groupId,
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
      await this.groupService.removeMember(req.params.userId, req.params.groupId);
      res.json({ message: 'Successfully removed.' });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  // ── Collection associations ─────────────────────────────────────────────────

  async listCollections(req: any, res: any) {
    try {
      const collections = await this.groupService.listCollections(req.params.groupId);
      res.json(collections);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async addCollection(req: any, res: any) {
    try {
      const { pricingCollectionId, accessRole } = req.body;
      const gc = await this.groupService.addCollection(
        req.params.groupId,
        pricingCollectionId,
        req.params.organizationId,
        accessRole
      );
      res.status(201).json(gc);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else if (
        err.message.toLowerCase().includes('does not belong') ||
        err.message.toLowerCase().includes('already associated')
      ) {
        res.status(422).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async updateCollectionAccess(req: any, res: any) {
    try {
      const { accessRole } = req.body;
      const gc = await this.groupService.updateCollectionAccess(
        req.params.groupId,
        req.params.pricingCollectionId,
        accessRole
      );
      res.json(gc);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async removeCollection(req: any, res: any) {
    try {
      await this.groupService.removeCollection(
        req.params.groupId,
        req.params.pricingCollectionId
      );
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

export default GroupController;
