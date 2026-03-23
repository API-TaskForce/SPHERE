import RepositoryBase from '../RepositoryBase';
import DatasheetMongoose from './models/DatasheetMongoose';
import { getAllDatasheetsAggregator } from './aggregators/get-all-datasheets';
import { DatasheetIndexQueryParams } from '../../types/services/DatasheetService';
import mongoose from 'mongoose';
import { getDatasheetByNameAndOwnerAggregator } from './aggregators/get-datasheet-by-name-and-owner';

class DatasheetRepository extends RepositoryBase {
  async findAll(...args: any) {
    const queryParams: DatasheetIndexQueryParams = args[0];

    let filteringAggregators = [];
    let sortAggregator = [];

    if (Object.keys(queryParams).length > 0) {
      const { name, selectedOwners, sortBy, sort } = queryParams;

      if (name) {
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
            owner: {
              $in: selectedOwnersFilter,
            },
          },
        });
      }
      if (sortBy && sort) {
        let sortParameter = '';
        let sortOrder = sort === 'asc' ? 1 : -1;

        switch (sortBy) {
          case 'datasheetName':
            sortParameter = 'name';
            break;
        }
        sortAggregator.push({
          $addFields: {
            datasheets: {
              $sortArray: {
                input: '$datasheets',
                sortBy: {
                  [sortParameter]: sortOrder,
                },
              },
            },
          },
        });
      }
    }

    try {
      const aggregator = getAllDatasheetsAggregator(filteringAggregators, sortAggregator);

      // parse pagination params to integers
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
        ...aggregator,
      ];

      if (typeof offset !== 'undefined' || typeof limit !== 'undefined') {
        const start = offset || 0;
        const take = typeof limit !== 'undefined' ? limit : Number.MAX_SAFE_INTEGER;

        const paginationStages = [
          {
            $addFields: {
              total: { $size: '$datasheets' },
            },
          },
          {
            $project: {
              datasheets: {
                $cond: [
                  { $gt: [{ $size: '$datasheets' }, 0] },
                  { $slice: ['$datasheets', start, take] },
                  [],
                ],
              },
              total: 1,
            },
          },
        ];

        const datasheets = await DatasheetMongoose.aggregate([...basePipeline, ...paginationStages]);
        return datasheets[0] || { datasheets: [], total: 0 };
      }

      const datasheets = await DatasheetMongoose.aggregate(basePipeline);
      const result = datasheets[0] || { datasheets: [], total: 0 };
      if (typeof result.total === 'undefined') {
        result.total = Array.isArray(result.datasheets) ? result.datasheets.length : 0;
      }
      return result;
    } catch (err) {
      return { datasheets: [] };
    }
  }

  async findByOwnerWithoutCollection(owner: string, ...args: any) {
    try {
      const datasheets = await DatasheetMongoose.aggregate([
        {
          $match: {
            owner: owner,
            _collectionId: { $exists: false },
          },
        },
        ...getAllDatasheetsAggregator([], []),
      ]);

      return datasheets[0];
    } catch (err) {
      return [];
    }
  }

  async findByNameAndOwner(
    name: string,
    owner: string,
    queryParams?: { collectionName?: string },
    ...args: any
  ) {
    try {
      let datasheet;
      if (queryParams?.collectionName) {
        datasheet = await DatasheetMongoose.aggregate([
          ...getDatasheetByNameAndOwnerAggregator(name, owner),
          {
            $match: {
              collectionName: queryParams.collectionName,
            },
          },
        ]);
      } else {
        datasheet = await DatasheetMongoose.aggregate([
          {
            $match: {
              _collectionId: { $exists: false },
            },
          },
          ...getDatasheetByNameAndOwnerAggregator(name, owner),
        ]);
      }

      if (!datasheet || datasheet.length === 0) {
        return null;
      }

      return datasheet[0];
    } catch (err) {
      return null;
    }
  }

  async findByCollection(collectionId: string, ...args: any) {
    try {
      const datasheets = await DatasheetMongoose.find({ _collectionId: collectionId });
      return datasheets;
    } catch (err) {
      return [];
    }
  }

  async findById(id: string, ...args: any[]): Promise<any> {
    const datasheet = await DatasheetMongoose.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!datasheet) {
      return null;
    }
    return datasheet.toJSON();
  }

  async create(data: any[], ...args: any) {
    data.forEach(item => {
      if (item._collectionId) {
        item._collectionId = new mongoose.Types.ObjectId(item._collectionId);
      }
    });

    return await DatasheetMongoose.insertMany(data);
  }

  async updateDatasheetsCollectionName(
    datasheetsToUpdate: any,
    ...args: any
  ) {
    const bulkOps = datasheetsToUpdate.map((datasheet: any) => ({
      updateOne: {
        filter: { _id: datasheet._id },
        update: { $set: { yaml: datasheet.yaml } },
      },
    }));

    const result = await DatasheetMongoose.bulkWrite(bulkOps);

    return result.modifiedCount === datasheetsToUpdate.length;
  }

  async addDatasheetToCollection(datasheetName: string, owner: string, collectionId: string) {
    return await DatasheetMongoose.updateMany(
      {
        name: datasheetName,
        owner: owner,
      },
      {
        $set: { _collectionId: new mongoose.Types.ObjectId(collectionId) },
      }
    );
  }

  async addDatasheetsToCollection(
    collectionId: string,
    owner: string,
    datasheets: string[],
    ...args: any
  ) {
    const result = await DatasheetMongoose.updateMany(
      { name: { $in: datasheets }, owner: owner },
      { $set: { _collectionId: new mongoose.Types.ObjectId(collectionId) } }
    );

    return result.modifiedCount === datasheets.length;
  }

  async update(id: string, data: any, ...args: any) {
    const datasheet = await DatasheetMongoose.findOne({ _id: id });
    if (!datasheet) {
      return null;
    }

    datasheet.set(data);
    await datasheet.save();

    return datasheet.toJSON();
  }

  async removeDatasheetFromCollection(datasheetName: string, owner: string, ...args: any) {
    return await DatasheetMongoose.updateMany(
      {
        name: datasheetName,
        owner: owner,
      },
      {
        $unset: { _collectionId: 1 },
      }
    );
  }

  async removeDatasheetsFromCollection(collectionId: string) {
    return await DatasheetMongoose.updateMany(
      {
        _collectionId: new mongoose.Types.ObjectId(collectionId),
      },
      {
        $unset: { _collectionId: 1 },
      }
    );
  }

  async destroyByNameOwnerAndCollectionId(name: string, owner: string, collectionId?: string) {
    if (collectionId) {
      const result = await DatasheetMongoose.deleteMany({
        name: name,
        owner: owner,
        _collectionId: new mongoose.Types.ObjectId(collectionId),
      });
      return result.deletedCount >= 1;
    } else {
      const result = await DatasheetMongoose.deleteMany({
        name: name,
        owner: owner,
        _collectionId: { $exists: false },
      });
      return result.deletedCount >= 1;
    }
  }

  async destroyVersionByNameAndOwner(name: string, version: string, owner: string, ...args: any) {
    const result = await DatasheetMongoose.deleteOne({
      $expr: {
        $and: [
          { $eq: [{ $toLower: '$name' }, name.toLowerCase()] },
          { $eq: ['$owner', owner] },
          { $eq: ['$version', version] },
        ],
      },
    });

    return result.deletedCount === 1;
  }

  async destroy(id: string, ...args: any) {
    const result = await DatasheetMongoose.deleteOne({ _id: id });
    return result?.deletedCount === 1;
  }
}

export default DatasheetRepository;
