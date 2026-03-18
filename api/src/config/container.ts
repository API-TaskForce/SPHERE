// deno-lint-ignore-file no-explicit-any
import { createContainer, asValue, asClass, AwilixContainer } from "awilix";
import dotenv from "dotenv";
import process from "node:process";

import MongooseUserRepository from "../repositories/mongoose/UserRepository";
import MongoosePricingRepository from "../repositories/mongoose/PricingRepository";
import MongoosePricingCollectionRepository from "../repositories/mongoose/PricingCollectionRepository";
import MongooseOrganizationRepository from "../repositories/mongoose/OrganizationRepository";
import MongooseGroupRepository from "../repositories/mongoose/GroupRepository";
import MongooseOrganizationMembershipRepository from "../repositories/mongoose/OrganizationMembershipRepository";
import MongooseGroupMembershipRepository from "../repositories/mongoose/GroupMembershipRepository";
import MongooseGroupCollectionRepository from "../repositories/mongoose/GroupCollectionRepository";

import UserService from "../services/UserService";
import PricingService from "../services/PricingService";
import PricingCollectionService from "../services/PricingCollectionService";
import CacheService from "../services/CacheService";
import OrganizationService from "../services/OrganizationService";
import OrganizationMembershipService from "../services/OrganizationMembershipService";
import GroupService from "../services/GroupService";
import GroupMembershipService from "../services/GroupMembershipService";
import GroupCollectionService from "../services/GroupCollectionService";

dotenv.config();

function initContainer(databaseType: string): AwilixContainer {
  const container: AwilixContainer = createContainer();
  let userRepository, pricingRepository, pricingCollectionRepository,
      organizationRepository, groupRepository, organizationMembershipRepository,
      groupMembershipRepository, groupCollectionRepository;
  switch (databaseType) {
    case "mongoDB":
      userRepository = new MongooseUserRepository();
      pricingRepository = new MongoosePricingRepository();
      pricingCollectionRepository = new MongoosePricingCollectionRepository();
      organizationRepository = new MongooseOrganizationRepository();
      groupRepository = new MongooseGroupRepository();
      organizationMembershipRepository = new MongooseOrganizationMembershipRepository();
      groupMembershipRepository = new MongooseGroupMembershipRepository();
      groupCollectionRepository = new MongooseGroupCollectionRepository();
      break;
    default:
      throw new Error(`Unsupported database type: ${databaseType}`);
  }
  container.register({
    userRepository: asValue(userRepository),
    pricingRepository: asValue(pricingRepository),
    pricingCollectionRepository: asValue(pricingCollectionRepository),
    organizationRepository: asValue(organizationRepository),
    groupRepository: asValue(groupRepository),
    organizationMembershipRepository: asValue(organizationMembershipRepository),
    groupMembershipRepository: asValue(groupMembershipRepository),
    groupCollectionRepository: asValue(groupCollectionRepository),
    userService: asClass(UserService).singleton(),
    pricingService: asClass(PricingService).singleton(),
    pricingCollectionService: asClass(PricingCollectionService).singleton(),
    cacheService: asClass(CacheService).singleton(),
    organizationService: asClass(OrganizationService).singleton(),
    organizationMembershipService: asClass(OrganizationMembershipService).singleton(),
    groupService: asClass(GroupService).singleton(),
    groupMembershipService: asClass(GroupMembershipService).singleton(),
    groupCollectionService: asClass(GroupCollectionService).singleton(),
  });
  return container;
}

let container: AwilixContainer | null = null;
if (!container) { container = initContainer(process.env.DATABASE_TECHNOLOGY ?? "") }

export default container as AwilixContainer;