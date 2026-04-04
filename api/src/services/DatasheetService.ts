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
    const result: any = await this.datasheetRepository.findAll(queryParams);
    
    // Process file URIs if datasheets are returned
    if (result && result.datasheets && Array.isArray(result.datasheets)) {
      result.datasheets.forEach((datasheet: any) => {
        processFileUris(datasheet, ['yaml']);
      });
    }
    
    return result;
  }

  async indexByUserWithoutCollection(username: string) {
    const result: any = await this.datasheetRepository.findByOwnerWithoutCollection(username);
    
    // Process file URIs for all datasheets if result is an object with datasheets array
    if (result && result.datasheets && Array.isArray(result.datasheets)) {
      result.datasheets.forEach((datasheet: any) => {
        processFileUris(datasheet, ['yaml']);
      });
    }
    
    return result;
  }

  async indexByCollection(collectionId: string) {
    const result: any = await this.datasheetRepository.findByCollection(collectionId);
    
    // Process file URIs for all datasheets if result is an object with datasheets array
    if (result && result.datasheets && Array.isArray(result.datasheets)) {
      result.datasheets.forEach((datasheet: any) => {
        processFileUris(datasheet, ['yaml']);
      });
    }
    
    return result;
  }

  async show(name: string, owner: string, queryParams?: { collectionName?: string }) {
    const datasheet: { name: string; versions: DatasheetModel[] } | null =
      await this.datasheetRepository.findByNameAndOwner(name, owner, queryParams);
    if (!datasheet) {
      throw new Error('Datasheet not found');
    }
    for (const version of datasheet.versions) {
      processFileUris(version, ['yaml']);
      version.yaml = this.normalizeYamlUrl(version.yaml);
    }
    const datasheetObject = Object.assign({}, datasheet);
    return datasheetObject;
  }

  async create(datasheetFile: any, owner: string, collectionId?: string) {
    try {
      const filePath = typeof datasheetFile === 'string' ? datasheetFile : datasheetFile.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Extract the actual filename from the full path
      const originalFileName = filePath.split(/[/\\]/).pop()?.split('.')[0] || 'UnknownDatasheet';
      
      // Simple extraction of associated_saas (or saasName for backwards compatibility) and version for datasheets
      let extractedName = originalFileName;
      let extractedVersion = '1.0.0';
      const extractedCreatedAt = new Date();
      let extractedCurrency = 'USD';

      // Try to extract from associated_saas or saasName field
      const associatedSaasMatch = fileContent.match(/associated_saas:\s*([^\s\n]+)/);
      if (associatedSaasMatch) {
        extractedName = associatedSaasMatch[1];
      } else {
        const saasNameMatch = fileContent.match(/saasName:\s*([^\s\n]+)/);
        if (saasNameMatch) {
          extractedName = saasNameMatch[1];
        }
      }
      
      // Extract version
      const versionMatch = fileContent.match(/version:\s*([^\s\n]+)/);
      if (versionMatch) {
        extractedVersion = versionMatch[1];
      }

      const currencyMatch = fileContent.match(/currency:\s*([^\s\n]+)/);
      if (currencyMatch) {
        extractedCurrency = currencyMatch[1];
      }

      const extractedAnalytics = this.computeBasicAnalyticsFromYaml(fileContent);

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
        currency: extractedCurrency,
        extractionDate: extractedCreatedAt,
        url: '',
        yaml: this.getRelativeYamlPath(filePath),
        analytics: extractedAnalytics,
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

  private getRelativeYamlPath(filePath: string): string {
    // Normalize path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Find the index of 'public' in the path
    const publicIndex = normalizedPath.indexOf('/public/');
    
    if (publicIndex !== -1) {
      // Extract after '/public/' so express.static('public') can resolve it at '/...'
      return normalizedPath.substring(publicIndex + '/public/'.length);
    }
    
    // Fallback: just take the relative part after 'public'
    const parts = normalizedPath.split('/');
    const publicPos = parts.indexOf('public');
    if (publicPos !== -1) {
      return parts.slice(publicPos + 1).join('/');
    }
    
    // Last resort: return as is
    return normalizedPath;
  }

  private normalizeYamlUrl(yamlPath: string): string {
    if (!yamlPath) {
      return yamlPath;
    }

    if (/^https?:\/\//i.test(yamlPath)) {
      try {
        const parsedUrl = new URL(yamlPath);
        if (parsedUrl.pathname.startsWith('/public/')) {
          parsedUrl.pathname = parsedUrl.pathname.replace('/public/', '/');
        }
        return parsedUrl.toString();
      } catch {
        return yamlPath;
      }
    }

    if (yamlPath.startsWith('/public/')) {
      return yamlPath.replace('/public/', '/');
    }

    if (yamlPath.startsWith('public/')) {
      return yamlPath.replace('public/', '');
    }

    return yamlPath;
  }

  private computeBasicAnalyticsFromYaml(fileContent: string) {
    const lines = fileContent.split(/\r?\n/);
    let inPlansSection = false;
    let plansIndent = 0;
    let currentPlanIndent: number | null = null;

    let configurationSpaceSize = 0;
    const planPrices: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const indent = line.search(/\S/);

      if (!inPlansSection) {
        if (/^plans:\s*$/i.test(trimmed)) {
          inPlansSection = true;
          plansIndent = indent;
        }
        continue;
      }

      if (indent <= plansIndent) {
        inPlansSection = false;
        currentPlanIndent = null;
        continue;
      }

      if (indent === plansIndent + 2 && /^[^:\s][^:]*:\s*$/.test(trimmed)) {
        configurationSpaceSize += 1;
        currentPlanIndent = indent;
        continue;
      }

      if (currentPlanIndent !== null && indent === currentPlanIndent + 2) {
        const priceMatch = trimmed.match(/^price:\s*(-?\d+(?:\.\d+)?)/i);
        if (priceMatch) {
          planPrices.push(Number(priceMatch[1]));
        }
      }
    }

    const minSubscriptionPrice = planPrices.length > 0 ? Math.min(...planPrices) : undefined;
    const maxSubscriptionPrice = planPrices.length > 0 ? Math.max(...planPrices) : undefined;

    return {
      configurationSpaceSize,
      minSubscriptionPrice,
      maxSubscriptionPrice,
    };
  }
}

export default DatasheetService;
