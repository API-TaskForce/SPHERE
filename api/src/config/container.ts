// deno-lint-ignore-file no-explicit-any
import { createContainer, asValue, asClass, AwilixContainer } from "awilix";
import dotenv from "dotenv";
import process from "node:process";

import MongooseUserRepository from "../repositories/mongoose/UserRepository";
import MongoosePricingRepository from "../repositories/mongoose/PricingRepository";
import MongoosePricingCollectionRepository from "../repositories/mongoose/PricingCollectionRepository";
import MongooseDatasheetRepository from "../repositories/mongoose/DatasheetRepository";
import MongooseDatasheetCollectionRepository from "../repositories/mongoose/DatasheetCollectionRepository";

import UserService from "../services/UserService";
import PricingService from "../services/PricingService";
import PricingCollectionService from "../services/PricingCollectionService";
import DatasheetService from "../services/DatasheetService";
import DatasheetCollectionService from "../services/DatasheetCollectionService";
import CacheService from "../services/CacheService";

dotenv.config();

function initContainer(databaseType: string): AwilixContainer {
  const container: AwilixContainer = createContainer();
  let userRepository, pricingRepository, pricingCollectionRepository;
  let datasheetRepository, datasheetCollectionRepository;
  switch (databaseType) {
    case "mongoDB":
      userRepository = new MongooseUserRepository();
      pricingRepository = new MongoosePricingRepository();
      pricingCollectionRepository = new MongoosePricingCollectionRepository();
      datasheetRepository = new MongooseDatasheetRepository();
      datasheetCollectionRepository = new MongooseDatasheetCollectionRepository();
      break;
    default:
      throw new Error(`Unsupported database type: ${databaseType}`);
  }
  container.register({
    userRepository: asValue(userRepository),
    pricingRepository: asValue(pricingRepository),
    pricingCollectionRepository: asValue(pricingCollectionRepository),
    datasheetRepository: asValue(datasheetRepository),
    datasheetCollectionRepository: asValue(datasheetCollectionRepository),
    userService: asClass(UserService).singleton(),
    pricingService: asClass(PricingService).singleton(),
    pricingCollectionService: asClass(PricingCollectionService).singleton(),
    datasheetService: asClass(DatasheetService).singleton(),
    datasheetCollectionService: asClass(DatasheetCollectionService).singleton(),
    cacheService: asClass(CacheService).singleton(),
  });
  return container;
}

let container: AwilixContainer | null = null;
if (!container) { container = initContainer(process.env.DATABASE_TECHNOLOGY ?? "") }

export default container as AwilixContainer;