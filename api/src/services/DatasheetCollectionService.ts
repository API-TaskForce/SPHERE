import mongoose from 'mongoose';
import container from '../config/container';
import DatasheetCollectionRepository from '../repositories/mongoose/DatasheetCollectionRepository';
import DatasheetRepository from '../repositories/mongoose/DatasheetRepository';
import { RetrievedDatasheetCollection } from '../types/database/DatasheetCollection';
import { DatasheetCollectionIndexQueryParams } from '../types/services/DatasheetCollection';
import { decompressZip } from '../utils/zip-manager';
import fs from 'fs';

class DatasheetCollectionService {
  private readonly datasheetCollectionRepository: DatasheetCollectionRepository;
  private readonly datasheetRepository: DatasheetRepository;

  constructor() {
    this.datasheetCollectionRepository = container.resolve('datasheetCollectionRepository');
    this.datasheetRepository = container.resolve('datasheetRepository');
  }

  async index(queryParams: DatasheetCollectionIndexQueryParams) {
    const result = await this.datasheetCollectionRepository.findAll(queryParams);
    return result;
  }

  async showByNameAndUserId(name: string, userId: string) {
    const collection = await this.datasheetCollectionRepository.findByNameAndUserId(name, userId);
    if (!collection) {
      throw new Error('Datasheet collection not found');
    }

    return collection;
  }

  async showByUserId(userId: string) {
    const collections = await this.datasheetCollectionRepository.findByUserId(userId);
    return collections;
  }

  async show(userId: string) {
    const collection = await this.datasheetCollectionRepository.findByUserId(userId);
    if (!collection) {
      throw new Error('Datasheet collection not found');
    }

    return collection;
  }

  async create(newCollection: any, userId: string, username: string) {
    let collection: any;
    try {
      newCollection._ownerId = new mongoose.Types.ObjectId(userId);
      newCollection.analytics = {};

      collection = await this.datasheetCollectionRepository.create(newCollection);

      if (newCollection.datasheets && newCollection.datasheets.length > 0) {
        await this.datasheetRepository.addDatasheetsToCollection(
          collection._id.toString(),
          username,
          newCollection.datasheets
        );
      }

      await this.updateCollectionAnalytics(collection._id.toString());

      return collection;
    } catch (err) {
      await this._handleCollectionCreationError(err as Error, collection, newCollection, userId);
    }
  }

  async bulkCreate(file: any, newCollectionData: any, userId: string, username: string) {
    let collection: any;
    try {
      const extractPath = this._getExtractPath(userId, newCollectionData.name);
      const zipPath = file.path;

      const extractedFiles = await decompressZip(zipPath, extractPath);

      newCollectionData._ownerId = new mongoose.Types.ObjectId(userId);

      collection = await this.datasheetCollectionRepository.create(newCollectionData);

      const datasheetDatas = [];
      const datasheetsWithErrors = [];
      for (const datasheet of extractedFiles) {
        if (!(datasheet.endsWith('.yaml') || datasheet.endsWith('.yml'))) {
          continue
        }
        try{
          const fileContent = fs.readFileSync(datasheet, 'utf8');

          let extractedName = datasheet.split('/').pop()?.split('.')[0] || 'UnknownDatasheet';
          let extractedVersion = '1.0.0';
          let extractedCreatedAt = new Date();
    
          const nameMatch = fileContent.match(/saasName:\s*([^\s\n]+)/);
          if (nameMatch) extractedName = nameMatch[1];
          
          const versionMatch = fileContent.match(/version:\s*([^\s\n]+)/);
          if (versionMatch) extractedVersion = versionMatch[1];

          const datasheetData = {
            name: extractedName,
            version: extractedVersion,
            _collectionId: collection._id,
            owner: username,
            extractionDate: extractedCreatedAt,
            url: '',
            yaml: datasheet.split('/').slice(1).join('/'),
            analytics: {},
          };
          datasheetDatas.push(datasheetData);
        }catch(err){
          datasheetsWithErrors.push({
            name: `${datasheet.split("/")[datasheet.split("/").length - 2]}/${datasheet.split("/")[datasheet.split("/").length - 1]}`,
            error: err,
          });
        }
      }

      if (datasheetDatas.length > 0) {
        await this.datasheetRepository.create(datasheetDatas);
      }

      await this.updateCollectionAnalytics(collection._id.toString());

      return [collection, datasheetsWithErrors];
    } catch(err) {
      throw await this._handleCollectionCreationError(err as Error, collection, newCollectionData, userId);
    }
  }

  async update(collectionName: string, ownerId: string, data: any) {
    const collection = await this.datasheetCollectionRepository.findByNameAndUserId(
      collectionName,
      ownerId
    );
    if (!collection) {
      throw new Error('Either the collection does not exist or you are not its owner');
    }

    await this.datasheetCollectionRepository.update(collection._id.toString(), data);

    const updatedCollection = await this.datasheetCollectionRepository.findById(collection._id.toString());

    if (updatedCollection.name !== collectionName) {
      if (fs.existsSync(this._getExtractPath(ownerId, collectionName))) {
        fs.renameSync(
            this._getExtractPath(ownerId, collectionName),
            this._getExtractPath(ownerId, updatedCollection.name)
        );
      }
    }

    return updatedCollection;
  }

  async updateCollectionAnalytics(collectionId: string) {
    const collection = await this.datasheetCollectionRepository.findById(collectionId);

    if (!collection) {
      throw new Error('Datasheet collection not found');
    }

    const newAnalyticsEntry = this._computeCollectionAnalytics(collection);

    if (newAnalyticsEntry) {
        // Here we could implement collection analytics updates if requested later
        // await this.datasheetCollectionRepository.updateAnalytics(collection._id, newAnalyticsEntry);
    }
  }

  async destroy(collectionName: string, ownerId: string, deleteCascade: boolean, ignoreResult: boolean = false) {
    const collection = await this.datasheetCollectionRepository.findByNameAndUserId(
      collectionName,
      ownerId
    );
    if (!collection) {
      throw new Error('Either the collection does not exist or you are not its owner');
    }

    let result;

    if (deleteCascade) {
      result = await this.datasheetCollectionRepository.destroyWithDatasheets(
        collection._id.toString()
      );
      
      const extractPath = this._getExtractPath(ownerId, collectionName);
      if (fs.existsSync(extractPath)) fs.rmdirSync(extractPath, { recursive: true });
    } else {
      await this.datasheetRepository.removeDatasheetsFromCollection(collection._id.toString());
      result = await this.datasheetCollectionRepository.destroy(collection._id.toString());
    }

    if (!result && !ignoreResult) {
      throw new Error('Collection not found');
    }

    return true;
  }

  _computeCollectionAnalytics(collection: RetrievedDatasheetCollection) {
      return {};
  }


  _getExtractPath(userId: string, collectionName: string) {
    return `${process.env.COLLECTIONS_FOLDER}/${userId}/${collectionName}`;
  }

  async _handleCollectionCreationError(err: Error, collection: any, newCollectionData: any, userId: string): Promise<Error> {
      try {
        if (collection?._id) {
          await this.destroy(newCollectionData.name, userId, true, true);
        }
      } catch (cleanupErr) {
        console.error('Error during cleanup after bulkCreate failure:', cleanupErr);
      }

      const errMsg = (err as any)?.message || String(err);

      if (errMsg.includes('E11000') || errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('already exists')) {
        throw new Error('A collection with this name already exists. Please choose another name.');
      }

      throw new Error(errMsg);
  }
}

export default DatasheetCollectionService;
