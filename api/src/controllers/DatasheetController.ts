import fs from 'fs';
import container from '../config/container.js';
import DatasheetService from '../services/DatasheetService';
import path from 'path';
import { DatasheetIndexQueryParams } from '../types/services/DatasheetService.js';

class DatasheetController {
  private datasheetService: DatasheetService;

  constructor() {
    this.datasheetService = container.resolve('datasheetService');
    this.index = this.index.bind(this);
    this.indexByUserWithoutCollection = this.indexByUserWithoutCollection.bind(this);
    this.show = this.show.bind(this);
    this.create = this.create.bind(this);
    this.addDatasheetToCollection = this.addDatasheetToCollection.bind(this);
    this.update = this.update.bind(this);
    this.removeDatasheetFromCollection = this.removeDatasheetFromCollection.bind(this);
    this.destroyByNameAndOwner = this.destroyByNameAndOwner.bind(this);
    this.destroyVersionByNameAndOwner = this.destroyVersionByNameAndOwner.bind(this);
  }

  async index(req: any, res: any) {
    try {
      const queryParams: DatasheetIndexQueryParams = {
        name: req.query.name as string,
        sortBy: req.query.sortBy as string,
        sort: req.query.sort as "asc" | "desc" | undefined,
        selectedOwners: req.query.selectedOwners ? (req.query.selectedOwners as string).split(',') : undefined,
      };

      const pagination = {
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const datasheets = await this.datasheetService.index(Object.assign({}, queryParams, pagination));
      res.json(datasheets);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByUserWithoutCollection(req: any, res: any) {
    try {
      const datasheets = await this.datasheetService.indexByUserWithoutCollection(req.user.username);
      res.json({ datasheets });
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  }

  async show(req: any, res: any) {
    try {
      const queryParams = req.query;
      const datasheet = await this.datasheetService.show(
        req.params.datasheetName,
        req.params.owner,
        queryParams
      );
      res.json(datasheet);
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
      const datasheet = await this.datasheetService.create(req.file, req.user.username);
      res.json(datasheet);
    } catch (err: any) {
      try {
        const file = req.file;
        // Only removing file on error for Datasheets, we simplify the cleanup
        if (file?.path && fs.existsSync(file.path)) {
            fs.rmSync(file.path);
        }
        res.status(500).send({ error: err.message });
      } catch (err) {
        res.status(500).send({ error: (err as Error).message });
      }
    }
  }

  async addDatasheetToCollection(req: any, res: any) {
    try {
      const result = await this.datasheetService.addDatasheetToCollection(
        req.body.datasheetName,
        req.user.username,
        req.body.collectionId
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async update(req: any, res: any) {
    try {
      const datasheet = await this.datasheetService.update(
        req.params.datasheetName,
        req.user.username,
        req.body
      );
      res.json(datasheet);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async removeDatasheetFromCollection(req: any, res: any) {
    try {
      const result = await this.datasheetService.removeDatasheetFromCollection(
        req.params.datasheetName,
        req.user.username
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async destroyByNameAndOwner(req: any, res: any) {
    try {
      const queryParams = req.query;
      const result = await this.datasheetService.destroy(
        req.params.datasheetName,
        req.user.username,
        queryParams,
        req.user.id
      );
      if (!result) {
        res.status(404).send({ error: 'Datasheet not found' });
      } else {
        res.status(200).send({ message: 'Datasheet deleted successfully' });
      }
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async destroyVersionByNameAndOwner(req: any, res: any) {
    try {
      const result = await this.datasheetService.destroyVersion(
        req.params.datasheetName,
        req.params.datasheetVersion,
        req.user.username
      );
      if (!result) {
        res.status(404).send({ error: 'Datasheet version not found' });
      } else {
        res.status(200).send({ message: 'Datasheet version deleted successfully' });
      }
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not exist')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }
}

export default DatasheetController;
