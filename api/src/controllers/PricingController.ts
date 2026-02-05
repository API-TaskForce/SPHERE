import fs from 'fs';
import container from '../config/container.js';
import PricingService from '../services/PricingService';
import path from 'path';
import { retrievePricingFromPath } from 'pricing4ts/server';
import { PricingIndexQueryParams } from '../types/services/PricingService.js';

class PricingController {
  private pricingService: PricingService;

  constructor() {
    this.pricingService = container.resolve('pricingService');
    this.index = this.index.bind(this);
    this.indexByUserWithoutCollection = this.indexByUserWithoutCollection.bind(this);
    this.show = this.show.bind(this);
    this.getConfigurationSpace = this.getConfigurationSpace.bind(this);
    this.create = this.create.bind(this);
    this.addPricingToCollection = this.addPricingToCollection.bind(this);
    this.update = this.update.bind(this);
    this.updateVersion = this.updateVersion.bind(this);
    this.removePricingFromCollection = this.removePricingFromCollection.bind(this);
    this.destroyByNameAndOwner = this.destroyByNameAndOwner.bind(this);
    this.destroyVersionByNameAndOwner = this.destroyVersionByNameAndOwner.bind(this);
  }

  async index(req: any, res: any) {
    try {
      const queryParams: PricingIndexQueryParams = this._transformIndexQueryParams(req.query);

      // include pagination params if provided
      const pagination = {
        limit: req.query.limit,
        offset: req.query.offset,
      };

      const pricings = await this.pricingService.index(Object.assign({}, queryParams, pagination));
      res.json(pricings);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async indexByUserWithoutCollection(req: any, res: any) {
    try {
      const pricings = await this.pricingService.indexByUserWithoutCollection(req.user.username);
      res.json({ pricings });
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  }

  async show(req: any, res: any) {
    try {
      const queryParams = req.query;
      const pricing = await this.pricingService.show(
        req.params.pricingName,
        req.params.owner,
        queryParams
      );
      res.json(pricing);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async getConfigurationSpace(req: any, res: any) {
    try {
      const [configurationSpace, configurationSpaceSize] =
        await this.pricingService.getConfigurationSpace(req.params.pricingId, req.query);
      res.json({
        configurationSpace: configurationSpace,
        configurationSpaceSize: configurationSpaceSize,
      });
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not found')) {
        res.status(404).send({ error: err.message });
      } else if (err.message.toLowerCase().includes('minizinc')) {
        res.status(503).send({ error: 'MiniZinc is not available on the server. Cannot compute configuration space.' });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async create(req: any, res: any) {
    try {
      // Basic validations for helpful errors
      if (!req.file) {
        return res.status(400).send({ error: 'File not provided. Use multipart/form-data with key "yaml".' });
      }
      if (!req.body.saasName || !req.body.version) {
        // safe cleanup of temp upload
        try {
          if (req.file && req.file.path) fs.rmSync(req.file.path);
        } catch (e) {}
        return res.status(400).send({ error: 'Missing saasName or version in form data.' });
      }

      // Move file from tmp to final location using saasName and version to ensure correct path
      try {
        const tmpPath = req.file.path; // e.g., ./public/static/pricings/uploaded/tmp/<uuid>.yaml
        const tmpDest = req.file.destination; // folder/tmp
        const baseUploadDir = path.join(tmpDest, '..'); // folder
        const finalDir = path.join(baseUploadDir, req.body.saasName);
        fs.mkdirSync(finalDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || path.extname(req.file.filename) || '.yaml';
        const finalFilename = req.body.version + ext;
        const finalPath = path.join(finalDir, finalFilename);

        // If a file already exists for the same version, overwrite it
        if (fs.existsSync(finalPath)) {
          fs.rmSync(finalPath);
        }

        fs.renameSync(tmpPath, finalPath);

        // update req.file properties so service reads correct path
        req.file.path = finalPath;
        req.file.destination = finalDir;
        req.file.filename = finalFilename;
        req.file.originalname = finalFilename;

        // Validate YAML content matches provided saasName/version
        try {
          const parsed = retrievePricingFromPath(finalPath);
          if (parsed.saasName !== req.body.saasName || String(parsed.version) !== String(req.body.version)) {
            // remove the file and return error
            try { if (fs.existsSync(finalPath)) fs.rmSync(finalPath) } catch (e) {}
            return res.status(400).send({ error: 'YAML file contents do not match saasName/version provided in form data.' });
          }
        } catch (err) {
          // If parsing fails, remove file and return error
          try { if (fs.existsSync(finalPath)) fs.rmSync(finalPath) } catch (e) {}
          return res.status(400).send({ error: 'Invalid YAML file: ' + (err as Error).message });
        }
      } catch (err) {
        // Cleanup and return error
        try { if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.rmSync(req.file.path) } catch (e) {}
        return res.status(500).send({ error: 'Error storing uploaded file: ' + (err as Error).message });
      }

      const pricing = await this.pricingService.create(req.file, req.user.username, req.body.collectionId);
      res.json(pricing);
    } catch (err: any) {
      try {
        const file = req.file;
        if (file && file.path) {
          const directory = path.dirname(file.path);
          if (fs.existsSync(directory) && fs.readdirSync(directory).length === 1) {
            fs.rmdirSync(directory, { recursive: true });
          } else if (fs.existsSync(file.path)) {
            fs.rmSync(file.path);
          }
        }
        res.status(500).send({ error: err.message });
      } catch (err) {
        res.status(500).send({ error: (err as Error).message });
      }
    }
  }

  async addPricingToCollection(req: any, res: any) {
    try {
      const result = await this.pricingService.addPricingToCollection(
        req.body.pricingName,
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
      const pricing = await this.pricingService.update(
        req.params.pricingName,
        req.user.username,
        req.body
      );
      res.json(pricing);
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async updateVersion(req: any, res: any) {
    try {
      const pricing = await this.pricingService.updateVersion(req.body.pricing);
      res.json(pricing);
    } catch (err: any) {
      if (err.message.toLowerCase().includes('error updating pricing')) {
        res.status(400).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
    }
  }

  async removePricingFromCollection(req: any, res: any) {
    try {
      const result = await this.pricingService.removePricingFromCollection(
        req.params.pricingName,
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
      const result = await this.pricingService.destroy(
        req.params.pricingName,
        req.user.username,
        queryParams
      );
      if (!result) {
        res.status(404).send({ error: 'Pricing not found' });
      } else {
        res.status(200).send({ message: 'Pricing deleted successfully' });
      }
    } catch (err: any) {
      res.status(500).send({ error: err.message });
    }
  }

  async destroyVersionByNameAndOwner(req: any, res: any) {
    try {
      const result = await this.pricingService.destroyVersion(
        req.params.pricingName,
        req.params.pricingVersion,
        req.user.username
      );
      if (!result) {
        res.status(404).send({ error: 'Pricing version not found' });
      } else {
        res.status(200).send({ message: 'Pricing version deleted successfully' });
      }
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not exist')) {
        res.status(404).send({ error: err.message });
      }
      res.status(500).send({ error: err.message });
    }
  }

  _transformIndexQueryParams(
    indexQueryParams: Record<string, string | number>
  ): PricingIndexQueryParams {
    const transformedData: PricingIndexQueryParams = {
      name: indexQueryParams.name as string,
      sortBy: indexQueryParams.sortBy as string,
      sort: indexQueryParams.sort as string,
      subscriptions: {
        min: parseFloat(indexQueryParams['min-subscription'] as string),
        max: parseFloat(indexQueryParams['max-subscription'] as string),
      },
      minPrice: {
        min: parseFloat(indexQueryParams['min-minPrice'] as string),
        max: parseFloat(indexQueryParams['max-minPrice'] as string),
      },
      maxPrice: {
        min: parseFloat(indexQueryParams['min-maxPrice'] as string),
        max: parseFloat(indexQueryParams['max-maxPrice'] as string),
      },
      selectedOwners: indexQueryParams.selectedOwners
        ? (indexQueryParams.selectedOwners as string).split(',')
        : undefined,
    };

    // pass through pagination (as strings) if present
    if (indexQueryParams['limit'] !== undefined) {
      (transformedData as any).limit = indexQueryParams['limit'] as string;
    }

    if (indexQueryParams['offset'] !== undefined) {
      (transformedData as any).offset = indexQueryParams['offset'] as string;
    }

    const optionalFields = [
      'name',
      'subscriptions',
      'minPrice',
      'maxPrice',
      'selectedOwners',
      'sortBy',
      'sort',
    ] as const;

    optionalFields.forEach(field => {
      if (['name', 'selectedOwners', 'sortBy', 'sort'].includes(field)) {
        if (!transformedData[field]) {
          delete transformedData[field];
        }
      } else {
        if (this._containsNaN(transformedData[field]!)) {
          delete transformedData[field];
        }
      }
    });

    return transformedData;
  }

  _containsNaN(attr: any): boolean {
    return Object.values(attr).every(value => Number.isNaN(value));
  }
}

export default PricingController;
