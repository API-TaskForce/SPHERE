import { Datasheet as DatasheetModel } from '../types/database/Datasheet';
import container from '../config/container';
import { processFileUris } from './FileService';
import { DatasheetIndexQueryParams } from '../types/services/DatasheetService';
import DatasheetCollectionService from './DatasheetCollectionService';
import DatasheetRepository from '../repositories/mongoose/DatasheetRepository';
import DatasheetMongoose from '../repositories/mongoose/models/DatasheetMongoose';
import CacheService from './CacheService';
import fs from 'fs';

class DatasheetService {
  private datasheetRepository: DatasheetRepository;
  private datasheetCollectionService: DatasheetCollectionService;
  private cacheService: CacheService;

  constructor() {
    this.datasheetRepository = container.resolve('datasheetRepository');
    this.datasheetCollectionService = container.resolve('datasheetCollectionService');
    this.cacheService = container.resolve('cacheService');
  }

  async index(queryParams: DatasheetIndexQueryParams) {
    const datasheets = await this.datasheetRepository.findAll(queryParams);
    return datasheets;
  }

  async indexByUserWithoutCollection(username: string) {
    const datasheets = await this.datasheetRepository.findByOwnerWithoutCollection(username);
    return datasheets;
  }

  async indexByCollection(collectionId: string) {
    const datasheets = await this.datasheetRepository.findByCollection(collectionId);
    return datasheets;
  }

  async show(name: string, owner: string, queryParams?: { collectionName?: string }) {
    const datasheet: { name: string; versions: DatasheetModel[] } | null =
      await this.datasheetRepository.findByNameAndOwner(name, owner, queryParams);
    if (!datasheet) {
      throw new Error('Datasheet not found');
    }
    for (const version of datasheet.versions) {
      processFileUris(version, ['yaml']);
    }
    const datasheetObject = Object.assign({}, datasheet);
    return datasheetObject;
  }

  async create(datasheetFile: any, owner: string, collectionId?: string) {
    try {
      const filePath = typeof datasheetFile === 'string' ? datasheetFile : datasheetFile.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Simple extraction of saasName and version for datasheets
      // If none found, we default to the filename and version 1.0.0
      let extractedName = filePath.split('/').pop()?.split('.')[0] || 'UnknownDatasheet';
      let extractedVersion = '1.0.0';
      let extractedCreatedAt = new Date();

      const nameMatch = fileContent.match(/saasName:\s*([^\s\n]+)/);
      if (nameMatch) extractedName = nameMatch[1];
      
      const versionMatch = fileContent.match(/version:\s*([^\s\n]+)/);
      if (versionMatch) extractedVersion = versionMatch[1];

      const previousDatasheet = await this.datasheetRepository.findByNameAndOwner(
        extractedName,
        owner
      );

      if (!collectionId && previousDatasheet && previousDatasheet.versions[0]._collectionId) {
        collectionId = previousDatasheet.versions[0]._collectionId.toString();
      }

      const datasheetData = {
        name: extractedName,
        version: extractedVersion,
        _collectionId: collectionId,
        owner: owner,
        extractionDate: extractedCreatedAt,
        url: '',
        yaml: filePath.split(/[/\\]/).slice(filePath.split(/[/\\]/).indexOf("public") >= 0 ? filePath.split(/[/\\]/).indexOf("public") : 1).join("/"),
        analytics: {},
      };

      const datasheet = await this.datasheetRepository.create([datasheetData]);

      processFileUris(datasheet[0], ['yaml']);

      // Collections do not have heavy analytics right now
      if (collectionId) {
        await this.datasheetCollectionService.updateCollectionAnalytics(collectionId);
      }

      return datasheet;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async addDatasheetToCollection(datasheetName: string, owner: string, collectionId: string) {
    try {
      const datasheet = await this.datasheetRepository.findByNameAndOwner(datasheetName, owner);
      if (!datasheet) {
        throw new Error('Either the datasheet does not exist or you are not its owner');
      }

      await this.datasheetRepository.addDatasheetToCollection(datasheetName, owner, collectionId);
      await this.datasheetCollectionService.updateCollectionAnalytics(collectionId);

      return true;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async update(datasheetName: string, owner: string, data: any) {
    const datasheet = await this.datasheetRepository.findByNameAndOwner(datasheetName, owner);
    if (!datasheet) {
      throw new Error('Either the datasheet does not exist or you are not its owner');
    }

    for (const datasheetVersion of datasheet.versions) {
      await this.datasheetRepository.update(datasheetVersion.id, data);
    }

    const updatedDatasheet = await this.datasheetRepository.findByNameAndOwner(datasheetName, owner);

    return updatedDatasheet;
  }

  async updateDatasheetsCollectionName(
    oldCollectionName: string,
    newCollectionName: string,
    collectionId: string,
    ownerId: string
  ) {
    if (oldCollectionName === newCollectionName) {
      return true;
    }

    const datasheets = await this.datasheetRepository.findByCollection(collectionId);
    const datasheetsToUpdate = [];
    for (const datasheet of datasheets) {
      if (datasheet.yaml.includes(oldCollectionName)) {
        datasheet.yaml = datasheet.yaml.replace(oldCollectionName, newCollectionName);
        datasheetsToUpdate.push(datasheet);
      }
    }

    await this.datasheetRepository.updateDatasheetsCollectionName(
      datasheetsToUpdate,
      ownerId,
      newCollectionName
    );
    return true;
  }

  async removeDatasheetFromCollection(datasheetName: string, owner: string) {
    try {
      const datasheet = await DatasheetMongoose.findOne({ name: datasheetName, owner });

      if (!datasheet) {
        throw new Error('Either the datasheet does not exist or you are not its owner');
      }

      await this.datasheetRepository.removeDatasheetFromCollection(datasheetName, owner);
      if (datasheet._collectionId) {
        await this.datasheetCollectionService.updateCollectionAnalytics(
          datasheet._collectionId.toString()
        );
      } else {
        throw new Error('Datasheet is not in a collection');
      }

      return true;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  async destroy(datasheetName: string, owner: string, queryParams?: { collectionName?: string }) {
    let collectionId;

    if (queryParams?.collectionName) {
      const collection = await this.datasheetCollectionService.showByNameAndUserId(
        queryParams.collectionName,
        owner
      );
      if (!collection) {
        throw new Error('Collection not found');
      }

      collectionId = collection._id.toString();
    }

    const result = await this.datasheetRepository.destroyByNameOwnerAndCollectionId(
      datasheetName,
      owner,
      collectionId
    );
    if (!result) {
      throw new Error('Either the datasheet does not exist or you are not its owner');
    }
    return true;
  }

  async destroyVersion(datasheetName: string, datasheetVersion: string, owner: string) {
    let result;

    result = await this.datasheetRepository.destroyVersionByNameAndOwner(
      datasheetName,
      datasheetVersion,
      owner
    );

    if (!result) {
      result = await this.datasheetRepository.destroyVersionByNameAndOwner(
        datasheetName,
        datasheetVersion.replace('_', '.'),
        owner
      );
    }

    if (!result) {
      throw new Error('Either the datasheet does not exist or you are not its owner');
    }

    return true;
  }
}

export default DatasheetService;
