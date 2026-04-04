import container from '../config/container';
import DatasheetCollectionService from '../services/DatasheetCollectionService';
import { DatasheetCollectionIndexQueryParams } from '../types/services/DatasheetCollection';

class DatasheetCollectionController {
  private datasheetCollectionService: DatasheetCollectionService;

  constructor() {
    this.datasheetCollectionService = container.resolve('datasheetCollectionService');
    this.index = this.index.bind(this);
    this.showByNameAndUserId = this.showByNameAndUserId.bind(this);
    this.show = this.show.bind(this);
    this.showByUserId = this.showByUserId.bind(this);
    this.create = this.create.bind(this);
    this.bulkCreate = this.bulkCreate.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  async index(req: any, res: any) {
    try {
      const queryParams: DatasheetCollectionIndexQueryParams = {
        name: req.query.name as string,
        sortBy: req.query.sortBy as string,
        sort: req.query.sort as "asc" | "desc" | undefined,
        selectedOwners: req.query.selectedOwners ? (req.query.selectedOwners as string).split(',') : undefined,
      };

      const pagination = {
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const collections = await this.datasheetCollectionService.index(Object.assign({}, queryParams, pagination));
      res.json(collections);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async showByNameAndUserId(req: any, res: any) {
    try {
      const collection = await this.datasheetCollectionService.showByNameAndUserId(
        req.params.collectionName,
        req.params.userId
      );
      res.json(collection);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async show(req: any, res: any) {
    try {
      const { ownerId } = req.params;
      const collection = await this.datasheetCollectionService.show(ownerId);
      res.json(collection);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async showByUserId(req: any, res: any) {
    try {
      const collections = await this.datasheetCollectionService.showByUserId(req.user.id);
      res.json({ collections: collections });
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
      const collection = await this.datasheetCollectionService.create(req.body, req.user.id, req.user.username);
      res.json(collection);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async bulkCreate(req: any, res: any) {
    try {
      const [collection, datasheetsWithErrors] = await this.datasheetCollectionService.bulkCreate(
        req.file,
        JSON.parse(req.body.collectionData),
        req.user.id,
        req.user.username
      );
      res.json({ collection, datasheetsWithErrors });
    } catch (err: any) {
      if (err.message.includes('A collection with this name already exists')) {
        res.status(409).send({ error: err.message });
        return;
      }
      res.status(500).send({ error: err.message });
    }
  }

  async update(req: any, res: any) {
    try {
      const collection = await this.datasheetCollectionService.update(
        req.params.collectionName,
        req.user.id,
        req.body
      );
      res.json(collection);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async destroy(req: any, res: any) {
    try {
      await this.datasheetCollectionService.destroy(
        req.params.collectionName,
        req.user.id,
        Boolean(req.query.deleteCascade)
      );
      res.status(200).send({ message: 'Collection deleted successfully' });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not exist')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }
}

export default DatasheetCollectionController;
