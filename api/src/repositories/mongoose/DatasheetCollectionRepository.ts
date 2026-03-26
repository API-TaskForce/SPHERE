import mongoose from 'mongoose';
import RepositoryBase from '../RepositoryBase';
import DatasheetCollectionMongoose from './models/DatasheetCollectionMongoose';
import DatasheetMongoose from './models/DatasheetMongoose';
import { processFileUris } from '../../services/FileService';
import { getAllDatasheetsFromCollection } from './aggregators/get-datasheets-from-collection';
import { addNumberOfDatasheetsAggregator } from './aggregators/datasheetCollections/add-number-of-datasheets';
import { addOwnerToCollectionAggregator } from './aggregators/datasheetCollections/add-owner-to-collection';
import { addLastDatasheetUpdateAggregator } from './aggregators/datasheetCollections/add-last-datasheet-update';
import { DatasheetCollectionIndexQueryParams } from '../../types/services/DatasheetCollection';

class DatasheetCollectionRepository extends RepositoryBase {
  async findAll(queryParams: DatasheetCollectionIndexQueryParams, ...args: any) {
    
    let filteringAggregators = [];
    let sortAggregator = [];

    if (Object.keys(queryParams).length > 0){
      const { name, selectedOwners, sortBy, sort } = queryParams;

      if (name){
        filteringAggregators.push({
          $match: {
            name: {
              $regex: name,
              $options: 'i', // case-insensitive
            },
          },
        });
      }

      if (selectedOwners) {
        const selectedOwnersFilter = selectedOwners as string[];

        filteringAggregators.push({
          $match: {
            "owner.username": {
              $in: selectedOwnersFilter,
            },
          },
        });
      }
      if (sortBy && sort){

        let sortParameter = "";
        let sortOrder: 1 | -1 = sort === "asc" ? 1 : -1;

        switch (sortBy) {
          case 'numberOfDatasheets':
            sortParameter = "numberOfDatasheets";
            break;
        };
        sortAggregator.push({
          $sort: {
            [sortParameter]: sortOrder,
          },
        });
      }
    }
    
    
    try {
      // parse pagination params
      const limitRaw = queryParams?.limit;
      const offsetRaw = queryParams?.offset;

      let limit: number | undefined;
      let offset: number | undefined;

      if (limitRaw !== undefined) {
        limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : Number(limitRaw);
        if (Number.isNaN(limit) || limit! < 0) limit = undefined;
      }

      if (offsetRaw !== undefined) {
        offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw, 10) : Number(offsetRaw);
        if (Number.isNaN(offset) || offset! < 0) offset = undefined;
      }

      const basePipeline: any[] = [
        {
          $match: {
            private: false,
          },
        },
        ...addNumberOfDatasheetsAggregator(),
        ...addOwnerToCollectionAggregator(),
        ...filteringAggregators,
        { $sort: { name: 1 } },
        ...sortAggregator,
        {
          $project: {
            owner: {
              username: 1,
              avatar: 1,
              id: { $toString: '$owner._id' },
            },
            name: 1,
            numberOfDatasheets: 1,
          },
        },
      ];

      if (typeof offset !== 'undefined' || typeof limit !== 'undefined') {
        const start = offset || 0;
        const take = typeof limit !== 'undefined' ? limit : Number.MAX_SAFE_INTEGER;

        const facetPipeline = [
          {
            $facet: {
              collections: [
                { $skip: start },
                { $limit: take },
              ],
              total: [
                { $count: 'count' },
              ],
            },
          },
        ];

        const aggResult = await DatasheetCollectionMongoose.aggregate([...basePipeline, ...facetPipeline]);
        const first = aggResult[0] || { collections: [], total: [] };
        const collections = first.collections || [];
        const total = (first.total && first.total[0] && first.total[0].count) || 0;

        collections.forEach((c: any) => processFileUris(c.owner, ['avatar']));
        return { collections, total };
      }

      const collections = await DatasheetCollectionMongoose.aggregate(basePipeline);
      collections.forEach((c: any) => processFileUris(c.owner, ['avatar']));
      const total = collections.length;
      return { collections, total };
    } catch (err) {
      return { collections: [], total: 0 };
    }
  }

  async findById(id: string, ...args: any) {
    try {
      const collections = await DatasheetCollectionMongoose.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        ...getAllDatasheetsFromCollection(),
        {
          $project: {
            name: 1,
            description: 1,
            analytics: 1,
            datasheets: 1,
          },
        },
      ]);

      return collections[0];
    } catch (err) {
      return null;
    }
  }

  async findByUserId(userId: string, ...args: any) {
    try {
      const collections = await DatasheetCollectionMongoose.aggregate([
        {
          $match: {
            _ownerId: new mongoose.Types.ObjectId(userId),
          },
        },
        ...addNumberOfDatasheetsAggregator(),
        ...addOwnerToCollectionAggregator(),
        {
          $addFields: {
            id: { $toString: '$_id' },
          }
        },
        {
          $project: {
            id: 1,
            _id: 0,
            owner: {
              username: 1,
              avatar: 1,
              id: { $toString: '$owner._id' },
            },
            name: 1,
            numberOfDatasheets: 1,
          },
        },
      ]);

      return collections;
    } catch (err) {
      return null;
    }
  }

  async findByNameAndUserId(name: string, userId: string, ...args: any) {
    try {
      const collections = await DatasheetCollectionMongoose.aggregate([
        {
          $match: {
            name: {
              $regex: name,
              $options: 'i',
            },
            _ownerId: new mongoose.Types.ObjectId(userId),
          },
        },
        ...getAllDatasheetsFromCollection(),
        ...addOwnerToCollectionAggregator(),
        ...addLastDatasheetUpdateAggregator(),
        {
          $addFields: {
            id: { $toString: '$_id' },
          }
        },
        {
          $project: {
            id: 1,
            owner: {
              username: 1,
              avatar: 1,
              id: { $toString: '$owner._id' },
            },
            name: 1,
            description: 1,
            private: 1,
            analytics: 1,
            datasheets: 1,
            lastUpdate: 1,
          },
        },
      ]);

      return collections[0];
    } catch (err) {
      console.log('[ERROR] An error occurred during the retrieval of the datasheet collection');
      return null;
    }
  }

  async findCollectionDatasheets(name: string, userId: string, ...args: any) {
    try {
      const collections = await DatasheetCollectionMongoose.aggregate([
        {
          $match: {
            name: {
              $regex: name,
              $options: 'i',
            },
            _ownerId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'datasheets',
            localField: '_id',
            foreignField: '_collectionId',
            as: 'datasheets',
          }
        },
        {
          $project: {
            datasheets: 1,
          },
        },
      ]);

      return collections[0];
    } catch (err) {
      return null;
    }
  }

  async create(data: any, ...args: any) {
    const collection = new DatasheetCollectionMongoose(data);
    await collection.save();

    return collection.populate('owner', {
      username: 1,
      avatar: 1,
      id: 1,
    });
  }

  async update(collectionId: string, data: any) {
    const collection = await DatasheetCollectionMongoose.findById(collectionId);
    
    if (!collection) {
      throw new Error('Collection not found in database');
    }

    collection.set(data);
    await collection.save();

    return collection.toJSON();
  }

  async setCollectionAnalytics(collectionId: string, analytics: any) {
    const collection = await DatasheetCollectionMongoose.findById(collectionId);

    if (!collection) {
      throw new Error('Collection not found in database');
    }

    collection.set({ analytics });
    await collection.save();

    return collection.toJSON();
  }

  async destroy(id: string, ...args: any) {
    const result = await DatasheetCollectionMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }

  async destroyWithDatasheets(id: string, ...args: any) {
    const resultDatasheets = await DatasheetMongoose.deleteMany({ _collectionId: new mongoose.Types.ObjectId(id) });
    const resultCollections = await DatasheetCollectionMongoose.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    return resultCollections?.deletedCount === 1 && resultDatasheets?.deletedCount > 0;
  }
}

export default DatasheetCollectionRepository;
